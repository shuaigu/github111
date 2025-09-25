<script setup>
	import { computed, onMounted, ref, watch, onUnmounted, onBeforeUnmount, onActivated, nextTick } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	import formatTime from '@/utils/formatTime.js'
	import { testLogin } from '@/utils/isLogin'
	import { onReachBottom, onShareAppMessage, onShareTimeline, onLoad, onShow, onHide, onUnload, onReady, onPullDownRefresh } from '@dcloudio/uni-app'
	// 导入推荐组件
	import tuijian from '@/components/tuijian/tuijian.vue'


	// 导入uni-load-more组件
	import uniLoadMore from '@/uni_modules/uni-load-more/components/uni-load-more/uni-load-more.vue'
	

	// 接受传递过来的数据 - 不需要导入 defineProps
	const props = defineProps( {
		article_id: {
			type: String,
			default: ''
		},
		
		user_id: String
	} )

	// 在setup部分顶部添加userStore引用
	const userStore = useUserInfoStore()

	// 在script setup顶部添加图片CDN处理函数（已禁用压缩）
	const processCDNImage = (url) => {
		if (!url) return '';
		
		// 已禁用图片压缩功能，直接返回原始URL
		// 移除所有压缩参数，避免长URL导致的400错误
		if (url.includes('?')) {
			// 提取基础URL，去除所有参数
			const baseUrl = url.split('?')[0];
			console.log('已移除图片压缩参数:', url, '->', baseUrl);
			return baseUrl;
		}
		
		return url;
	};
	
	// 添加登录状态跟踪，避免多次显示loading
	const loginLoadingVisible = ref(false);

	// 手机号识别和拨号功能（小程序专用版本）
	// 添加手机号码识别和处理函数
	const processPhoneNumbers = (text) => {
		if (!text) return text;
		
		// 手机号码正则表达式（支持多种格式）
		// 匹配：11位数字、带分隔符的手机号等
		const phoneRegex = /(1[3-9]\d{9}|1[3-9]\d[-\s]?\d{4}[-\s]?\d{4})/g;
		
		// 替换手机号为可点击的链接格式（去除蓝色样式）
		return text.replace(phoneRegex, function(match) {
			// 提取纯数字手机号
			var cleanPhone = match.replace(/[-\s]/g, '');
			// 验证是否为有效的11位手机号
			if (cleanPhone.length === 11 && /^1[3-9]\d{9}$/.test(cleanPhone)) {
				// 使用普通样式，不显示蓝色和下划线
				return '<span style="cursor: pointer; padding: 2rpx 4rpx; border-radius: 4rpx;" data-phone="' + cleanPhone + '" class="phone-link">' + match + '</span>';
			}
			return match;
		});
	};
	
	// 处理手机号点击事件（小程序环境优化）
	const handlePhoneClick = function(phone) {
		try {
			console.log('准备拨打电话:', phone);
			
			// 验证手机号格式
			if (!phone || phone.length !== 11 || !/^1[3-9]\d{9}$/.test(phone)) {
				uni.showToast({
					title: '手机号格式不正确',
					icon: 'none',
					duration: 2000
				});
				return;
			}
			
			// 检查登录状态
			customTestLogin().then(function(isLoggedIn) {
				if (!isLoggedIn) {
					console.log('用户未登录，无法拨打电话');
					return;
				}
				
				// 添加确认弹窗
				uni.showModal({
					title: '拨打电话',
					content: '是否拨打 ' + phone + '？',
					confirmText: '拨打',
					cancelText: '取消',
					success: function(res) {
						if (res.confirm) {
							console.log('用户确认拨打电话');
							// 用户确认后调用拨号功能
							uni.makePhoneCall({
								phoneNumber: phone,
								success: function() {
									console.log('成功调起拨号界面');
								},
								fail: function(err) {
									console.error('拨打电话失败:', err);
									
									// 根据错误类型给出不同提示
									var errorMsg = '拨打电话失败';
									if (err.errMsg) {
										if (err.errMsg.indexOf('cancel') !== -1) {
											errorMsg = '用户取消拨打';
										} else if (err.errMsg.indexOf('fail') !== -1) {
											errorMsg = '设备不支持拨号功能';
										}
									}
									
									uni.showToast({
										title: errorMsg,
										icon: 'none',
										duration: 2000
									});
								}
							});
						} else {
							console.log('用户取消拨打电话');
						}
					},
					fail: function(err) {
						console.error('显示确认对话框失败:', err);
					}
				});
			}).catch(function(err) {
				console.error('登录检查失败:', err);
			});
			
		} catch (err) {
			console.error('处理电话点击失败:', err);
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none',
				duration: 2000
			});
		}
	};
	
	// 处理rich-text的点击事件（针对小程序环境优化）
	const handleRichTextTap = function(e) {
		console.log('Rich text tap event:', e);
		
		// 在小程序环境中，rich-text的点击事件处理可能不同
		// 尝试多种方式获取点击的元素信息
		var phoneNumber = null;
		
		// 方式1: 从target获取
		if (e.detail && e.detail.target && e.detail.target.dataset && e.detail.target.dataset.phone) {
			phoneNumber = e.detail.target.dataset.phone;
		}
		// 方式2: 从currentTarget获取
		else if (e.detail && e.detail.currentTarget && e.detail.currentTarget.dataset && e.detail.currentTarget.dataset.phone) {
			phoneNumber = e.detail.currentTarget.dataset.phone;
		}
		// 方式3: 检查是否有data-phone属性（兼容性处理）
		else if (e.detail && e.detail.target) {
			// 在小程序中，可能需要从文本内容中重新提取手机号
			var targetText = e.detail.target.innerText || e.detail.target.textContent || '';
			if (targetText) {
				var phoneMatch = targetText.match(/1[3-9]\d{9}/);
				if (phoneMatch) {
					phoneNumber = phoneMatch[0];
				}
			}
		}
		
		if (phoneNumber) {
			console.log('检测到手机号:', phoneNumber);
			handlePhoneClick(phoneNumber);
		} else {
			console.log('未检测到有效的手机号点击，尝试备用方案');
			// 备用方案：解析整个文本内容中的手机号
			handleTextPhoneDetection();
		}
	};
	
	// 备用的手机号检测方案
	const handleTextPhoneDetection = function() {
		var text = articleDetail.value && articleDetail.value.content ? articleDetail.value.content : '';
		if (!text) return;
		
		var phoneRegex = /1[3-9]\d{9}/g;
		var matches = text.match(phoneRegex);
		
		if (matches && matches.length > 0) {
			if (matches.length === 1) {
				// 只有一个手机号，直接调用handlePhoneClick（内部已有确认机制）
				handlePhoneClick(matches[0]);
			} else {
				// 多个手机号，让用户选择
				uni.showActionSheet({
					itemList: matches.map(function(phone) { return '拨打 ' + phone; }),
					success: function(res) {
						// 选择后直接调用handlePhoneClick，内部已有确认机制
						handlePhoneClick(matches[res.tapIndex]);
					},
					fail: function(err) {
						console.error('显示手机号选择列表失败:', err);
					}
				});
			}
		} else {
			console.log('文本中未找到有效的手机号');
		}
	};
	
	// 处理富文本内容，识别手机号
	const processedContent = computed(() => {
		if (!articleDetail.value || !articleDetail.value.content) return '';
		return processPhoneNumbers(articleDetail.value.content);
	});

	// 处理页面跳转逻辑
	const handlePageNavigation = async () => {
		try {
			// 获取当前页面栈
			const pages = getCurrentPages()
			
			// 如果是直接进入详情页（页面栈长度为1）
			if (pages.length === 1) {
				// 先跳转到首页
				uni.switchTab({
					url: '/pages/index/index',
					success: () => {
						// 首页加载完成后，再跳转回文章详情页
						setTimeout(() => {
							uni.navigateTo({
								url: `/pages/article/articleDetail?article_id=${props.article_id}`,
								animationType: 'slide-in-right', // 添加右侧滑入动画
								animationDuration: 300, // 设置动画持续时间为300ms
								fail: (err) => {
									console.error('跳转回文章详情页失败:', err)
								}
							})
						}, 300) // 减少首页加载时间，增加流畅度
					},
					fail: (err) => {
						console.error('跳转到首页失败:', err)
						// 如果跳转失败，仍然尝试加载首页数据
						try {
							const cateApi = uniCloud.importObject('cateWx', { customUI: true })
							cateApi.get().catch(err => {
								console.warn('预加载首页数据失败', err)
							})
						} catch (err) {
							console.warn('初始化首页数据失败', err)
						}
					}
				})
				return true // 返回 true 表示需要跳转
			}

			return false // 返回 false 表示无需跳转
		} catch (err) {
			console.error('页面导航错误：', err)
			return false
		}
	}
	// 添加一个加载状态标记
	const isLoading = ref( true )
	const isSubmitting = ref( false )
	const articleApi = uniCloud.importObject( 'articleWx', { customUI: true } )

	const likeApi = uniCloud.importObject( 'likeRecord', { customUI: true } )
	const userApi = uniCloud.importObject('userWx', { customUI: true }) // 使用userWx代替login
	// const loginApi = uniCloud.importObject('login', { customUI: true })

	// 文章详情
	const articleDetail = ref( {} )



	// 增加一个标志位，避免重复登录检查
	const isCheckingLogin = ref(false)

	// 添加当前图片索引的状态
	const currentImageIndex = ref(0)

	// 添加图片懒加载状态跟踪
	const imageLoadStatus = ref({})
	const isAnyImageLoading = ref(true)
	
	// 添加视频相关状态
	const videoLoadStatus = ref('loading')
	const videoContext = ref(null)
	
	// 新增导航信息
	const navInfo = ref(null)


	// 添加推荐组件的ref
	const tuijianRef = ref(null)

	// 在script setup顶部添加ref引用
	const likeButtonTop = ref(null)
	const likeButtonBottom = ref(null)
	const isLikeAnimating = ref(false)

	// 添加一个统一的媒体处理函数
	const processMediaURL = (url, type = 'image') => {
		if (!url) return '';
		
		// 处理CDN域名
		if (url.includes('jingle0350.cn')) {
			if (type === 'image') {
				return processCDNImage(url);
			}
		}
		
		// 处理可能的防盗链问题
		if (url.includes('ixigua.com') || url.includes('aly2.')) {
			return url.includes('?') ? `${url}&referer=no_referer` : `${url}?referer=no_referer`;
		}
		
		// 对视频URL的特殊处理
		if (type === 'video' && url.includes('baidu.com')) {
			// 百度视频链接可能需要特殊处理
			return url;
		}
		
		return url;
	};
	
	// 添加验证图片URL的函数
	const isValidImageUrl = (url) => {
		if (!url) return false;
		
		// 检查是否是合法的URL格式
		return url.startsWith('http') || url.startsWith('https') || url.startsWith('/') || url.startsWith('data:image');
	};
	
	// 添加图片加载超时机制
	const imageLoadTimeouts = ref({});
	// 增加加载超时时间，因为模拟器/真机可能较慢
	const IMAGE_LOAD_TIMEOUT = 15000; // 15秒
	// 添加最大重试次数
	const MAX_RETRY_COUNT = 3;
	// 添加图片重试计数
	const imageRetryCount = ref({});
	
	// 添加分享信息
	const shareInfo = ref({
		title: '',
		path: '',
		imageUrl: ''
	});
	
	// 更新分享信息
	const updateShareInfo = () => {
		try {
			// 处理分享标题，使用文章内容的前30个字符
			let title = articleDetail.value.content 
				? articleDetail.value.content.substring(0, 30) 
				: '精彩内容';
			
			// 为所有标题添加分类名
			if (articleDetail.value.cate_name) {
				title = `【${articleDetail.value.cate_name}】 ${title}`;
			}
			
			// 设置分享图片URL（仅用于朋友圈分享）
			let imageUrl = '';
			
			// 尝试获取文章的第一张图片作为朋友圈分享封面
			if (articleDetail.value.images && articleDetail.value.images.length > 0) {
				// 获取第一张图片
				const firstImage = articleDetail.value.images[0];
				// 优先使用压缩图或缩略图，以提高加载速度
				imageUrl = firstImage.compressedURL || firstImage.thumbnailURL || firstImage.url || '';
			}
			
			// 设置分享路径
			const path = `/pages/article/articleDetail?article_id=${props.article_id}`;
			
			// 更新分享信息（朋友圈分享包含imageUrl，微信好友分享不包含）
			shareInfo.value = {
				title,
				path,
				imageUrl
			};
			
			console.log('分享信息已更新（朋友圈使用文章图片，微信好友使用页面截图）:', shareInfo.value);
		} catch (err) {
			console.error('更新分享信息失败:', err);
		}
	};
	
	// 分享到微信好友
	onShareAppMessage((res) => {
		updateShareInfo();
		return {
			title: shareInfo.value.title,
			path: shareInfo.value.path
			// 微信好友分享不设置imageUrl，使用页面截图作为分享封面
		};
	});
	
	// 分享到朋友圈
	onShareTimeline(() => {
		updateShareInfo();
		return {
			title: shareInfo.value.title,
			path: shareInfo.value.path,
			imageUrl: shareInfo.value.imageUrl
			// 朋友圈分享使用文章第一张图片作为封面
		};
	});
	
	// 自定义按钮分享
	const handleShareButtonClick = () => {
		updateShareInfo();
		
		// 检查环境是否支持uni.share API
		if (typeof uni.share === 'function') {
			uni.share({
				provider: 'weixin',
				title: shareInfo.value.title,
				scene: 'WXSceneSession', // WXSceneSession 微信好友，WXSceneTimeline 朋友圈
				summary: shareInfo.value.title,
				href: shareInfo.value.path,
				imageUrl: shareInfo.value.imageUrl,
				success: () => {
					console.log('分享成功');
					uni.showToast({
						title: '分享成功',
						icon: 'success'
					});
				},
				fail: (err) => {
					console.error('分享失败:', err);
					uni.showToast({
						title: '分享失败',
						icon: 'none'
					});
				}
			});
		} else {
			// 对于不支持 uni.share 的平台，提示用户使用右上角菜单分享
			uni.showToast({
				title: '请使用右上角菜单分享',
				icon: 'none'
			});
		}
	};
	
	// 监听分享信息设置事件
	uni.$on('setShareInfo', (data) => {
		if (data) {
			shareInfo.value = {
				title: data.title || shareInfo.value.title,
				path: data.path || shareInfo.value.path,
				imageUrl: data.imageUrl || shareInfo.value.imageUrl
			};
		}
	});

	// 页面卸载时移除事件监听
	onBeforeUnmount(() => {
		uni.$off('setShareInfo');
	});
	
	// 获取文章详情
	const getArticleDetail = async () => {
		try {
			// 先检查是否需要处理页面导航
			const needRedirect = await handlePageNavigation()
			if (needRedirect) {
				return // 如果需要重定向，直接返回
			}

			// 检查文章ID是否存在
			if (!props.article_id) {
				throw new Error('文章ID不能为空')
			}

			// 添加轻微延迟，确保页面动画完成
			await new Promise(resolve => setTimeout(resolve, 50));

			const res = await articleApi.getArticleDetal(props.article_id)
			
			// 检查返回的数据结构
			if (!res || !res.articleRes || !res.articleRes.data || !Array.isArray(res.articleRes.data)) {
				throw new Error('获取文章详情失败：返回数据格式错误')
			}

			// 更新文章详情
			const articleData = res.articleRes.data[0]
			
			// 确保文章内容不为空
			if (!articleData.content) {
				articleData.content = '暂无内容'
			}
			
			// 处理视频资源
			if (articleData.videoURL) {
				articleData.videoURL = processMediaURL(articleData.videoURL, 'video');
				videoLoadStatus.value = 'loading';
			}
			
			// 处理图片资源，优化图片处理
			if (articleData.images && articleData.images.length) {
				// 清空之前的加载状态
				imageLoadStatus.value = {};
				imageRetryCount.value = {};
				
				// 清除之前的超时计时器
				Object.keys(imageLoadTimeouts.value).forEach(key => {
					clearTimeout(imageLoadTimeouts.value[key]);
				});
				imageLoadTimeouts.value = {};
				
				// 处理图片资源，添加必要的处理逻辑
				articleData.images = articleData.images.map((img, index) => {
					// 确保图片有压缩地址
					if (!img.compressedURL && img.url) {
						img.compressedURL = img.url;
					}
					
					// 处理图片URL，使用统一的媒体处理函数
					if (img.compressedURL) {
						img.compressedURL = processMediaURL(img.compressedURL, 'image');
					}
					
					// 确保缩略图URL存在
					if (!img.thumbnailURL && img.compressedURL) {
						img.thumbnailURL = img.compressedURL;
					}
					
					// 检查URL是否有效
					if (!isValidImageUrl(img.compressedURL) && !isValidImageUrl(img.thumbnailURL) && !isValidImageUrl(img.url)) {
						console.warn(`图片 ${index} 的URL无效:`, img);
						// 设置默认图片
						img.compressedURL = '/static/images/default.png';
						img.thumbnailURL = '/static/images/default.png';
					}
					
					// 设置每张图片的初始加载状态
					imageLoadStatus.value[index] = 'loading';
					
					// 为每张图片设置加载超时
					imageLoadTimeouts.value[index] = setTimeout(() => {
						if (imageLoadStatus.value[index] === 'loading') {
							console.log(`图片 ${index} 加载超时`);
							imageLoadStatus.value[index] = 'error';
							checkAllImagesLoaded();
						}
					}, IMAGE_LOAD_TIMEOUT);
					
					return img;
				});
				
				// 设置加载状态
				isAnyImageLoading.value = true;
				
				// 设置全局超时，确保即使所有图片都加载失败，也能看到内容
				setTimeout(() => {
					if (isAnyImageLoading.value) {
						console.log('图片加载全局超时，强制显示内容');
						isAnyImageLoading.value = false;
					}
				}, IMAGE_LOAD_TIMEOUT + 2000);
			} else {
				isAnyImageLoading.value = false;
			}
			
			// 获取分类名称
			if (articleData.cate_id) {
				try {
					const cateApi = uniCloud.importObject('cateWx', { customUI: true })
					const cateRes = await cateApi.get(articleData.cate_id)
					if (cateRes.data && cateRes.data[0]) {
						articleData.cate_name = cateRes.data[0].cate_name
					}
				} catch (err) {
					console.error('获取分类名称失败:', err)
				}
			}
			
			// 确保文章对象有所有必要的属性
			articleDetail.value = {
				_id: articleData._id || '',
				content: articleData.content || '',
				user_id: articleData.user_id || '',
				user_nickName: articleData.user_nickName || '',
				user_avatarUrl: articleData.user_avatarUrl || '',
				user_mobile: articleData.user_mobile || '',
				cate_id: articleData.cate_id || '',
				cate_name: articleData.cate_name || '',
				create_time: articleData.create_time || Date.now(),
				look_count: articleData.look_count || 0,
				like_count: articleData.like_count || 0,
				address: articleData.address || '', // 添加地址字段
				district: articleData.district || '', // 添加区域字段
				images: articleData.images || [],
				videoURL: articleData.videoURL || null
			}

			// 添加调试信息，检查位置信息是否正确获取
			console.log('文章详情位置信息调试:', {
				originalAddress: articleData.address,
				originalDistrict: articleData.district,
				finalAddress: articleDetail.value.address,
				finalDistrict: articleDetail.value.district,
				getSimplifiedLocationResult: getSimplifiedLocation()
			});

		} catch (err) {
			console.error('获取文章详情失败：', err)
			
			// 特别检查是否为抽奖相关错误
			if (err.message && (err.message.includes('lotteryVisibility') || err.message.includes('lottery') || err.message.includes('currentCommentPosition'))) {
				console.warn('检测到抽奖相关错误，已忽略：', err.message);
				uni.showToast({
					title: '请清理缓存后重试',
					icon: 'none',
					duration: 3000
				})
			} else {
				uni.showToast({
					title: '获取文章详情失败',
					icon: 'none'
				})
			}
		}
	}





	// 添加页面刷新方法
	const refreshPage = async () => {
		try {
			// 设置加载状态
			isLoading.value = true;
			
			// 清除所有图片超时计时器
			Object.keys(imageLoadTimeouts.value).forEach(key => {
				clearTimeout(imageLoadTimeouts.value[key]);
			});
			// 重置图片加载状态
			imageLoadStatus.value = {};
			imageLoadTimeouts.value = {};
			imageRetryCount.value = {};
			isAnyImageLoading.value = true;
			
			// 重新加载文章详情
			await getArticleDetail();
			
			// 更新浏览计数
			await updatePageView();
			
			console.log('页面数据已刷新');
		} catch (error) {
			console.error('刷新页面数据失败:', error);
			uni.showToast({
				title: '刷新数据失败',
				icon: 'none'
			});
		} finally {
			// 重置加载状态
			isLoading.value = false;
			
			// 停止下拉刷新动画（如果有）
			uni.stopPullDownRefresh();
		}
	}

	// 添加下拉刷新处理函数
	onPullDownRefresh(() => {
		refreshPage();
	});







	// 跳转到首页
	const goToHome = ( ) => {
		uni.switchTab( {
			url: '/pages/index/index'
		} )
	}

	// 修改处理打电话的方法
	const handleCall = async () => {
		try {
			// 检查登录状态
			const isLoggedIn = await customTestLogin()
			if (!isLoggedIn) {
				// customTestLogin 已经处理了登录跳转
				return
			}

			// 如果没有就给与提示
			if (articleDetail.value.user_mobile === '未填写') {
				return uni.showToast({
					icon: 'none',
					title: '没有联系方式'
				})
			}

			// 如果有就拨打电话
			uni.makePhoneCall({
				phoneNumber: articleDetail.value.user_mobile,
				fail: (err) => {
					uni.showToast({
						title: '拨打电话失败',
						icon: 'none'
					})
				}
			})
		} catch (err) {
			console.error('拨打电话失败:', err)
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			})
		}
	}

	// 修改 customTestLogin 方法，解决showLoading/hideLoading配对问题
	const customTestLogin = async () => {
		if (isCheckingLogin.value) return false;
		isCheckingLogin.value = true;

		try {
			// 如果已登录，直接返回true
			if (userStore.userInfo && userStore.userInfo.uid) {
				
				// 如果用户已登录但没有手机号，尝试获取手机号
				if (!userStore.userInfo.mobile) {
					
					try {
						// 尝试从本地存储获取
						const localUserInfo = uni.getStorageSync('userInfo');
						if (localUserInfo && localUserInfo.mobile) {
							// 更新用户信息
							userStore.setUserInfo({
								...userStore.userInfo,
								mobile: localUserInfo.mobile
							});
						} else {
							// 尝试从服务器获取用户信息 - 使用userWx云函数代替userKs
							try {
								// 使用userWx云函数获取用户信息
								const userInfoApi = uniCloud.importObject('userWx', { customUI: true });
								const userResult = await userInfoApi.getUserInfo(userStore.userInfo.uid);
								
								if (userResult && userResult.data && userResult.data.mobile) {
									// 更新用户信息
									userStore.setUserInfo({
										...userStore.userInfo,
										mobile: userResult.data.mobile
									});
									// 保存到本地存储
									uni.setStorageSync('userInfo', {
										...userStore.userInfo,
										mobile: userResult.data.mobile
									});
								}
							} catch (err) {
								// 继续执行，不阻止用户操作
							}
						}
					} catch (err) {
						console.error('获取用户手机号失败:', err);
						// 继续执行，不阻止用户操作
					}
				}
				
				isCheckingLogin.value = false;
				return true;
			}
			
			// 检查是否已经显示loading，避免重复显示
			if (!loginLoadingVisible.value) {
				loginLoadingVisible.value = true;
				// 显示加载提示
				uni.showLoading({
					title: '登录中...',
					mask: true
				});
			}
			
			// 不再使用 loginApi.login()，直接跳转到登录页面
			// 获取当前页面路径和参数
			const pages = getCurrentPages();
			const currentPage = pages[pages.length - 1];
			const currentRoute = currentPage.route;
			const currentOptions = currentPage.options || {};
			
			// 构建完整的当前页面URL（包含参数）
			// 确保路径以斜杠开头
			let redirectUrl = '/' + currentRoute;
			const queryParams = [];
			
			for (const key in currentOptions) {
				if (currentOptions.hasOwnProperty(key)) {
					queryParams.push(`${key}=${encodeURIComponent(currentOptions[key])}`);
				}
			}
			
			if (queryParams.length > 0) {
				redirectUrl += '?' + queryParams.join('&');
			}
			
			// 隐藏加载提示
			if (loginLoadingVisible.value) {
				uni.hideLoading();
				loginLoadingVisible.value = false;
			}
			
			// 跳转到登录页面，并传递当前页面作为重定向参数
			uni.navigateTo({
				url: `/pages/login/login?redirect=${encodeURIComponent(redirectUrl)}`,
				complete: () => {
					isCheckingLogin.value = false;
				}
			});
			
			return false;
		} catch (err) {
			console.error('登录检查失败:', err);
			
			// 隐藏加载提示
			if (loginLoadingVisible.value) {
				uni.hideLoading();
				loginLoadingVisible.value = false;
			}
			
			// 显示提示
			uni.showToast({
				title: '登录检查失败，请重试',
				icon: 'none',
				duration: 2000
			});
			
			// 发生错误时也跳转到登录页
			const currentRoute = `/pages/article/articleDetail?article_id=${props.article_id}`;
			const redirectUrl = encodeURIComponent(currentRoute);
			
			// 延迟跳转，让用户看到提示
			setTimeout(() => {
				uni.navigateTo({
					url: `/pages/login/login?redirect=${redirectUrl}`,
					complete: () => {
						isCheckingLogin.value = false;
					}
				});
			}, 1500);
			
			return false;
		} finally {
			isCheckingLogin.value = false;
		}
	};

	// 添加页面浏览量更新状态跟踪变量
	const isUpdatingPageView = ref(false);
	
	// 更新页面浏览量
	const updatePageView = async () => {
		try {
			// 检查文章ID是否存在
			if (!props.article_id) {
				return;
			}
			
			// 添加锁机制防止重复增加浏览量
			if (isUpdatingPageView.value) {
				console.log('浏览量更新已在进行中，跳过重复操作');
				return;
			}
			
			// 设置锁定状态
			isUpdatingPageView.value = true;
			
			// 从本地存储中获取已浏览文章记录
			const viewedKey = `viewed_${props.article_id}`;
			const lastViewTime = uni.getStorageSync(viewedKey);
			const currentTime = Date.now();
			
			// 如果在3秒钟内已经浏览过，不再增加浏览量
			if (lastViewTime && (currentTime - lastViewTime < 3 * 1000)) {
				console.log('3秒钟内已浏览过此文章，不增加浏览量');
				isUpdatingPageView.value = false;
				return;
			}
			
			// 更新最后浏览时间
			uni.setStorageSync(viewedKey, currentTime);
			
			// 直接调用API更新浏览量
			const result = await articleApi.updateLookCount(props.article_id);
			
			// 如果更新成功，更新本地的浏览量数据
			if (result && result.code === 0) {
				// 获取服务器返回的浏览量
				const updatedViewCount = result.data?.look_count || (articleDetail.value?.look_count || 0) + 1;
				
				// 更新文章详情中的浏览量
				if (articleDetail.value) {
					articleDetail.value.look_count = updatedViewCount;
					console.log('文章浏览量已更新为:', articleDetail.value.look_count);
				}
				
				// 发送全局浏览量更新事件，以便更新文章列表中的计数
				uni.$emit('articleViewCountUpdated', {
					articleId: props.article_id,
					viewCount: updatedViewCount
				});
			}
		} catch (err) {
			console.error('更新浏览量失败:', err);
			
			// 即使API调用失败，也尝试在本地更新浏览量
			if (articleDetail.value) {
				const localViewCount = (articleDetail.value.look_count || 0) + 1;
				articleDetail.value.look_count = localViewCount;
				
				// 发送全局浏览量更新事件
				uni.$emit('articleViewCountUpdated', {
					articleId: props.article_id,
					viewCount: localViewCount
				});
			}
		} finally {
			// 解除锁定状态
			isUpdatingPageView.value = false;
		}
	}

	// 添加保存浏览记录的方法
	const saveViewedArticle = () => {
		try {
			if (!articleDetail.value || !articleDetail.value._id) return
			
			// 获取当前文章的基本信息
			const article = {
				_id: articleDetail.value._id,
				title: articleDetail.value.content ? articleDetail.value.content.substring(0, 30) : '无标题',
				content: articleDetail.value.content || '',
				cate_name: articleDetail.value.cate_name || '未分类',
				create_time: articleDetail.value.create_time,
				view_time: Date.now(), // 浏览时间
				images: articleDetail.value.images && articleDetail.value.images.length > 0 
					? [articleDetail.value.images[0]] // 只保存第一张图片信息
					: []
			}
			
			// 从本地存储获取已浏览文章列表
			let viewedArticles = uni.getStorageSync('viewedArticles') || []
			
			// 检查是否已存在该文章
			const existingIndex = viewedArticles.findIndex(item => item._id === article._id)
			
			if (existingIndex !== -1) {
				// 如果已存在，更新浏览时间并移到列表最前面
				viewedArticles.splice(existingIndex, 1)
			}
			
			// 将当前文章添加到列表最前面
			viewedArticles.unshift(article)
			
			// 限制保存的数量，最多保存50篇
			if (viewedArticles.length > 50) {
				viewedArticles = viewedArticles.slice(0, 50)
			}
			
			// 保存到本地存储
			uni.setStorageSync('viewedArticles', viewedArticles)
		} catch (err) {
			console.error('保存浏览记录失败:', err)
		}
	}

	// 修改页面加载逻辑
	onMounted(async () => {
		try {
			// 初始化加载状态
			isLoading.value = true;
			
			// 从当前页面获取参数
			const pages = getCurrentPages();
			const currentPage = pages[pages.length - 1];
			const options = currentPage.$page?.options || {};
			
			// 使用当前页面的 options 获取 article_id
			const articleId = options.article_id || props.article_id;
			
			if (!articleId) {
				throw new Error('文章ID不能为空');
			}

			// 先获取文章详情，让用户尽快看到内容
			await getArticleDetail();
			
			// 文章详情加载完成后，就可以显示页面了
			isLoading.value = false;
			
			// 获取视频播放器上下文
			if (articleDetail.value.videoURL) {
				setTimeout(() => {
					videoContext.value = uni.createVideoContext('articleVideo');
				}, 300);
			}
			
			// 更新浏览量
			updatePageView().catch(err => {
				console.error('更新浏览量失败:', err);
			});
			
			// 添加文章到浏览记录
			saveViewedArticle();
			
		} catch (err) {
			console.error('页面初始化失败:', err);
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			});
		} finally {
			// 确保在任何情况下都设置加载状态为false
			isLoading.value = false;
		}
	})

	onUnmounted(() => {
		// 清除定时器（评论相关代码已删除）
	})

	// 添加图片预览方法
	const previewImage = (current) => {
		if (!articleDetail.value.images || !articleDetail.value.images.length) return
		
		// 只提取有效URL的图片
		const validImages = articleDetail.value.images.filter(img => {
			const url = img.compressedURL || img.thumbnailURL || img.url;
			return url && (url.startsWith('http') || url.startsWith('/'));
		});
		
		if (validImages.length === 0) {
			console.log('没有有效的图片可以预览');
			uni.showToast({
				title: '图片无法预览',
				icon: 'none'
			});
			return;
		}
		
		const urls = validImages.map(img => img.compressedURL || img.thumbnailURL || img.url);
		
		// 如果传入的current不是有效URL，则使用第一个有效URL
		if (!current || (typeof current === 'string' && !urls.includes(current))) {
			current = urls[0];
		}
		
		console.log(`准备预览图片，有效图片数: ${urls.length}，当前图片: ${current}`);
		
		uni.previewImage({
			current: current, // 当前显示图片的索引
			urls: urls, // 需要预览的图片链接列表
			indicator: 'number',
			loop: true,
			fail: (err) => {
				console.error('预览图片失败:', err)
				uni.showToast({
					title: '预览图片失败',
					icon: 'none'
				})
			}
		})
	}
	
	// 位置信息处理函数
	const getSimplifiedLocation = () => {
		if (!articleDetail.value) return '';
		
		const { address, district } = articleDetail.value;
		
		// 如果有完整地址，优先显示地址
		if (address && address.trim()) {
			// 简化地址显示，去除过长的详细信息
			let simplifiedAddress = address.trim();
			
			// 如果地址过长，进行截取
			if (simplifiedAddress.length > 50) {
				simplifiedAddress = simplifiedAddress.substring(0, 47) + '...';
			}
			
			return simplifiedAddress;
		}
		
		// 如果没有地址但有区域信息，显示区域
		if (district && district.trim()) {
			return district.trim();
		}
		
		// 都没有则返回空字符串
		return '';
	};



	// 添加文章点赞状态
	const isArticleLiked = ref(false)
	const likeCount = ref(0)
	
	// 获取文章点赞状态
	const getArticleLikeStatus = async () => {
		try {
			if (!props.article_id || !userStore.userInfo.uid) {
				return;
			}
			
			// 先设置默认状态，确保即使请求失败也有基本显示
			if (articleDetail.value) {
				likeCount.value = articleDetail.value.like_count || 0;
			}
			
			try {
				const result = await likeApi.getLikeRecord(props.article_id, userStore.userInfo.uid);
				
				// 更新点赞状态
				isArticleLiked.value = result.res.data && result.res.data.length > 0;
				
				// 更新点赞数
				if (articleDetail.value) {
					likeCount.value = articleDetail.value.like_count || 0;
				} else {
					likeCount.value = result.like_count || 0;
				}
			} catch (err) {
				console.error('获取点赞记录失败:', err);
				// 使用默认值继续执行
				isArticleLiked.value = false;
			}
			
			// 发送事件通知其他组件更新点赞状态
			uni.$emit('updateArticleLikeStatus', {
				articleId: props.article_id,
				isLiked: isArticleLiked.value,
				likeCount: likeCount.value
			});
		} catch (err) {
			console.error('获取点赞状态失败:', err);
			// 使用默认值
			isArticleLiked.value = false;
			if (articleDetail.value) {
				likeCount.value = articleDetail.value.like_count || 0;
			}
		}
	};
	
	// 添加处理轮播图变化的方法
	const handleSwiperChange = (e) => {
		currentImageIndex.value = e.detail.current
	}

	// 添加图片加载完成的处理方法
	const handleImageLoad = (index) => {
		console.log(`图片 ${index} 加载成功`);
		
		// 清除超时计时器
		if (imageLoadTimeouts.value[index]) {
			clearTimeout(imageLoadTimeouts.value[index]);
			delete imageLoadTimeouts.value[index];
		}
		
		// 设置加载状态为已加载
		imageLoadStatus.value[index] = 'loaded';
		
		// 检查所有图片加载状态
		checkAllImagesLoaded();
	};
	
	// 修改图片加载失败的处理方法
	const handleImageError = (index) => {
		console.error('图片加载失败:', index, articleDetail.value.images && articleDetail.value.images[index]);
		
		// 清除超时计时器
		if (imageLoadTimeouts.value[index]) {
			clearTimeout(imageLoadTimeouts.value[index]);
			delete imageLoadTimeouts.value[index];
		}
		
		// 初始化或增加重试计数
		if (!imageRetryCount.value[index]) {
			imageRetryCount.value[index] = 1;
		} else {
			imageRetryCount.value[index]++;
		}
		
		// 确保文章详情和图片数组存在
		if (!articleDetail.value || !articleDetail.value.images || !articleDetail.value.images[index]) {
			imageLoadStatus.value[index] = 'error';
			checkAllImagesLoaded();
			return;
		}
		
		// 检查图片是否存在且未超过最大重试次数
		if (imageRetryCount.value[index] <= MAX_RETRY_COUNT) {
			const img = articleDetail.value.images[index];
			let shouldRetry = false;
			let newUrl = '';
			
			try {
				// 尝试不同的加载策略
				if (imageRetryCount.value[index] === 1) {
					// 第一次重试：尝试使用原始URL替代压缩URL
					if (img.compressedURL !== img.url && img.url) {
						console.log('尝试使用原始URL加载图片:', img.url);
						newUrl = img.url;
						shouldRetry = true;
					}
				} else if (imageRetryCount.value[index] === 2) {
					// 第二次重试：添加时间戳避免缓存问题
					const timestamp = new Date().getTime();
					const baseUrl = img.url || img.compressedURL;
					if (baseUrl) {
						newUrl = baseUrl.includes('?') 
							? `${baseUrl}&t=${timestamp}` 
							: `${baseUrl}?t=${timestamp}`;
						shouldRetry = true;
					}
				} else if (imageRetryCount.value[index] === 3) {
					// 第三次重试：尝试使用图片代理服务
					const baseUrl = img.url || img.compressedURL;
					if (baseUrl) {
						// 这里可以使用你自己的图片代理服务URL
						// 例如: newUrl = `https://your-proxy-service.com/proxy?url=${encodeURIComponent(baseUrl)}`;
						// 如果没有代理服务，就再次添加不同的时间戳
						const timestamp = new Date().getTime() + 1000;
						newUrl = baseUrl.includes('?') 
							? `${baseUrl}&t=${timestamp}&retry=final` 
							: `${baseUrl}?t=${timestamp}&retry=final`;
						shouldRetry = true;
					}
				}
				
				if (shouldRetry && newUrl) {
					console.log(`图片 ${index} 重试 (${imageRetryCount.value[index]}/${MAX_RETRY_COUNT}): ${newUrl}`);
					
					// 使用Vue的更新方法确保响应式更新
					articleDetail.value.images[index] = {
						...articleDetail.value.images[index],
							compressedURL: newUrl
					};
					
					// 保持loading状态以允许重试
					imageLoadStatus.value[index] = 'loading';
					
					// 再次设置超时，增加超时时间
					const increasedTimeout = IMAGE_LOAD_TIMEOUT + (imageRetryCount.value[index] * 5000); // 每次重试增加5秒
					console.log(`图片 ${index} 设置加载超时: ${increasedTimeout}ms`);
					
					imageLoadTimeouts.value[index] = setTimeout(() => {
						if (imageLoadStatus.value[index] === 'loading') {
							console.log(`图片 ${index} 重试后依然超时`);
							imageLoadStatus.value[index] = 'error';
							checkAllImagesLoaded();
						}
					}, increasedTimeout);
					
					return;
				}
			} catch (err) {
				console.error('处理图片重试失败:', err);
				// 如果重试过程出错，直接标记为错误状态
				imageLoadStatus.value[index] = 'error';
				checkAllImagesLoaded();
				return;
			}
		}
		
		// 如果多次尝试后仍然失败，标记为错误
		imageLoadStatus.value[index] = 'error';
		console.log(`图片${index}加载失败，已标记为错误状态 (已重试${imageRetryCount.value[index]}次)`);
		checkAllImagesLoaded();
		
		// 如果第一张图片加载失败，立即隐藏加载状态显示界面内容
		if (index === 0) {
			setTimeout(() => {
				isAnyImageLoading.value = false;
			}, 300);
		}
	};
	
	// 检查所有图片是否已加载
	const checkAllImagesLoaded = () => {
		if (!articleDetail.value || !articleDetail.value.images || !articleDetail.value.images.length) {
			isAnyImageLoading.value = false;
			return;
		}
		
		const imageCount = articleDetail.value.images.length;
		let loadedCount = 0;
		let errorCount = 0;
		
		for (let i = 0; i < imageCount; i++) {
			if (imageLoadStatus.value[i] === 'loaded') {
				loadedCount++;
			} else if (imageLoadStatus.value[i] === 'error') {
				errorCount++;
			}
		}
		
		console.log(`图片加载状态: 已加载 ${loadedCount}, 错误 ${errorCount}, 总数 ${imageCount}`);
		
		// 如果所有图片都已加载完成或标记为错误，显示内容
		if (loadedCount + errorCount >= imageCount) {
			isAnyImageLoading.value = false;
		}
		
		// 如果大部分图片(70%)都已加载，也可以显示内容
		if (loadedCount > imageCount * 0.7) {
			isAnyImageLoading.value = false;
		}
	};

	// 处理关注功能
	const handleFollow = async (followedId) => {
		// ... existing code ...
	}
	
	// 处理客服会话
	const handleContact = (e) => {
		// 记录客服会话事件
		console.log('客服会话事件:', e)
		
		// 使用新API获取应用基础信息和平台信息
		let appInfo;
		try {
			// 尝试使用新API
			appInfo = uni.getAppBaseInfo();
		} catch (error) {
			// 降级处理：如果新API不可用，使用其他方式判断
			console.warn('getAppBaseInfo不可用，尝试使用替代方法');
			appInfo = {};
			try {
				// 尝试通过环境变量判断
				const envInfo = uni.getEnv ? uni.getEnv() : {};
				appInfo.AppPlatform = envInfo.platform || '';
			} catch (err) {
				console.error('获取环境信息失败', err);
			}
		}
		
		const isKuaishou = appInfo.AppPlatform === 'kwaishop' || 
						   appInfo.host === 'Kuaishou' || 
						   appInfo.hostName === 'Kuaishou'
		
		// 如果不在快手环境中，提供备选方案
		if (!isKuaishou) {
			// 检查是否支持客服会话
			if (e.detail && e.detail.errMsg && e.detail.errMsg.includes('fail')) {
				// 显示提示
				uni.showModal({
					title: '联系客服',
					content: '请添加客服微信: customer_service_wx',
					confirmText: '复制微信号',
					success: (res) => {
						if (res.confirm) {
							uni.setClipboardData({
								data: 'customer_service_wx',
								success: () => {
									uni.showToast({
										title: '微信号已复制',
										icon: 'success'
									})
								}
							})
						}
					}
				})
			}
		}
	}

	// 文章点击跳转
	const handleArticleClick = (articleId) => {
		// 如果点击的是当前文章，不做任何操作
		if (articleId === props.article_id) {
			return
		}
		
		// 跳转到新的文章详情页
		uni.navigateTo({
			url: `/pages/article/articleDetail?article_id=${articleId}`,
			success: () => {
			},
			fail: (err) => {
				console.error('跳转到文章详情页失败:', err)
				uni.showToast({
					title: '跳转失败',
					icon: 'none'
				})
			}
		})
	}
	
	// 修改触底事件处理
	onReachBottom(() => {
		// 调用推荐组件的加载更多方法
		if (tuijianRef.value) {
			tuijianRef.value.loadMore()
		}
	})

	// 处理点赞变化
	const handleLikeChange = async (data) => {
		// 检查用户是否登录
		const isLoggedIn = await customTestLogin();
		if (!isLoggedIn) {
			console.log('用户未登录，无法点赞');
			return;
		}
		
		// 确保有用户信息
		if (!userStore.userInfo || !userStore.userInfo.uid) {
			console.error('用户信息不完整，无法点赞');
			uni.showToast({
				title: '登录信息异常，请重新登录',
				icon: 'none'
			});
			return;
		}
		
		// 获取用户信息
		const userInfo = {
			uid: userStore.userInfo.uid,
			nickName: userStore.userInfo.nickName || '匿名用户',
			avatarUrl: userStore.userInfo.avatarUrl || '/static/images/default-avatar.png'
		};
		
		console.log('点赞用户信息:', userInfo);
		
		// 更新文章详情中的点赞数
		if (articleDetail.value) {
			articleDetail.value.like_count = data.likeCount;
		}
		
		// 更新点赞状态
		isArticleLiked.value = data.isLiked;
		likeCount.value = data.likeCount;
	}

	// 添加视频事件处理
	const handleVideoLoad = () => {
		videoLoadStatus.value = 'loaded';
	};
	
	const handleVideoError = () => {
		videoLoadStatus.value = 'error';
		uni.showToast({
			title: '视频加载失败',
			icon: 'none'
		});
	};


	
	// 页面卸载时移除事件监听
	onUnmounted(() => {
		// 清除其他可能的监听器和定时器
		uni.$off('setShareInfo');
		uni.$off('viewCountUpdated');
		uni.$off('updateArticleLikeStatus');
	})
	


	// 页面加载时执行
	onLoad(async () => {
		// 重置图片加载状态
		imageLoadStatus.value = {};
		imageRetryCount.value = {};
		
		// 清除所有超时计时器
		Object.keys(imageLoadTimeouts.value).forEach(key => {
			clearTimeout(imageLoadTimeouts.value[key]);
		});
		imageLoadTimeouts.value = {};
		
		// 初始化加载状态
		isLoading.value = true;
		isAnyImageLoading.value = true;
		
		// 注意：SharedArrayBuffer警告是Chrome M92+的一项安全措施
		// 在小程序环境中这个警告通常可以忽略，因为小程序有自己的安全机制
		// 详见: https://developer.chrome.com/blog/enabling-shared-array-buffer/
		
		try {
			// 先获取文章详情
			await getArticleDetail();
			
			// 更新浏览计数
			await updatePageView();
		} catch (error) {
			console.error('页面加载失败:', error);
		} finally {
			isLoading.value = false;
		}
	});
	
	// 页面显示时执行
	onShow(() => {
		// 移除对不存在函数的调用
		// 之前: initNavigation();
		console.log('页面显示');
	});

	// 预加载图片
	const preloadImages = (imageList, startIndex = 0) => {
		if (!imageList || !Array.isArray(imageList) || imageList.length === 0) {
			console.log('无图片可预加载');
			return;
		}
		
		// 计算总数和已加载数
		const totalCount = imageList.length;
		let loadedCount = 0;
		let errorCount = 0;
		
		// 更新加载状态
		const updateLoadingStatus = () => {
			if (loadedCount + errorCount === totalCount) {
				isAnyImageLoading.value = false;
				console.log(`图片加载完成: 成功 ${loadedCount}, 失败 ${errorCount}`);
			} else {
				console.log(`图片加载状态: 已加载 ${loadedCount}, 错误 ${errorCount}, 总数 ${totalCount}`);
			}
		};
		
		// 逐个预加载图片
		const loadNextImage = (index) => {
			if (index >= totalCount) {
				updateLoadingStatus();
				return;
			}
			
			const img = imageList[index];
			if (!img) {
				console.log(`图片 ${index} 为空`);
				errorCount++;
				loadNextImage(index + 1);
				return;
			}
			
			// 获取图片URL
			let url = img.compressedURL || img.thumbnailURL || img.url;
			
			// 如果仍然没有URL，标记为错误并继续
			if (!url) {
				console.log(`图片 ${index} 没有有效URL`);
				errorCount++;
				loadNextImage(index + 1);
				return;
			}
			
			// 直接设置为已加载状态，不进行实际预加载
			// 这样可以避免小程序环境下的getImageInfo错误
			loadedCount++;
			console.log(`标记图片 ${index} 为已加载，URL: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`);
			
			// 立即加载下一张图片，不使用延时
			loadNextImage(index + 1);
		};
		
		// 开始预加载
		loadNextImage(startIndex);
	}

	// 处理图片加载完成后的操作
	const handleArticleLoaded = () => {
		// 延迟处理图片，避免与初始渲染冲突
		setTimeout(() => {
			if (articleDetail.value && articleDetail.value.images) {
				// 使用优化后的预加载方式
				preloadImages(articleDetail.value.images);
				
				// 标记图片加载状态
				articleDetail.value.images.forEach((img, index) => {
					imageLoadStatus.value[index] = 'loaded';
				});
				
				// 设置为非加载状态，显示页面内容
				isAnyImageLoading.value = false;
				console.log('文章已加载完成，标记所有图片为已加载状态');
			}
		}, 300);
	};

	// 在文章详情加载完成后处理图片
	watch(() => articleDetail.value._id, (newVal) => {
		if (newVal) {
			// 文章ID变化时触发处理
			nextTick(() => {
				handleArticleLoaded();
			});
		}
	});

	// 监听加载状态变化
	watch(() => isLoading.value, (newVal, oldVal) => {
		if (oldVal === true && newVal === false) {
			// 从加载中变为加载完成时触发
			handleArticleLoaded();
		}
	});

	// 在 script setup 部分添加编辑相关的方法
	const handleEdit = () => {
		// 检查是否是文章作者
		if (!userStore.userInfo || !userStore.userInfo.uid || userStore.userInfo.uid !== articleDetail.value.user_id) {
			uni.showToast({
				title: '只能编辑自己的文章',
				icon: 'none'
			})
			return
		}

		// 跳转到发布页面进行编辑
		uni.navigateTo({
			url: `/pages/fabu/fabu?mode=edit&article_id=${props.article_id}`,
			fail: (err) => {
				console.error('跳转编辑页面失败:', err)
				uni.showToast({
					title: '跳转失败',
					icon: 'none'
				})
			}
		})
	}
