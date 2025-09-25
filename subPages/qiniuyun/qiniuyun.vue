<template>
	<view class="publish-container">
		<!-- 内容区域 -->
		<view class="content-container">
			<!-- 分类选择和位置信息 -->
			<view class="category-section">
				<view class="section-header">
					<text class="section-title">选择分类</text>
					<!-- 位置信息 - 放在标题后面 -->
					<view class="location-info-inline" v-if="locationInfo">
						<uni-icons type="location" size="14" color="#007AFF"></uni-icons>
						<text>{{ locationInfo.address }}</text>
					</view>
				</view>
				<view class="category-grid">
					<view 
						class="category-item" 
						v-for="(item, index) in categoryList" 
						:key="item._id"
						:class="{ active: selectedCategory === item._id }"
						@click="selectCategory(index)"
					>
						<image 
							:src="item.cate_img" 
							mode="aspectFit" 
							class="category-icon"
							@error="handleCategoryImageError(index)"
						></image>
						<text class="category-name">{{ item.cate_name }}</text>
					</view>
				</view>
				<view class="loading-placeholder" v-if="categoryList.length === 0">
					<uni-icons type="spinner-cycle" size="30" color="#399bfe"></uni-icons>
					<text>正在加载分类...</text>
				</view>
			</view>

			<!-- 合并文本输入和媒体为一个整体模块 -->
			<view class="content-media-section">
				<!-- 文本输入区域 -->
				<view class="textarea-container">
					<textarea 
						v-model="content" 
						placeholder="分享新鲜事..." 
						maxlength="350"
						class="content-textarea"
						auto-height
						show-confirm-bar="false"
						cursor-spacing="120"
					></textarea>
					<view class="word-count">{{ content.length }}/350</view>
				</view>

				<!-- 媒体选择区域 -->
				<view class="media-area">
					<view class="media-tabs">
						<view 
							class="tab-item" 
							:class="{'active': mediaType === 'image'}" 
							@tap="mediaType = 'image'"
						>
							<uni-icons 
								type="image" 
								size="20" 
								:color="mediaType === 'image' ? '#399bfe' : '#999'"
							></uni-icons>
							<text 
								class="tab-text" 
								:class="{'active-text': mediaType === 'image'}"
							>图片</text>
						</view>
						<view 
							class="tab-item" 
							:class="{'active': mediaType === 'video'}" 
							@tap="mediaType = 'video'"
						>
							<uni-icons 
								type="videocam" 
								size="20" 
								:color="mediaType === 'video' ? '#399bfe' : '#999'"
							></uni-icons>
							<text 
								class="tab-text" 
								:class="{'active-text': mediaType === 'video'}"
							>视频</text>
						</view>
					</view>
					
					<!-- 图片上传区域 - 当选择图片选项卡或已有图片时显示 -->
					<view class="media-content" v-if="mediaType === 'image' || (imageList.length > 0 && mediaType === 'video')">
						<view class="section-title" v-if="mediaType !== 'image' && imageList.length > 0">已上传图片</view>
						<view class="image-grid">
							<view 
								v-for="(item, index) in imageList" 
								:key="index" 
								class="image-item"
							>
								<image 
									:src="formatImagePath(item.tempPath || item.thumbnailURL)" 
									mode="aspectFill" 
									@error="handleImageError(index)"
								/>
								<view class="progress-overlay" v-if="item.progress < 100">
									<view class="progress-text">{{item.progress}}%</view>
									<view class="progress-bar">
										<view class="progress" :style="{width: item.progress + '%'}"></view>
									</view>
								</view>
								<view class="delete-btn" @tap="removeFile(index)">
									<uni-icons type="close" size="16" color="#fff"></uni-icons>
								</view>
							</view>
							
							<!-- 添加图片按钮 - 只在图片模式下显示 -->
							<view 
								v-if="imageList.length < 9 && mediaType === 'image'" 
								class="add-media-btn"
								@tap="chooseImage"
							>
								<uni-icons type="plusempty" size="30" color="#999"></uni-icons>
								<text class="btn-text">添加图片</text>
							</view>
						</view>
						<text class="tip-text" v-if="mediaType === 'image'">最多上传9张图片，支持从相册、拍照选择</text>
					</view>
					
					<!-- 视频上传区域 - 当选择视频选项卡或已有视频时显示 -->
					<view class="media-content" v-if="mediaType === 'video' || (hasVideo && mediaType === 'image')">
						<view class="section-title" v-if="mediaType !== 'video' && hasVideo">已上传视频</view>
						<view class="video-container" v-if="hasVideo">
							<view class="video-item">
								<image 
									:src="videoData.poster || videoData.thumbnailURL" 
									mode="aspectFill"
								/>
								<view class="video-icon">
									<uni-icons type="videocam-filled" size="30" color="#fff"></uni-icons>
								</view>
								<view class="video-info">
									<text class="video-duration">{{Math.floor(videoData.duration || 0)}}秒</text>
									<text class="video-size">{{((videoData.size || 0) / 1024 / 1024).toFixed(1)}}MB</text>
									<text class="video-format">{{videoData.format || 'mp4'}}</text>
								</view>
								<view class="progress-overlay" v-if="videoData && videoData.progress < 100">
									<view class="progress-text">{{videoData.progress}}%</view>
									<view class="progress-bar">
										<view class="progress" :style="{width: videoData.progress + '%'}"></view>
									</view>
								</view>
								<view class="delete-btn" @tap="removeVideo">
									<uni-icons type="close" size="16" color="#fff"></uni-icons>
								</view>
							</view>
						</view>
						
						<!-- 视频上传按钮 - 只在视频模式下且没有视频时显示 -->
						<view 
							v-if="!hasVideo && mediaType === 'video'" 
							class="video-upload-btn" 
							@tap="chooseVideo"
						>
							<uni-icons type="videocam-filled" size="40" color="#999"></uni-icons>
							<text class="upload-text">点击上传视频</text>
							<text class="upload-subtext">支持60秒以内、500MB以下的视频</text>
						</view>
						<text class="tip-text" v-if="mediaType === 'video' && !hasVideo">支持60秒以内、500MB以下的视频</text>
					</view>
				</view>
			</view>
			
			<!-- 底部安全区域占位 -->
			<view class="safe-area-placeholder"></view>
		</view>
		
		<!-- 发布按钮 - 移到内容容器外部 -->
		<view class="publish-btn-container">
			<button class="publish-btn" @click="publishContent">发布</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useUserInfoStore } from '@/store/user.js'
