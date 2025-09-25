<script>
// 使用选项式API定义分享方法，这是微信小程序最稳定的方式
import { useUserInfoStore } from '@/store/user.js'
import { testLogin } from '@/utils/isLogin'
import { useAuthSwitchStore } from '@/store/authSwitch'
import { fixImageUrl, getDefaultImage } from '@/utils/domainConfig.js'


export default {
	components: {
	},
	data() {
		return {
			// 分享相关数据
			shareTitle: '',
			shareImageUrl: '',
			shareUserId: '',
			defaultShareImage: '/static/images/logo.png', // 默认分享图片
			dynamicShareImage: '', // 动态生成的分享图片路径
			linkShareImage: '', // 链接分享图片路径，与小程序分享图保持一致
			
			// 视频播放相关
			videoUrl: '', // 默认视频地址
			videoVisible: false, // 控制视频组件显示状态
			isVideoPlaying: false, // 视频是否正在播放
			videoContext: null, // 视频上下文对象
			userClosedVideo: false, // 用户是否主动关闭了视频
			
			// 用户信息和文章列表
			userArticleData: [],
			userArticleInfo: {
				avatarUrl: getDefaultImage('avatar'),
				nickName: '加载中...',
				mobile: '未填写'
			},
			
			// 最新文章图片
			latestArticleImages: [],
			
			// 分页相关
			pageNo: 1,
			pageSize: 8, // 每页加载的数据条数，与后端默认值保持一致
			
			// 加载状态
			status: 'more', // 初始状态为 'more'
			isLoading: false, // 是否正在加载
			hasMore: true, // 是否还有更多数据
			loadMoreText: {
				contentdown: '上拉加载更多',
				contentrefresh: '加载中...',
				contentnomore: '~ 已经到底啦 ~'
			},
			
			// 用户信息store
			userStore: null,
			
			// 头像点击控制状态
			avatarClickEnabled: true,
			
			// 下拉刷新相关
			isRefreshing: false,
			refreshStartTime: 0, // 记录开始刷新的时间
			
			// 添加触底加载防抖变量
			scrollToLowerTimer: null,
			isScrollLoading: false,
			totalArticleCount: 0, // 文章总数
			
			// 全屏弹窗控制
			showFullScreenPopup: false,
			
			// 缓存视频URL
			videoUrlCache: [],
		}
	},
	
	props: {
		userId: String
	},

	computed: {
		// 计算文章总数，便于在模板和分享中使用
		articleTotal() {
			return this.totalArticleCount || 0;
		}
	},

	
	// 页面加载时设置分享数据
	onLoad(options) {
		// 保存userId
		if (options.userId) {
			this.shareUserId = options.userId;
		}
		
		// 初始化store
		this.userStore = useUserInfoStore();
		
		// 获取权限状态
		this.getSendOnState();
		
		// 请求云对象获取文章总数
		this.getUserArticleCount();
		
		// 获取文章列表，并在完成后搜索视频
		this.getArticelList(true).then(() => {
			// 搜索视频
			this.searchAllVideosOnLoad();
		});
		
		// 开启平台原生页面分享
		uni.showShareMenu({
			withShareTicket: true,
			menus: ['shareAppMessage', 'shareTimeline'] // 显式指定支持分享到朋友圈
		});
		
		// 监听浏览量更新事件
		uni.$on('viewCountUpdated', (articleId) => {
			this.updateLocalViewCount({articleId});
		});
		
		// 监听新的全局浏览量更新事件
		uni.$on('articleViewCountUpdated', (data) => {
			console.log('用户文章列表收到文章浏览量更新事件:', data);
			if (data && data.articleId) {
				this.updateLocalViewCount(data);
			}
		});
		
		// 监听头像点击状态变化事件
		uni.$on('avatarClickChanged', (newState) => {
			console.log('用户文章列表页面收到头像点击状态变化事件:', newState);
			this.avatarClickEnabled = newState;
		});
		
		// 监听全局刷新事件，用于发布后返回刷新列表
		uni.$on('globalRefresh', (data) => {
			console.log('用户文章列表收到全局刷新事件:', data);
			// 检查是否需要刷新当前页面
			if (data && data.pages && data.pages.includes('userArticleList')) {
				console.log('正在刷新用户文章列表...');
				// 刷新时重新获取文章总数
				this.getUserArticleCount();
				this.getArticelList(true);
			}
		});
		
		// 预加载默认分享图片
		this.preloadDefaultShareImage();
		
		// 不在页面加载时生成分享图，改为按需生成
		// setTimeout(() => {
		// this.generateShareImage();
		// }, 1500);
	},
	
	
	
	// 页面卸载时移除事件监听
	onUnload() {
		uni.$off('viewCountUpdated');
		uni.$off('articleViewCountUpdated');
		uni.$off('avatarClickChanged');
		uni.$off('globalRefresh');
		
		// 清理防抖定时器
		if (this.scrollToLowerTimer) {
			clearTimeout(this.scrollToLowerTimer);
			this.scrollToLowerTimer = null;
		}
	},
	
	// 组件销毁前清理资源
	beforeDestroy() {
		// 清理所有定时器
		if (this.scrollToLowerTimer) {
			clearTimeout(this.scrollToLowerTimer);
			this.scrollToLowerTimer = null;
		}
	},
	
	// 监听页面触底事件
	onReachBottom() {
		console.log('原生触底事件被触发');
		// 如果已经在处理中，则跳过
		if (this.isScrollLoading || this.scrollToLowerTimer) {
			return;
		}
		// 调用通用的触底加载方法
		this.scrolltolower();
	},
	
	methods: {
		// 获取权限开关状态
		async getSendOnState() {
			try {
				console.log('正在获取按钮状态...');
				
				const sendOnApi = uniCloud.importObject('sendOn', { customUI: true });
				const res = await sendOnApi.get();
				
				if (res && res.data && res.data.length > 0) {
					// 获取头像点击状态
					const serverAvatarClickState = res.data[0].avatarClick !== undefined ? res.data[0].avatarClick : true;
					
					// 更新头像点击状态
					this.avatarClickEnabled = serverAvatarClickState;
					
					console.log('头像点击状态:', this.avatarClickEnabled);
				} else {
					console.error('获取按钮状态失败: 数据格式不正确');
				}
			} catch (err) {
				console.error('获取按钮状态失败:', err);
			}
		},
		
		// 请求云对象获取文章总数
		async getUserArticleCount() {
			if (!this.userId) {
				console.log('用户ID不存在，无法获取文章总数');
				return;
			}
			
			console.log('通过云对象请求文章总数，用户ID:', this.userId);
			
			try {
				// 使用getArticleList方法获取文章总数
				// 由于getUserArticleCount方法在部署的云对象中不存在（Method[getUserArticleCount] was not found in index.obj.js）
				const articleApi = uniCloud.importObject('articleWx', { customUI: true });
				// 设置pageSize为1，只获取总数
				const result = await articleApi.getArticleList(this.userId, 1, 1);
				
				if (result && result.total !== undefined) {
					// 更新文章总数
					this.totalArticleCount = result.total;
					console.log('云对象通过getArticleList获取到文章总数:', this.totalArticleCount);
					
					// 更新分享信息
					this.updateShareInfo();
					
					return this.totalArticleCount;
				} else {
					console.error('云对象获取文章总数失败: 未返回total字段');
					return null;
				}
			} catch (err) {
				console.error('云对象获取文章总数出错:', err);
				
				// 出错时，将文章总数设为0
				this.totalArticleCount = 0;
				console.log('云对象请求失败，设置文章总数为0');
				
				return null;
			}
		},
		
		// 预加载默认分享图片
		preloadDefaultShareImage() {
			// 预加载常规分享默认图片
			uni.getImageInfo({
				src: this.defaultShareImage,
				success: (res) => {
					console.log('默认分享图片预加载成功:', res);
					// 确保默认图片路径正确
					this.defaultShareImage = res.path;
					// 同时设置链接分享图片
					this.linkShareImage = res.path;
				},
				fail: (err) => {
					console.error('默认分享图片预加载失败:', err);
				}
			});
		},
		
		// 统一分享方法 - 返回标准分享信息（分享给好友使用页面截图作为封面）
		getShareInfo() {
			// 设置分享标题
			if (this.userArticleInfo) {
				const nickName = this.userArticleInfo?.nickName || '用户';
				this.shareTitle = `我是${nickName}，这是我的第${this.articleTotal}条朋友圈，点击查看！`;
			}
			
			// 确保用户ID已设置
			this.shareUserId = this.userId || this.shareUserId;
			
			console.log('统一分享方法 - 分享给好友使用页面截图作为封面');
			
			// 返回标准分享信息 - 不包含imageUrl，使用页面截图作为封面
			return {
				title: this.shareTitle || '更新了精彩动态，点击查看！',
				path: `/pages/userArticleList/userArticleList?userId=${this.shareUserId}`
				// 不包含imageUrl，使小程序自动截取页面作为分享封面
			};
		},
		
		// 获取朋友圈分享信息（使用用户头像作为封面）
		getTimelineShareInfo() {
			// 设置分享标题
			if (this.userArticleInfo) {
				const nickName = this.userArticleInfo?.nickName || '用户';
				this.shareTitle = `我是${nickName}，这是我的第${this.articleTotal}条朋友圈，点击查看！`;
			}
			
			// 确保用户ID已设置
			this.shareUserId = this.userId || this.shareUserId;
			
			// 获取用户头像作为分享封面
			let shareImageUrl = '';
			if (this.userArticleInfo && this.userArticleInfo.avatarUrl) {
				shareImageUrl = this.processImageUrl(this.userArticleInfo.avatarUrl);
				console.log('朋友圈分享 - 使用用户头像作为封面:', shareImageUrl);
			} else {
				// 如果没有头像，使用默认分享图
				shareImageUrl = this.defaultShareImage;
				console.log('朋友圈分享 - 使用默认分享图作为封面:', shareImageUrl);
			}
			
			// 返回朋友圈分享信息（使用用户头像作为封面）
			return {
				title: this.shareTitle || '更新了精彩动态，点击查看！',
				query: `userId=${this.shareUserId}`,
				imageUrl: shareImageUrl // 使用用户头像作为朋友圈分享封面
			};
		},
		
		// 更新分享信息
		updateShareInfo() {
			if (this.userArticleInfo) {
				const nickName = this.userArticleInfo?.nickName || '用户';
				
				// 设置分享标题
				this.shareTitle = `我是${nickName}，这是我的第${this.articleTotal}条朋友圈，点击查看！`;
				
				this.shareUserId = this.userId || this.shareUserId;
				
				// 设置分享图片URL
				this.shareImageUrl = this.dynamicShareImage || this.defaultShareImage;
				
				console.log('更新分享信息:', {
					title: this.shareTitle,
					imageUrl: this.shareImageUrl,
					userId: this.shareUserId
				});
			}
		},
		
		// 获取用户文章列表（首次加载或重置）
		async getArticelList(isReset = false) {
			this.isLoading = true;
			this.status = 'loading';
			
			if (isReset) {
				this.pageNo = 1;
				this.userArticleData = [];
			}
			
			return new Promise(async (resolve, reject) => {
				try {
					const articleApi = uniCloud.importObject('articleWx', { customUI: true });
					const res = await articleApi.getArticleList(this.userId, this.pageNo, this.pageSize);
					
					// 保存API返回的文章总数
					if (res && res.total !== undefined) {
						this.totalArticleCount = res.total;
						console.log('获取到文章总数:', this.totalArticleCount);
					}
					
					// 添加空值检查
					if (res && res.userInfo) {
						this.userArticleInfo = res.userInfo;
						// 如果当前用户是登录用户，可以更新全局用户信息
						if (this.userId === this.userStore.userInfo.uid) {
							this.userStore.setUserInfo({
								...this.userStore.userInfo,
								nickName: res.userInfo.nickName || this.userStore.userInfo.nickName,
								avatarUrl: res.userInfo.avatarUrl ? fixImageUrl(res.userInfo.avatarUrl) : (this.userStore.userInfo.avatarUrl ? fixImageUrl(this.userStore.userInfo.avatarUrl) : getDefaultImage('avatar'))
							});
						}
						
						// 数据加载完成后，更新分享信息
						this.$nextTick(() => {
							this.updateShareInfo();
						});
					} else {
						// 如果res.userInfo为null，检查是否第一页数据中有文章，
						// 如果有，从第一篇文章中获取用户信息
						if (this.pageNo === 1 && res && res.data && res.data.length > 0) {
							const firstArticle = res.data[0];
							this.userArticleInfo = {
								avatarUrl: firstArticle.user_avatarUrl ? fixImageUrl(firstArticle.user_avatarUrl) : getDefaultImage('avatar'),
								nickName: firstArticle.user_nickName,
								mobile: firstArticle.user_mobile || '未填写'
							};
						} else {
							// 如果这不是第一页，或者没有任何文章数据，保持当前的用户信息
							// 只有在第一页且没有文章时才设为空对象
							if (this.pageNo === 1) {
								this.userArticleInfo = {};
							}
							// 否则保持当前的用户信息不变
						}
					}
					
					// 处理文章数据
					if (res && res.data) {
						let articlesData = res.data;
						
						// 处理每篇文章，检查是否含有视频
						articlesData = articlesData.map(article => {
							// 添加一个标识字段，表示文章是否包含视频
							article.hasVideo = this.checkArticleHasVideo(article);
							return article;
						});
						
						if (isReset) {
							this.userArticleData = articlesData;
						} else {
							this.userArticleData = [...this.userArticleData, ...articlesData];
						}
						
						// 确保每篇文章都有用户信息
						this.userArticleData.forEach(article => {
							// 如果文章没有用户信息，使用从API获取的用户信息
							if (!article.user_avatarUrl && this.userArticleInfo.avatarUrl) {
								article.user_avatarUrl = this.userArticleInfo.avatarUrl;
							}
							if (!article.user_nickName && this.userArticleInfo.nickName) {
								article.user_nickName = this.userArticleInfo.nickName;
							}
						});
						
						// 判断是否还有更多数据
						this.hasMore = res.data.length >= this.pageSize;
						this.status = this.hasMore ? 'more' : 'noMore';
						
						// 文章数据更新后，重新更新分享信息以获取最佳图片
						this.$nextTick(() => {
							this.updateShareInfo();
							// 获取最新文章的图片
							this.extractLatestArticleImages();
							// 尝试从文章中提取视频
							this.extractVideoFromArticles();
						});
					} else {
						if (isReset) {
							this.userArticleData = [];
						}
						this.hasMore = false;
						this.status = 'noMore';
					}
					
					resolve();
				} catch (err) {
					console.error('获取用户文章列表失败:', err);
					if (isReset) {
						this.userArticleData = [];
					}
					this.userArticleInfo = {};
					this.status = 'noMore';
					this.hasMore = false;
					
					// 显示错误提示
					uni.showToast({
						title: '获取数据失败，请重试',
						icon: 'none'
					});
					
					reject(err);
				} finally {
					this.isLoading = false;
					// 重置下拉刷新状态
					this.isRefreshing = false;
				}
			});
		},
		
		// 触底加载时，不影响视频状态
		scrolltolower() {
			console.log('触底加载被触发，状态:', { isLoading: this.isLoading, hasMore: this.hasMore, isScrollLoading: this.isScrollLoading });
			
			// 如果正在加载或已经没有更多数据，直接返回
			if (this.isLoading || !this.hasMore || this.isScrollLoading) {
				console.log('跳过加载: ' + (this.isLoading ? '正在加载中' : (this.isScrollLoading ? '防抖期间' : '没有更多数据')));
				return;
			}
			
			// 设置防抖标志
			this.isScrollLoading = true;
			
			// 先展示加载提示
			this.status = 'loading';
			
			// 清除之前的定时器
			if (this.scrollToLowerTimer) {
				clearTimeout(this.scrollToLowerTimer);
			}
			
			// 记录当前视频状态，以便加载后恢复
			let savedVideoState = null;
			if (this.videoVisible && this.videoContext) {
				savedVideoState = {
					isPlaying: this.isVideoPlaying,
					position: 0,
					visible: this.videoVisible
				};
				
				// 获取当前播放位置
				try {
					this.videoContext.pause(); // 临时暂停以便获取准确的当前位置
					savedVideoState.position = this.videoContext.currentTime || 0;
					// 如果之前是播放状态，则恢复播放
					if (savedVideoState.isPlaying) {
						this.videoContext.play();
					}
				} catch (e) {
					console.error('保存视频状态时出错:', e);
				}
			}
			
			// 设置防抖定时器，300毫秒内只执行一次
			this.scrollToLowerTimer = setTimeout(() => {
				console.log('开始加载更多数据 (防抖后)，保存的视频状态:', savedVideoState);
				
				// 传递保存的视频状态
				this.loadMoreData(savedVideoState);
			}, 500);
		},
		
		// 加载更多数据
		async loadMoreData(savedVideoState = null) {
			if (this.isLoading || !this.hasMore) {
				console.log('跳过加载更多:', { isLoading: this.isLoading, hasMore: this.hasMore });
				this.isScrollLoading = false;
				return;
			}
			
			console.log(`开始加载第${this.pageNo + 1}页数据，视频状态:`, savedVideoState);
			this.status = 'loading';
			this.isLoading = true;
			
			// 视觉上显示加载延迟，避免加载过快用户无感知
			const loadStartTime = Date.now();
			const minLoadingTime = 500; // 最小加载时间，提供更好的视觉反馈
			
			this.pageNo++;
			try {
				await this.getArticelList();
				
				// 计算已经过去的时间
				const loadDuration = Date.now() - loadStartTime;
				
				// 如果加载太快，添加小延迟使加载状态对用户可见
				if (loadDuration < minLoadingTime) {
					await new Promise(resolve => setTimeout(resolve, minLoadingTime - loadDuration));
				}
				
				console.log(`第${this.pageNo}页数据加载完成, 当前状态:`, { 
					articleCount: this.userArticleData.length,
					hasMore: this.hasMore,
					status: this.status
				});
				
				// 恢复视频状态
				this.$nextTick(() => {
					this.restoreVideoState(savedVideoState);
				});
			} catch (err) {
				// 静默处理"请求进行中"错误，避免在控制台显示错误信息
				if (err && err.message === '请求进行中') {
					console.log('忽略并发请求:', err.message);
				} else {
					console.error('加载更多数据失败:', err);
				}
				
				// 发生错误时恢复页码，以便下次重试
				this.pageNo--;
				this.status = 'more';
				
				// 即使出错也恢复视频状态
				this.$nextTick(() => {
					this.restoreVideoState(savedVideoState);
				});
			} finally {
				this.isLoading = false;
				this.isScrollLoading = false;
			}
		},
		
		// 恢复视频状态的方法
		restoreVideoState(savedVideoState) {
			if (!savedVideoState) return;
			
			console.log('尝试恢复视频状态:', savedVideoState, '用户关闭标记:', this.userClosedVideo);
			
			// 如果用户主动关闭了视频，不恢复视频状态
			if (this.userClosedVideo) {
				console.log('用户已主动关闭视频，不恢复视频状态');
				return;
			}
			
			// 确保视频组件可见性与之前一致
			if (savedVideoState.visible !== this.videoVisible) {
				this.videoVisible = savedVideoState.visible;
			}
			
			// 仅当视频组件可见且有视频URL时恢复状态
			if (this.videoVisible && this.videoUrl) {
				// 需要重新获取视频上下文
				this.videoContext = uni.createVideoContext('myVideo', this);
				
				if (this.videoContext) {
					try {
						// 设置播放位置
						if (savedVideoState.position > 0) {
							this.videoContext.seek(savedVideoState.position);
						}
						
						// 恢复播放状态
						if (savedVideoState.isPlaying) {
							this.videoContext.play();
							this.isVideoPlaying = true;
						} else {
							this.videoContext.pause();
							this.isVideoPlaying = false;
						}
						
						console.log('视频状态恢复成功');
					} catch (e) {
						console.error('恢复视频状态时出错:', e);
					}
				}
			}
		},
		
		// 处理删除
		async handleDelete(article_id) {
			try {
				// 添加确认提示
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这篇文章吗？',
					success: async (result) => {
						if (result.confirm) {
							// 显示加载中提示
							uni.showLoading({
								title: '删除中...',
								mask: true
							});
							
							// 调用删除API
							const articleApi = uniCloud.importObject('articleWx', { customUI: true });
							const res = await articleApi.del(article_id, this.userStore.userInfo.uid);
							
							console.log('删除返回结果:', res);
							
							// 检查删除是否成功
							if (res && res.deleted) {
								// 从本地数据列表中移除已删除的文章
								const index = this.userArticleData.findIndex(item => item._id === article_id);
								if (index !== -1) {
									this.userArticleData.splice(index, 1);
								}
								
								// 显示成功提示
								uni.hideLoading();
								uni.showToast({
									title: '删除成功',
									icon: 'success',
									duration: 1500
								});
							} else {
								throw new Error('删除失败，请重试');
							}
						}
					}
				});
			} catch (err) {
				console.error('删除出错:', err);
				uni.hideLoading();
				uni.showToast({
					title: err.message || '删除失败，请重试',
					icon: 'none',
					duration: 2000
				});
			}
		},
		
		// 图片预览
		previewImage(urls, current) {
			uni.previewImage({
				urls,
				current
			});
		},
		
		// 处理联系方式
		handleContact() {
			if (!this.userStore.userInfo.isLogin) {
				return testLogin();
			}
			
			if (!this.userArticleInfo || this.userArticleInfo.mobile === '未填写') {
				return uni.showToast({
					icon: 'none',
					title: '他并不想让人联系'
				});
			}
			uni.makePhoneCall({
				phoneNumber: this.userArticleInfo.mobile
			});
		},
		
		// 文章列表触底时触发
		scrolltolower() {
			console.log('触底加载被触发，状态:', { isLoading: this.isLoading, hasMore: this.hasMore, isScrollLoading: this.isScrollLoading });
			
			// 如果正在加载或已经没有更多数据，直接返回
			if (this.isLoading || !this.hasMore || this.isScrollLoading) {
				console.log('跳过加载: ' + (this.isLoading ? '正在加载中' : (this.isScrollLoading ? '防抖期间' : '没有更多数据')));
				return;
			}
			
			// 设置防抖标志
			this.isScrollLoading = true;
			
			// 先展示加载提示
			this.status = 'loading';
			
			// 清除之前的定时器
			if (this.scrollToLowerTimer) {
				clearTimeout(this.scrollToLowerTimer);
			}
			
			// 记录当前视频状态，以便加载后恢复
			let savedVideoState = null;
			if (this.videoVisible && this.videoContext) {
				savedVideoState = {
					isPlaying: this.isVideoPlaying,
					position: 0,
					visible: this.videoVisible
				};
				
				// 获取当前播放位置
				try {
					this.videoContext.pause(); // 临时暂停以便获取准确的当前位置
					savedVideoState.position = this.videoContext.currentTime || 0;
					// 如果之前是播放状态，则恢复播放
					if (savedVideoState.isPlaying) {
						this.videoContext.play();
					}
				} catch (e) {
					console.error('保存视频状态时出错:', e);
				}
			}
			
			// 设置防抖定时器，300毫秒内只执行一次
			this.scrollToLowerTimer = setTimeout(() => {
				console.log('开始加载更多数据 (防抖后)，保存的视频状态:', savedVideoState);
				
				// 传递保存的视频状态
				this.loadMoreData(savedVideoState);
			}, 500);
		},
		
		// 更新本地文章浏览量数据
		updateLocalViewCount(data) {
			// 检查数据有效性
			if (!data || !data.articleId) {
				console.log('更新浏览量失败：无效的文章数据');
				return;
			}
			
			// 查找文章并更新浏览量
			const article = this.userArticleData.find(item => item._id === data.articleId);
			if (article) {
				// 如果提供了具体的浏览量，则直接使用；否则自增
				if (data.viewCount !== undefined) {
					article.look_count = data.viewCount;
				} else if (article.look_count !== undefined) {
					article.look_count++;
				} else {
					article.look_count = 1;
				}
				console.log(`文章(${data.articleId})浏览量已更新: ${article.look_count}`);
			} else {
				console.log(`未找到文章: ${data.articleId}`);
			}
		},
		
		// 预览最新文章图片
		previewLatestImages(index) {
			if (this.latestArticleImages && this.latestArticleImages.length > 0) {
				uni.previewImage({
					current: this.latestArticleImages[index],
					urls: this.latestArticleImages
				});
			}
		},
		
		// 获取文章的图片
		getArticleImages(article) {
			const images = [];
			
			if (!article) return images;
			
			// 处理新版图片结构 (images 数组)
			if (article.images && article.images.length > 0) {
				article.images.forEach(img => {
					// 优先使用缩略图
					if (img.thumbnailURL) {
						images.push(this.processImageUrl(img.thumbnailURL));
					}
					// 其次使用压缩图
					else if (img.compressedURL) {
						images.push(this.processImageUrl(img.compressedURL));
					}
					// 再次使用原图
					else if (img.url) {
						images.push(this.processImageUrl(img.url));
					}
					// 如果是字符串直接使用
					else if (typeof img === 'string') {
						images.push(this.processImageUrl(img));
					}
				});
			}
			
			// 处理旧版图片结构 (imgArr 数组)
			if (article.imgArr && article.imgArr.length > 0) {
				article.imgArr.forEach(img => {
					images.push(this.processImageUrl(img));
				});
			}
			
			// 尝试使用封面图
			if (article.coverImage && images.length === 0) {
				images.push(this.processImageUrl(article.coverImage));
			}
			
			return images;
		},
		
		// 预览文章图片
		previewArticleImage(article, index) {
			const images = this.getArticleImages(article);
			if (images && images.length > 0) {
				uni.previewImage({
					current: images[index],
					urls: images
				});
			}
		},
		
		// 下拉刷新
		onRefresh() {
			this.isRefreshing = true;
			this.refreshStartTime = Date.now(); // 记录开始刷新的时间
			
			this.getArticelList(true).then(() => {
				// 确保刷新动画至少显示800毫秒，提供良好的用户体验
				const refreshDuration = Date.now() - this.refreshStartTime;
				const minimumDuration = 800;
				
				if (refreshDuration < minimumDuration) {
					setTimeout(() => {
						this.isRefreshing = false;
						// 刷新成功提示
						uni.showToast({
							title: '刷新成功',
							icon: 'success',
							duration: 1500
						});
					}, minimumDuration - refreshDuration);
				} else {
					this.isRefreshing = false;
					// 刷新成功提示
					uni.showToast({
						title: '刷新成功',
						icon: 'success',
						duration: 1500
					});
				}
			}).catch(() => {
				// 确保刷新动画至少显示800毫秒
				const refreshDuration = Date.now() - this.refreshStartTime;
				const minimumDuration = 800;
				
				if (refreshDuration < minimumDuration) {
					setTimeout(() => {
						this.isRefreshing = false;
						// 刷新失败提示
						uni.showToast({
							title: '刷新失败',
							icon: 'none',
							duration: 1500
						});
					}, minimumDuration - refreshDuration);
				} else {
					this.isRefreshing = false;
					// 刷新失败提示
					uni.showToast({
						title: '刷新失败',
						icon: 'none',
						duration: 1500
					});
				}
			});
		},
		
		// 隐藏分享引导蒙层
		hideShareGuide() {
			this.showShareArrow = false;
		},
		
		// 视频相关方法
		// 初始化视频上下文
		initVideoContext() {
			// 只有当视频组件可见且有视频URL时才初始化
			if (this.videoVisible && this.videoUrl) {
				console.log('初始化视频上下文');
				this.videoContext = uni.createVideoContext('myVideo', this);
			} else {
				console.log('视频组件不可见或没有视频URL，跳过初始化');
			}
		},
		
		// 视频播放事件处理
		onVideoPlay() {
			console.log('视频开始播放');
			this.isVideoPlaying = true;
		},
		
		// 视频暂停事件处理
		onVideoPause() {
			console.log('视频暂停播放');
			this.isVideoPlaying = false;
		},
		
		// 视频播放结束事件处理
		onVideoEnded() {
			console.log('视频播放结束');
			this.isVideoPlaying = false;
		},
		
		// 视频播放错误事件处理
		onVideoError(e) {
			console.error('视频播放错误:', e);
			
			// 尝试自动查找下一个视频
			const foundNext = this.findNextVideo();
			
			// 如果没有找到下一个视频
			if (!foundNext) {
				// 主动关闭视频，不显示提示
				this.hideVideo();
			}
		},
		
		// 查找下一个可用视频
		findNextVideo() {
			console.log('查找下一个可用视频');
			
			// 首先检查是否有缓存的视频URL
			if (this.videoUrlCache && this.videoUrlCache.length > 0) {
				// 移除当前正在使用的视频URL
				this.videoUrlCache = this.videoUrlCache.filter(url => url !== this.videoUrl);
				
				// 如果还有其他视频URL
				if (this.videoUrlCache.length > 0) {
					console.log('从缓存中找到其他视频:', this.videoUrlCache[0]);
					this.videoUrl = this.videoUrlCache[0];
					this.videoVisible = true;
					
					// 在下一个渲染周期初始化视频上下文
					this.$nextTick(() => {
						this.initVideoContext();
					});
					
					return true;
				}
			}
			
			// 如果没有文章数据，直接返回
			if (!this.userArticleData || this.userArticleData.length === 0) {
				console.log('没有文章数据，无法查找视频');
				return false;
			}
			
			// 存储找到的所有视频URL
			const allVideoUrls = [];
			
			// 查找所有视频URLs
			for (let article of this.userArticleData) {
				const videoUrl = this.extractVideoUrlFromArticle(article);
				if (videoUrl && videoUrl !== this.videoUrl) {
					allVideoUrls.push(videoUrl);
				}
			}
			
			// 如果找到了其他视频
			if (allVideoUrls.length > 0) {
				console.log('找到其他视频:', allVideoUrls[0]);
				
				// 更新缓存
				this.videoUrlCache = allVideoUrls;
				
				this.videoUrl = allVideoUrls[0];
				this.videoVisible = true;
				
				// 在下一个渲染周期初始化视频上下文
				this.$nextTick(() => {
					this.initVideoContext();
				});
				
				return true;
			} else {
				console.log('没有找到其他可用视频');
				uni.showToast({
					title: '未找到其他视频',
					icon: 'none'
				});
				return false;
			}
		},
		
		// 全屏状态变化事件处理
		handleFullscreenChange(e) {
			console.log('全屏状态变化:', e.detail.fullScreen);
		},
		
		// 隐藏视频
		hideVideo() {
			console.log('隐藏视频组件被调用');
			// 标记用户主动关闭了视频
			this.userClosedVideo = true;
			// 暂停视频
			if (this.videoContext) {
				this.videoContext.pause();
			}
			// 隐藏视频组件
			this.videoVisible = false;
			this.videoUrl = ''; // 清空视频URL，确保组件完全隐藏
		},
		
		// 显示视频
		showVideo() {
			// 重置用户关闭标记
			this.userClosedVideo = false;
			this.videoVisible = true;
			// 在下一个渲染周期重新初始化视频上下文
			this.$nextTick(() => {
				this.initVideoContext();
			});
		},
		
		// 从文章列表中提取视频URL
		extractVideoFromArticles() {
			console.log('尝试从文章中提取视频链接');
			
			// 如果用户主动关闭了视频，不提取新视频
			if (this.userClosedVideo) {
				console.log('用户已主动关闭视频，跳过视频提取');
				return false;
			}
			
			// 如果没有文章数据，直接返回
			if (!this.userArticleData || this.userArticleData.length === 0) {
				console.log('没有文章数据，无法提取视频');
				return false;
			}
			
			// 创建一个包含文章索引的数组，按照文章的创建时间降序排序（最新的优先）
			const sortedArticleIndices = this.userArticleData
				.map((article, index) => ({ 
					index, 
					time: article.create_time || article.createTime || article.time || 0,
					priority: this.getVideoPriority(article), // 计算视频优先级
					hasVideo: this.checkArticleHasVideo(article) // 预先检查是否包含视频
				}))
				.sort((a, b) => {
					// 首先检查是否包含视频，有视频的优先
					if (a.hasVideo !== b.hasVideo) {
						return a.hasVideo ? -1 : 1;
					}
					
					// 然后按时间排序，确保最新的视频优先
					if (typeof a.time === 'string' && typeof b.time === 'string') {
						return new Date(b.time) - new Date(a.time);
					} else if (typeof a.time === 'number' && typeof b.time === 'number') {
						return b.time - a.time;
					}
					
					// 最后按优先级排序
					if (a.priority !== b.priority) {
						return b.priority - a.priority;
					}
					
					return a.index - b.index; // 保持原有顺序
				})
				.map(item => item.index);
			
			console.log('优化排序后的文章索引:', sortedArticleIndices.slice(0, 5)); // 只显示前5个，避免日志过长
			
			// 收集所有视频URL以便后续使用
			const allVideoUrls = [];
			let firstFoundVideo = null;
			
			// 扫描文章，最多处理前15篇，避免过度处理
			const maxArticlesToProcess = Math.min(sortedArticleIndices.length, 15);
			
			for (let i = 0; i < maxArticlesToProcess; i++) {
				const articleIndex = sortedArticleIndices[i];
				const article = this.userArticleData[articleIndex];
				
				console.log(`检查文章索引 ${articleIndex} 是否包含视频`);
				
				// 尝试各种方法获取视频URL
				const videoUrl = this.extractVideoUrlFromArticle(article);
				
				if (videoUrl) {
					// 如果是第一个找到的视频，记录下来立即使用
					if (!firstFoundVideo) {
						firstFoundVideo = videoUrl;
						
						// 同时将找到的视频URL存入数组供后续使用
						if (!allVideoUrls.includes(videoUrl)) {
							allVideoUrls.push(videoUrl);
						}
					} else {
						// 如果不是第一个，只添加到数组
						if (!allVideoUrls.includes(videoUrl)) {
							allVideoUrls.push(videoUrl);
						}
					}
					
					// 当找到3个以上的视频时停止搜索，以优化性能
					if (allVideoUrls.length >= 3) {
						break;
					}
				}
			}
			
			// 如果找到了视频
			if (firstFoundVideo) {
				console.log('找到视频链接:', firstFoundVideo);
				// 保存所有找到的视频以便于错误时重试
				this.videoUrlCache = allVideoUrls;
				
				// 使用第一个找到的视频
				this.videoUrl = firstFoundVideo;
				this.videoVisible = true;
				
				// 在下一个渲染周期初始化视频上下文
				this.$nextTick(() => {
					this.initVideoContext();
				});
				
				return true;
			}
			
			console.log('未在文章中找到有效的视频链接');
			return false;
		},
		
		// 计算文章中视频的优先级
		getVideoPriority(article) {
			let priority = 0;
			
			// 检查是否有明确标记的视频字段
			if (article.videoURL || article.videoUrl || article.video_url) {
				priority += 10;
			}
			
			// 检查是否有视频数组
			if (article.videos && Array.isArray(article.videos) && article.videos.length > 0) {
				priority += 8;
			}
			
			// 检查内容长度
			if (article.content && article.content.length > 500) {
				priority += 3; // 长内容可能包含更多重要信息
			}
			
			// 如果有互动数据，增加权重
			if (article.like_count > 5 || article.look_count > 20) {
				priority += 5;
			}
			
			return priority;
		},
		
		// 从单个文章中提取视频URL
		extractVideoUrlFromArticle(article) {
			if (!article) return null;
			
			// 首先检查schema中定义的videoURL字段
			if (article.videoURL && typeof article.videoURL === 'string' && this.isValidVideoUrl(article.videoURL)) {
				console.log('找到videoURL字段中的视频链接:', article.videoURL);
				return article.videoURL;
			}
			
			// 检查可能包含视频链接的所有常见字段
			const possibleVideoFields = [
				'videoUrl',
				'video_url',
				'video',
				'videoSrc',
				'video_src',
				'url'
			];
			
			// 检查是否有直接的视频字段
			for (let field of possibleVideoFields) {
				if (article[field] && typeof article[field] === 'string' && this.isValidVideoUrl(article[field])) {
					console.log(`找到视频链接(${field}):`, article[field]);
					return article[field];
				}
			}
			
			// 检查可能包含视频数组的所有常见字段
			const possibleVideoArrayFields = [
				'videos',
				'videoArr',
				'video_arr',
				'videoList',
				'video_list'
			];
			
			// 检查是否有视频数组
			for (let field of possibleVideoArrayFields) {
				if (article[field] && Array.isArray(article[field]) && article[field].length > 0) {
					const videoItem = article[field][0];
					console.log(`找到视频数组(${field}):`, videoItem);
					
					// 如果数组项是字符串，直接使用
					if (typeof videoItem === 'string' && this.isValidVideoUrl(videoItem)) {
						return videoItem;
					} 
					// 如果是对象，尝试获取url字段
					else if (typeof videoItem === 'object') {
						const possibleUrlProps = ['url', 'src', 'source', 'path', 'videoUrl'];
						for (let prop of possibleUrlProps) {
							if (videoItem[prop] && typeof videoItem[prop] === 'string' && this.isValidVideoUrl(videoItem[prop])) {
								return videoItem[prop];
							}
						}
					}
				}
			}
			
			// 检查是否有内容解析视频
			if (article.content) {
				const videoUrlMatch = this.extractVideoUrlFromContent(article.content);
				if (videoUrlMatch) {
					console.log('从内容中提取到视频链接:', videoUrlMatch);
					return videoUrlMatch;
				}
			}
			
			return null;
		},
		
		// 从内容中提取视频URL
		extractVideoUrlFromContent(content) {
			if (!content || typeof content !== 'string') return null;
			
			// 尝试匹配常见视频URL模式
			const videoUrlRegexes = [
				// 小程序视频路径格式
				/cloud:\/\/[^"'\s<>]+\.(mp4|mov|m3u8)/gi,
				
				// 文件存储视频路径
				/cloud-file:\/\/[^"'\s<>]+\.(mp4|mov|m3u8)/gi,
				
				// 常见视频文件扩展名
				/https?:\/\/[^\s<>"']+\.(mp4|avi|mov|wmv|flv|mkv|webm|m3u8|3gp|rm|rmvb)/gi,
				
				// 特定视频平台
				/https?:\/\/v\.qq\.com\/[^\s<>"']+/gi,
				/https?:\/\/www\.youtube\.com\/watch\?v=[^\s<>"']+/gi,
				/https?:\/\/youtu\.be\/[^\s<>"']+/gi,
				/https?:\/\/vimeo\.com\/[^\s<>"']+/gi,
				/https?:\/\/www\.bilibili\.com\/video\/[^\s<>"']+/gi,
				/https?:\/\/www\.ixigua\.com\/[^\s<>"']+/gi,
				/https?:\/\/www\.kuaishou\.com\/[^\s<>"']+/gi,
				
				// 通用CDN和文件存储链接
				/https?:\/\/[^\s<>"']+\.bspapp\.com\/[^\s<>"']+/gi,
				/https?:\/\/[^\s<>"']+\.cdn[^\s<>"']*\/[^\s<>"']+/gi,
				
				// 微信视频
				/https?:\/\/mp\.weixin\.qq\.com\/[^\s<>"']*video[^\s<>"']+/gi,
				/https?:\/\/wxsnsdy\.wxs\.qq\.com\/[^\s<>"']+/gi,
				
				// 查找HTML视频标签
				/<video[^>]*src=["']([^"']+)["'][^>]*>/gi,
				/<video[^>]*>[\s\S]*?<source[^>]*src=["']([^"']+)["'][^>]*>/gi
			];
			
			// 先尝试从HTML标签中提取
			const htmlMatchRegexes = [
				/<video[^>]*src=["']([^"']+)["'][^>]*>/i,
				/<video[^>]*>[\s\S]*?<source[^>]*src=["']([^"']+)["'][^>]*>/i
			];
			
			for (let regex of htmlMatchRegexes) {
				const match = content.match(regex);
				if (match && match[1]) {
					const url = match[1];
					if (this.isValidVideoUrl(url)) {
						return url;
					}
				}
			}
			
			// 然后查找直接的URL
			for (let regex of videoUrlRegexes) {
				const matches = content.match(regex);
				if (matches && matches.length > 0) {
					// 检查每个匹配项是否是有效的视频URL
					for (const url of matches) {
						if (this.isValidVideoUrl(url)) {
							return url;
						}
					}
				}
			}
			
			// 查找JSON格式中的URL
			try {
				const jsonMatches = content.match(/"(https?:\/\/[^"]+\.(mp4|mov|m3u8))"/gi);
				if (jsonMatches && jsonMatches.length > 0) {
					for (let jsonMatch of jsonMatches) {
						// 提取URL并去除引号
						const url = jsonMatch.replace(/^"|"$/g, '');
						if (this.isValidVideoUrl(url)) {
							return url;
						}
					}
				}
			} catch (e) {
				console.error('JSON解析错误:', e);
			}
			
			return null;
		},
		
		// 检查URL是否是有效的视频URL
		isValidVideoUrl(url) {
			if (!url || typeof url !== 'string') return false;
			
			// 排除图片URL
			if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)($|\?)/i)) {
				return false;
			}
			
			// 检查常见视频扩展名
			const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m3u8', '.3gp', '.rm', '.rmvb'];
			const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
			
			// 检查常见视频域名
			const videoDomains = [
				'youku', 'youtube', 'vimeo', 'bilibili', 'qq.com/video', 
				'weixin.qq', 'douyin', 'bspapp.com', 'ixigua.com', 
				'kuaishou.com', 'cdn', 'mp4', '.video.'
			];
			const hasVideoDomain = videoDomains.some(domain => url.toLowerCase().includes(domain));
			
			// 检查云存储路径
			const isCloudPath = url.startsWith('cloud://') && videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
			
			// 增加HLS和DASH流媒体格式检测
			const isStreamingUrl = url.includes('.m3u8') || url.includes('.mpd');
			
			return hasVideoExtension || hasVideoDomain || isCloudPath || isStreamingUrl;
		},
		
		// 分享到朋友圈 - 显示全屏引导
		shareToTimeline() {
			console.log('点击分享到朋友圈按钮，显示全屏弹窗');
			
			// 显示全屏弹窗
			this.showFullScreenPopup = true;
		},
		
		// 关闭全屏弹窗
		closeFullScreenPopup() {
			this.showFullScreenPopup = false;
		},
		
		// 跳转到发布页面
		goToPublish() {
			if (!this.userStore.userInfo.isLogin) {
				return testLogin();
			}
			
			// 显示加载提示
			uni.showLoading({
				title: '正在跳转...',
				mask: true
			});
			
			// 使用setTimeout延迟执行，给系统一些时间处理之前的操作
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/fabu/fabu',
					success: () => {
						console.log('跳转到发布页面成功');
						uni.hideLoading();
					},
					fail: (err) => {
						console.error('发布页面跳转失败:', err);
						uni.hideLoading();
						
						// 尝试使用其他导航方式
						uni.redirectTo({
							url: '/pages/fabu/fabu',
							success: () => {
								console.log('使用redirectTo跳转成功');
							},
							fail: (redirectErr) => {
								console.error('redirectTo也失败了:', redirectErr);
								
								// 最后尝试使用reLaunch
								uni.reLaunch({
									url: '/pages/fabu/fabu',
									fail: (relaunchErr) => {
										console.error('所有导航方法都失败了:', relaunchErr);
										uni.showToast({
											title: '页面跳转失败，请重试',
											icon: 'none',
											duration: 2000
										});
									}
								});
							}
						});
					}
				});
			}, 100); // 短暂延迟，让UI有时间响应
		},
		
		// 处理图片URL，确保可以正确加载
		processImageUrl(url) {
			if (!url) return getDefaultImage('default');
			
			// 如果是本地路径或临时路径，直接返回
			if (url.startsWith('/static/') || 
				url.startsWith('wxfile://') || 
				url.startsWith('http://tmp/')) {
				return url;
			}
			
			try {
				// 使用统一的域名配置工具处理URL
				return fixImageUrl(url);
			} catch (e) {
				console.error('处理图片URL出错:', e);
				return getDefaultImage('default');
			}
		},
		
		// 从文章列表中提取最新的图片
		extractLatestArticleImages() {
			console.log('提取最新文章图片');
			
			// 如果没有文章数据，直接返回
			if (!this.userArticleData || this.userArticleData.length === 0) {
				console.log('没有文章数据，无法提取图片');
				this.latestArticleImages = [];
				return [];
			}
			
			// 创建一个包含文章索引的数组，按照文章的创建时间降序排序（最新的优先）
			const sortedArticleIndices = this.userArticleData
				.map((article, index) => ({ index, time: article.create_time || article.createTime || article.time || 0 }))
				.sort((a, b) => {
					// 尝试按照时间排序，如果时间相同或不存在，保持原有顺序
					if (typeof a.time === 'string' && typeof b.time === 'string') {
						return new Date(b.time) - new Date(a.time);
					} else if (typeof a.time === 'number' && typeof b.time === 'number') {
						return b.time - a.time;
					} else {
						return a.index - b.index; // 保持原有顺序
					}
				})
				.map(item => item.index);
			
			// 收集所有图片
			const allImages = [];
			
			// 根据排序后的索引遍历文章，最多提取5张图片
			for (let i = 0; i < sortedArticleIndices.length && allImages.length < 5; i++) {
				const articleIndex = sortedArticleIndices[i];
				const article = this.userArticleData[articleIndex];
				
				// 获取当前文章的所有图片
				const articleImages = this.getArticleImages(article);
				
				if (articleImages && articleImages.length > 0) {
					// 添加到总图片集合，避免重复
					for (let img of articleImages) {
						if (!allImages.includes(img) && allImages.length < 5) {
							allImages.push(img);
						}
					}
				}
			}
			
			// 更新最新文章图片数组
			this.latestArticleImages = allImages;
			console.log('提取到的最新文章图片:', this.latestArticleImages);
			
			return this.latestArticleImages;
		},
		
		// 检查文章是否含有视频
		checkArticleHasVideo(article) {
			if (!article) return false;
			
			// 检查常见的视频字段
			if (article.videoURL && typeof article.videoURL === 'string' && this.isValidVideoUrl(article.videoURL)) {
				return true;
			}
			
			// 检查可能包含视频链接的其他字段
			const possibleVideoFields = [
				'videoUrl',
				'video_url',
				'video',
				'videoSrc',
				'video_src',
				'url'
			];
			
			for (let field of possibleVideoFields) {
				if (article[field] && typeof article[field] === 'string' && this.isValidVideoUrl(article[field])) {
					return true;
				}
			}
			
			// 检查视频数组
			const possibleVideoArrayFields = [
				'videos',
				'videoArr',
				'video_arr',
				'videoList',
				'video_list'
			];
			
			for (let field of possibleVideoArrayFields) {
				if (article[field] && Array.isArray(article[field]) && article[field].length > 0) {
					const videoItem = article[field][0];
					if (typeof videoItem === 'string' && this.isValidVideoUrl(videoItem)) {
						return true;
					} else if (typeof videoItem === 'object') {
						const possibleUrlProps = ['url', 'src', 'source', 'path', 'videoUrl'];
						for (let prop of possibleUrlProps) {
							if (videoItem[prop] && typeof videoItem[prop] === 'string' && this.isValidVideoUrl(videoItem[prop])) {
								return true;
							}
						}
					}
				}
			}
			
			// 检查内容中是否有视频链接
			if (article.content) {
				const videoUrlMatch = this.extractVideoUrlFromContent(article.content);
				if (videoUrlMatch) {
					return true;
				}
			}
			
			return false;
		},
		
		// 播放特定文章的视频
		playArticleVideo(article) {
			if (!article) return;
			
			// 提取视频URL
			const videoUrl = this.extractVideoUrlFromArticle(article);
			
			if (videoUrl) {
				// 设置视频URL并显示视频
				this.videoUrl = videoUrl;
				this.videoVisible = true;
				this.userClosedVideo = false;
				
				// 在下一个渲染周期初始化视频上下文
				this.$nextTick(() => {
					this.initVideoContext();
				});
				
				console.log('正在播放文章视频:', videoUrl);
			} else {
				uni.showToast({
					title: '无法提取视频链接',
					icon: 'none'
				});
			}
		},
		
		// 页面加载时搜索所有文章的视频
		async searchAllVideosOnLoad() {
			console.log('正在搜索所有文章的视频...');
			
			// 创建一个数组存储所有找到的视频URL
			let allFoundVideos = [];
			
			// 1. 首先从已加载的文章中搜索视频
			if (this.userArticleData && this.userArticleData.length > 0) {
				console.log(`从${this.userArticleData.length}篇已加载文章中搜索视频...`);
				
				// 遍历所有已加载的文章
				for (let article of this.userArticleData) {
					const videoUrl = this.extractVideoUrlFromArticle(article);
					if (videoUrl && this.isValidVideoUrl(videoUrl)) {
						console.log(`在文章(${article._id || '未知ID'})中找到视频: ${videoUrl}`);
						if (!allFoundVideos.includes(videoUrl)) {
							allFoundVideos.push(videoUrl);
						}
					}
				}
			}
			
			// 2. 判断是否需要加载更多文章来搜索视频
			const totalArticles = this.totalArticleCount || 0;
			const loadedArticles = this.userArticleData ? this.userArticleData.length : 0;
			
			// 如果已经找到视频或已加载所有文章，则不需要加载更多
			if (allFoundVideos.length > 0 || loadedArticles >= totalArticles) {
				console.log(`已找到${allFoundVideos.length}个视频，不需要加载更多文章`);
			} else if (totalArticles > loadedArticles && this.hasMore) {
				// 需要加载更多文章
				console.log(`已加载${loadedArticles}篇文章，共有${totalArticles}篇，尝试加载更多来搜索视频...`);
				
				try {
					// 临时存储当前页码
					const originalPageNo = this.pageNo;
					const maxPagesToLoad = 3; // 最多额外加载3页，防止过多请求
					
					// 尝试最多额外加载3页来搜索视频
					for (let i = 0; i < maxPagesToLoad && this.hasMore && allFoundVideos.length === 0; i++) {
						this.pageNo++;
						console.log(`加载第${this.pageNo}页文章来搜索视频...`);
						
						// 加载新一页的文章
						await this.getArticelList(false);
						
						// 从新加载的文章中搜索视频
						if (this.userArticleData && this.userArticleData.length > loadedArticles) {
							// 只检查新加载的文章
							const newArticles = this.userArticleData.slice(loadedArticles);
							console.log(`从新加载的${newArticles.length}篇文章中搜索视频...`);
							
							for (let article of newArticles) {
								const videoUrl = this.extractVideoUrlFromArticle(article);
								if (videoUrl && this.isValidVideoUrl(videoUrl)) {
									console.log(`在新加载文章(${article._id || '未知ID'})中找到视频: ${videoUrl}`);
									if (!allFoundVideos.includes(videoUrl)) {
										allFoundVideos.push(videoUrl);
									}
									
									// 找到视频后，可以选择停止搜索
									if (allFoundVideos.length >= 5) { // 限制搜索的视频数量，避免过多
										break;
									}
								}
							}
						}
					}
				} catch (err) {
					console.error('加载更多文章搜索视频时出错:', err);
				}
			}
			
			// 保存找到的所有视频
			if (allFoundVideos.length > 0) {
				console.log(`共找到${allFoundVideos.length}个视频链接:`, allFoundVideos);
				
				// 更新视频缓存
				this.videoUrlCache = allFoundVideos;
				
				// 自动播放第一个视频（除非用户之前关闭了视频）
				if (!this.userClosedVideo) {
					this.videoUrl = allFoundVideos[0];
					this.videoVisible = true;
					
					// 在下一个渲染周期初始化视频上下文
					this.$nextTick(() => {
						this.initVideoContext();
					});
				}
				
				// 发出事件通知找到了视频
				uni.$emit('videosFound', { 
					count: allFoundVideos.length,
					videos: allFoundVideos
				});
				
				return allFoundVideos;
			} else {
				console.log('未找到任何视频链接');
				return [];
			}
		},
	},
	
	// 分享给朋友
	onShareAppMessage() {
		// 使用统一的分享信息方法
		return this.getShareInfo();
	},
	
	// 分享到朋友圈
	onShareTimeline() {
		// 获取统一的分享信息
		const shareInfo = this.getTimelineShareInfo();
		
		// 构建朋友圈分享信息
		return shareInfo;
	}
}
</script>

<template>
	<view class="userArticleList">
		
		<!-- 添加微信开放能力按钮 (隐藏但功能可用) -->
		<button 
			open-type="share" 
			style="position: absolute; width: 0; height: 0; padding: 0; margin: 0; opacity: 0;"
		></button>
		
		<!-- 用于生成分享图的Canvas (隐藏) -->
		<canvas canvas-id="shareCanvas" style="width: 750px; height: 600px; position: absolute; left: -2000px; top: 0;"></canvas>
		
		<scroll-view 
			@scrolltolower="scrolltolower" 
			:scroll-y="true" 
			class="scroll-view-article"
			refresher-enabled
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
			show-scrollbar="true"
			enable-passive="true" 
			enable-back-to-top="true"
			enhanced="true"
			bounces="true"
			refresher-threshold="80"
			refresher-background="#f2f2f2">
			<view class="content">
				<!-- 用户信息头部 -->
				<view class="head">
					<user-header @contact="handleContact" @publish="goToPublish" :articleTotal="articleTotal"
						:userInfo="userArticleInfo"></user-header>
				</view>
				
				<!-- 视频播放组件 -->
				<view class="video-container" v-if="videoUrl && videoUrl.length > 0">
					<video 
						id="myVideo"
						:src="videoUrl"
						class="video-player"
						object-fit="cover" 
						controls 
						autoplay
						@play="onVideoPlay"
						@pause="onVideoPause"
						@ended="onVideoEnded"
						@error="onVideoError"
						:loop="false"
						enable-progress-gesture
						enable-play-gesture
						show-fullscreen-btn
						show-play-btn
						show-center-play-btn
						@fullscreenchange="handleFullscreenChange">
					</video>
					<!-- 关闭按钮 -->
					<view class="video-close-btn" @click="hideVideo">
						<text class="close-icon">×</text>
					</view>
				</view>
				
				<!-- 文章列表 -->
				<articleItem v-if="userArticleData && userArticleData.length > 0"
					@preview="(url, urls) => previewImage(urls, url)" @contact="handleContact"
					@delete="handleDelete" v-for="item in userArticleData" :item="item" :key="item._id"
					:avatarClickEnabled="avatarClickEnabled">
					<!-- 添加视频标记 -->
					<template v-if="item.hasVideo" #video-badge>
						<view class="video-badge" @click.stop="playArticleVideo(item)">
							<text class="video-badge-icon">▶</text>
							<text class="video-badge-text">视频</text>
						</view>
					</template>
				</articleItem>
				<view v-else class="empty-state">
					<text>暂无文章</text>
				</view>
				
				<!-- 加载状态 - 优化显示 -->
				<view style="margin-bottom: 120rpx; padding-bottom: 90rpx;">
					<uni-load-more color="#d6d6d6" :status="status" :content-text="loadMoreText" />
				</view>
				
				<!-- 底部安全区域间距 -->
				<view class="safe-area-inset-bottom"></view>
			</view>
		</scroll-view>
		
		<!-- 优化后的分享按钮 -->
		<view class="share-buttons">
			<!-- 分享到朋友圈按钮 - 显示提示引导用户 -->
			<button class="share-btn share-to-group" @tap="shareToTimeline">
				<text class="icon lishuai-iconfontzhizuobiaozhunbduan36"></text>
				<text class="btn-text">分享朋友圈</text>
			</button>
			
			<!-- 发给好友按钮 - 直接使用open-type="share"调起转发 -->
			<button class="share-btn share-to-friend" open-type="share">
				<text class="icon lishuai-weixin"></text>
				<text class="btn-text">发给好友</text>
			</button>
		</view>
		
		<!-- 全屏弹窗 -->
		<view class="full-screen-popup" v-if="showFullScreenPopup" @tap="closeFullScreenPopup">
			<view class="popup-content" @tap.stop>
				<view class="popup-header">
					<text class="popup-title">分享到朋友圈</text>
					<text class="popup-close" @tap="closeFullScreenPopup">×</text>
				</view>
				<view class="popup-body">
					<image class="popup-image" :src="dynamicShareImage || defaultShareImage" mode="aspectFit"></image>
					<view class="popup-text">
						<text>点击右上角 "..." 按钮</text>
						<text>选择 "分享到朋友圈"</text>
					</view>
				</view>
				<view class="popup-footer">
					<button class="popup-btn" @tap="closeFullScreenPopup">我知道了</button>
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.userArticleList {
		height: 100vh;
		background-color: $pyq-pages-bg-color;
		position: relative;
		display: flex;
		flex-direction: column;
		touch-action: pan-y; /* 优化触摸响应 */

		.content {
			padding-bottom: env(safe-area-inset-bottom);
			padding: 20rpx;
			-webkit-overflow-scrolling: touch; /* iOS流畅滚动 */

			.head {
				margin-bottom: 2rpx;
			}
			
			.empty-state {
				display: flex;
				justify-content: center;
				align-items: center;
				padding: 40rpx 0;
				color: #999;
				font-size: 28rpx;
			}
		}
		
		.scroll-view-article {
			flex: 1;
			height: 0; /* 使用flex布局时，设置height为0使其自动扩展 */
			padding-bottom: 120rpx; /* 为底部按钮留出空间 */
			-webkit-overflow-scrolling: touch; /* iOS流畅滚动 */
		}
		
		/* 文本省略样式 */
		.ellipsis {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		
		.ellipsis-2 {
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			overflow: hidden;
			text-overflow: ellipsis;
			word-break: break-all;
		}
		
		/* 正方形图片样式 */
		.square-image {
			width: 100%;
			height: 100%;
			border-radius: 8rpx;
			object-fit: cover; /* 确保图片填充容器并裁剪到最短边 */
		}
		
		/* 分享标题显示区域 */
		.share-titles {
			background-color: #fff;
			padding: 20rpx;
			margin-bottom: 10rpx;
			border-bottom: 1px solid #eee;
			
			.title-box {
				margin-bottom: 10rpx;
				
				.title-label {
					font-size: 24rpx;
					color: #666;
					margin-bottom: 4rpx;
				}
				
				.title-content {
					font-size: 28rpx;
					color: #333;
					padding: 10rpx;
					background-color: #f8f8f8;
					border-radius: 8rpx;
				}
			}
		}
		
		/* 优化后的分享按钮样式 */
		.share-buttons {
			position: fixed;
			bottom: 80rpx;
			left: 0;
			right: 0;
			display: flex;
			justify-content: center;
			gap: 30rpx;
			z-index: 100;
			padding: 0 80rpx;
		}
		
		.share-btn {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			height: 80rpx;
			border-radius: 40rpx;
			border: none;
			color: #ffffff;
			font-size: 28rpx;
			font-weight: 500;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
			transition: all 0.3s ease;
			
			&::after {
				border: none; /* 移除按钮默认边框 */
			}
			
			.icon {
				font-size: 38rpx;
				color: #FFFFFF;
			}
			
			.btn-text {
				margin-left: 10rpx;
			}
			
			&.share-to-group {
				background: linear-gradient(135deg, #f7991e, #f39b16); /* 渐变橙色 */
				
				&:active {
					transform: scale(0.95);
					box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
				}
			}
			
			&.share-to-friend {
				background: linear-gradient(135deg, #5ecc80, #4fc08d); /* 渐变绿色 */
				
				&:active {
					transform: scale(0.95);
					box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
				}
			}
		}
		
		.safe-area-inset-bottom {
			height: 30rpx;
			padding-bottom: env(safe-area-inset-bottom);
		}
		
		/* 防止滚动时出现白色间隙 */
		overflow: hidden;
	}
	
	/* 视频播放器相关样式 */
	.video-container {
		position: relative;
		margin: 20rpx auto 20rpx;
		border-radius: 12rpx;
		overflow: hidden;
	}
	
	.video-player {
		width: 100%;
		height: 420rpx; /* 16:9 宽高比 */
		background-color: #000;
		border-radius: 5rpx;
	}
	
	.video-close-btn {
		position: absolute;
		top: 20rpx;
		right: 20rpx;
		width: 60rpx;
		height: 60rpx;
		background-color: rgba(0, 0, 0, 0.6);
		border-radius: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 101;
		transition: all 0.2s ease;
		box-shadow: 0 0 10rpx rgba(0, 0, 0, 0.3);
		
		.close-icon {
			color: #fff;
			font-size: 50rpx;
			font-weight: bold;
		}
		
		&:active {
			background-color: rgba(0, 0, 0, 0.8);
			transform: scale(0.95);
		}
	}
	
	
	
	.placeholder-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	
	.placeholder-icon {
		color: #fff;
		font-size: 50rpx;
		margin-bottom: 10rpx;
	}
	
	.placeholder-text {
		color: #fff;
		font-size: 28rpx;
		font-weight: 500;
	}
	
	/* 分享引导蒙层样式 */
	.share-guide-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
		
		/* 半透明黑色背景 */
		.overlay-bg {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(0, 0, 0, 0.8);
		}
		
		/* 顶部引导提示 */
		.top-guide {
			position: absolute;
			top: 120rpx;
			right: 120rpx;
			display: flex;
			align-items: center;
			background-color: #fff;
			border-radius: 40rpx;
			padding: 10rpx 25rpx;
			box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
			z-index: 1;
			
			.guide-number {
				width: 36rpx;
				height: 36rpx;
				line-height: 36rpx;
				text-align: center;
				background-color: #ff6b00;
				color: #fff;
				border-radius: 50%;
				font-size: 26rpx;
				font-weight: bold;
				margin-right: 10rpx;
			}
			
			.guide-text {
				color: #333;
				font-size: 28rpx;
				font-weight: 500;
			}
		}
		
		/* 引导箭头线 */
		.guide-arrow-line {
			position: absolute;
			top: 180rpx;
			right: 160rpx;
			width: 300rpx;
			height: 700rpx;
			
			/* 使用伪元素创建虚线 */
			&::before {
				content: '';
				position: absolute;
				top: 0;
				right: 40rpx;
				height: 100%;
				width: 8rpx;
				background: transparent;
				border: none;
				box-shadow: 6rpx 0 0 #fff;
				border-radius: 0 0 0 100%;
				transform: rotate(-20deg);
			}
			
			/* 箭头尖端 */
			.arrow-end {
				position: absolute;
				bottom: 20rpx;
				right: 270rpx;
				width: 24rpx;
				height: 24rpx;
				border-right: 6rpx solid #fff;
				border-bottom: 6rpx solid #fff;
				transform: rotate(45deg);
			}
		}
		
		/* 底部引导文字 */
		.bottom-guide {
			position: absolute;
			bottom: 400rpx;
			left: 0;
			right: 0;
			text-align: center;
			color: #fff;
			font-size: 36rpx;
			font-weight: 500;
			line-height: 1.8;
			display: flex;
			flex-direction: column;
			align-items: center;
			
			.close-tip {
				margin-top: 60rpx;
				font-size: 24rpx;
				color: rgba(255, 255, 255, 0.7);
			}
		}
	}
	
	/* 全屏弹窗样式 */
	.full-screen-popup {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.75);
		z-index: 9999;
		display: flex;
		justify-content: center;
		align-items: center;
		
		.popup-content {
			width: 80%;
			background-color: #fff;
			border-radius: 24rpx;
			overflow: hidden;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
			display: flex;
			flex-direction: column;
		}
		
		.popup-header {
			position: relative;
			padding: 30rpx;
			text-align: center;
			border-bottom: 1px solid #f0f0f0;
			
			.popup-title {
				font-size: 34rpx;
				font-weight: bold;
				color: #333;
			}
			
			.popup-close {
				position: absolute;
				right: 30rpx;
				top: 30rpx;
				font-size: 40rpx;
				color: #999;
				line-height: 1;
			}
		}
		
		.popup-body {
			padding: 40rpx;
			display: flex;
			flex-direction: column;
			align-items: center;
			
			.popup-image {
				width: 100%;
				height: 400rpx;
				margin-bottom: 30rpx;
				border-radius: 12rpx;
				background-color: #f5f5f5;
			}
			
			.popup-text {
				display: flex;
				flex-direction: column;
				align-items: center;
				
				text {
					font-size: 32rpx;
					color: #333;
					margin-bottom: 16rpx;
					
					&:last-child {
						color: #ff8c3e;
						font-weight: bold;
					}
				}
			}
		}
		
		.popup-footer {
			padding: 30rpx;
			display: flex;
			justify-content: center;
			
			.popup-btn {
				background: linear-gradient(135deg, #ff9f43, #ff8c3e);
				color: #fff;
				font-size: 32rpx;
				font-weight: 500;
				padding: 20rpx 80rpx;
				border-radius: 40rpx;
				border: none;
				
				&::after {
					border: none;
				}
			}
		}
	}
	
	/* 增加加载更多组件与底部的距离 */
	.loading-more-spacing {
		margin-bottom: 90rpx; /* 增加到60rpx */
		margin-top: 40rpx; /* 增加顶部边距 */
		padding-bottom: 60rpx; /* 增加底部内边距 */
		position: relative; /* 添加相对定位，便于添加装饰元素 */
		
		/* 确保内部uni-load-more组件有足够间距 */
		:deep(.uni-load-more) {
			padding: 40rpx 0;
			
			/* 自定义文本样式 */
			.uni-load-more__text {
				font-size: 26rpx;
				color: #888888;
			}
			
			/* 自定义loading动画样式 */
			.uni-load-more__img {
				width: 36rpx !important;
				height: 36rpx !important;
			}
		}
		
		/* 添加上下装饰线 */
		&::before, &::after {
			content: '';
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
			width: 120rpx;
			height: 2rpx;
			background: linear-gradient(to right, transparent, #e0e0e0, transparent);
		}
		
		&::before {
			top: 0;
		}
		
		&::after {
			bottom: 0;
		}
	}
	
	.video-badge {
		position: absolute;
		top: 10rpx;
		right: 10rpx;
		display: flex;
		align-items: center;
		background-color: rgba(0, 0, 0, 0.6);
		padding: 4rpx 16rpx;
		border-radius: 30rpx;
		z-index: 10;
		
		.video-badge-icon {
			color: #fff;
			font-size: 20rpx;
			margin-right: 6rpx;
		}
		
		.video-badge-text {
			color: #fff;
			font-size: 22rpx;
		}
		
		&:active {
			background-color: rgba(0, 0, 0, 0.8);
			transform: scale(0.96);
		}
	}
</style>

<!-- 移除全局样式中的标签选择器，避免微信小程序的限制 -->
<!-- 注意：这些样式应该在组件内部使用类选择器实现，而不是在这里全局覆盖 -->