</script>

<template>
	<view class="article-detail-container">
		<!-- 替换原有的加载页面，使用与首页相同的加载样式 -->
		<view class="custom-loading-container" v-if="isLoading && !articleDetail._id">
			<view class="loading-spinner">
				<uni-icons type="spinner-cycle" size="48" color="#399bfe"></uni-icons>
			</view>
			<text class="loading-text">内容加载中...</text>
		</view>

		<view class="article-detail-container" v-show="articleDetail._id">
			<scroll-view 
				class="article-detail-scroll" 
				scroll-y 
				@scrolltolower="tuijianRef?.loadMore()"
				:show-scrollbar="false"
				:lower-threshold="150"
				enable-back-to-top
			>
				<view class="article-detail fade-in-animation">
					<!-- 头部文章内容 -->
					<view class="articleHead">
						<!-- 视频和图片区域 -->
						<view class="media-container">
							<!-- 视频区域 - 单独显示 -->
							<view class="articleVideo" v-if="articleDetail.videoURL">
								<!-- 视频加载状态 -->
								<view class="video-loading" v-if="videoLoadStatus === 'loading'">
									<uni-load-more status="loading" :contentText="{ contentrefresh: '视频加载中...' }"></uni-load-more>
								</view>
								
								<!-- 视频错误状态 -->
								<view class="video-error" v-if="videoLoadStatus === 'error'">
									<uni-icons type="videocam-slash" size="50" color="#CCCCCC"></uni-icons>
									<text>视频加载失败</text>
								</view>
								
								<video
									id="articleVideo"
									class="video-player"
									:src="articleDetail.videoURL"
									autoplay
									object-fit="cover"
									:poster="articleDetail.images && articleDetail.images[0] ? articleDetail.images[0].compressedURL : ''"
									controls
									@error="handleVideoError"
									@loadedmetadata="handleVideoLoad"
								></video>
							</view>
							
							<!-- 图片显示区域 - 单独显示 -->
							<view class="articleImages" v-if="articleDetail.images && articleDetail.images.length">
								<!-- 图片网格 -->
								<view class="image-grid">
									<view 
										v-for="(item, index) in articleDetail.images.slice(0, articleDetail.images.length > 9 ? 9 : articleDetail.images.length)" 
										:key="index"
										:class="[
											'image-grid-item',
											{
												'single-image': articleDetail.images.length === 1,
												'double-image': articleDetail.images.length === 2,
												'triple-image': articleDetail.images.length === 3,
												'grid-image': articleDetail.images.length > 3
											}
										]"
										@click="previewImage(item.compressedURL || item.thumbnailURL || item.url)"
									>
										<!-- 图片加载失败占位符 -->
										<view class="image-placeholder" v-if="imageLoadStatus[index] === 'error'">
											<uni-icons type="image" size="24" color="#999999"></uni-icons>
											<text>加载失败</text>
										</view>
										
										<!-- 图片加载中占位符 -->
										<view class="image-placeholder loading" v-else-if="imageLoadStatus[index] !== 'loaded'">
											<uni-icons type="spinner-cycle" size="24" color="#666666"></uni-icons>
											<text>加载中</text>
										</view>
										
										<!-- 图片 -->
										<image 
											:src="item.compressedURL || item.thumbnailURL || item.url || '/static/images/default.png'" 
											mode="aspectFill" 
											@load="handleImageLoad(index)"
											@error="handleImageError(index)"
											:style="{opacity: imageLoadStatus[index] === 'loaded' ? 1 : 0}"
										></image>
										
										<!-- 更多图片提示 -->
										<view class="more-images" v-if="index === 8 && articleDetail.images.length > 9">
											<text>+{{articleDetail.images.length - 9}}</text>
										</view>
									</view>
								</view>
								
								<!-- 图片计数器 -->
								<view class="image-counter" v-if="articleDetail.images.length > 1">
									{{articleDetail.images.length}}张图片
								</view>
							</view>
						</view>
					</view>
					
					<!-- 操作功能区 - 移除了重复的时间和浏览量 -->
					<view class="article-info" style="display: none;">
					</view>
					
					<!-- 新的元信息显示区域 -->
					<view class="article-meta-info">
						<view class="meta-item date">
							<uni-icons type="calendar" size="18" color="#666666"></uni-icons>
							<text>{{formatTime(articleDetail.create_time)}}</text>
						</view>
						<view class="meta-divider"></view>
						<view class="meta-item views">
							<uni-icons type="eye" size="18" color="#666666"></uni-icons>
							<text>{{articleDetail.look_count || 0}}浏览</text>
						</view>
						<view class="meta-divider"></view>
						<view class="meta-item category" v-if="articleDetail.cate_name">
							<uni-icons type="tag" size="18" color="#399bfe"></uni-icons>
							<text>{{articleDetail.cate_name}}</text>
						</view>
					</view>
					
					<!-- 文章内容区域 -->
					<view class="articleContent">
						<view class="articleText" v-if="articleDetail.content">
							<!-- 使用rich-text组件渲染包含手机号链接的内容（小程序优化版本） -->
							<rich-text 
								class="category-name rich-text-content"
								:nodes="processedContent"
								@tap="handleRichTextTap"
								space="nbsp"
							></rich-text>
							<!-- 备用方案：如果rich-text无法正常工作，提供普通文本点击 -->
							<view class="phone-text-fallback" v-if="!processedContent" @tap="handleTextPhoneDetection">
								<text class="category-name">{{articleDetail.content}}</text>
							</view>
						</view>
					</view>


					
					
					<!-- 详情图展示 - 在文章内容下方重复展示图片 -->
					<view class="article-detail-images" v-if="articleDetail.images && articleDetail.images.length" style="border-top: 0px solid #f5f5f5;">
						<view class="detail-images-title">
							<view class="line"></view>
							<text>详情图片 ({{articleDetail.images.length}}张)</text>
							<view class="line"></view>
						</view>
						<view class="detail-images-container">
							<view class="detail-image-wrapper" v-for="(item, index) in articleDetail.images" :key="index">
								<!-- 加载失败占位符 -->
								<view class="detail-image-placeholder" v-if="imageLoadStatus[index] === 'error'">
									<uni-icons type="image" size="32" color="#cccccc"></uni-icons>
									<text>图片加载失败</text>
								</view>
								
								<!-- 加载中占位符 -->
								<view class="detail-image-placeholder loading" v-else-if="imageLoadStatus[index] !== 'loaded'">
									<uni-icons type="spinner-cycle" size="32" color="#666666"></uni-icons>
									<text>加载中...</text>
								</view>
								
								<image 
									class="detail-image"
									:src="item.compressedURL || item.thumbnailURL || item.url || '/static/images/default.png'" 
									mode="widthFix"
									@click="previewImage(item.compressedURL || item.thumbnailURL || item.url)"
									@load="handleImageLoad(index)"
									@error="handleImageError(index)"
									:style="{opacity: imageLoadStatus[index] === 'loaded' ? 1 : 0}"
								></image>
							</view>
						</view>
					</view>
					
					<!-- 位置信息显示 - 在详情图片后面 -->
					<view class="location-info-section" v-if="articleDetail.address || articleDetail.district">
						<view class="location-header">
							<uni-icons type="location" size="16" color="#399bfe"></uni-icons>
							<text class="location-title">位置信息</text>
						</view>
						<view class="location-content">
							<text class="location-address">地址：{{ getSimplifiedLocation() }}</text>
						</view>
					</view>
					
					<!-- 替换原有的推荐部分为新组件 -->
					<tuijian 
						ref="tuijianRef"
						:current-article-id="article_id"
						:cate_id="articleDetail.cate_id"
						@click="handleArticleClick"
					/>
					

				</view>
			</scroll-view>

			
		</view>

		<!-- 底部栏 -->
		<view class="footer">
			<view class="footer-content">
				<view class="action-item" @click="goToHome">
					<uni-icons type="home" size="24" color="#444444"></uni-icons>
					<view class="text">
						首页
					</view>
				</view>
				
				<!-- 添加编辑按钮 -->
				<view class="action-item" v-if="userStore.userInfo && userStore.userInfo.uid === articleDetail.user_id" @click="handleEdit">
					<uni-icons type="compose" size="24" color="#444444"></uni-icons>
					<view class="text">
						编辑
					</view>
				</view>
				
				<!-- 转发按钮 -->
				<button open-type="share" class="action-item">
					<text class="icon lishuai-zhuanfa" style="font-size: 24px; color: #444444;"></text>
					<view class="text">
						转发
					</view>
				</button>
				
				<view class="call-btn" @click="handleCall">
					打电话
				</view>
			</view>
		</view>
		

	</view>