import { testLogin } from '@/utils/isLogin'

// Store & API
const userStore = useUserInfoStore()
const qiniuCloud = uniCloud.importObject('qiniuyunCloud', { customUI: true })
const extStorageCo = uniCloud.importObject('ext-storage-co', { customUI: true })
const articleApi = uniCloud.importObject('articleWx', { customUI: true })

// 状态管理
const fileList = ref([])
const imageList = ref([])
const videoData = ref(null)
const isUploading = ref(false)
const totalProgress = ref(0)
const uploadedFiles = ref([])
const mediaType = ref('image')
const content = ref('')
const locationInfo = ref(null)
const categoryList = ref([])
const cateIndex = ref(0)
const selectedCategory = ref(null)
const isPublishing = ref(false)
const publishedArticleId = ref(null)

// 计算属性
const hasVideo = computed(() => videoData.value !== null)

// 获取位置和分类
const getLocaAndCate = async () => {
	try {
		uni.showLoading({ title: '加载中...' })
		
		// 获取位置信息
		const locationRes = await uni.getLocation({
			type: 'gcj02'
		}).catch(err => {
			console.error('获取位置失败:', err)
			return { longitude: 0, latitude: 0 }
		})

		// 获取分类和位置信息
		const res = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`)
		console.log('获取位置和分类:', res)

		if (res) {
			// 设置位置信息
			locationInfo.value = {
				address: res.address || '未知位置',
				district: res.district || ''
			}

			// 设置分类信息
			if (res.cateList && res.cateList.length > 0) {
				// 处理分类图片路径，确保URL格式正确
				categoryList.value = res.cateList.map(category => ({
					...category,
					cate_img: formatCategoryImageUrl(category.cate_img)
				}))
				
				// 移除默认选择
				selectedCategory.value = null
				cateIndex.value = -1
			} else {
				// 如果没有获取到分类，尝试从本地获取
				await getCategoriesFromLocal()
			}
		} else {
			// 如果API调用失败，尝试从本地获取
			await getCategoriesFromLocal()
		}

		uni.hideLoading()
	} catch (e) {
		console.error('获取位置和分类失败:', e)
		uni.hideLoading()
		
		// 尝试从本地获取分类
		await getCategoriesFromLocal()
		
		uni.showToast({
			title: '获取信息失败',
			icon: 'none'
		})
	}
}

// 从本地存储获取分类
const getCategoriesFromLocal = async () => {
	try {
		// 尝试从本地存储获取分类数据
		const storage = uni.getStorageSync('categoryList')
		if (storage) {
			categoryList.value = JSON.parse(storage).map(category => ({
				...category,
				cate_img: formatCategoryImageUrl(category.cate_img)
			}))
			console.log('从本地存储获取分类成功:', categoryList.value)
		} else {
			// 如果本地没有，尝试直接从数据库获取
			const result = await articleApi.getCategories()
			if (result && result.length > 0) {
				categoryList.value = result.map(category => ({
					...category,
					cate_img: formatCategoryImageUrl(category.cate_img)
				}))
				
				// 保存到本地存储
				uni.setStorageSync('categoryList', JSON.stringify(result))
				console.log('从数据库获取分类成功:', categoryList.value)
			} else {
				// 如果都失败了，使用默认分类
				categoryList.value = getDefaultCategories()
				console.log('使用默认分类:', categoryList.value)
			}
		}
	} catch (error) {
		console.error('获取本地分类失败:', error)
		// 使用默认分类
		categoryList.value = getDefaultCategories()
	}
}

// 获取默认分类
const getDefaultCategories = () => {
	return [
		{
			_id: 'default_1',
			cate_name: '默认分类1',
			cate_img: '/static/category/default1.png'
		},
		{
			_id: 'default_2',
			cate_name: '默认分类2',
			cate_img: '/static/category/default2.png'
		},
		{
			_id: 'default_3',
			cate_name: '默认分类3',
			cate_img: '/static/category/default3.png'
		},
		{
			_id: 'default_4',
			cate_name: '默认分类4',
			cate_img: '/static/category/default4.png'
		}
	]
}

// 格式化分类图片URL
const formatCategoryImageUrl = (url) => {
	if (!url) return '/static/category/default.png'
	
	// 如果已经是完整URL，直接返回
	if (url.startsWith('http')) return url
	
	// 如果是相对路径，添加域名
	if (url.startsWith('/')) {
		// 这里可以根据实际情况添加域名前缀
		// 例如: return 'https://your-domain.com' + url
		return url
	}
	
	// 如果是七牛云路径，添加七牛云域名
	if (!url.includes('://')) {
		// 这里替换为您的七牛云域名
		return `https://your-qiniu-domain.com/${url}`
	}
	
	return url
}

// 处理分类图片加载错误
const handleCategoryImageError = (index) => {
	console.error(`分类图片加载错误，索引: ${index}`, categoryList.value[index])
	
	// 设置为默认图片
	if (categoryList.value[index]) {
		categoryList.value[index].cate_img = '/static/category/default.png'
	}
}

// 分类选择处理
const selectCategory = (index) => {
	console.log('选择分类:', categoryList.value[index])
	cateIndex.value = index
	selectedCategory.value = categoryList.value[index]._id
}

// 检查用户是否登录
const checkUserLogin = () => {
	console.log('检查用户登录状态:', userStore.userInfo)
	
	if (!userStore.userInfo || !userStore.userInfo.uid) {
		console.log('用户未登录，调用登录函数')
		uni.showToast({
			title: '请先登录',
			icon: 'none'
		})
		testLogin()
		return false
	}
	return true
}

// 页面加载时获取位置和分类信息
onMounted(() => {
	console.log('发布页面已加载')
	getLocaAndCate()
	
	// 添加返回按钮拦截
	const pages = getCurrentPages()
	const page = pages[pages.length - 1]
	if (page && page.$getAppWebview) {
		const currentWebview = page.$getAppWebview()
		currentWebview.setStyle({
			popGesture: 'none' // 禁用侧滑返回
		})
	}
})

