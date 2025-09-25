<script setup>
	import { nextTick, onMounted, ref, onUnmounted, computed, watch, onActivated } from 'vue';
	import { testLogin } from '@/utils/isLogin'
	import { useUserInfoStore } from '@/store/user.js'
	import { onPullDownRefresh, onReachBottom, onPageScroll, onShow, onBackPress } from '@dcloudio/uni-app'
	import { fixImageUrl, getDefaultImage } from '@/utils/domainConfig.js'
	
	// 加载状态管理器
	const loadingManager = {
		isLoading: false,
		showLoading(title = '加载中...', mask = true) {
			// 只设置状态，不显示加载动画
			this.isLoading = true;
			// 注释掉显示加载动画的代码
			// uni.showLoading({
			// 	title: title,
			// 	mask: mask
			// });
		},
		hideLoading() {
			this.isLoading = false;
			// 注释掉隐藏加载动画的代码
			// uni.hideLoading();
		}
	};
	
	// 头像点击状态控制
	const avatarClickState = ref(true)
	
	// 获取权限状态
	const getSendOnState = async () => {
		try {
			console.log('首页正在获取按钮状态...');
			
			const sendOnApi = uniCloud.importObject('sendOn', { customUI: true });
			const res = await sendOnApi.get();
			
			if (res && res.data && res.data.length > 0) {
				// 获取头像点击状态
				const serverAvatarClickState = res.data[0].avatarClick !== undefined ? res.data[0].avatarClick : true;
				
				// 更新头像点击状态
				avatarClickState.value = serverAvatarClickState;
				
				console.log('首页头像点击状态:', avatarClickState.value);
			} else {
				console.error('获取按钮状态失败: 数据格式不正确');
			}
		} catch (err) {
			console.error('获取按钮状态失败:', err);
		}
	}
	
	// 用户状态管理
	const userStore = useUserInfoStore()
	const paging = ref(null)
	// 分类
	const cateList = ref([])
	const activeIndex = ref(0)
	// 移除排序相关变量
	const currentCateId = ref('');  // 当前选中的分类ID
	
	// 分类api
	const cateApi = uniCloud.importObject('cateWx', { customUI: true })
	// 文章api
	const articleApi = uniCloud.importObject('articleWx', { customUI: true })
	// 扩展存储api
	const extStorageCo = uniCloud.importObject('fabuWx', { customUI: true })
	
	// 位置相关信息
	const locationInfo = ref(null)
	
	// 每页加载数据条数
	const pageSize = 8

	// 获取分类
	const cateListGet = async () => {
		try {
			// 显示加载提示
			// uni.showLoading({
			//	title: '加载分类...',
			//	mask: true
			// });
			
			// 首先获取用户位置
			let locationRes = await uni.getLocation({
				type: 'gcj02'
			}).catch(err => {
				console.error('获取位置失败:', err)
				// 如果获取位置失败，使用默认坐标
				return { longitude: 116.397428, latitude: 39.90923 }
			})
			
			// 获取分类数据
			const res = await cateApi.get(null, false);
			
			// 检查返回结果
			if (!res || !res.data) {
				throw new Error('获取分类失败，返回数据格式错误');
			}
			
			// 获取位置文本信息
			const addrInfo = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`);
			
			// 存储位置信息
			locationInfo.value = {
				address: addrInfo.address || '未知地址',
				district: addrInfo.district || '未知区域',
				longitude: locationRes.longitude,
				latitude: locationRes.latitude
			}
			
			// 处理分类数据，确保每个分类都有图标
			let processedCateList = res.data.map(cate => {
				// 添加是否为当前区域的标记
				const isLocationCategory = cate.cate_name && addrInfo.district && 
					(cate.cate_name.includes(addrInfo.district) || addrInfo.district.includes(cate.cate_name));
				
				return {
					...cate,
					cate_img: getCategoryIcon(cate),
					isLocationCategory: isLocationCategory,
					district: isLocationCategory ? addrInfo.district : ''
				};
			});
			
			// 根据是否为当前区域排序，当前区域的分类排在前面
			processedCateList.sort((a, b) => {
				if (a.isLocationCategory && !b.isLocationCategory) return -1;
				if (!a.isLocationCategory && b.isLocationCategory) return 1;
				return 0;
			});
			
			// 设置排序后的分类列表（移除5个限制）
			cateList.value = processedCateList;
			console.log('分类列表加载成功:', cateList.value);
			
			// 默认选中第一个分类
			if (processedCateList.length > 0) {
				currentCateId.value = processedCateList[0]._id;
				activeIndex.value = 0;
			}
			
			// 重置页码并获取文章
			pageNo.value = 1;
			getArticleList(currentCateId.value);
			
		} catch (err) {
			console.error('获取分类失败:', err);
			uni.showToast({
				title: '获取分类失败，请重试',
				icon: 'none',
				duration: 2000
			});
			
			// 如果获取分类失败，获取所有文章
			getArticleList();
		} finally {
			uni.hideLoading();
		}
	}
	const pageNo = ref(1)
	
	// 切换分类
	const hanleHeadTab = (index, id) => {
		activeIndex.value = index
		pageNo.value = 1
		status.value = 'more'
		
		// 设置当前分类ID
		currentCateId.value = id;
		getArticleList(id);
	}
	
	// 初始文章数据
	const articleList = ref([])
	let tempCateId = ''
	// 加载状态
	const isLoading = ref(true);
	
	// 获取文章
	const getArticleList = async (cate_id) => {
		// 避免重复请求
		if (loadingManager.isLoading) return;
		
		try {
			tempCateId = cate_id || ''
			console.log(tempCateId, '临时id')
			
			// 显示加载提示
			loadingManager.showLoading('加载文章列表...', true)
			isLoading.value = true;
			
			// 调用API时传递分类ID参数，始终按最新排序
			const res = await articleApi.getArticle(cate_id || '', pageNo.value, pageSize)
			console.log(res)
			articleList.value = res.data
		} catch (err) {
			console.log(err)
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none',
				duration: 2000
			})
		} finally {
			// 确保请求完成后隐藏加载动画
			loadingManager.hideLoading()
			isLoading.value = false;
		}
	}

	// 监听下拉刷新
	onPullDownRefresh(async () => {
		// 避免重复请求
		if (loadingManager.isLoading) {
			uni.stopPullDownRefresh();
			return;
		}
		
		pageNo.value = 1
		status.value = 'more'
		try {
			// 下拉刷新时，获取当前分类下的文章
			await getArticleList(tempCateId)
		} catch (err) {
			console.error('下拉刷新失败:', err)
			uni.showToast({
				title: '刷新失败，请重试',
				icon: 'none'
			})
		} finally {
			// 无论成功或失败，都停止下拉刷新
			uni.stopPullDownRefresh()
		}
	})

	// 加载更多
	const status = ref('more') // 初始状态为 'more'

	// 文章列表触底时触发
	onReachBottom(async () => {
		console.log('触底')
		// 如果已经是 'noMore' 状态或正在加载中，直接返回
		if (status.value === 'noMore' || loadingManager.isLoading) return
		
		// 'loading' 状态
		status.value = 'loading'

		try {
			// 显示加载提示
			loadingManager.showLoading('加载更多...', false)
			
			// 加载更多数据
			pageNo.value++
			const res = await articleApi.getArticle(tempCateId, pageNo.value, pageSize)

			// 拼接新老数据
			articleList.value = [...articleList.value, ...res.data]

			// 根据数据情况设置状态
			if (res.data.length > 0) {
				status.value = 'more' // 还有更多数据
			} else {
				status.value = 'noMore' // 没有更多数据了
			}
		} catch (err) {
			console.error('加载更多失败:', err)
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			})
			status.value = 'more' // 失败时恢复为 'more' 状态
		} finally {
			// 确保请求完成后隐藏加载动画
			loadingManager.hideLoading()
		}
	})


	// 处理删除
	const handleDelete = async (articleId) => {
		try {
			// 添加确认提示
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这篇文章吗？',
				success: async (res) => {
					if (res.confirm) {
						// 显示加载提示
						loadingManager.showLoading('删除中...')
						
						console.log('正在删除文章ID:', articleId, '用户ID:', userStore.userInfo.uid)
						
						// 确保用户已登录
						if (!userStore.userInfo.uid) {
							uni.showToast({
								title: '请先登录',
								icon: 'none',
								duration: 2000
							})
							loadingManager.hideLoading()
							return
						}
						
						// 调用接口删除文章
						const res = await articleApi.del(articleId, userStore.userInfo.uid)
						console.log('删除接口返回结果:', res)
						
						if (res && res.deleted) {
							// 删除成功，从列表中移除该文章
							const index = articleList.value.findIndex(item => item._id === articleId)
							if (index !== -1) {
								articleList.value.splice(index, 1)
							}
							
							loadingManager.hideLoading()
							uni.showToast({
								title: '删除成功',
								icon: 'success',
								duration: 2000
							})
						} else {
							throw new Error(res.message || '删除失败，请重试')
						}
					}
				}
			})
		} catch (err) {
			console.error('删除文章失败:', err)
			loadingManager.hideLoading()
			uni.showToast({
				title: err.message || '删除失败，请重试',
				icon: 'none',
				duration: 2000
			})
		}
	}

	// 联系电话
	const handelContact = (mobile) => {
		console.log(mobile)
		if ( !userStore.userInfo.isLogin ) {
			return testLogin()
		}

		if ( mobile === '未填写' ) {
			return uni.showToast({
				icon: 'none',
				title: '他并不想让人联系'
			})
		}

		uni.makePhoneCall({
			phoneNumber: mobile
		})
	}



	// 跳转用户列表
	const handelGoUserList = (user_id) => {
		// 检查头像点击功能是否启用
		if (!avatarClickState.value) {
			console.log('头像点击功能已禁用')
			uni.showToast({
				title: '联系管理员',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		uni.navigateTo({
			url: `/pages/userArticleList/userArticleList?userId=${user_id}`
		})
	}
	
	

	// 页面加载完毕
	onMounted(() => {
		// 直接获取分类和文章列表
		cateListGet()
		
		// 监听文章发布成功事件
		uni.$on('articlePublished', (articleId) => {
			console.log('收到文章发布成功事件，文章ID:', articleId)
			// 重新获取文章列表
			pageNo.value = 1
			status.value = 'more'
			getArticleList(tempCateId)
			
			// 显示发布成功提示
			uni.showToast({
				title: '发布成功，内容已更新',
				icon: 'success',
				duration: 2000
			})
		})
		
		// 监听一次性刷新事件 - 从发布页面跳转回来时只刷新一次
		uni.$on('refreshIndexOnce', (articleId) => {
			console.log('收到一次性刷新事件，文章ID:', articleId)
			// 重置页码并刷新文章列表
			pageNo.value = 1
			status.value = 'more'
			
			// 显示加载提示
			// uni.showLoading({
			//	title: '正在刷新内容...',
			//	mask: true
			// })
			
			// 延迟一点执行，确保页面已完全加载
			setTimeout(() => {
				getArticleList(tempCateId).then(() => {
					// 刷新完成后隐藏加载提示
					// uni.hideLoading()
					
					// 如果有文章ID，尝试滚动到该文章
					if (articleId && articleList.value.length > 0) {
						// 查找新发布的文章在列表中的位置
						const index = articleList.value.findIndex(item => item._id === articleId)
						if (index !== -1) {
							console.log('找到新发布的文章，位置:', index)
							// 可以在这里添加滚动到该文章的逻辑
						}
					}
				}).catch(err => {
					console.error('刷新文章列表失败:', err)
					// uni.hideLoading()
				})
			}, 300)
		})
		
		// 监听浏览量更新事件
		uni.$on('viewCountUpdated', (articleId) => {
			updateLocalViewCount(articleId)
		})
		
		// 添加新的全局事件监听器，从详情页更新浏览量
		uni.$on('articleViewCountUpdated', (data) => {
			console.log('收到文章浏览量更新事件:', data);
			if (data && data.articleId) {
				// 调用更新本地浏览量的方法
				updateLocalViewCount(data);
			}
		});
		
		// 开启平台原生页面分享
		uni.showShareMenu({
			withShareTicket: true
		})
		
		// 监听头像点击状态变化事件
		uni.$on('avatarClickChanged', (newState) => {
			console.log('首页收到头像点击状态变化事件:', newState);
			avatarClickState.value = newState;
		})
	})

	// 在页面卸载时移除事件监听
	onUnmounted(() => {
		uni.$off('articlePublished')
		uni.$off('refreshIndexOnce') // 移除一次性刷新事件监听
		uni.$off('viewCountUpdated')
		uni.$off('articleViewCountUpdated') // 移除新的浏览量更新事件监听
		uni.$off('avatarClickChanged') // 移除头像点击状态监听
	})
	
	// 使用正确的页面滚动生命周期函数
	onPageScroll(() => {
		// 确保滚动时隐藏加载动画
		loadingManager.hideLoading()
	})

	// 添加返回事件处理
	let lastRefreshTime = 0;
	onBackPress((e) => {
		console.log('检测到返回按钮事件', e);
		
		// 获取当前时间
		const now = Date.now();
		
		// 如果距离上次刷新时间不足1秒，不重复刷新
		if (now - lastRefreshTime < 1000) {
			console.log('距离上次刷新时间不足1秒，跳过刷新');
			return false;
		}
		
		// 记录本次刷新时间
		lastRefreshTime = now;
		
		// 检查是否从发布页面返回
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		
		if (currentPage && currentPage.route === 'pages/index/index') {
			console.log('当前在首页，检查是否需要刷新');
			
			// 延迟执行刷新，避免与页面切换冲突
			setTimeout(() => {
				// 重置页码并刷新文章列表
				pageNo.value = 1;
				status.value = 'more';
				getArticleList(tempCateId);
			}, 300);
		}
		
		// 返回false表示不拦截返回事件
		return false;
	});

	// 添加页面激活事件处理（用于处理页面从后台切回前台的情况）
	onActivated(() => {
		console.log('首页被激活');
		
		// 获取当前时间
		const now = Date.now();
		
		// 如果距离上次刷新时间超过5秒，自动刷新
		if (now - lastRefreshTime > 5000) {
			console.log('页面激活，自动刷新内容');
			lastRefreshTime = now;
			
			// 重置页码并刷新文章列表
			pageNo.value = 1;
			status.value = 'more';
			getArticleList(tempCateId);
		}
	});

	// 添加这个函数来获取分类图标
	const getCategoryIcon = (category) => {
		// 如果分类对象有cate_img字段且不为空，使用域名修复后的URL
		if (category && category.cate_img) {
			return fixImageUrl(category.cate_img);
		}
		
		// 如果没有图标，返回默认图标
		return getDefaultImage('default');
	}

	// 更新本地文章浏览量
	const updateLocalViewCount = (data) => {
		// 检查数据有效性
		if (!data || !data.articleId || !articleList.value.length) {
			console.log('更新浏览量失败：无效的文章数据或文章列表为空');
			return;
		}
		
		const index = articleList.value.findIndex(item => item._id === data.articleId);
		if (index !== -1) {
			// 如果有具体的浏览量数据，直接使用
			if (data.viewCount !== undefined) {
				articleList.value[index].look_count = data.viewCount;
				// 同时保持兼容性更新view_count字段
				if (articleList.value[index].view_count !== undefined) {
					articleList.value[index].view_count = data.viewCount;
				}
			} else {
				// 否则，自增浏览量
				if (articleList.value[index].look_count !== undefined) {
					articleList.value[index].look_count++;
				} else {
					articleList.value[index].look_count = 1;
				}
				
				// 同时保持兼容性更新view_count字段
				if (articleList.value[index].view_count !== undefined) {
					articleList.value[index].view_count = articleList.value[index].look_count;
				}
			}
			
			console.log(`文章[${data.articleId}]浏览量已更新为: ${articleList.value[index].look_count}`);
		} else {
			console.log(`未找到文章: ${data.articleId}`);
		}
	};

	// 添加图片预览方法
	const previewImage = (urls, current) => {
		// 检查参数
		if (!urls || !urls.length) {
			console.error('预览图片缺少URLs参数');
			return;
		}
		
		// 获取预览URL列表 - 使用域名修复后的URL
		let previewUrls = urls;
		
		// 如果当前URL和URLs数组是对象数组，仅在预览时提取compressedURL（如果有）或url
		if (typeof current === 'object' && current !== null) {
			current = fixImageUrl(current.compressedURL || current.thumbnailURL || current.url);
		} else if (typeof current === 'string') {
			current = fixImageUrl(current);
		}
		
		// 如果URLs数组是对象数组，仅在预览时提取compressedURL（如果有）或url
		if (urls.length > 0 && typeof urls[0] === 'object') {
			previewUrls = urls.map(img => fixImageUrl(img.compressedURL || img.thumbnailURL || img.url));
		} else {
			// 如果是字符串数组，直接处理URL
			previewUrls = urls.map(url => fixImageUrl(url));
		}
		
		// 使用uni.previewImage实现图片预览和左右滑动功能
		uni.previewImage({
			urls: previewUrls,           // 需要预览的图片链接列表（此时已是修复后的URL）
			current: current || previewUrls[0], // 当前显示图片的链接
			indicator: 'number',  // 显示页码指示器
			loop: true,           // 循环预览
			success: () => {
				console.log('图片预览成功');
			},
			fail: (err) => {
				console.error('预览图片失败:', err);
				uni.showToast({
					title: '预览图片失败',
					icon: 'none'
				});
			},
			complete: () => {
				// 预览完成后可以做一些清理工作
			}
		});
		
		
	};

	// 页面显示时获取最新权限状态
	onShow(() => {
		// 获取最新的权限状态
		getSendOnState();
	})

	const getCurrentCateName = () => {
		// 查找当前选中分类的名称
		if (!currentCateId.value) return '';
		
		const category = cateList.value.find(item => item._id === currentCateId.value);
		return category ? category.cate_name : '';
	}

	// 根据位置名称生成兼容的图标信息
	const generateLocationIconUniapp = (locationName) => {
		if (!locationName || locationName === '未知区域') {
			return {
				text: '位',
				bgColor: '#4cb0f9',
				type: 'text'
			};
		}
		
		// 获取位置的第一个字符
		const firstChar = locationName.trim().charAt(0);
		
		// 使用图标字典或颜色字典根据首字符生成一致的颜色
		const colorMap = {
			'北': '#FF5722', '南': '#2196F3', '东': '#4CAF50', '西': '#9C27B0',
			'中': '#FFEB3B', '河': '#03A9F4', '山': '#8BC34A', '海': '#00BCD4',
			'天': '#673AB7', '朝': '#FFC107', '新': '#E91E63', '广': '#3F51B5',
			'大': '#009688', '小': '#795548', '长': '#607D8B', '金': '#FF9800'
		};
		
		// 根据字符获取颜色，如果没有预设则使用哈希算法生成
		let bgColor = colorMap[firstChar] || '#4cb0f9';
		
		// 如果没有预设颜色，根据字符生成一个确定的颜色
		if (!colorMap[firstChar]) {
			// 简单的哈希算法将字符转换为颜色
			let hash = 0;
			for (let i = 0; i < firstChar.length; i++) {
				hash = firstChar.charCodeAt(i) + ((hash << 5) - hash);
			}
			
			const c = (hash & 0x00FFFFFF)
				.toString(16)
				.toUpperCase();
			
			bgColor = '#' + '00000'.substring(0, 6 - c.length) + c;
		}
		
		return {
			text: firstChar,
			bgColor: bgColor,
			type: 'text'
		};
	}

	// 跳转文章详情
	const handelGoArticleDetail = (id) => {
		uni.navigateTo({
			url: `/pages/article/articleDetail?article_id=${id}`,
			animationType: 'slide-in-right', // 添加滑入动画
			animationDuration: 300 // 设置动画持续时间为300ms
		})
	}

</script>
<template>
	<view class="home">
		<!-- 顶部分类导航 -->
		<view class="category-container">
			<!-- 动态分类 -->
			<scroll-view class="category-scroll" scroll-x="true" scroll-with-animation="true" show-scrollbar="false">
				<view class="category-list">
					<view class="category-item" 
						v-for="(item, index) in cateList" 
						:key="item._id" 
						:class="{ active: currentCateId === item._id, 'location-category': item.isLocationCategory }" 
						@click="hanleHeadTab(index, item._id)">
						<view class="category-content">
							<image v-if="item.cate_img" :src="item.cate_img" class="cate-icon" mode="aspectFit"></image>
							<text class="cate-text">{{ item.cate_name }}</text>
							<!-- 位置图标指示器 -->
							<view class="location-badge" v-if="item.isLocationCategory">当前</view>
						</view>
					</view>
					
					<!-- 加载中显示 -->
					<view class="category-item loading-item" v-if="cateList.length == 0">
						<view class="category-content">
							<uni-icons type="spinner-cycle" size="24" color="#399bfe"></uni-icons>
							<text class="loading-text">加载中...</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 文章列表 -->
		<view class="view-article">
			<!-- 添加加载中动画 -->
			<view class="loading-container" v-if="articleList.length === 0 && isLoading">
				<view class="loading-spinner">
					<uni-icons type="spinner-cycle" size="48" color="#399bfe"></uni-icons>
				</view>
				<text class="loading-text">内容加载中...</text>
			</view>
			
			<!-- 空数据提示 -->
			<view class="empty-container" v-if="articleList.length === 0 && !isLoading">
				<view class="empty-icon">
					<uni-icons color="#5cb85c" custom-prefix="icon" type="lishuai-a-00jichuiconkongzhuangtaiwuneirong" size="58"></uni-icons>
				</view>
				<text class="empty-text">暂无内容</text>
				<text class="empty-subtext">该分类下还没有数据，去看看其他分类吧</text>
			</view>
			
			<articleItem v-for="item in articleList" :key="item._id" :item="item" @contact="handelContact"
				@preview="(url, urls) => previewImage(urls, url)" @userList="handelGoUserList"
				@delete="handleDelete" :avatarClickEnabled="avatarClickState">
			</articleItem>
			
			<!-- 加载更多 -->
			<view class="loading">
				<uni-load-more v-if="!articleList.length==0" color="#cccccc" iconType="auto"
					:status="status" />
			</view>
		</view>
		
	
	</view>
	
	
</template>

<style lang="scss" scoped>
	.home {
		display: flex;
		flex-direction: column;
		padding-top: 180rpx; /* 固定高度的顶部padding */
		height: 100vh;
		background-color: $pyq-pages-bg-color;

		/* 分类导航容器 */
		.category-container {
			position: fixed;
			left: 0;
			top: 0;
			width: 100%;
			z-index: 999;
			background-color: #fff;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		}
		
		/* 分类导航样式 */
		.category-scroll {
			width: 100%;
			height: 160rpx; /* 固定高度 */
			white-space: nowrap;
			border-bottom: 1px solid $pyq-border-color-translucent;
			
			.category-list {
				display: flex;
				align-items: center;
				padding: 20rpx;
				flex-wrap: nowrap;
				
				.category-item {
					flex-shrink: 0;
					padding: 16rpx 24rpx;
					margin: 0 10rpx;
					font-size: 26rpx;
					color: $pyq-text-color-placeholder;
					height: 120rpx;
					width: 120rpx;
					border-radius: 12rpx;
					background-color: #f8f8f8;
					position: relative;
					transition: all 0.3s ease;
					
					&:active {
						transform: scale(0.95);
					}
					
					.category-content {
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						height: 100%;
						position: relative;
						
						.loading-text {
							font-size: 22rpx;
							margin-top: 8rpx;
							color: #399bfe;
						}
					}
					
					.cate-icon {
						width: 50rpx;
						height: 50rpx;
						margin-bottom: 8rpx;
						object-fit: contain;
					}
					
					.cate-text {
						font-size: 24rpx;
						text-align: center;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						max-width: 100%;
						padding: 0 4rpx;
						line-height: 1.2;
					}
					
					&.active {
						color: #399bfe;
						font-weight: bold;
						background-color: rgba(57, 155, 254, 0.1);
						transform: scale(1.05);
						box-shadow: 0 4rpx 12rpx rgba(57, 155, 254, 0.15);
						z-index: 1;
					}
					
					&.location-category {
						background-color: rgba(76, 176, 249, 0.1);
						
						&.active {
							background-color: rgba(76, 176, 249, 0.2);
						}
						
						.location-badge {
							position: absolute;
							top: 6rpx;
							right: 6rpx;
							background-color: #4cb0f9;
							color: white;
							font-size: 18rpx;
							padding: 2rpx 6rpx;
							border-radius: 6rpx;
							z-index: 2;
						}
					}
				}
			}
		}

		/* 文章列表 */
		.view-article {
			background-color: $pyq-pages-bg-color;
			padding-bottom: 120rpx; /* 增加底部间距 */
			
			/* 加载中动画容器 */
			.loading-container {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				height: 60vh;
				width: 100%;
				
				.loading-spinner {
					animation: rotate 1.5s linear infinite;
				}
				
				.loading-text {
					margin-top: 30rpx;
					color: #666;
					font-size: 28rpx;
				}
				
				@keyframes rotate {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
			}
			
			/* 空数据提示 */
			.empty-container {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				height: 70vh;
				width: 100%;
				padding: 0 50rpx;
				
				.empty-icon {
					opacity: 0.7;
					margin-bottom: 30rpx;
					transform: scale(1.2);
				}
				
				.empty-text {
					font-size: 34rpx;
					color: #888;
					margin-bottom: 16rpx;
					font-weight: 500;
				}
				
				.empty-subtext {
					font-size: 28rpx;
					color: #aaaaaa;
					text-align: center;
					line-height: 1.5;
				}
			}

			.loading {
				height: 100rpx; /* 增加加载区域高度 */
				padding-bottom: 30rpx; /* 额外底部间距 */
			}
		}
		
		/* 测试按钮样式 */
		.test-buttons {
			position: fixed;
			left: 40rpx;
			bottom: 120rpx;
			z-index: 999;
			
			.test-btn {
				background-color: #007AFF;
				color: #fff;
				font-size: 28rpx;
				padding: 10rpx 30rpx;
				border-radius: 50rpx;
				box-shadow: 0 4rpx 10rpx rgba(0, 122, 255, 0.3);
			}
		}
		
		/* 美化后的发布按钮 */
		.publish-button {
			position: fixed;
			right: 40rpx;
			bottom: 120rpx;
			z-index: 999;
			display: flex;
			align-items: center;
			background: linear-gradient(135deg, #3c7dff, #399bfe);
			padding: 16rpx 32rpx;
			border-radius: 50rpx;
			box-shadow: 0 6rpx 16rpx rgba(60, 125, 255, 0.3);
			transition: all 0.3s ease;
			
			.publish-icon {
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 12rpx;
			}
			
			.publish-text {
				color: #FFFFFF;
				font-size: 30rpx;
				font-weight: 500;
				letter-spacing: 2rpx;
			}
			
			&:active {
				transform: scale(0.95);
				box-shadow: 0 3rpx 8rpx rgba(60, 125, 255, 0.3);
			}
		}
		
		/* 七牛云上传按钮样式 */
		.qiniu-button {
			position: fixed;
			right: 40rpx;
			bottom: 220rpx;
			z-index: 999;
			display: flex;
			align-items: center;
			background: linear-gradient(135deg, #ff7043, #ff5722);
			padding: 16rpx 32rpx;
			border-radius: 50rpx;
			box-shadow: 0 6rpx 16rpx rgba(255, 87, 34, 0.3);
			transition: all 0.3s ease;
			
			.qiniu-icon {
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 12rpx;
			}
			
			.qiniu-text {
				color: #FFFFFF;
				font-size: 30rpx;
				font-weight: 500;
				letter-spacing: 2rpx;
			}
			
			&:active {
				transform: scale(0.95);
				box-shadow: 0 3rpx 8rpx rgba(255, 87, 34, 0.3);
			}
		}
	}
</style>

<!-- 添加全局样式，覆盖组件中的问题样式 -->
<style lang="scss">
/* 修复uni-load-more组件样式问题 */
.uni-load-more {
	.uni-load-more__img--android-MP {
		.uni-load-more__img-icon {
			border-top-style: solid;
			border-color: #777777;
			border-width: 2px;
		}
	}
	
	.uni-load-more__img--ios-H5 {
		.uni-load-more__img-icon {
			width: 100%;
			height: 100%;
		}
	}
}

/* 修复articleItem组件样式问题 */
.pyqContent {
	.pyq-img {
		.multi-img {
			.img-grid {
				.grid-item {
					width: 180rpx;
					height: 180rpx;
					border-radius: 8rpx;
				}
			}
		}
		
		.single-img {
			.single-img-item {
				width: 100%;
				height: auto;
			}
		}
	}
}
</style>