</template>

<style lang="scss" scoped>
	.article-detail-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #e2e2e2;
		padding-bottom: 160rpx;
		border: none;
		box-sizing: border-box;
	}

	.article-detail-scroll {
		flex: 1;
		height: calc(100vh - 120rpx - env(safe-area-inset-bottom));
		-webkit-overflow-scrolling: touch;
		background-color: #e2e2e2;
	}

	.article-detail {
		padding-top: 0;
		padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
		background-color: #e2e2e2;
	}

	.articleHead {
		.media-container {
			display: flex;
			flex-direction: column;
			padding: 24rpx 24rpx 0rpx 24rpx;
			background-color: #e2e2e2;
			// margin-bottom: 20rpx;
			border-radius: 12rpx;
			
			// 视频播放区域
			.articleVideo {
				position: relative;
				width: 100%;
				height: 422rpx;
				border-radius: 8rpx;
				background-color: #f5f5f5;
				margin-bottom: 20rpx;
				overflow: hidden;
				
				.video-player {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					object-fit: contain;
					z-index: 1;
				}
				
				// 视频加载状态
				.video-loading {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					z-index: 2;
					background-color: rgba(0, 0, 0, 0.1);
				}
				
				// 视频错误状态
				.video-error {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					z-index: 2;
					background-color: #f5f5f5;
					
					text {
						margin-top: 20rpx;
						color: #999999;
						font-size: 28rpx;
					}
				}
			}
			
			.articleImages {
				position: relative;
				width: 100%;
				border-radius: 8rpx;
				overflow: hidden;
				margin-bottom: 20rpx;
				background-color: #f5f5f5;
				
				.image-grid {
					display: flex;
					flex-wrap: wrap;
					padding: 4rpx;
					box-sizing: border-box;
					
					.image-grid-item {
						position: relative;
						overflow: hidden;
						border-radius: 8rpx;
						margin: 4rpx;
						
						// 单张图片
						&.single-image {
							width: calc(100% - 8rpx);
							height: 400rpx;
						}
						
						// 两张图片
						&.double-image {
							width: calc(50% - 8rpx);
							height: 300rpx;
						}
						
						// 三张图片
						&.triple-image {
							width: calc(33.33% - 8rpx);
							height: 200rpx;
						}
						
						// 九宫格布局
						&.grid-image {
							width: calc(33.33% - 8rpx);
							height: 200rpx;
						}
						
						image {
							width: 100%;
							height: 100%;
							object-fit: cover;
							transition: opacity 0.3s ease;
						}
						
						.image-placeholder {
							position: absolute;
							top: 0;
							left: 0;
							width: 100%;
							height: 100%;
							display: flex;
							flex-direction: column;
							justify-content: center;
							align-items: center;
							background-color: #f5f5f5;
							
							text {
								margin-top: 10rpx;
								font-size: 24rpx;
								color: #999;
							}
						}
						
						.more-images {
							position: absolute;
							top: 0;
							left: 0;
							width: 100%;
							height: 100%;
							background-color: rgba(0, 0, 0, 0.5);
							display: flex;
							justify-content: center;
							align-items: center;
							
							text {
								color: #fff;
								font-size: 32rpx;
								font-weight: bold;
							}
						}
					}
				}
				
				.image-counter {
					position: absolute;
					right: 20rpx;
					background-color: rgba(0, 0, 0, 0.5);
					color: #fff;
					padding: 4rpx 12rpx;
					border-radius: 20rpx;
					font-size: 24rpx;
				}
			}
		}
	}

	.articleContent {
		padding: 30rpx;
		font-size: 28rpx;
		line-height: 1.8;
		background-color: #fff;
		margin: 0 24rpx;
		border-radius: 12rpx;
		
		min-height: 24rpx; /* 添加最小高度，确保即使内容为空也有高度 */
		display: block; /* 确保始终显示 */
		
		.articleText {
			padding: 0;
			color: #333;
			word-break: break-word;
			min-height: 1.8em; /* 添加最小高度 */
			padding: 0 24rpx;
			
			.call-text-button {
				color: #0066cc;
				margin-left: 10rpx;
				cursor: pointer;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				vertical-align: middle;
				gap: 4rpx;
			}
							
			/* 手机号链接样式（去除蓝色和下划线） */
			:deep(.phone-link) {
				color: inherit !important; /* 继承正常文本颜色 */
				text-decoration: none !important; /* 去除下划线 */
				padding: 2rpx 4rpx !important;
				border-radius: 4rpx !important;
				transition: all 0.2s ease !important;
				cursor: pointer !important;
								
				/* 点击时的反馈效果 */
				&:active {
					background-color: rgba(0, 0, 0, 0.05) !important; /* 淡灰色背景 */
					transform: scale(0.98) !important;
				}
			}
							
			/* rich-text组件样式优化 */
			.rich-text-content {
				word-break: break-word;
				line-height: 1.6;
				/* 小程序中确保点击事件能正常触发 */
				pointer-events: auto;
								
				/* 确保span元素可以正常点击 */
				:deep(span) {
					-webkit-tap-highlight-color: rgba(57, 155, 254, 0.2);
					tap-highlight-color: rgba(57, 155, 254, 0.2);
					pointer-events: auto;
				}
			}
							
			/* 备用方案样式 */
			.phone-text-fallback {
				cursor: pointer;
				padding: 4rpx;
				border-radius: 4rpx;
								
				&:active {
					background-color: rgba(57, 155, 254, 0.1);
					opacity: 0.8;
				}
			}
		}
	}





	.footer {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #fff;
		border-top: 1px solid $pyq-border-color-translucent;
		padding-bottom: env(safe-area-inset-bottom);

		.footer-content {
			display: flex;
			padding: 16rpx 24rpx;
			height: 120rpx;
			font-size: 24rpx;
			color: $pyq-text-color-body;

			.action-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				//左边间距
				margin-left: 28rpx;

				.text {
					margin-top: 8rpx;
					font-size: 24rpx;
				}

				&:active {
					opacity: 0.7;
				}
			}
			
			/* 添加组件之间的间距 */
			:deep(fenxiang-zujian) {
				margin-right: 48rpx;
			}

			.call-btn {
				flex: 1;
				height: 80rpx;
				line-height: 80rpx;
				text-align: center;
				background-color: $pyq-vi-color;
				color: #fff;
				border-radius: 8rpx;
				font-size: 28rpx;
				font-weight: 500;
				display: flex;
				align-items: center;
				justify-content: center;
				margin: auto 0; /* 添加上下外边距为auto，实现垂直居中 */

				&:active {
					opacity: 0.8;
				}
			}
		}
	}

	.custom-play-pause {
		position: absolute;
					top: 20rpx;
		right: 20rpx;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		z-index: 10;
		width: auto;
		min-width: 120rpx;
		padding: 8rpx 20rpx;
		border-radius: 30rpx;
		font-size: 26rpx;
		text-align: center;
		border: 1px solid rgba(255,255,255,0.2);
		
		&:active {
			background-color: rgba(0, 0, 0, 0.8);
		}
	}

	.article-info {
		display: flex;
		align-items: center;
		padding: 0rpx 24rpx 15rpx;
		background-color: #fff;
		margin: 0;
		border-radius: 0;
		box-shadow: none;
		justify-content: flex-start; /* 修改为靠左对齐 */
		flex-wrap: wrap; /* 添加换行显示 */
		
		.info-item {
			display: flex;
			align-items: center;
			margin-right: 20rpx; /* 统一使用margin-right */
			
			&:first-child {
				margin-left: 0;
			}
			
			&:last-child {
				margin-right: 0;
			}
			
			.info-text {
				margin-left: 8rpx;
				font-size: 26rpx;
				color: #999;
			}
		}
	}

	.caozuo {
		display: none;
	}

	.image-counter {
		position: absolute;
		right: 20rpx;
		top: 20rpx;
		background-color: rgba(0, 0, 0, 0.6);
					color: #fff;
					padding: 8rpx 20rpx;
					border-radius: 30rpx;
					font-size: 24rpx;
					z-index: 2;
		display: flex;
		align-items: center;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.2);
		
		&::before {
			content: '';
			display: inline-block;
			width: 24rpx;
			height: 24rpx;
			background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>');
			background-size: contain;
			margin-right: 8rpx;
		}
	}

	.manual-mode-indicator {
		position: absolute;
		left: 20rpx;
		top: 20rpx;
		background-color: rgba(0, 0, 0, 0.5);
		color: #fff;
		padding: 6rpx 16rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		z-index: 2;
		display: none; /* 隐藏手动模式提示 */
		align-items: center;
		gap: 6rpx;
		animation: pulse 1.5s infinite;
	}
	
	@keyframes pulse {
		0% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0.7;
		}
	}

	// 添加旋转动画
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	
	// 客服按钮样式
	.customer-service-btn {
		position: fixed;
		right: 30rpx;
		bottom: 180rpx;
		z-index: 100;
		background-color: #FF4D4F; // 红色背景
		color: #ffffff;
		border-radius: 50rpx;
		padding: 16rpx 30rpx;
		font-size: 28rpx;
					display: flex;
					align-items: center;
					justify-content: center;
		box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.3);
		border: none;
		line-height: 1.5;
		
		&::after {
			border: none;
		}
		
		text {
			margin-left: 10rpx;
		}
		
		&:active {
			transform: scale(0.95);
			opacity: 0.9;
		}
	}



	/* 添加类目信息样式 */
	.category-info {
		padding: 20rpx 24rpx 16rpx;
		background-color: #fff;
		
		.category-tag {
			display: inline-flex;
			align-items: center;
			padding: 8rpx 20rpx;
			background-color: rgba(57, 155, 254, 0.1);
			border-radius: 24rpx;
			
			text {
				font-size: 26rpx;
				color: #399bfe;
				margin-left: 8rpx;
				font-weight: 500;
			}
		}
	}

	

	.category-name {
		font-size: 32rpx;
	}

	.category-name1 {
		color: #399bfe;
	}

	.load-more {
		padding: 20rpx 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	/* 点赞相关样式 */
	.like-item {
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		
		&:active {
			transform: scale(1.1);
		}
	}
	
	.info-text.liked {
		color: #ff6b6b;
	}
	
	.liked-text {
		color: #ff6b6b;
	}
	
	/* 点赞动画 */
	@keyframes like-animation {
		0% {
			transform: scale(1);
		}
		25% {
			transform: scale(1.2);
		}
		50% {
			transform: scale(0.95);
		}
		75% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}
	
	.like-animation {
		animation: like-animation 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	
	/* 点赞图标动画 */
	@keyframes heart-beat {
		0% {
			transform: scale(1);
		}
		15% {
			transform: scale(1.3);
		}
		30% {
			transform: scale(1);
		}
		45% {
			transform: scale(1.2);
		}
		60% {
			transform: scale(1);
		}
		100% {
			transform: scale(1);
		}
	}
	
	.action-item[data-action="like"] uni-icons,
	.like-item uni-icons {
		transition: transform 0.2s ease;
	}
	
	.action-item[data-action="like"]:active uni-icons,
	.like-item:active uni-icons {
		transform: scale(1.2);
	}
	
	.action-item[data-action="like"].like-animation uni-icons,
	.like-item.like-animation uni-icons {
		animation: heart-beat 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.custom-rate-control {
		position: absolute;
		top: 20rpx;
		left: 20rpx;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		z-index: 10;
		width: auto;
		min-width: 120rpx;
		padding: 8rpx 20rpx;
		border-radius: 30rpx;
		font-size: 26rpx;
		text-align: center;
		border: 1px solid rgba(255,255,255,0.2);
		
		&:active {
			background-color: rgba(0, 0, 0, 0.8);
		}
	}

	/* 底部操作栏样式 */
	.article-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		border-top: 1px solid #f0f0f0;
		background-color: #fff;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 100;
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	.left-actions, .right-actions {
		display: flex;
		align-items: center;
	}

	.left-actions {
		flex: 1;
	}

	.info-item {
		display: flex;
		align-items: center;
		margin-right: 0rpx;
		color: #999;
	}

	.info-text {
		font-size: 24rpx;
		margin-left: 8rpx;
	}

	.right-actions {
		display: flex;
		align-items: center;
	}

	.action-item {
		margin-right: 20rpx;
	}

	.call-btn {
		background-color: #399bfe;
		color: #fff;
		padding: 10rpx 30rpx;
		border-radius: 30rpx;
		font-size: 28rpx;
	}

	/* 在组件的<style>部分的末尾添加 */
	:deep(.icon) {
		font-family: "icon" !important;
	}

	/* 添加图片底部信息栏样式 */
	.image-info-bar {
		position: absolute;
		bottom: 20rpx;
		right: 20rpx;
		background-color: rgba(0, 0, 0, 0.5);
		display: inline-table;
		width: auto;
		text-align: right;
		padding: 10rpx 20rpx;
		color: #fff;
		z-index: 2;
		border-radius: 8rpx;
		
		.info-item {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			margin-bottom: 10rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
			
			.info-label {
				font-size: 22rpx;
				color: #ffffff;
				margin-right: 4rpx;
			}
			
			.info-text {
				font-size: 22rpx;
				color: #ffffff;
			}
		}
	}

	/* 添加图片网格样式 */
	.image-grid {
		display: flex;
		flex-wrap: wrap;
		width: 100%;
		z-index: 1;
		position: relative;
		
		.image-grid-item {
			position: relative;
			width: calc(33.33% - 4rpx);
			height: 240rpx;
			margin: 2rpx;
			overflow: hidden;
			background-color: #f5f5f5;
			
			// 特殊处理单图的情况
			&:first-child:last-child {
				width: 100%;
				height: 500rpx;
				margin: 0;
			}
			
			image {
				width: 100%;
				height: 100%;
				transition: opacity 0.5s ease;
			}
			
			.image-placeholder {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				background-color: #f5f5f5;
				
				text {
					margin-top: 20rpx;
					color: #999999;
					font-size: 24rpx;
				}
			}
			
			/* 更多图片指示器 */
			.more-images {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				display: flex;
				justify-content: center;
				align-items: center;
				background-color: rgba(0, 0, 0, 0.5);
				
				text {
					color: #fff;
					font-size: 40rpx;
					font-weight: bold;
				}
			}
		}
	}

	/* 新的元信息显示区域 */
	.article-meta-info {
		display: flex;
		flex-wrap: nowrap;
		padding: 24rpx 24rpx 24rpx 24rpx;
		background-color: #fff;
		border-bottom: 1px solid #eaeaea;
		position: relative;
		justify-content: flex-start;
		align-items: center;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		margin: 0 24rpx 0rpx 24rpx;
		border-radius: 12rpx;
		
		/* 左侧蓝色指示条 */
		&::before {
			content: '';
			position: absolute;
			left: 0;
			top: 50%;
			transform: translateY(-50%);
			width: 6rpx;
			height: 32rpx;
			background-color: #399bfe;
			border-radius: 0 4rpx 4rpx 0;
			margin-left: 20rpx;
		}
		
		.meta-item {
			display: flex;
			align-items: center;
			white-space: nowrap;
			padding: 0 16rpx;
			flex-shrink: 0;
			height: 50rpx;
			line-height: 50rpx; /* 添加行高确保文字垂直居中 */
			
			uni-icons {
				display: flex;
				align-items: center;
				justify-content: center;
				height: 36rpx; /* 固定图标容器高度 */
			}
			
			text {
				font-size: 26rpx;
				color: #666;
				margin-left: 10rpx;
				display: inline-block;
				vertical-align: middle; /* 确保文本垂直居中 */
				line-height: 1; /* 重置文本行高 */
			}
			
			&.date {
				padding-left: 20rpx;
			}
			
			&.category {
				background-color: rgba(57, 155, 254, 0.1);
				padding: 0 16rpx;
				border-radius: 24rpx;
				height: 44rpx; /* 调整高度与其他项一致 */
				margin-left: 8rpx;
				align-self: center;
				border: 1px solid rgba(57, 155, 254, 0.2);
				
				text {
					color: #399bfe;
					font-weight: 500;
					font-size: 24rpx;
					line-height: 44rpx; /* 确保文本在分类标签中居中 */
				}
			}
		}
		
		/* 添加分隔符 */
		.meta-divider {
			width: 1px;
			height: 24rpx;
			background-color: #ddd;
			flex-shrink: 0;
			margin: 0 8rpx; /* 增加左右间距 */
		}
		
		/* 添加滚动条样式 */
		&::-webkit-scrollbar {
			display: none; /* 隐藏滚动条 */
		}
	}

	/* 详情图样式 */
	.article-detail-images {
		margin: 20rpx 24rpx;
		padding: 30rpx 10rpx;
		background-color: #fff;
		border-radius: 12rpx;
		
		.detail-images-title {
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 30rpx;
			padding: 0 40rpx;
			
			text {
				font-size: 30rpx;
				color: #333;
				margin: 0 30rpx;
				font-weight: 500;
			}
			
			.line {
				height: 1px;
				flex: 0.8;
				max-width: 120rpx;
				background-color: #ccc;
			}
		}
		
		.detail-images-container {
			display: flex;
			flex-direction: column;
			
			.detail-image-wrapper {
				margin-bottom: 1rpx;
				position: relative;
				background-color: #f9f9f9;
				border-radius: 0; /* Changed from 8rpx to 0 */
				overflow: hidden;
				
				&:last-child {
					margin-bottom: 0;
				}
				
				.detail-image {
					width: 100%;
					border-radius: 0; /* Changed from 8rpx to 0 */
					display: block;
					box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
				}
			}
		}
	}

	/* 浮动分享按钮 */
	.float-share-btn {
		display: none;
	}
	
	/* 分享面板 */
	.float-share-panel {
		display: none;
	}

	/* 添加分享按钮样式 */
	.share-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: 48rpx;
		background: transparent;
		border: none;
		padding: 0;
		line-height: normal;
		height: auto;
		font-size: inherit;
		color: inherit;

		&::after {
			border: none;
		}

		.text {
			margin-top: 8rpx;
			font-size: 24rpx;
		}

		&:active {
			opacity: 0.7;
		}
	}
	
	/* 更新action-item按钮样式，适用于普通按钮和open-type按钮 */
	button.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: 48rpx;
		background: transparent;
		border: none;
		padding: 0;
		line-height: normal;
		height: auto;
		font-size: inherit;
		color: inherit;
		
		&::after {
			border: none;
		}
		
		.text {
			margin-top: 8rpx;
			font-size: 24rpx;
		}
		
		&:active {
			opacity: 0.7;
		}
	}


	


			


	// 添加补充的加载组件样式
	.video-loading :deep(.uni-load-more) {
		background-color: transparent;
	}

	.video-loading :deep(.uni-load-more__text) {
		color: #fff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	/* 添加渐显动画 */
	.fade-in-animation {
		animation: fadeIn 0.4s ease-in-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* 添加自定义加载动画样式与首页一致 */
	.custom-loading-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #e2e2e2;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		
		.loading-spinner {
			animation: rotate 1.5s linear infinite;
		}
		
		.loading-text {
			margin-top: 30rpx;
			color: #666;
			font-size: 28rpx;
		}
	}
	
	@keyframes rotate {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}



	.image-grid .image-grid-item .image-placeholder {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: #f5f5f5;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 8rpx;
		z-index: 2;
	}

	.image-grid .image-grid-item .image-placeholder.loading uni-icons {
		animation: spin 1.5s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.image-grid .image-grid-item .image-placeholder text {
		font-size: 22rpx;
		color: #999;
		margin-top: 8rpx;
	}

	.detail-image-placeholder {
		width: 100%;
		min-height: 300rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: #f5f5f5;
		border-radius: 0; /* Changed from 8rpx to 0 */
		
		text {
			margin-top: 20rpx;
			color: #999;
			font-size: 26rpx;
		}
		
		&.loading {
			uni-icons {
				animation: spin 1.5s linear infinite;
			}
		}
	}

	.detail-image {
		width: 100%;
		border-radius: 0; /* Changed from 8rpx to 0 */
		display: block;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	}
	
	/* 位置信息显示样式 */
	.location-info-section {
		margin: 20rpx 24rpx;
		padding: 24rpx 30rpx;
		background-color: #fff;
		border-radius: 12rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		border: 1px solid #f0f0f0;
		
		.location-header {
			display: flex;
			align-items: center;
			margin-bottom: 12rpx;
			
			.location-title {
				font-size: 28rpx;
				color: #333;
				font-weight: 500;
				margin-left: 8rpx;
			}
		}
		
		.location-content {
			.location-address {
				font-size: 26rpx;
				color: #666;
				line-height: 1.5;
				word-break: break-all;
			}
		}
	}
</style>