// 页面卸载前的清理工作
onBeforeUnmount(() => {
	console.log('发布页面即将卸载')
	// 如果有正在上传的文件，提示用户
	const hasUploadingMedia = imageList.value.some(item => item.uploadStatus === 'uploading') || 
							 (videoData.value && videoData.value.uploadStatus === 'uploading')
	
	if (hasUploadingMedia && !isPublishing.value) {
		console.log('有正在上传的媒体文件，但用户选择离开页面')
	}
	
	// 如果已经发布成功，确保触发刷新事件
	if (publishedArticleId.value && !isPublishing.value) {
		console.log('页面卸载前再次触发刷新事件')
		uni.$emit('refreshIndexOnce', publishedArticleId.value)
	}
})

// 页面完全卸载时的清理
onUnmounted(() => {
	console.log('发布页面已完全卸载')
})

// 选择图片
const chooseImage = async () => {
	try {
		// 检查用户是否登录
		if (!checkUserLogin()) return
		
		// 检查是否达到最大图片数量
		if (imageList.value.length >= 9) {
			uni.showToast({
				title: '最多只能上传9张图片',
				icon: 'none'
			})
			return
		}
		
		// 显示选择图片来源的操作菜单
		uni.showActionSheet({
			itemList: ['从相册选择', '拍照'],
			success: async (res) => {
				let sourceType = []
				
				// 根据用户选择设置图片来源
				switch (res.tapIndex) {
					case 0: // 从相册选择
						sourceType = ['album']
						break
					case 1: // 拍照
						sourceType = ['camera']
						break
				}
				
				// 选择图片
				const chooseRes = await uni.chooseImage({
					count: 9 - imageList.value.length,
					sizeType: ['original', 'compressed'], // 同时使用原图和压缩图
					sourceType: sourceType
				})
				
				console.log('选择图片结果:', chooseRes)
				
				// 为每个选中的图片创建临时对象
				const tempFiles = chooseRes.tempFilePaths.map(filePath => {
					// 处理文件路径，确保格式正确
					const processedPath = filePath.replace(/^kwfile:\/\//, '');
					
					return {
						type: 'image',
						tempPath: processedPath,
						thumbnailURL: processedPath,
						progress: 0,
						uploadStatus: null
					}
				})
				
				// 添加到预览列表
				const startIndex = imageList.value.length
				imageList.value.push(...tempFiles)
				
				// 立即上传图片
				for (let i = 0; i < tempFiles.length; i++) {
					const index = startIndex + i
					// 使用setTimeout错开上传时间，避免同时发起太多请求
					setTimeout(() => {
						uploadImageToQiniu(imageList.value[index], index)
							.then(result => {
								console.log(`图片${index}上传成功:`, result)
								// 更新图片信息
								if (imageList.value[index]) {
									imageList.value[index] = {
										...imageList.value[index],
										...result,
										progress: 100,
										uploadStatus: 'success'
									}
								}
							})
							.catch(error => {
								console.error(`图片${index}上传失败:`, error)
								if (imageList.value[index]) {
									imageList.value[index].uploadStatus = 'error'
								}
								uni.showToast({
									title: `第${index+1}张图片上传失败`,
									icon: 'none'
								})
							})
					}, i * 200) // 每张图片错开200ms上传
				}
			}
		})
	} catch (e) {
		if (e.errMsg !== 'chooseImage:fail cancel') {
			uni.showToast({
				title: '选择图片失败',
				icon: 'none'
			})
		}
	}
}

// 格式化图片路径，处理特殊前缀
const formatImagePath = (path) => {
	if (!path) return '';
	
	// 移除可能导致问题的前缀
	let formattedPath = path.replace(/^kwfile:\/\//, '');
	
	// 如果是网络图片，直接返回
	if (formattedPath.startsWith('http')) {
		return formattedPath;
	}
	
	// 如果是本地临时文件，确保路径格式正确
	if (formattedPath.startsWith('tmp/')) {
		// 在某些平台上可能需要添加特定前缀
		// #ifdef MP-WEIXIN
		return formattedPath;
		// #endif
		
		// #ifdef APP-PLUS
		return plus.io.convertLocalFileSystemURL(formattedPath);
		// #endif
		
		// 其他平台
		return formattedPath;
	}
	
	return formattedPath;
}

// 处理图片加载错误
const handleImageError = (index) => {
	console.error(`图片加载错误，索引: ${index}`, imageList.value[index]);
	
	// 设置为默认图片
	if (imageList.value[index]) {
		// 标记图片加载失败
		imageList.value[index].loadError = true;
		
		// 可以选择设置一个默认图片
		// imageList.value[index].thumbnailURL = '/static/default-image.png';
		
		// 或者显示错误提示
		uni.showToast({
			title: '图片加载失败',
			icon: 'none'
		});
	}
}

// 选择视频
const chooseVideo = async () => {
	try {
		// 检查用户是否登录
		if (!checkUserLogin()) return
		
		// 如果已经有视频，提示先删除
		if (hasVideo.value) {
			uni.showToast({
				title: '只能选择一个视频',
				icon: 'none'
			})
			return
		}

		// 显示选择视频来源的操作菜单
		uni.showActionSheet({
			itemList: ['从相册选择', '拍摄视频'],
			success: async (res) => {
				let sourceType = []
				
				// 根据用户选择设置视频来源
				switch (res.tapIndex) {
					case 0: // 从相册选择
						sourceType = ['album']
						break
					case 1: // 拍摄视频
						sourceType = ['camera']
						break
				}
				
				// 选择视频
				const chooseRes = await uni.chooseVideo({
					sourceType: sourceType,
					maxDuration: 60, // 限制视频最长60秒
					camera: 'back'
				})
				
				console.log('选择视频结果:', chooseRes)
				
				// 检查视频大小（限制为500MB）
				const maxSize = 500 * 1024 * 1024 // 500MB
				if (chooseRes.size > maxSize) {
					uni.showToast({
						title: '视频过大，请选择小于500MB的视频',
						icon: 'none'
					})
					return
				}
				
				// 创建临时视频对象
				videoData.value = {
					type: 'video',
					tempPath: chooseRes.tempFilePath,
					poster: chooseRes.thumbTempFilePath,
					thumbnailURL: chooseRes.thumbTempFilePath,
					duration: chooseRes.duration,
					size: chooseRes.size,
					width: chooseRes.width,
					height: chooseRes.height,
					format: 'mp4', // 默认格式
					progress: 0,
					uploadStatus: 'uploading'
				}
				
				// 显示轻量级提示，不阻塞界面
				uni.showToast({
					title: '准备上传视频',
					icon: 'loading',
					duration: 2000
				});
				
				try {
					// 异步上传视频，不等待完成
					uploadVideoToQiniu(videoData.value)
						.then(result => {
							console.log('视频上传成功:', result)
							
							// 更新视频信息
							videoData.value = {
								...videoData.value,
								...result,
								progress: 100,
								uploadStatus: 'success'
							}
							
							// 显示成功提示
							uni.showToast({
								title: '视频上传成功',
								icon: 'success',
								duration: 2000
							});
						})
						.catch(error => {
							console.error('视频上传失败:', error)
							
							// 只有在视频对象仍然存在时才更新状态
							if (videoData.value) {
								videoData.value.uploadStatus = 'error'
								
								// 显示失败提示
								uni.showToast({
									title: '视频上传失败，可继续编辑内容',
									icon: 'none',
									duration: 2000
								});
							}
						});
					
					// 不等待上传完成，立即返回让用户继续操作
					uni.showToast({
						title: '视频上传中，您可继续编辑',
						icon: 'none',
						duration: 2000
					});
				} catch (error) {
					console.error('启动视频上传失败:', error)
					
					// 只有在视频对象仍然存在时才更新状态
					if (videoData.value) {
						videoData.value.uploadStatus = 'error'
					}
					
					// 显示失败提示
					uni.showToast({
						title: '启动视频上传失败',
						icon: 'none',
						duration: 2000
					});
				}
			}
		})
	} catch (e) {
		if (e.errMsg !== 'chooseVideo:fail cancel') {
			uni.showToast({
				title: '选择视频失败',
				icon: 'none'
			})
		}
	}
}

// 移除图片
const removeFile = (index) => {
	imageList.value.splice(index, 1)
}

// 移除视频
const removeVideo = () => {
	videoData.value = null
}

// 上传图片到七牛云
const uploadImageToQiniu = async (file, index) => {
	try {
		// 更新上传状态
		file.uploadStatus = 'uploading'
		
		// 获取文件扩展名
		const fileExt = getFileExtension(file.tempPath)
		
		// 获取七牛云上传凭证
		const uploadConfig = await qiniuCloud.generateUploadToken({
			type: 'image',
			ext: fileExt
		})
		
		console.log('获取七牛云上传凭证成功:', uploadConfig)
		
		if (!uploadConfig || !uploadConfig.token) {
			throw new Error('获取上传凭证失败')
		}
		
		// 确保上传域名使用HTTPS协议
		let uploadDomain = uploadConfig.uploadDomain;
		if (uploadDomain && !uploadDomain.startsWith('https://')) {
			uploadDomain = uploadDomain.replace('http://', 'https://');
			console.log('已将上传域名转换为HTTPS:', uploadDomain);
		}
		
		// 上传文件
		return new Promise((resolve, reject) => {
			// 添加重试逻辑
			let retryCount = 0;
			const maxRetries = 3;
			
			const performUpload = () => {
				try {
					const uploadTask = uni.uploadFile({
						url: uploadDomain,
						filePath: file.tempPath,
						name: 'file',
						formData: {
							token: uploadConfig.token,
							key: uploadConfig.key
						},
						success: (uploadRes) => {
							console.log('上传响应:', uploadRes)
							
							if (uploadRes.statusCode === 200) {
								try {
									const data = JSON.parse(uploadRes.data)
									const fileUrl = `${uploadConfig.domain}/${uploadConfig.key}`
									
									// 更新上传状态
									file.uploadStatus = 'success'
									file.fileURL = fileUrl
									file.progress = 100
									
									// 构建缩略图URL (七牛云图片处理)
									const thumbnailURL = `${fileUrl}?imageView2/1/w/200/h/200`
									// 构建压缩图URL
									const compressedURL = `${fileUrl}?imageView2/2/w/800`
									
									resolve({
										type: 'image',
										url: fileUrl,
										thumbnailURL: thumbnailURL,
										compressedURL: compressedURL
									})
								} catch (e) {
									console.error('解析上传响应失败:', e)
									file.uploadStatus = 'error'
									reject(new Error('解析上传响应失败'))
								}
							} else {
								console.error('上传失败状态码:', uploadRes.statusCode)
								file.uploadStatus = 'error'
								reject(new Error(`上传失败: ${uploadRes.statusCode}`))
							}
						},
						fail: (error) => {
							console.error('上传失败:', error)
							
							// 检查是否是域名错误
							if (error.errMsg && error.errMsg.includes('url not in domain list')) {
								uni.showModal({
									title: '上传域名未授权',
									content: '请在微信小程序管理后台添加 ' + uploadDomain + ' 到合法域名列表',
									showCancel: false
								});
								file.uploadStatus = 'error'
								reject(new Error(error.errMsg || '上传失败'))
								return;
							}
							
							// 检查是否是连接数超限错误
							if (error.errMsg && error.errMsg.includes('exceed max upload connection count')) {
								if (retryCount < maxRetries) {
									retryCount++;
									console.log(`连接数超限，第${retryCount}次重试上传图片...`);
									
									// 延迟重试，给其他上传任务完成的时间
									setTimeout(() => {
										performUpload();
									}, 1000 * retryCount); // 递增延迟
									return;
								}
							}
							
							file.uploadStatus = 'error'
							reject(new Error(error.errMsg || '上传失败'))
						}
					})
					
					// 监听上传进度
					uploadTask.onProgressUpdate((res) => {
						file.progress = res.progress
						updateTotalProgress()
					})
				} catch (e) {
					console.error('创建上传任务失败:', e);
					file.uploadStatus = 'error';
					reject(new Error('创建上传任务失败: ' + e.message));
				}
			}
			
			// 开始上传
			performUpload();
		})
	} catch (e) {
		console.error('上传图片错误:', e)
		file.uploadStatus = 'error'
		throw new Error(`上传失败：${e.message}`)
	}
}

// 上传视频到七牛云
const uploadVideoToQiniu = async (file) => {
	try {
		// 更新上传状态
		file.uploadStatus = 'uploading'
		
		// 获取文件扩展名
		const fileExt = getFileExtension(file.tempPath)
		
		// 获取七牛云上传凭证
		const uploadConfig = await qiniuCloud.generateUploadToken({
			type: 'video',
			ext: fileExt
		})
		
		console.log('获取七牛云上传凭证成功:', uploadConfig)
		
		if (!uploadConfig || !uploadConfig.token) {
			throw new Error('获取上传凭证失败')
		}
		
		// 确保上传域名使用HTTPS协议
		let uploadDomain = uploadConfig.uploadDomain;
		if (uploadDomain && !uploadDomain.startsWith('https://')) {
			uploadDomain = uploadDomain.replace('http://', 'https://');
			console.log('已将上传域名转换为HTTPS:', uploadDomain);
		}
		
		// 保存视频样式配置 - 简化为只使用一种转码方式
		const videoStyle = uploadConfig.videoStyle || 'standard';
		const styleSeparator = uploadConfig.styleSeparator || '-';
		
		// 显示轻量级提示，不阻塞界面
		uni.showToast({
			title: '开始上传视频',
			icon: 'loading',
			duration: 2000
		});
		
		// 上传文件
		return new Promise((resolve, reject) => {
			// 对于大文件，显示更详细的上传信息
			let lastUpdateTime = Date.now();
			let uploadSpeed = 0;
			let uploadedSize = 0;
			let estimatedTimeLeft = '计算中...';
			let lastToastTime = 0; // 控制Toast显示频率
			
			const updateProgress = (progress, currentSize) => {
				const now = Date.now();
				const timeElapsed = (now - lastUpdateTime) / 1000; // 秒
				
				if (timeElapsed > 1) { // 每秒更新一次
					const sizeDiff = currentSize - uploadedSize; // 字节
					uploadSpeed = sizeDiff / timeElapsed; // 字节/秒
					
					// 计算剩余时间
					const remainingSize = file.size - currentSize;
					const remainingTime = uploadSpeed > 0 ? remainingSize / uploadSpeed : 0;
					
					// 格式化剩余时间
					if (remainingTime > 60) {
						estimatedTimeLeft = `约${Math.ceil(remainingTime / 60)}分钟`;
					} else {
						estimatedTimeLeft = `约${Math.ceil(remainingTime)}秒`;
					}
					
					// 格式化速度
					let speedText = '';
					if (uploadSpeed > 1024 * 1024) {
						speedText = `${(uploadSpeed / (1024 * 1024)).toFixed(2)}MB/s`;
					} else if (uploadSpeed > 1024) {
						speedText = `${(uploadSpeed / 1024).toFixed(2)}KB/s`;
					} else {
						speedText = `${Math.floor(uploadSpeed)}B/s`;
					}
					
					// 控制Toast显示频率，避免频繁弹出
					if (now - lastToastTime > 3000) { // 每3秒最多显示一次Toast
						uni.showToast({
							title: `上传中: ${progress}%`,
							icon: 'none',
							duration: 1500
						});
						lastToastTime = now;
					}
					
					// 更新参考值
					lastUpdateTime = now;
					uploadedSize = currentSize;
				}
			};
			
			// 添加重试逻辑
			let retryCount = 0;
			const maxRetries = 3;
			
			const performUpload = () => {
				try {
					const uploadTask = uni.uploadFile({
						url: uploadDomain,
						filePath: file.tempPath,
						name: 'file',
						formData: {
							token: uploadConfig.token,
							key: uploadConfig.key
						},
						success: (uploadRes) => {
							console.log('上传响应:', uploadRes)
							
							if (uploadRes.statusCode === 200) {
								try {
									const data = JSON.parse(uploadRes.data)
									const fileUrl = `${uploadConfig.domain}/${uploadConfig.key}`
									
									// 更新上传状态
									file.uploadStatus = 'success'
									file.videoURL = fileUrl
									file.progress = 100
									
									// 构建缩略图URL (七牛云视频截帧)
									const thumbnailURL = `${fileUrl}?vframe/jpg/offset/1`
									
									// 生成转码后的视频URL - 只使用一种转码方式
									const transcodedURL = videoStyle ? `${fileUrl}${styleSeparator}${videoStyle}` : fileUrl;
									
									// 显示成功提示
									uni.showToast({
										title: '视频上传成功',
										icon: 'success',
										duration: 2000
									});
									
									resolve({
										type: 'video',
										videoURL: fileUrl,
										thumbnailURL: thumbnailURL,
										playURL: transcodedURL, // 使用单一转码方式
										duration: data.duration ? parseInt(data.duration) : file.duration,
										size: file.size,
										width: file.width,
										height: file.height,
										format: file.format || 'mp4'
									})
								} catch (e) {
									console.error('解析上传响应失败:', e)
									file.uploadStatus = 'error'
									
									uni.showToast({
										title: '解析响应失败',
										icon: 'none',
										duration: 2000
									});
									
									reject(new Error('解析上传响应失败'))
								}
							} else {
								console.error('上传失败状态码:', uploadRes.statusCode)
								file.uploadStatus = 'error'
								
								uni.showToast({
									title: `上传失败: ${uploadRes.statusCode}`,
									icon: 'none',
									duration: 2000
								});
								
								reject(new Error(`上传失败: ${uploadRes.statusCode}`))
							}
						},
						fail: (error) => {
							console.error('上传失败:', error)
							
							// 检查是否是域名错误
							if (error.errMsg && error.errMsg.includes('url not in domain list')) {
								uni.showModal({
									title: '上传域名未授权',
									content: '请在微信小程序管理后台添加 ' + uploadDomain + ' 到合法域名列表',
									showCancel: false
								});
								file.uploadStatus = 'error'
								reject(new Error(error.errMsg || '上传失败'))
								return;
							}
							
							// 检查是否是连接数超限错误
							if (error.errMsg && error.errMsg.includes('exceed max upload connection count')) {
								if (retryCount < maxRetries) {
									retryCount++;
									console.log(`连接数超限，第${retryCount}次重试上传视频...`);
									
									uni.showToast({
										title: `连接数超限，正在重试(${retryCount}/${maxRetries})`,
										icon: 'none',
										duration: 2000
									});
									
									// 延迟重试，给其他上传任务完成的时间
									setTimeout(() => {
										performUpload();
									}, 2000 * retryCount); // 递增延迟
									return;
								}
							}
							
							file.uploadStatus = 'error'
							
							uni.showToast({
								title: '上传失败，请重试',
								icon: 'none',
								duration: 2000
							});
							
							reject(new Error(error.errMsg || '上传失败'))
						}
					})
					
					// 监听上传进度
					uploadTask.onProgressUpdate((res) => {
						file.progress = res.progress
						
						// 更新上传速度和剩余时间估计
						updateProgress(res.progress, res.totalBytesWritten);
						
						updateTotalProgress()
					})
				} catch (e) {
					console.error('创建上传任务失败:', e);
					file.uploadStatus = 'error';
					
					uni.showToast({
						title: '创建上传任务失败',
						icon: 'none',
						duration: 2000
					});
					
					reject(new Error('创建上传任务失败: ' + e.message));
				}
			}
			
			// 开始上传
			performUpload();
		})
	} catch (e) {
		console.error('上传视频错误:', e)
		file.uploadStatus = 'error'
		
		uni.showToast({
			title: '上传失败: ' + e.message,
			icon: 'none',
			duration: 2000
		});
		
		throw new Error(`上传失败：${e.message}`)
	}
}

// 获取文件扩展名
const getFileExtension = (filePath) => {
	const lastDotIndex = filePath.lastIndexOf('.')
	if (lastDotIndex > 0) {
		return filePath.substring(lastDotIndex + 1).toLowerCase()
	}
	return ''
}

// 更新总进度
const updateTotalProgress = () => {
	let totalFiles = imageList.value.length + (videoData.value ? 1 : 0)
	let totalProgressValue = 0
	
	// 计算图片进度
	imageList.value.forEach(file => {
		totalProgressValue += file.progress || 0
	})
	
	// 计算视频进度
	if (videoData.value) {
		totalProgressValue += videoData.value.progress || 0
	}
	
	totalProgress.value = totalFiles > 0 ? Math.floor(totalProgressValue / totalFiles) : 0
}

// 发布内容
const publishContent = async () => {
	try {
		// 防止重复提交
		if (isPublishing.value) {
			console.log('发布请求正在处理中，请勿重复提交')
			return
		}
		
		// 设置发布状态
		isPublishing.value = true
		
		// 检查用户是否登录
		if (!checkUserLogin()) {
			isPublishing.value = false
			return
		}
		
		// 验证分类
		if (!selectedCategory.value) {
			uni.showToast({
				title: '请选择分类',
				icon: 'none'
			})
			isPublishing.value = false
			return
		}
		
		// 验证文本内容 - 强制要求必须有文字内容
		if (!content.value.trim()) {
			uni.showToast({
				title: '请输入文字内容',
				icon: 'none',
				duration: 2000
			})
			isPublishing.value = false
			return
		}
		
		// 检查文字内容长度是否太短
		if (content.value.trim().length < 5) {
			uni.showToast({
				title: '文字内容需大于5个字符',
				icon: 'none',
				duration: 2000
			})
			isPublishing.value = false
			return
		}
		
		// 检查是否有正在上传的媒体文件
		const hasUploadingMedia = imageList.value.some(item => item.uploadStatus === 'uploading') || 
								(videoData.value && videoData.value.uploadStatus === 'uploading')
		
		if (hasUploadingMedia) {
			// 询问用户是否等待上传完成
			uni.showModal({
				title: '媒体文件正在上传',
				content: '有媒体文件正在上传中，是否等待上传完成后再发布？',
				confirmText: '等待上传',
				cancelText: '仅发布文字',
				success: (res) => {
					if (res.confirm) {
						// 用户选择等待上传
						uni.showToast({
							title: '请等待上传完成',
							icon: 'none',
							duration: 2000
						});
						isPublishing.value = false;
					} else {
						// 用户选择仅发布文字内容
						continuePublishWithoutMedia();
					}
				}
			});
			return;
		}
		
		// 正常发布全部内容
		await publishWithAllMedia();
		
	} catch (e) {
		console.error('发布失败:', e)
		uni.hideLoading()
		uni.showToast({
			title: e.message || '发布失败',
			icon: 'none'
		})
		isUploading.value = false
		isPublishing.value = false
	}
}

// 仅发布文字内容，忽略未完成上传的媒体
const continuePublishWithoutMedia = async () => {
	try {
		uni.showLoading({
			title: '正在发布...',
			mask: true
		});
		
		// 构建发布数据 - 只包含文字内容
		const paramsArticle = {
			user_id: userStore.userInfo.uid,
			content: content.value.trim(),
			cate_id: selectedCategory.value,
			cate_name: categoryList.value[cateIndex.value]?.cate_name || '',
			address: locationInfo.value?.address || '',
			district: locationInfo.value?.district || '',
			user_nickName: userStore.userInfo.nickName,
			user_avatarUrl: userStore.userInfo.avatarUrl,
			user_mobile: userStore.userInfo.mobile,
			state: 1
		};
		
		// 只添加已完成上传的媒体
		const uploadedImages = imageList.value
			.filter(item => item.uploadStatus === 'success' && !item.loadError)
			.map(item => ({
				type: 'image',
				url: item.fileURL,
				thumbnailURL: item.thumbnailURL,
				compressedURL: item.compressedURL
			}));
		
		if (uploadedImages.length > 0) {
			paramsArticle.mediaType = 'image';
			paramsArticle.images = uploadedImages;
		}
		
		// 只添加已完成上传的视频
		if (videoData.value && videoData.value.uploadStatus === 'success') {
			paramsArticle.mediaType = 'video';
			paramsArticle.video = {
				type: 'video',
				videoURL: videoData.value.videoURL,
				thumbnailURL: videoData.value.thumbnailURL,
				playURL: videoData.value.playURL || videoData.value.videoURL,
				duration: videoData.value.duration,
				size: videoData.value.size,
				width: videoData.value.width,
				height: videoData.value.height,
				format: videoData.value.format || 'mp4'
			};
		}
		
		console.log('发布数据(仅已上传完成的媒体):', paramsArticle);
		
		// 调用文章发布API
		const res = await articleApi.addArticle(paramsArticle);
		
		handlePublishSuccess(res);
	} catch (error) {
		console.error('发布失败:', error);
		uni.hideLoading();
		uni.showToast({
			title: error.message || '发布失败',
			icon: 'none'
		});
		isUploading.value = false;
		isPublishing.value = false;
	}
};

// 发布包含所有媒体的内容
const publishWithAllMedia = async () => {
	try {
		// 开始发布
		isUploading.value = true;
		
		uni.showLoading({
			title: '正在发布...',
			mask: true
		});
		
		// 收集已上传成功的图片
		const uploadedImages = imageList.value
			.filter(item => item.uploadStatus === 'success' && !item.loadError)
			.map(item => ({
				type: 'image',
				url: item.fileURL,
				thumbnailURL: item.thumbnailURL,
				compressedURL: item.compressedURL
			}));
		
		// 收集已上传成功的视频
		let uploadedVideo = null;
		if (videoData.value && videoData.value.uploadStatus === 'success') {
			uploadedVideo = {
				type: 'video',
				videoURL: videoData.value.videoURL,
				thumbnailURL: videoData.value.thumbnailURL,
				playURL: videoData.value.playURL || videoData.value.videoURL,
				duration: videoData.value.duration,
				size: videoData.value.size,
				width: videoData.value.width,
				height: videoData.value.height,
				format: videoData.value.format || 'mp4'
			};
		}
		
		// 构建发布数据
		const paramsArticle = {
			user_id: userStore.userInfo.uid,
			content: content.value.trim(),
			cate_id: selectedCategory.value,
			cate_name: categoryList.value[cateIndex.value]?.cate_name || '',
			address: locationInfo.value?.address || '',
			district: locationInfo.value?.district || '',
			user_nickName: userStore.userInfo.nickName,
			user_avatarUrl: userStore.userInfo.avatarUrl,
			user_mobile: userStore.userInfo.mobile,
			state: 1
		};
		
		// 添加媒体数据
		if (uploadedImages.length > 0) {
			paramsArticle.mediaType = 'image';
			paramsArticle.images = uploadedImages;
		}
		
		if (uploadedVideo) {
			paramsArticle.mediaType = 'video';
			paramsArticle.video = uploadedVideo;
		}
		
		console.log('发布数据:', paramsArticle);
		
		// 调用文章发布API
		const res = await articleApi.addArticle(paramsArticle);
		
		handlePublishSuccess(res);
	} catch (error) {
		console.error('发布失败:', error);
		uni.hideLoading();
		uni.showToast({
			title: error.message || '发布失败',
			icon: 'none'
		});
		isUploading.value = false;
		isPublishing.value = false;
	}
};

// 处理发布成功后的逻辑
const handlePublishSuccess = (res) => {
	if (res.id) {
		uni.hideLoading();
		uni.showToast({
			title: '发布成功',
			icon: 'success'
		});
		
		// 清空表单
		content.value = '';
		imageList.value = [];
		videoData.value = null;
		
		// 保存新发布的文章ID
		publishedArticleId.value = res.id;
		
		// 延迟执行跳转，确保Toast显示完成
		setTimeout(() => {
			// 触发全局的刷新事件，传递新文章ID
			uni.$emit('articlePublished', publishedArticleId.value);
			
			// 检查当前页面栈
			const pages = getCurrentPages();
			console.log('当前页面栈:', pages);
			
			// 判断是否需要返回到首页
			if (pages.length > 1) {
				// 如果页面栈中有多个页面，使用返回
				uni.navigateBack({
					delta: 1,
					success: () => {
						console.log('成功返回上一页');
						// 触发一次性刷新事件
						uni.$emit('refreshIndexOnce', publishedArticleId.value);
					},
					fail: (err) => {
						console.error('返回上一页失败:', err);
						// 如果返回失败，尝试直接跳转到首页
						navigateToIndex(publishedArticleId.value);
					}
				});
			} else {
				// 如果只有当前页面，直接跳转到首页
				navigateToIndex(publishedArticleId.value);
			}
		}, 1500);
	} else {
		throw new Error(res.message || '发布失败');
	}
	
	isUploading.value = false;
	isPublishing.value = false;
};

// 跳转到首页的辅助函数
const navigateToIndex = (articleId) => {
	console.log('准备跳转到首页，文章ID:', articleId)
	
	// 尝试使用switchTab跳转到首页
	uni.switchTab({
		url: '/pages/index/index',
		success: () => {
			console.log('成功跳转到首页')
			// 延迟触发刷新事件，确保首页已完全加载
			setTimeout(() => {
				uni.$emit('refreshIndexOnce', articleId)
			}, 500)
		},
		fail: (err) => {
			console.error('跳转到首页失败:', err)
			// 如果switchTab失败，尝试使用reLaunch
			uni.reLaunch({
				url: '/pages/index/index',
				success: () => {
					console.log('使用reLaunch成功跳转到首页')
					// 延迟触发刷新事件
					setTimeout(() => {
						uni.$emit('refreshIndexOnce', articleId)
					}, 500)
				},
				fail: (relaunchErr) => {
					console.error('所有导航方法都失败了:', relaunchErr)
					uni.showToast({
						title: '跳转首页失败，请手动返回',
						icon: 'none',
						duration: 3000
					})
				}
			})
		}
	})
}

</script>

<style>
.publish-container {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background-color: #f5f7fa;
	position: relative;
}

/* 内容区域样式 */
.content-container {
	flex: 1;
	padding: 24rpx;
	padding-bottom: calc(140rpx + constant(safe-area-inset-bottom)); /* iOS 11.2以下 */
	padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); /* iOS 11.2及以上 */
	display: flex;
	flex-direction: column;
}

/* 分类选择样式 */
.category-section {
	margin-bottom: 32rpx;
	padding: 24rpx;
	background-color: #fff;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

/* 分类标题和位置信息的容器 */
.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 24rpx;
	flex-wrap: wrap;
}

.section-title {
	font-size: 32rpx;
	color: #333;
	font-weight: 600;
	padding-left: 16rpx;
	position: relative;
	margin-right: 16rpx;
}

.section-title::before {
	content: '';
	position: absolute;
	left: 0;
	top: 50%;
	transform: translateY(-50%);
	width: 6rpx;
	height: 28rpx;
	background: linear-gradient(to bottom, #2196F3, #1976D2);
	border-radius: 3rpx;
}

/* 内联位置信息样式 */
.location-info-inline {
	display: flex;
	align-items: center;
	font-size: 22rpx;
	color: #999;
	max-width: 60%;
	background-color: #f8f8f8;
	padding: 4rpx 10rpx;
	border-radius: 20rpx;
}

.location-info-inline text {
	margin-left: 4rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: calc(100% - 20rpx);
}

.category-grid {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 16rpx;
	padding: 10rpx;
}

.category-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 16rpx 8rpx;
	border-radius: 12rpx;
	background-color: #fff;
	transition: all 0.3s;
	min-height: 150rpx;
	position: relative;
	overflow: hidden;
	cursor: pointer;
	border: 2rpx solid transparent;
}

.category-item:active {
	transform: scale(0.98);
}

.category-item.active {
	background-color: #fff;
	border: 2rpx solid #2196F3;
	box-shadow: 0 2rpx 8rpx rgba(33, 150, 243, 0.1);
}

.category-icon {
	width: 80rpx;
	height: 80rpx;
	margin-bottom: 12rpx;
	object-fit: contain;
	border-radius: 10rpx;
	transition: all 0.3s;
}

.category-item.active .category-icon {
	transform: scale(1.02);
}

.category-name {
	font-size: 24rpx;
	color: #333;
	text-align: center;
	width: 100%;
	line-height: 1.3;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
}

.category-item.active .category-name {
	color: #2196F3;
	font-weight: 500;
}

/* 合并文本、媒体和位置的整体容器 */
.content-media-section {
	position: relative;
	margin-bottom: 32rpx;
	padding: 24rpx;
	background-color: #fff;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

/* 文本输入区域样式 */
.textarea-container {
	position: relative;
	margin-bottom: 24rpx;
	width: 100%;
}

.content-textarea {
	width: 100%;
	min-height: 120rpx;
	font-size: 30rpx;
	line-height: 1.6;
	padding: 16rpx;
	padding-bottom: 40rpx;
	background-color: #f8f8f8;
	border-radius: 12rpx;
	box-sizing: border-box;
	white-space: pre-wrap;
	word-break: break-word;
}

.word-count {
	position: absolute;
	bottom: 8rpx;
	right: 16rpx;
	font-size: 24rpx;
	color: #999;
	background-color: rgba(255, 255, 255, 0.7);
	padding: 2rpx 10rpx;
	border-radius: 20rpx;
	z-index: 1;
}

/* 媒体区域样式 */
.media-area {
	margin-top: 16rpx;
	margin-bottom: 16rpx;
	border-top: 1rpx solid #f0f0f0;
	padding-top: 16rpx;
}

.media-tabs {
	display: flex;
	border-bottom: 1rpx solid #eee;
	margin-bottom: 0;
	padding: 0;
}

.tab-item {
	display: flex;
	align-items: center;
	padding: 16rpx 32rpx;
	margin-right: 24rpx;
	border-bottom: 3rpx solid transparent;
	position: relative;
	transition: all 0.3s;
}

.tab-item.active {
	border-bottom-color: #399bfe;
}

.tab-text {
	margin-left: 8rpx;
	font-size: 28rpx;
	color: #333;
}

.active-text {
	color: #399bfe;
}

.media-content {
	padding: 24rpx 0;
	transition: all 0.3s ease;
}

/* 底部安全区域占位 */
.safe-area-placeholder {
	height: 0;
	width: 100%;
	margin-top: auto;
}

/* 底部发布按钮样式 */
.publish-btn-container {
	padding: 24rpx 0;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: #fff;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 10;
	width: 100%;
	/* 添加安全区域适配 */
	padding-bottom: constant(safe-area-inset-bottom); /* iOS 11.2以下 */
	padding-bottom: env(safe-area-inset-bottom); /* iOS 11.2及以上 */
}

.publish-btn {
	width: 90%;
	height: 88rpx;
	line-height: 88rpx;
	background: linear-gradient(to right, #399bfe, #3178f2);
	color: #fff;
	font-size: 32rpx;
	font-weight: 500;
	border-radius: 44rpx;
	box-shadow: 0 4rpx 16rpx rgba(33, 150, 243, 0.3);
	transition: all 0.3s;
	text-align: center;
}

.publish-btn:active {
	transform: scale(0.98);
	opacity: 0.9;
	box-shadow: 0 2rpx 8rpx rgba(33, 150, 243, 0.2);
}

/* 保留其他必要的样式 */
.image-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.image-item {
	width: calc((100% - 32rpx) / 3);
	height: 200rpx;
	position: relative;
	border-radius: 8rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.image-item image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.delete-btn {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 40rpx;
	height: 40rpx;
	background-color: rgba(0, 0, 0, 0.5);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2;
}

.progress-overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	z-index: 1;
}

.progress-text {
	color: #fff;
	font-size: 24rpx;
	margin-bottom: 10rpx;
}

.progress-bar {
	width: 80%;
	height: 6rpx;
	background-color: rgba(255, 255, 255, 0.3);
	border-radius: 3rpx;
	overflow: hidden;
}

.progress {
	height: 100%;
	background-color: #fff;
}

.add-media-btn {
	width: calc((100% - 32rpx) / 3);
	height: 200rpx;
	background-color: #f8f8f8;
	border: 1rpx dashed #ddd;
	border-radius: 8rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.btn-text {
	font-size: 24rpx;
	color: #999;
	margin-top: 10rpx;
}

.video-container {
	width: 100%;
	margin-bottom: 16rpx;
}

.video-item {
	width: 100%;
	height: 400rpx;
	position: relative;
	border-radius: 8rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.video-item image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.video-icon {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 80rpx;
	height: 80rpx;
	background-color: rgba(0, 0, 0, 0.5);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.video-info {
	position: absolute;
	bottom: 16rpx;
	right: 16rpx;
	display: flex;
	gap: 12rpx;
	padding: 8rpx 16rpx;
	background-color: rgba(0, 0, 0, 0.6);
	border-radius: 8rpx;
}

.video-info text {
	color: #fff;
	font-size: 24rpx;
}

.video-upload-btn {
	width: 100%;
	height: 300rpx;
	background-color: #f8f8f8;
	border: 1rpx dashed #ddd;
	border-radius: 8rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.upload-text {
	font-size: 28rpx;
	color: #666;
	margin-top: 16rpx;
	font-weight: 500;
}

.upload-subtext {
	font-size: 24rpx;
	color: #999;
	margin-top: 8rpx;
}

.tip-text {
	display: block;
	margin-top: 16rpx;
	font-size: 24rpx;
	color: #999;
	text-align: center;
}

.loading-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40rpx 0;
	color: #999;
}

.loading-placeholder text {
	margin-top: 16rpx;
	font-size: 28rpx;
}

.category-icon-fallback {
	width: 80rpx;
	height: 80rpx;
	margin-bottom: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #f5f5f5;
	border-radius: 10rpx;
	transition: all 0.3s;
}

.category-icon-fallback.active {
	background-color: #E3F2FD;
	transform: scale(1.05);
}
</style>