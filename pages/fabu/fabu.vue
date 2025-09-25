<script>
export default {
	name: 'Fabu'
}
</script>

<script setup>
	import { ref, onMounted, nextTick, computed } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	import { onLoad } from '@dcloudio/uni-app'  // 添加这一行
	import { fixImageUrl, getDefaultImage, getCurrentDomain } from '@/utils/domainConfig.js'  // 添加域名配置

	// Store & API
	const userStore = useUserInfoStore( )
	const articleApi = uniCloud.importObject( 'articleWx', { customUI: true })
	const extStorageCo = uniCloud.importObject('fabuWx', { customUI: true })
	// 页面初始数据
	const articleData = ref( null )
	const categoryList = ref( [ ] )
	const cateIndex = ref( 0 )
	const imageList = ref([])
	const uploadingCount = ref(0)
	const locationInfo = ref( null )
	const content = ref( '' )
	const selectedCategory = ref( null )
	const videoInfo = ref(null)
	const textareaFocus = ref(false)
	const contentTextarea = ref(null)
	const payAmount = ref(0)
	const videoLink = ref('')
	const inputHeight = ref(170)
	const selectionStart = ref(0)
	const selectionEnd = ref(0)
	const textareaElement = ref(null) // 记录DOM元素
	const isInSelectionMode = ref(false) // 文本选择模式状态
	// 添加图片预览相关变量
	const showImagePreview = ref(false)
	const currentPreviewImage = ref('')
	const previewImageIndex = ref(0)
	
	// 域名状态显示相关变量
	const showDomainInfo = ref(false)
	const domainStatus = ref({
		currentDomain: '',
		imageCount: 0,
		fixedCount: 0
	})

	// 添加精确位置信息变量
	const preciseLocationInfo = ref({
		latitude: null,
		longitude: null,
		accuracy: null,
		altitude: null,
		speed: null,
		timestamp: null,
		province: '',
		city: '',
		district: '',
		street: '',
		streetNumber: '',
		poiName: ''
	})

	// 计算选择的字符数
	const selectedCharsCount = computed(() => {
		return selectionEnd.value - selectionStart.value
	})

	// 图标生成相关
	const iconCustomizing = ref(false)
	const textOffsetX = ref(0)  // 文字X轴偏移量
	const textOffsetY = ref(0)  // 文字Y轴偏移量
	const textSize = ref(100)   // 文字大小百分比
	const previewImageUrl = ref('') // 预览图URL

	// 当前正在编辑的分类
	let currentEditingCategory = null;

	// 添加以下常用文本功能相关的变量
	const commonPhrases = ref([
		'欢迎咨询',
		'全新产品',
		'限时优惠',
		'诚信交易',
		'支持自提'
	])

	// 添加表情符号相关的变量
	const showEmojiPanel = ref(false)
	const emojiGroups = ref([
		{
			name: '常用',
			emojis: ['😊', '👍', '❤️', '👋', '🙏', '🔥', '💯', '👏', '🎉', '✨', '🌹', '💪', '🤝']
		},
		{
			name: '表情',
			emojis: ['😀', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍']
		},
		{
			name: '手势',
			emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤙', '🤛', '🤜', '👊', '✊', '🤝', '👏']
		}
	])
	const currentEmojiGroupIndex = ref(0)

	// 添加快捷输入常用词功能
	// 删除以下内容
	// const quickPhrases = ref([
	//   '欢迎咨询',
	//   '有现货',
	//   '支持自提',
	//   '全新正品',
	//   '包邮到家'
	// ])
	// const showQuickPhrases = ref(false)
	// const toggleQuickPhrases = () => {...}
	// const insertQuickPhrase = (phrase) => {...}

	// 显示快捷短语面板的状态
	// 删除以下内容
	// const showQuickPhrases = ref(false)

	// 切换快捷短语面板
	// 删除以下内容
	// const toggleQuickPhrases = () => {...}

	// 插入快捷短语
	// 删除以下内容
	// const insertQuickPhrase = (phrase) => {...}

	// 获取位置和分类
	const getLocaAndCate = async ( ) => {
		try {
			// 显示加载提示
			uni.showLoading({
				title: '加载中...',
				mask: false
			})
			
			// 获取高精度位置信息
			let locationRes = await uni.getLocation({
				type: 'gcj02',
				highAccuracyExpireTime: 10000, // 10秒超时
				isHighAccuracy: true, // 启用高精度定位
				altitude: true // 获取高度信息
			}).catch(err => {
				console.error('获取位置失败:', err)
				// 如果获取位置失败，使用默认坐标
				return { longitude: 116.397428, latitude: 39.90923 }
			})
			
			// 保存精确位置信息
			preciseLocationInfo.value = {
				latitude: locationRes.latitude,
				longitude: locationRes.longitude,
				accuracy: locationRes.accuracy || 0,
				altitude: locationRes.altitude || 0,
				speed: locationRes.speed || 0,
				timestamp: Date.now(),
				province: '',
				city: '',
				district: '',
				street: '',
				streetNumber: '',
				poiName: ''
			}
			
			// 调用API获取分类和地址信息
			const res = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`)
			console.log('获取分类和地址信息成功:', res)
			
			// 设置位置信息
			locationInfo.value = {
				address: res.address || '未知地址',
				district: res.district || '未知区域'
			}
			
			// 解析详细地址信息
			if (res.address && res.address !== '未知地址') {
				parseDetailedAddress(res.address, res.district)
			}
			
			// 如果获取到了区域信息，则尝试根据区域创建或获取分类
			if (res.district && res.district !== '未知区域') {
				try {
					// 调用云函数创建或获取基于区域的分类
					const categoryResult = await extStorageCo.processCategoryFromDistrict(res.district)
					console.log('区域分类处理结果:', categoryResult)
					
					// 如果成功创建或获取了基于位置的分类，重新获取分类列表
					if (categoryResult.code === 0 && categoryResult.data) {
						// 重新获取最新的分类列表
						const updatedCateRes = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`)
						if (updatedCateRes.cateList && updatedCateRes.cateList.length > 0) {
							res.cateList = updatedCateRes.cateList
						}
					}
				} catch (categoryError) {
					console.error('处理区域分类失败:', categoryError)
					// 继续使用原有分类列表，不中断流程
				}
			}
			
			// 设置分类列表 - 只保留当前位置的分类
			if (res.cateList && res.cateList.length > 0) {
				// 筛选出当前区域的位置分类
				const locationBasedCategories = res.cateList.filter(cate => 
					cate.is_location_based && cate.location_district === res.district
				)
				
				// 如果有本地区分类，则只显示它们
				if (locationBasedCategories.length > 0) {
					categoryList.value = locationBasedCategories.map(cate => {
						return {
							...cate,
							icon: cate.cate_img || getDefaultCategoryIcon(cate.cate_name)
						}
					})
					
					// 选择第一个位置分类
					selectedCategory.value = categoryList.value[0]._id
					cateIndex.value = 0
					
					// 自动为位置分类生成图标（如果需要）
					const firstCategory = categoryList.value[0]
					if (!firstCategory.cate_img || firstCategory.cate_img.includes('default')) {
						try {
							console.log('为位置分类自动生成图标:', firstCategory.cate_name)
							const iconResult = await generateCategoryIcon(firstCategory.cate_name, firstCategory._id)
							if (iconResult && iconResult.iconURL) {
								// 更新UI中的图标
								firstCategory.icon = iconResult.iconURL
								// 确保分类列表中的图标也被更新
								categoryList.value[0].icon = iconResult.iconURL
								categoryList.value[0].cate_img = iconResult.iconURL
							}
						} catch (iconError) {
							console.error('自动生成位置分类图标失败:', iconError)
						}
					}
				} else {
					// 如果没有位置分类，尝试创建一个
					try {
						if (res.district && res.district !== '未知区域') {
							// 创建当前位置的分类
							const createResult = await extStorageCo.createLocationCategory({
								district: res.district,
								address: res.address
							})
							
							if (createResult && createResult.categoryId) {
								// 创建成功，添加到分类列表
								const newCategory = {
									_id: createResult.categoryId,
									cate_name: res.district,
									is_location_based: true,
									location_district: res.district,
									icon: getDefaultCategoryIcon(res.district)
								}
								
								categoryList.value = [newCategory]
								selectedCategory.value = newCategory._id
								cateIndex.value = 0
								
								// 为新分类生成图标
								handleGenerateIcon(newCategory)
							} else {
								// 创建失败，使用默认分类
								setDefaultCategory()
							}
						} else {
							// 没有位置信息，使用默认分类
							setDefaultCategory()
						}
					} catch (e) {
						console.error('创建位置分类失败:', e)
						setDefaultCategory()
					}
				}
			} else {
				console.warn('未获取到分类列表或分类列表为空')
				setDefaultCategory()
			}
		} catch (error) {
			console.error('获取位置和分类失败:', error)
			uni.showToast({
				title: '获取分类失败，请重试',
				icon: 'none',
				duration: 2000
			})
			
			// 设置默认值
			locationInfo.value = {
				address: '未知地址',
				district: '未知区域'
			}
			setDefaultCategory()
		} finally {
			uni.hideLoading()
		}
	}
	
	// 设置默认分类的辅助函数
	const setDefaultCategory = () => {
		categoryList.value = [{ 
			_id: 'default', 
			cate_name: '默认分类',
			icon: '/static/images/category/default.png'
		}]
		selectedCategory.value = 'default'
		cateIndex.value = 0
	}

	// 解析详细地址信息
	const parseDetailedAddress = (address, district) => {
		try {
			// 使用正则表达式解析地址
			const addressParts = {
				province: '',
				city: '',
				district: district || '',
				street: '',
				streetNumber: '',
				poiName: ''
			}
			
			// 提取省份信息
			const provinceMatch = address.match(/(中国)?(.+?省|中国.+?自治区|中国.+?市)/)
			if (provinceMatch) {
				addressParts.province = provinceMatch[2] || provinceMatch[1]
			}
			
			// 提取城市信息
			const cityMatch = address.match(/(省|市|自治区)(.+?市)/)
			if (cityMatch) {
				addressParts.city = cityMatch[2]
			}
			
			// 提取街道信息
			const streetMatch = address.match(/(区|县)(.+?)(街道|镇|乡)/)
			if (streetMatch) {
				addressParts.street = streetMatch[2] + streetMatch[3]
			}
			
			// 提取POI信息（具体地名）
			const poiMatch = address.match(/(街道|镇|乡)(.+)/)
			if (poiMatch) {
				addressParts.poiName = poiMatch[2].trim()
			}
			
			// 更新精确位置信息
			preciseLocationInfo.value = {
				...preciseLocationInfo.value,
				...addressParts
			}
			
			console.log('解析的详细地址信息:', addressParts)
		} catch (error) {
			console.error('解析地址信息失败:', error)
		}
	}

	// 重新定位
	const relocate = async () => {
		uni.showToast({
			title: '正在重新定位...',
			icon: 'loading'
		})
		
		try {
			await getLocaAndCate()
			uni.showToast({
				title: '定位成功',
				icon: 'success'
			})
		} catch (error) {
			uni.showToast({
				title: '定位失败',
				icon: 'error'
			})
		}
	}

	// 简化地址显示
	const getSimplifiedAddress = (address) => {
		if (!address || address === '未知地址') {
			return ''
		}
		
		// 移除省份信息，保留主要地名
		let simplified = address
		
		// 移除省份前缀
		simplified = simplified.replace(/^.*?省/, '')
		simplified = simplified.replace(/^.*?市/, '')
		simplified = simplified.replace(/^.*?自治区/, '')
		
		// 如果地址过长，只保留前部分
		if (simplified.length > 20) {
			// 找到适合的截断点（按照行政区划或地标截断）
			const breakPoints = ['县', '区', '镇', '街道', '乡']
			for (const breakPoint of breakPoints) {
				const index = simplified.indexOf(breakPoint)
				if (index !== -1 && index < 15) {
					simplified = simplified.substring(0, index + breakPoint.length)
					break
				}
			}
			
			// 如果仍然过长，直接截断
			if (simplified.length > 20) {
				simplified = simplified.substring(0, 18) + '...'
			}
		}
		
		return simplified
	}

	// 根据分类名称获取默认图标
	const getDefaultCategoryIcon = (cateName) => {
		// 定义常见分类的默认图标映射
		const iconMap = {
			'宠物用品': '/static/images/category/pet.png',
			'水杯餐具': '/static/images/category/tableware.png',
			'日用百货': '/static/images/category/daily.png',
			'清洁工具': '/static/images/category/cleaning.png',
			'收纳整理': '/static/images/category/storage.png',
			'文具教具': '/static/images/category/stationery.png',
			'畜牧农资': '/static/images/category/agriculture.png',
			'纸品湿巾': '/static/images/category/tissue.png',
			'个人护理': '/static/images/category/personal.png',
			'厨房烹饪': '/static/images/category/kitchen.png',
			'节庆礼品': '/static/images/category/gift.png',
			'图书乐器': '/static/images/category/book.png',
			'家庭清洁': '/static/images/category/home.png',
			'花卉园艺': '/static/images/category/garden.png',
			'锅具水壶': '/static/images/category/pot.png'
		}
		
		// 返回对应的图标，如果没有匹配项则返回默认图标
		return iconMap[cateName] || getDefaultImage('default') // 使用域名配置中的默认图片路径
	}

	// 修改图片选择和上传方法
	const chooseAndUploadImage = async () => {
		try {
			// 移除图片数量限制检查
			// 选择图片，设置 sizeType 只包含 original 来选择原图
			const chooseRes = await uni.chooseImage({
				count: 9, // 保留此参数但不再做前置检查
				sizeType: ['original'], // 只使用原图
				sourceType: ['album', 'camera'],
				mediaType: ['image'] // 只选择图片，隐藏视频
			})

			// 上传所有选中的图片
			const uploadPromises = chooseRes.tempFilePaths.map(async (filePath, index) => {
				// 创建临时图片对象并添加到预览列表
				const newIndex = imageList.value.length
				imageList.value.push({
					fileURL: '',
					thumbnailURL: filePath,
					progress: 0
				})
				
				try {
					// 获取图片信息（宽高）用于水印大小调整
					const imageInfo = await uni.getImageInfo({
						src: filePath
					}).catch(err => {
						console.error('获取图片尺寸信息失败:', err)
						return { width: 0, height: 0 } // 失败时使用默认值
					})
					
					// 获取上传配置
					const uploadOptions = await extStorageCo.getUploadFileOptions({
						cloudPath: `images/${userStore.userInfo.uid}/${Date.now()}-${newIndex}.jpg`,
						fileType: 'image',
						isOriginal: true,
						userNickName: userStore.userInfo.nickName,
						imageWidth: imageInfo.width, // 传递图片宽度
						imageHeight: imageInfo.height // 传递图片高度
					})
					
					// 创建备用进度定时器（如果onProgressUpdate不工作）
					let fallbackTimer = null;
					let fallbackActive = true;
					
					// 启动备用进度动画 - 仅当实际进度回调未工作时使用
					fallbackTimer = setTimeout(function setupFallback() {
						if (!fallbackActive) return;
						
						// 获取当前进度
						const currentProgress = imageList.value[newIndex]?.progress || 0;
						if (currentProgress >= 98) {
							fallbackActive = false;
							return;
						}
						
						// 计算下一个进度值 - 缓慢上升，避免超过实际进度过多
						let nextProgress;
						if (currentProgress < 30) {
							nextProgress = currentProgress + 5;
						} else if (currentProgress < 70) {
							nextProgress = currentProgress + 3;
						} else if (currentProgress < 90) {
							nextProgress = currentProgress + 1;
						} else {
							nextProgress = currentProgress + 0.5;
						}
						
						// 更新进度，最大98%
						imageList.value[newIndex].progress = Math.min(98, nextProgress);
						
						// 继续下一个更新
						fallbackTimer = setTimeout(setupFallback, 800);
					}, 500);
					
					// 执行上传
					return new Promise((resolve, reject) => {
						const uploadTask = uni.uploadFile({
							...uploadOptions.uploadFileOptions,
							filePath: filePath,
							success: () => {
								// 取消备用定时器
								fallbackActive = false;
								clearTimeout(fallbackTimer);
								
								// 更新上传成功后的文件信息，使用域名修复函数
								imageList.value[newIndex].progress = 100;
								imageList.value[newIndex].fileURL = fixImageUrl(uploadOptions.fileURL);
								imageList.value[newIndex].compressedURL = fixImageUrl(uploadOptions.compressedURL);
								imageList.value[newIndex].thumbnailURL = fixImageUrl(uploadOptions.thumbnailURL);
								resolve(true);
							},
							fail: (err) => {
								// 取消备用定时器
								fallbackActive = false;
								clearTimeout(fallbackTimer);
								
								console.error("上传失败", err);
								imageList.value.splice(newIndex, 1);
								reject(err);
							}
						});
						
						// 尝试使用实际上传进度更新（如果平台支持）
						try {
							uploadTask.onProgressUpdate((res) => {
								if (res && typeof res.progress === 'number') {
									// 收到实际进度，停用备用进度
									fallbackActive = false;
									clearTimeout(fallbackTimer);
									
									// 更新实际进度，最大99%（保留1%给服务器处理阶段）
									const actualProgress = Math.min(99, res.progress);
									imageList.value[newIndex].progress = actualProgress;
								}
							});
						} catch (progressErr) {
							console.log('进度更新回调不可用，使用备用进度显示', progressErr);
							// 继续使用备用进度定时器
						}
					});
				} catch (err) {
					// 处理单个图片上传错误
					imageList.value.splice(newIndex, 1);
					console.error('上传图片错误:', err);
					return Promise.reject(err);
				}
			});
			
			// 等待所有上传完成
			await Promise.all(uploadPromises);
		} catch (err) {
			// 仅在出错时显示提示
			uni.showToast({
				title: '上传失败',
				icon: 'none'
			});
			console.error('图片上传过程错误:', err);
		}
	}

	// 删除图片方法
	const deleteImage = (index) => {
		imageList.value.splice(index, 1)
	}

	// 修改视频选择方法，添加自动保存功能
	const handleVideoLinkInput = (e) => {
	  // 在输入时自动验证并保存链接
	  const currentLink = videoLink.value.trim();
	  
	  // 如果链接为空，则清空视频信息
	  if (!currentLink) {
	    videoInfo.value = null;
	    return;
	  }
	  
	  // 简单验证链接格式，但不显示错误提示
	  const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/;
	  if (!urlPattern.test(currentLink)) {
	    return; // 不符合链接格式，不保存
	  }
	  
	  // 设置视频链接
	  videoInfo.value = currentLink;
	  
	  // 提供轻微的反馈（可选）
	  uni.vibrateShort && uni.vibrateShort({ type: 'light' });
	}

	// 添加视频链接
	const addVideoLink = () => {
		if (!validateVideoLink()) return
		
		// 如果已有视频，不允许再次添加
		if (videoInfo.value) {
			uni.showToast({
				title: '只能添加一个视频',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		// 设置视频链接
		videoInfo.value = videoLink.value.trim()
		
		// 清空输入框
		videoLink.value = ''
		
		uni.showToast({
			title: '视频链接已添加',
			icon: 'success',
			duration: 1500
		})
	}

	// 添加删除视频的方法
	const deleteVideo = () => {
		videoInfo.value = null
	}

	// 添加编辑模式相关变量
	const isEditMode = ref(false)
	const editArticleId = ref('')

	// 添加onLoad生命周期
	onLoad((options) => {
		console.log('页面加载参数:', options)
		// 检查是否是编辑模式
		if (options.mode === 'edit' && options.article_id) {
			isEditMode.value = true
			editArticleId.value = options.article_id
			// 先获取分类，再加载文章数据
			getLocaAndCate().then(() => {
				loadArticleData()
			}).catch(err => {
				console.error('获取分类失败:', err)
				uni.showToast({
					title: '获取分类失败',
					icon: 'none'
				})
			})
		} else {
			// 非编辑模式，只获取分类
			getLocaAndCate().catch(err => {
				console.error('获取分类失败:', err)
				uni.showToast({
					title: '获取分类失败',
					icon: 'none'
				})
			})
		}
	})

	// 加载文章数据
	const loadArticleData = async () => {
		try {
			uni.showLoading({
				title: '加载中...',
				mask: true
			})
			
			const res = await articleApi.getArticleDetal(editArticleId.value)
			
			if (!res || !res.articleRes || !res.articleRes.data || !res.articleRes.data[0]) {
				throw new Error('获取文章数据失败')
			}
			
			const articleData = res.articleRes.data[0]
			
			// 设置文章内容
			content.value = articleData.content || ''
			
			// 设置分类
			if (articleData.cate_id) {
				selectedCategory.value = articleData.cate_id
				const categoryIndex = categoryList.value.findIndex(cate => cate._id === articleData.cate_id)
				if (categoryIndex !== -1) {
					cateIndex.value = categoryIndex
				}
			}
			
			// 设置图片列表，使用域名修复函数
			if (articleData.images && articleData.images.length > 0) {
				imageList.value = articleData.images.map(img => ({
					fileURL: fixImageUrl(img.url || img),
					thumbnailURL: fixImageUrl(img.thumbnailURL || img.compressedURL || img.url || img),
					compressedURL: fixImageUrl(img.compressedURL || img.url || img),
					progress: 100
				}))
			}
			
			// 设置视频信息
			if (articleData.videoURL) {
				videoInfo.value = articleData.videoURL
			}
			
			// 设置位置信息
			locationInfo.value = {
				address: articleData.address || '未知地址',
				district: articleData.district || '未知区域'
			}
			
		} catch (err) {
			console.error('加载文章数据失败:', err)
			uni.showToast({
				title: '加载文章数据失败',
				icon: 'none'
			})
		} finally {
			uni.hideLoading()
		}
	}

	// 修改提交表单方法
	const submitForm = async () => {
		if (!content.value.trim()) {
			uni.showToast({
				title: '请输入内容',
				icon: 'none'
			})
			return
		}

		if (!selectedCategory.value) {
			uni.showToast({
				title: '请选择分类',
				icon: 'none'
			})
			// 如果没有分类，尝试重新获取
			if (!categoryList.value.length || categoryList.value[0]._id === 'default') {
				uni.showModal({
					title: '提示',
					content: '未能获取到分类信息，是否重新获取？',
					success: (res) => {
						if (res.confirm) {
							retryGetCategories()
						}
					}
				})
			}
			return
		}

		if (!locationInfo.value || !locationInfo.value.address) {
			uni.showToast({
				title: '未能获取位置信息',
				icon: 'none'
			})
			return
		}

		uni.showLoading({
			title: isEditMode.value ? '更新中...' : '发布中...',
			mask: false
		})

		try {
					// 获取所有已上传完成的图片URL，使用域名修复函数
			const uploadedImages = imageList.value
				.filter(img => img.fileURL && img.progress === 100)
				.map(img => ({
					url: fixImageUrl(img.fileURL),
					compressedURL: fixImageUrl(img.compressedURL),
					thumbnailURL: fixImageUrl(img.thumbnailURL)
				}))

			// 直接使用videoURL字段
			const videoURL = videoInfo.value || null
			
			// 获取选中的分类信息
			const selectedCategoryInfo = categoryList.value.find(cate => cate._id === selectedCategory.value) || null
			// 检查是否是基于位置的分类
			const isLocationBasedCategory = selectedCategoryInfo && selectedCategoryInfo.is_location_based === true

			const params = {
				user_id: userStore.userInfo.uid,
				content: content.value.trim(),
				images: uploadedImages,
				videoURL: videoURL,
				cate_id: selectedCategory.value,
				address: locationInfo.value.address || '未知地址',
				district: locationInfo.value.district || '未知区域',
				user_nickName: userStore.userInfo.nickName,
				user_avatarUrl: userStore.userInfo.avatarUrl,
				user_mobile: userStore.userInfo.mobile,
				pay_amount: payAmount.value || 0,
				is_location_based_category: isLocationBasedCategory,
				category_info: selectedCategoryInfo ? {
					name: selectedCategoryInfo.cate_name,
					is_location_based: selectedCategoryInfo.is_location_based || false,
					location_district: selectedCategoryInfo.location_district || null,
					icon: selectedCategoryInfo.icon || null,
					cate_img: selectedCategoryInfo.cate_img || selectedCategoryInfo.icon || null
				} : null
			}

			let res
			if (isEditMode.value) {
				// 更新文章
				res = await articleApi.updateArticle(editArticleId.value, params)
			} else {
				// 发布新文章
				res = await articleApi.addArticle(params)
			}

			if (res.id || res.code === 0) {
				uni.showToast({
					title: isEditMode.value ? '更新成功' : '发布成功',
					icon: 'success',
					duration: 1500,
					success: () => {
						setTimeout(() => {
							uni.navigateBack({
								delta: 1,
								success: () => {
									uni.$emit('globalRefresh', { 
										timestamp: Date.now(),
										pages: ['index', 'userArticleList', 'articleDetail']
									});
									console.log('触发全局刷新事件');
								}
							});
						}, 1500);
					}
				})
			} else {
				throw new Error(res.message || (isEditMode.value ? '更新失败' : '发布失败'))
			}
		} catch (err) {
			console.error(isEditMode.value ? '更新失败:' : '发布失败:', err)
			uni.showToast({
				title: err.message || (isEditMode.value ? '更新失败，请重试' : '发布失败，请重试'),
				icon: 'none'
			})
		} finally {
			uni.hideLoading()
		}
	}

	// 选择分类
	const bindPickerChange = ( e ) => {
		console.log( e, '分类' )
		cateIndex.value = e.detail.value
		selectedCategory.value = categoryList.value[ e.detail.value ]._id
	}

	// 直接选择分类
	const selectCategory = (index) => {
		cateIndex.value = index
		selectedCategory.value = categoryList.value[index]._id
		console.log('选择分类:', categoryList.value[index].cate_name)
	}

	// 使用 uni-app API 控制键盘
	const focusTextarea = () => {
		// 先隐藏键盘，再延迟显示，避免闪烁问题
		uni.hideKeyboard && uni.hideKeyboard()
		
		setTimeout(() => {
			textareaFocus.value = true
			
			// 添加光标位置设置 - 默认光标移到内容末尾
			if (content.value) {
				selectionStart.value = content.value.length
				selectionEnd.value = content.value.length
			}
			
			// 滚动到可视区域，确保输入区域在键盘上方
			adjustScrollPosition()
		}, 50)
	}

	// 选择支付金额
	const onSelectPayAmount = (e) => {
		payAmount.value = e.target.dataset.amount
	}

	// 生成分类图标
	const handleGenerateIcon = async (category) => {
		try {
			uni.showLoading({
				title: '生成图标中...',
				mask: false
			})
			
			// 生成临时图标
			const tempResult = await generateTempCategoryIcon(category.cate_name)
			if (tempResult && tempResult.tempFilePath) {
				// 直接上传和保存图标，跳过自定义调整面板
				currentEditingCategory = category
				previewImageUrl.value = tempResult.tempFilePath
				
				// 直接保存图标
				await saveCustomIcon()
			} else {
				throw new Error('生成临时图标失败')
			}
		} catch (error) {
			console.error('生成图标失败:', error)
			uni.showToast({
				title: '生成图标失败',
				icon: 'none'
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 生成临时预览图标
	const generateTempCategoryIcon = async (categoryName) => {
		try {
			// 显示加载中提示
			uni.showLoading({
				title: '生成预览中...',
				mask: false
			})
			
			// 1. 根据分类名称生成背景色和前景色（保持原有代码）
			const getColorFromName = (name) => {
				// 简单哈希算法生成颜色
				let hash = 0;
				for (let i = 0; i < name.length; i++) {
					hash = name.charCodeAt(i) + ((hash << 5) - hash);
				}
				
				// 生成柔和的背景色 - 使用HSL颜色模型，保持较高亮度和低饱和度
				const h = Math.abs(hash) % 360; // 色相
				const s = 40 + (Math.abs(hash) % 30); // 饱和度 40-70%
				const l = 75 + (Math.abs(hash) % 15); // 亮度 75-90%
				
				// 前景色 - 根据背景色明暗程度选择黑或白文本
				const foregroundColor = l > 65 ? '#333333' : '#FFFFFF';
				
				return {
					background: `hsl(${h}, ${s}%, ${l}%)`,
					foreground: foregroundColor
				};
			}
			
			// 2. 创建Canvas绘制图标
			const colors = getColorFromName(categoryName);
			const canvasSize = 200; // 画布大小
			const iconSize = canvasSize;
			
			// 创建离屏Canvas (App和小程序)
			const canvas = uni.createOffscreenCanvas({
				type: '2d',
				width: iconSize, 
				height: iconSize
			})
			const ctx = canvas.getContext('2d');
			
			// 绘制背景
			ctx.fillStyle = colors.background;
			ctx.fillRect(0, 0, iconSize, iconSize);
			
			// 绘制边框
			ctx.strokeStyle = 'rgba(0,0,0,0.1)';
			ctx.lineWidth = 2;
			ctx.strokeRect(2, 2, iconSize-4, iconSize-4);
			
			// 绘制文字 - 应用当前偏移和大小设置
			const firstChar = categoryName.charAt(0);
			ctx.fillStyle = colors.foreground;
			const fontSize = iconSize/2 * (textSize.value / 100);
			ctx.font = `bold ${fontSize}px sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			
			// 应用偏移量，默认位置是中心点(iconSize/2, iconSize/2)
			const textX = iconSize/2 + (textOffsetX.value * iconSize / 100);
			const textY = iconSize/2 + (textOffsetY.value * iconSize / 100);
			ctx.fillText(firstChar, textX, textY);
			
			// 3. 将Canvas转为临时图片
			const tempFilePath = await new Promise((resolve, reject) => {
				// 导出图片
				const buffer = canvas.toDataURL('image/png')
				
				// 将Base64转为本地临时文件
				const fs = uni.getFileSystemManager();
				const tempFilePath = `${uni.env.USER_DATA_PATH}/temp_category_icon_${Date.now()}.png`;
				
				// 保存Base64为临时文件
				const base64Data = buffer.replace(/^data:image\/\w+;base64,/, '');
				fs.writeFile({
					filePath: tempFilePath,
					data: base64Data,
					encoding: 'base64',
					success: () => resolve(tempFilePath),
					fail: (err) => reject(new Error(`保存临时文件失败: ${JSON.stringify(err)}`))
				});
			});
			
			uni.hideLoading();
			
			// 返回临时文件路径和颜色信息
			return { 
				tempFilePath,
				colors
			};
			
		} catch (error) {
			uni.hideLoading();
			console.error('生成临时图标失败:', error);
			return null;
		}
	}

	// 添加重试获取分类的方法
	const retryGetCategories = () => {
		uni.showToast({
			title: '正在重新获取分类...',
			icon: 'loading',
			duration: 2000
		})
		setTimeout(() => {
			getLocaAndCate()
		}, 1000)
	}

	// 组件加载时获取位置
	onMounted(() => {
		console.log('组件已挂载')
		isInSelectionMode.value = false
		
		// 如果不是编辑模式，则获取分类
		if (!isEditMode.value) {
			getLocaAndCate().catch(err => {
				console.error('onMounted获取分类失败:', err)
				uni.showModal({
					title: '提示',
					content: '获取分类失败，是否重试？',
					success: (res) => {
						if (res.confirm) {
							retryGetCategories()
						}
					}
				})
			})
		}
	})

	// 添加创建新分类图标的方法
	const createNewCategoryIcon = () => {
		if (categoryList.value.length === 0) {
			uni.showToast({
				title: '没有可用分类',
					icon: 'none',
					duration: 2000
				})
			return
		}
		
		// 如果已选择分类，为该分类生成图标
		if (categoryList.value[cateIndex.value]) {
			handleGenerateIcon(categoryList.value[cateIndex.value])
		} else {
			uni.showToast({
				title: '请先选择一个分类',
				icon: 'none',
				duration: 2000
			})
		}
	}

	// 检查URL是否有效图片URL
	const isValidImageUrl = (url) => {
		// 如果URL为空或为空字符串，不是有效URL
		if (!url || url.trim() === '') return false;
		
		// 检查是否是默认图片
		if (url.includes('default.png')) return false;
		
		// 检查是否是本地静态资源路径（非有效的远程URL）
		if (url.startsWith('/static/')) return false;
		
		try {
			// 尝试解析URL，检查是否有效
			const parsedUrl = new URL(url);
			// 检查是否是HTTP/HTTPS协议
			return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
		} catch (e) {
			// 解析失败，不是有效URL
			return false;
		}
	}

	// 处理文本框焦点事件
	const handleTextareaFocus = () => {
		textareaFocus.value = true
		// 调整滚动位置确保输入区域可见
		adjustScrollPosition()
	}

	// 处理文本框行数变化
	const handleLineChange = (e) => {
		// 获取当前行数
		const lineCount = e.detail.lineCount || 1;
		const minHeight = 170; // 最小高度 170rpx
		const lineHeight = 40; // 每行大约40rpx
		const maxHeight = 800; // 最大高度限制
		
		// 计算理想高度：每行40rpx，加上上下padding各20rpx
		let idealHeight = Math.max(minHeight, (lineCount * lineHeight) + 40);
		
		// 限制最大高度
		idealHeight = Math.min(idealHeight, maxHeight);
		
		// 只有当高度变化显著时才调整位置
		if (Math.abs(inputHeight.value - idealHeight) > 10) {
			inputHeight.value = idealHeight;
			
			// 使用节流函数延迟调用adjustScrollPosition
			clearTimeout(window.scrollAdjustTimer);
			window.scrollAdjustTimer = setTimeout(() => {
				adjustScrollPosition();
			}, 100);
		}
	}
	
	// 启用光标拖动模式
	const enableCursorDrag = (e) => {
		// 确保文本区域获得焦点
		textareaFocus.value = true
		
		// 设置为选择模式
		isInSelectionMode.value = true
		
		// 简单提示用户
		uni.showToast({
			title: '长按选择文本进行编辑',
			icon: 'none',
			duration: 1500
		})
		
		// 阻止默认行为，防止虚拟键盘弹出
		setTimeout(() => {
			uni.hideKeyboard && uni.hideKeyboard()
		}, 100)
	}

	// 更新图标预览
	const updateIconPreview = async () => {
		if (!currentEditingCategory) return;
		
		try {
			const tempResult = await generateTempCategoryIcon(currentEditingCategory.cate_name);
			if (tempResult && tempResult.tempFilePath) {
				previewImageUrl.value = tempResult.tempFilePath;
			}
		} catch (error) {
			console.error('更新预览失败:', error);
		}
	}
	
	// 保存自定义图标
	const saveCustomIcon = async () => {
		if (!currentEditingCategory || !previewImageUrl.value) {
			uni.showToast({
				title: '没有可保存的图标',
				icon: 'none'
			});
			return;
		}
		
		try {
			uni.showLoading({
				title: '保存中...',
				mask: false
			});
			
			// 上传到云存储
			const uploadResult = await extStorageCo.getUploadFileOptions({
				cloudPath: `categories/${currentEditingCategory._id || Date.now()}.png`,
				fileType: 'image',
				isOriginal: true
			});
			
			// 执行上传
			const uploadRes = await uni.uploadFile({
				...uploadResult.uploadFileOptions,
				filePath: previewImageUrl.value,
				name: 'file'
			});
			
			if (uploadRes.statusCode !== 200) {
				throw new Error(`上传失败: ${uploadRes.statusCode}`);
			}
			
					// 获取图片URL，使用域名修复函数
			const iconURL = fixImageUrl(uploadResult.fileURL);
			const thumbnailURL = fixImageUrl(uploadResult.thumbnailURL);
			
			// 更新数据库中的分类图标URL
			if (currentEditingCategory._id) {
				try {
					// 尝试调用云函数更新图标
					const updateResult = await extStorageCo.updateCategoryIcon({
						categoryId: currentEditingCategory._id, 
						iconURL,
						thumbnailURL
					}).catch(err => {
						console.warn('云函数updateCategoryIcon可能未部署或不可用:', err);
						return { updated: false, error: err.message };
					});
					
					// 如果云函数调用成功
					if (updateResult && updateResult.updated) {
						console.log('更新分类图标结果:', updateResult);
						
						// 更新本地分类图标，使用域名修复函数
						currentEditingCategory.icon = fixImageUrl(iconURL);
						currentEditingCategory.cate_img = fixImageUrl(iconURL);
						currentEditingCategory.cate_img_thumbnail = fixImageUrl(thumbnailURL);
						
						// 关闭自定义面板
						iconCustomizing.value = false;
						
						uni.showToast({
							title: '图标保存成功',
							icon: 'success'
						});
					} else {
						// 云函数未能正确执行，但我们仍然更新本地图标
						console.warn('更新分类图标未成功，但图标已生成:', {iconURL, thumbnailURL});
						
						// 更新本地分类图标，使用域名修复函数
						currentEditingCategory.icon = fixImageUrl(iconURL);
						currentEditingCategory.cate_img = fixImageUrl(iconURL);
						currentEditingCategory.cate_img_thumbnail = fixImageUrl(thumbnailURL);
						
						// 关闭自定义面板
						iconCustomizing.value = false;
						
						uni.showToast({
							title: '图标已生成',
							icon: 'success'
						});
					}
				} catch (updateError) {
					// 更新数据库失败，但图标已上传成功
					console.error('更新分类图标数据库记录失败:', updateError);
					
					// 更新本地分类图标，使用域名修复函数
					currentEditingCategory.icon = fixImageUrl(iconURL);
					currentEditingCategory.cate_img = fixImageUrl(iconURL);
					currentEditingCategory.cate_img_thumbnail = fixImageUrl(thumbnailURL);
					
					// 关闭自定义面板
					iconCustomizing.value = false;
					
					uni.showToast({
						title: '图标已生成，但未更新数据库',
						icon: 'none'
					});
				}
			}
		} catch (error) {
			console.error('保存图标失败:', error);
			uni.showToast({
				title: '保存图标失败',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	}
	
	// 取消自定义
	const cancelCustomize = () => {
		iconCustomizing.value = false;
		currentEditingCategory = null;
		previewImageUrl.value = '';
	}

	// 调整滚动位置
	const adjustScrollPosition = () => {
		nextTick(() => {
			try {
				// 获取当前设备信息
				const systemInfo = uni.getSystemInfoSync();
				const windowHeight = systemInfo.windowHeight;
				const keyboardHeight = systemInfo.windowHeight * 0.4; // 键盘高度约为屏幕高度的40%
				
				// 获取输入区域信息
				uni.createSelectorQuery()
					.select('.content-area')
					.boundingClientRect(rect => {
						if (!rect) return;
						
						// 计算输入区域底部到屏幕顶部的距离
						const inputBottom = rect.top + rect.height;
						
						// 计算理想的输入区域位置
						// 让输入区域底部位于键盘上方，留出一定空间(100rpx)
						const idealPosition = inputBottom - (windowHeight - keyboardHeight) + (100 * (systemInfo.windowWidth / 750));
						
						// 只有当输入区域被键盘遮挡时才滚动
						if (idealPosition > 0) {
							// 获取当前页面滚动位置
							let currentScrollTop = 0;
							const pages = getCurrentPages();
							const currentPage = pages[pages.length - 1];
							if (currentPage && currentPage.$page) {
								currentScrollTop = currentPage.$page.scrollTop || 0;
							}
							
							// 计算新的滚动位置，确保平滑过渡
							const newScrollTop = currentScrollTop + idealPosition;
							
							// 执行滚动，使用较短的动画时间
							uni.pageScrollTo({
								scrollTop: newScrollTop,
								duration: 200, // 减少动画时间提高响应速度
								success: () => {
									// 滚动完成后，确保光标可见
									nextTick(() => {
										// 如果需要，微调滚动位置
										const finalAdjustment = 50; // 额外的微调距离
										if (idealPosition > windowHeight / 3) {
											uni.pageScrollTo({
												scrollTop: newScrollTop + finalAdjustment,
												duration: 100
											});
										}
									});
								}
							});
						}
					})
					.exec();
				
			} catch (err) {
				console.error('调整滚动位置失败:', err);
			}
		});
	}

	// 插入文本到光标位置
	const insertTextAtCursor = (textToInsert) => {
		if (!content.value) content.value = ''
		
		// 插入文本
		const before = content.value.substring(0, selectionStart.value)
		const after = content.value.substring(selectionEnd.value)
		content.value = before + textToInsert + after
		
		// 更新光标位置 - 移动到插入的文本之后
		const newPosition = selectionStart.value + textToInsert.length
		
		// 延迟更新光标位置，确保内容已更新
		nextTick(() => {
			selectionStart.value = newPosition
			selectionEnd.value = newPosition
			
			// 确保文本区域仍然具有焦点
			textareaFocus.value = true
	  
			// 触发输入高度变化检测
			handleLineChange({ detail: { lineCount: content.value.split('\n').length } })
		})
	}
	
	// 添加一个保存光标位置的处理函数
	const handleSelectionChange = (e) => {
		if (e.detail) {
			// 记录选区位置
			selectionStart.value = e.detail.selectionStart || 0
			selectionEnd.value = e.detail.selectionEnd || 0
			
			// 如果有选中内容，显示字数
			if (selectionStart.value !== selectionEnd.value) {
				// 已经显示在界面中
			}
		}
	}
	
	// 应用自定义选择样式 - 例如在选择的文本下方添加细线
	const applyCustomSelectionStyle = () => {
		// 为了更好地兼容性，这只是一个占位函数
		// 实际样式通过CSS和class控制
		
		// 在微信小程序环境中，可以考虑使用覆盖层或其他视觉指示
		
		// 注意：某些平台可能不支持复杂的DOM操作或CSS自定义
		
		// 在这里，我们主要依赖于CSS和类来添加视觉区分
		console.log('应用自定义选择样式')
	}

	// 插入常用短语
	const insertCommonPhrase = (phrase) => {
		insertTextAtCursor(phrase)
		// 插入后自动关闭工具栏
		showFormatToolbar.value = false
	}

	// 清空全部内容
	const clearContent = () => {
		uni.showModal({
			title: '提示',
			content: '确定要清空全部内容吗？',
			success: (res) => {
				if (res.confirm) {
					content.value = ''
					// 聚焦到输入框
					textareaFocus.value = true
				}
			}
		})
	}

	// 切换表情面板显示
	const toggleEmojiPanel = () => {
		showEmojiPanel.value = !showEmojiPanel.value
		if (showEmojiPanel.value) {
			// 关闭格式工具栏
			showFormatToolbar.value = false
		}
	}

	// 插入表情符号
	const insertEmoji = (emoji) => {
		insertTextAtCursor(emoji)
	}

	// 选择表情分组
	const selectEmojiGroup = (index) => {
		currentEmojiGroupIndex.value = index
	}

	// 增强文本选择的焦点和选择控制
	const enhanceTextareaSelection = (e) => {
	  try {
	    // 确保内容区域可见
	    adjustScrollPosition()
	    
	    // 判断是否需要显示键盘
	    const shouldShowKeyboard = e && e.type === 'click'
	    
	    if (shouldShowKeyboard) {
	      textareaFocus.value = true
	    }
	    
	    // 记录文本区域位置用于后续精确选择
	    if (e && (e.type === 'touchstart' || e.type === 'click')) {
	      // 在小程序中获取元素信息
	      uni.createSelectorQuery()
	        .select('.content-input')
	        .boundingClientRect(data => {
	          if (data) {
	            // 记录文本区域的位置和尺寸信息
	            textAreaRect.value = {
	              left: data.left,
	              top: data.top,
	              width: data.width,
	              height: data.height
	            }
	          }
	        })
	        .exec()
	    }
	  } catch (err) {
	    console.log('增强文本选择失败', err)
	  }
	}

	// 将长按变成精确选择模式
	const enablePreciseSelection = (e) => {
	  // 防止默认长按菜单
	  e.preventDefault && e.preventDefault()
	  
	  // 显示自定义菜单
	  uni.showActionSheet({
	    itemList: ['全选', '复制', '粘贴', '清空'],
	    success: (res) => {
	      switch(res.tapIndex) {
	        case 0: // 全选
	          // 选择全部文本
	          selectionStart.value = 0
	          selectionEnd.value = content.value.length
	          
	          // 确保文本区域获得焦点
	          textareaFocus.value = true
	          
	          uni.showToast({
	            title: '已全选',
	            icon: 'none',
	            duration: 1000
	          })
	          break
	          
	        case 1: // 复制
	          if (selectionStart.value !== selectionEnd.value) {
	            // 复制选中内容到剪贴板
	            const selectedText = content.value.substring(selectionStart.value, selectionEnd.value)
	            uni.setClipboardData({
	              data: selectedText,
	              success: () => {
	                uni.showToast({
	                  title: '已复制',
	                  icon: 'success',
	                  duration: 1000
	                })
	              }
	            })
	          } else if (content.value) {
	            // 全部复制
	            uni.setClipboardData({
	              data: content.value,
	              success: () => {
	                uni.showToast({
	                  title: '已复制全部内容',
	                  icon: 'success',
	                  duration: 1000
	                })
	              }
	            })
	          } else {
	            uni.showToast({
	              title: '无内容可复制',
	              icon: 'none',
	              duration: 1000
	            })
	          }
	          break
	          
	        case 2: // 粘贴
	          // 从剪贴板获取内容并粘贴
	          uni.getClipboardData({
	            success: (res) => {
	              if (res.data) {
	                // 在当前光标位置插入剪贴板内容
	                insertTextAtCursor(res.data)
	                
	                uni.showToast({
	                  title: '已粘贴',
	                  icon: 'success',
	                  duration: 1000
	                })
	              } else {
	                uni.showToast({
	                  title: '剪贴板为空',
	                  icon: 'none',
	                  duration: 1000
	                })
	              }
	            }
	          })
	          break
	          
	        case 3: // 清空
	          // 清空确认
	          uni.showModal({
	            title: '提示',
	            content: '确定要清空全部内容吗？',
	            success: (res) => {
	              if (res.confirm) {
	                content.value = ''
	                
	                // 重新获取焦点
	                setTimeout(() => {
	                  textareaFocus.value = true
	                }, 100)
	              }
	            }
	          })
	          break
	      }
	    }
	  })
	}

	// 退出选择模式
	const exitSelectionMode = () => {
	  // 清除选择模式标志
	  isInSelectionMode.value = false
	  
	  // 通知用户
	  uni.showToast({
	    title: '选择已完成',
	    icon: 'none',
	    duration: 1500
	  })
	}

	// 根据点击位置计算光标位置
	const getCursorPositionFromPoint = (x, y, text) => {
	  // uni-app环境中可能没有直接访问document对象
	  // 创建临时元素来估算光标位置
	  try {
	    // 通过selectQuery获取textarea元素
	    uni.createSelectorQuery()
	      .select('.content-input')
	      .node(res => {
	        if (!res || !res.node) return 0
	        
	        // 获取容器节点作为参考
	        const textNode = res.node
	        
	        // 创建临时文本计算工具
	        const getPositionFromText = (text, relX, relY) => {
	          // 文本不存在则返回0
	          if (!text) return 0
	          
	          // 使用字符平均宽度进行估算
	          const avgCharWidth = 14 // 假设的平均字符宽度，28rpx约等于14px
	          const lineHeight = 21 // 1.5行高 * 14px
	          
	          // 计算点击位置大致对应的字符索引
	          const approxLine = Math.floor(relY / lineHeight)
	          const lineWidth = textNode.offsetWidth || 300 // 假设宽度
	          const charsPerLine = Math.floor(lineWidth / avgCharWidth)
	          
	          // 基于行数和相对X位置计算索引
	          let approxIndex = (approxLine * charsPerLine) + Math.floor(relX / avgCharWidth)
	          
	          // 确保索引在有效范围内
	          approxIndex = Math.max(0, Math.min(approxIndex, text.length))
	          
	          // 尝试找到最接近的字符边界
	          // 特别是对于CJK文字，可能需要更复杂的逻辑
	          return approxIndex
	        }
	        
	        // 获取相对于文本区的坐标
	        uni.createSelectorQuery()
	          .select('.content-input')
	          .boundingClientRect(data => {
	            if (data) {
	              const relX = x - data.left
	              const relY = y - data.top
	              
	              // 计算估算位置
	              const position = getPositionFromText(text, relX, relY)
	              
	              // 设置选中位置
	              selectionStart.value = position
	              selectionEnd.value = position
	              
	              // 直接应用到文本区
	              if (textNode.setSelectionRange) {
	                textNode.setSelectionRange(position, position)
	                // 保存引用
	                textareaElement.value = textNode
	              }
	            }
	          })
	          .exec()
	      })
	      .exec()
	    
	    // 如果没法获取到正确位置，返回一个估计值
	    return Math.min(text.length, Math.max(0, selectionStart.value))
	  } catch (e) {
	    console.error('光标位置计算失败:', e)
	    return 0 // 失败时返回开始位置
	  }
	}

	// 打开文本精确选择模式
	const openPreciseTextSelection = () => {
	  try {
	    // 使用微信小程序/uni提供的可能API
	    uni.showActionSheet({
	      itemList: ['精确选择文本'],
	      success: () => {
	        // 启用精确选择模式
	        uni.showToast({
	          title: '已启用精确选择',
	          icon: 'none',
	          duration: 1500
	        })
	        
	        // 设置系统选择模式为可选择
	        setTimeout(() => {
	          textareaFocus.value = true
	          
	          // 使用更专业的方法设置光标可选择模式
	          if (typeof plus !== 'undefined' && plus.webview) {
	            const currentWebview = plus.webview.currentWebview()
	            if (currentWebview.setStyle) {
	              currentWebview.setStyle({
	                softinputMode: 'adjustResize', // 确保软键盘不遮挡
	                userSelect: 'text' // 允许用户选择文本
	              })
	            }
	          }
	        }, 100)
	      }
	    })
	  } catch (e) {
	    console.error('无法启用精确文本选择:', e)
	    // 回退到基本选择方式
	    textareaFocus.value = true
	  }
	}

	// 记录文本区域位置的响应式变量
	const textAreaRect = ref({ left: 0, top: 0, width: 0, height: 0 })

	// 添加图片预览方法，使用域名修复
	const previewImage = (index) => {
		if (!imageList.value[index]) return
		
		// 使用域名修复函数处理图片URL
		const images = imageList.value.map(img => fixImageUrl(img.thumbnailURL))
		previewImageIndex.value = index
		
		// 使用uni-app的预览图片API
		uni.previewImage({
			current: index,
			urls: images,
			indicator: 'number',
			loop: true,
			success: () => {
				console.log('图片预览成功')
			},
			fail: (err) => {
				console.error('图片预览失败', err)
				// 预览失败时的备选方案，使用域名修复
				showImagePreview.value = true
				currentPreviewImage.value = fixImageUrl(images[index])
			}
		})
	}
	
	
		
	// 关闭图片预览
	const closeImagePreview = () => {
		showImagePreview.value = false
		currentPreviewImage.value = ''
	}
</script>

<template>
	<view class="add">

		<!-- 分类选择 -->
		<view class="category">
			<view class="category-header">
				<text class="label">所属地区</text>
				<text class="location-address-inline" v-if="locationInfo && locationInfo.address">（{{ getSimplifiedAddress(locationInfo.address) }}）</text>
			</view>
			
			<picker @change="bindPickerChange" :range="categoryList" :value="cateIndex"
				range-key="cate_name" v-if="false">
				<view class="picker">
					<text>
						{{categoryList[cateIndex]?.cate_name}}
					</text>
					<uni-icons type="bottom" size="14" color="#999999"></uni-icons>
				</view>
			</picker>
			
			<!-- 添加网格布局的分类选择 -->
			<view class="category-grid">
				<!-- 生成图标按钮，仅在当前选择的分类没有缩略图时显示 -->
				<view 
					v-if="categoryList.length > 0 && categoryList[cateIndex] && !categoryList[cateIndex].cate_img_thumbnail" 
					class="category-item generate-icon-item" 
					@click="createNewCategoryIcon"
				>
					<view class="category-icon">
						<uni-icons type="plus" size="30" color="#2196F3"></uni-icons>
					</view>
					<view class="category-name-container">
						<text class="category-name">生成图标</text>
					</view>
				</view>
				
				<view 
					v-for="(item, index) in categoryList" 
					:key="index" 
					class="category-item" 
					:class="{ 'active': index === cateIndex, 'location-based': item.is_location_based }"
					@click="selectCategory(index)"
				>
					<view class="category-icon">
						<!-- 使用分类图标，应用域名修复 -->
						<image :src="fixImageUrl(item.icon)" mode="aspectFit" class="category-image"></image>
						<!-- 选中状态指示器 -->
						<view class="selected-indicator" v-if="index === cateIndex">
							<uni-icons type="checkmarkempty" size="16" color="#fff"></uni-icons>
						</view>
					</view>
					<view class="category-name-container">
						
						<!-- 修改位置标记，移除图标只显示文本 -->
						<view class="location-badge" v-if="item.is_location_based">
							<!-- 移除图标 -->
						</view>
						<text class="category-name">{{ item.cate_name }}</text>
					</view>
				</view>
			</view>
			
			<!-- 添加重试按钮 -->
			<view v-if="categoryList.length === 0 || categoryList[0]._id === 'default'" 
				  class="retry-btn" @click="retryGetCategories">
				<uni-icons type="refresh" size="16" color="#ff6600"></uni-icons>
				<text class="retry-text">重试</text>
			</view>
			
		</view>

		<!-- 优化文本输入区域 -->
		<view class="content-wrapper">
			<view class="content-area" :style="{ minHeight: inputHeight + 'rpx' }">
				
				<textarea 
					v-model="content" 
					placeholder="分享新鲜事..." 
					class="content-input"
					maxlength="2000"
					auto-height
					:adjust-position="false"
					show-confirm-bar="false"
					confirm-type="done"
					cursor-spacing="120"
					:focus="textareaFocus"
					ref="contentTextarea"
					@blur="textareaFocus = false"
					@focus="handleTextareaFocus"
					:disable-default-padding="true"
					:hold-keyboard="false"
					:selection-start="selectionStart"
					:selection-end="selectionEnd"
					@confirm="() => {}"
					@linechange="handleLineChange"
					@input="handleLineChange"
					@selectionchange="handleSelectionChange"
					@longpress="enablePreciseSelection"
					@touchstart="enhanceTextareaSelection"
					@click="enhanceTextareaSelection"
				/>
				
				<!-- 底部字数统计和功能按钮 -->
				<view class="content-footer">
					<text class="word-count">{{ content.length }}/2000</text>
					
					<!-- 文本操作工具栏 -->
					<view class="text-toolbar">
						<view class="toolbar-btn" @click="enablePreciseSelection">
							<uni-icons type="more-filled" size="16" color="#666"></uni-icons>
							
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 修改媒体上传区域 -->
		<view class="media-section">
			<!-- 图片上传区域 -->
			<view class="images">
				
				<view class="image-list">
					<view v-for="(image, index) in imageList" :key="index" class="image-item">
						<image :src="fixImageUrl(image.thumbnailURL)" mode="aspectFill" @click="previewImage(index)" />
						<view class="delete-btn" @click="deleteImage(index)">
							<uni-icons type="close" size="20" color="#fff"></uni-icons>
						</view>
						<view class="progress-overlay" v-if="image.progress < 100">
							<view class="progress-text">{{image.progress.toFixed(0)}}%</view>
							<view class="progress-bar">
								<view class="progress" :style="{width: image.progress + '%'}"></view>
							</view>
						</view>
					</view>
					<view class="upload-btn" @click="chooseAndUploadImage">
						<uni-icons type="plusempty" size="30" color="#999"></uni-icons>
					</view>
				</view>
				<text class="tip">可无限上传图片，点击图片可放大查看</text>
			</view>

			<!-- 视频链接区域 -->
			<view class="video">
				<view v-if="videoInfo" class="video-link-preview">
					<view class="link-container">
						<text class="link-text">{{videoInfo}}</text>
					</view>
					<view class="delete-btn" @click="deleteVideo">
						<uni-icons type="close" size="20" color="#fff"></uni-icons>
					</view>
				</view>
				<view v-else class="video-link-input">
					<view class="input-container">
						<input 
							v-model="videoLink" 
							type="text" 
							placeholder="输入视频链接后自动保存" 
							class="link-input"
							confirm-type="done"
							maxlength="5000"
							@input="handleVideoLinkInput"
						/>
					</view>
				</view>
				<text class="tip">输入.mp4格式的链接，在详情页显示视频</text>
			</view>
		</view>

		<!-- 发布按钮 -->
		<view class="publish">
			<button class="publish-btn" @click="submitForm">{{isEditMode ? '更新' : '发布'}}</button>
		</view>

		<!-- 图标自定义面板 -->
		<view class="icon-customize-overlay" v-if="iconCustomizing">
			<view class="icon-customize-panel">
				<view class="icon-customize-header">
					<text class="panel-title">调整图标</text>
					<view class="close-btn" @click="cancelCustomize">
						<uni-icons type="close" size="20" color="#666"></uni-icons>
					</view>
				</view>
				
				<view class="icon-preview">
					<image :src="fixImageUrl(previewImageUrl)" mode="aspectFit" class="preview-image"></image>
				</view>
				
				<view class="customize-controls">
					<!-- 文字X轴位置调整 -->
					<view class="control-item">
						<text class="control-label">水平位置</text>
						<slider 
							:value="textOffsetX + 50" 
							min="0" 
							max="100" 
							show-value 
							@change="(e) => { textOffsetX = e.detail.value - 50; updateIconPreview(); }"
						/>
					</view>
					
					<!-- 文字Y轴位置调整 -->
					<view class="control-item">
						<text class="control-label">垂直位置</text>
						<slider 
							:value="textOffsetY + 50" 
							min="0" 
							max="100" 
							show-value 
							@change="(e) => { textOffsetY = e.detail.value - 50; updateIconPreview(); }"
						/>
					</view>
					
					<!-- 文字大小调整 -->
					<view class="control-item">
						<text class="control-label">文字大小</text>
						<slider 
							:value="textSize" 
							min="50" 
							max="150" 
							show-value 
							@change="(e) => { textSize = e.detail.value; updateIconPreview(); }"
						/>
					</view>
				</view>
				
				<view class="customize-buttons">
					<button class="cancel-btn" @click="cancelCustomize">取消</button>
					<button class="save-btn" @click="saveCustomIcon">保存</button>
				</view>
			</view>
		</view>
		
		<!-- 表情符号面板 -->
		<view class="emoji-panel" v-if="showEmojiPanel">
			<view class="emoji-header">
				<text class="emoji-title">插入表情</text>
				<view class="emoji-close" @click="showEmojiPanel = false">
					<uni-icons type="close" size="20" color="#666"></uni-icons>
				</view>
			</view>
			
			<view class="emoji-tabs">
				<view 
					v-for="(group, index) in emojiGroups" 
					:key="index" 
					class="emoji-tab" 
					:class="{'active': currentEmojiGroupIndex === index}"
					@click="selectEmojiGroup(index)"
				>
					{{ group.name }}
				</view>
			</view>
			
			<view class="emoji-content">
				<view class="emoji-list">
					<view 
						v-for="emoji in emojiGroups[currentEmojiGroupIndex].emojis" 
						:key="emoji" 
						class="emoji-item"
						@click.stop="insertEmoji(emoji)"
					>
						{{ emoji }}
					</view>
				</view>
			</view>
		</view>

		<!-- 添加图片预览弹窗 (备用方案) -->
		<view class="image-preview-overlay" v-if="showImagePreview" @click="closeImagePreview">
			<view class="image-preview-container" @click.stop>
				<image :src="fixImageUrl(currentPreviewImage)" mode="widthFix" class="preview-image" />
				<view class="preview-close" @click="closeImagePreview">
					<uni-icons type="close" size="24" color="#fff"></uni-icons>
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.add {
		min-height: 100vh;
		padding: 20rpx 30rpx;
		background-color: #fff;

		// 位置信息显示区域样式
		// 已移除位置信息显示相关样式

		.category {
			display: flex;
			flex-direction: column;

			.category-header {
				display: flex;
				align-items: center;
				margin-bottom: 16rpx;
				flex-wrap: wrap;
				gap: 8rpx;
			}

			.label {
				font-size: 28rpx;
				color: $pyq-text-color-body;
			}
			
			.location-address-inline {
				font-size: 24rpx;
				color: #666;
				margin-left: 8rpx;
				font-weight: normal;
				line-height: 1.3;
			}

			.picker {
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 16rpx 24rpx;
				background-color: #f7f7f7;
				border-radius: 3rpx;
			}
			
			/* 分类网格布局样式 */
			.category-grid {
				display: flex;
				flex-wrap: wrap;
				margin: 0 -10rpx;
				padding: 10rpx 0;
			}
			
			.category-item {
				width: 20%; /* 每行5个 */
				padding: 10rpx;
				box-sizing: border-box;
				display: flex;
				flex-direction: column;
				align-items: center;
				margin-bottom: 20rpx;
				
				.category-icon {
					width: 100rpx;
					height: 100rpx;
					background-color: #f8f8f8;
					border-radius: 20rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-bottom: 10rpx;
					border: 2rpx solid transparent;
					transition: all 0.3s;
					position: relative;
					overflow: hidden;
					box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
					
					.category-image {
						width: 70%;
						height: 70%;
						object-fit: contain;
					}
					
					.selected-indicator {
						position: absolute;
						right: 0;
						bottom: 0;
						background-color: $pyq-vi-color;
						width: 36rpx;
						height: 36rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						border-top-left-radius: 12rpx;
					}
				}
				
				.category-name-container {
					display: flex;
					align-items: center;
					justify-content: center;
					flex-wrap: wrap;
					gap: 4rpx;
					
					.category-name {
						font-size: 24rpx;
						color: #666;
						text-align: center;
						line-height: 1.2;
						height: 2.4em;
						display: flex;
						align-items: center;
						justify-content: center;
					}
					
					.location-badge {
						margin-left: 4rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						
						.uni-icons {
							width: 16rpx;
							height: 16rpx;
						}
					}
				}
				
				&.active {
					.category-icon {
						background-color: rgba(255, 102, 0, 0.08);
						border-color: $pyq-vi-color;
						box-shadow: 0 6rpx 16rpx rgba(255, 102, 0, 0.25);
						transform: translateY(-4rpx);
					}
					
					.category-name {
						color: $pyq-vi-color;
						font-weight: bold;
					}
				}
				
				&.location-based {
					.category-icon {
						background-color: rgba(33, 150, 243, 0.05);
						border: 2rpx dashed #2196F3;
					}
					
					.category-name {
						color: #2196F3;
					}
					
					&.active {
						.category-icon {
							background-color: rgba(33, 150, 243, 0.1);
							border: 2rpx solid #2196F3;
							box-shadow: 0 6rpx 16rpx rgba(33, 150, 243, 0.25);
							transform: translateY(-4rpx);
						}
						
						.category-name {
							color: #2196F3;
							font-weight: bold;
						}
					}
				}
				
				&.generate-icon-item {
					.category-icon {
						background-color: rgba(33, 150, 243, 0.05);
						border: 2rpx dashed #2196F3;
						
						&:active {
							background-color: rgba(33, 150, 243, 0.2);
						}
					}
					
					.category-name {
						color: #2196F3;
						font-weight: bold;
					}
					
					&:active {
						opacity: 0.7;
						transform: scale(0.95);
					}
				}
			}
			
		}

		// 重试按钮样式
		.retry-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20rpx;
			margin-top: 20rpx;
			background-color: rgba(255, 102, 0, 0.08);
			border-radius: 12rpx;
			border: 1px dashed $pyq-vi-color;

			.retry-text {
				font-size: 26rpx;
				color: $pyq-vi-color;
				margin-left: 8rpx;
				font-weight: bold;
			}

			&:active {
				background-color: rgba(255, 102, 0, 0.15);
				opacity: 0.8;
			}
		}

		.content-wrapper {
			position: relative;
			margin-bottom: 20rpx;
		}

		.format-toolbar {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			background-color: #fff;
			border-radius: 12rpx;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
			padding: 20rpx;
			z-index: 100;
			transform: translateY(-10rpx);
			opacity: 0;
			pointer-events: none;
			transition: all 0.3s ease;
			
			&.format-toolbar-visible {
				opacity: 1;
				transform: translateY(0);
				pointer-events: auto;
			}
			
			.toolbar-section {
				padding-bottom: 20rpx;
				margin-bottom: 20rpx;
				border-bottom: 1px solid #f0f0f0;
				
				&:last-child {
					margin-bottom: 0;
					padding-bottom: 0;
					border-bottom: none;
				}
			}
			
			.toolbar-title {
				font-size: 24rpx;
				color: #999;
				margin-bottom: 12rpx;
			}
			
			.format-actions {
				display: flex;
				gap: 20rpx;
				
				.format-btn {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 10rpx;
					border-radius: 8rpx;
					background-color: #f5f5f5;
					
					&:active {
						background-color: #e0e0e0;
					}
					
					.format-icon {
						font-size: 28rpx;
						color: #333;
						margin-bottom: 4rpx;
					}
					
					.format-label {
						font-size: 22rpx;
						color: #666;
					}
				}
			}
			
			.phrase-list {
				display: flex;
				flex-wrap: wrap;
				gap: 16rpx;
				
				.phrase-item {
					background-color: #f5f5f5;
					border-radius: 30rpx;
					padding: 8rpx 20rpx;
					font-size: 24rpx;
					color: #666;
					
					&:active {
						background-color: #e0e0e0;
					}
				}
			}
			
			.clear-btn {
				display: flex;
				align-items: center;
				justify-content: center;
				background-color: rgba(255, 59, 48, 0.1);
				border-radius: 8rpx;
				padding: 12rpx;
				
				text {
					color: #ff3b30;
					font-size: 26rpx;
					margin-left: 8rpx;
				}
				
				&:active {
					background-color: rgba(255, 59, 48, 0.2);
				}
			}
			
			.toolbar-close {
				position: absolute;
				top: 12rpx;
				right: 12rpx;
				width: 40rpx;
				height: 40rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;
				
				&:active {
					background-color: #f0f0f0;
				}
			}
			
			.action-btns {
				display: flex;
				gap: 20rpx;
				
				.action-btn {
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 16rpx;
					border-radius: 8rpx;
					
					text {
						margin-left: 8rpx;
						font-size: 26rpx;
						color: #fff;
					}
					
					&.primary {
						background-color: $pyq-vi-color;
						
						&:active {
							opacity: 0.8;
						}
					}
					
					&.danger {
						background-color: #ff3b30;
						
						&:active {
							opacity: 0.8;
						}
					}
				}
			}
		}

		.content-area {
			position: relative;
			border: 1px solid #e0e0e0;
			border-radius: 12rpx;
			background-color: #fff;
			min-height: 170rpx;
			max-height: 800rpx;
			padding: 0;
			box-sizing: border-box;
			overflow: hidden;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
			transition: height 0.2s ease-out;
			
			.content-input {
				width: 100%;
				min-height: 120rpx;
				font-size: 28rpx;
				line-height: 1.5;
				color: #333;
				padding: 20rpx;
				background-color: transparent;
				border: none;
				box-sizing: border-box;
				word-break: break-word;
				white-space: pre-wrap;
				overflow-wrap: break-word;
				text-align: left;
				user-select: text;
				caret-color: $pyq-vi-color;
				letter-spacing: 0.5px;
				touch-action: manipulation;
				-webkit-user-select: text;
				transition: all 0.2s ease-out;
				z-index: 1;
				position: relative;
				
				&:focus {
					outline: none;
				}
			}
			
			.content-footer {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 8rpx 16rpx;
				background-color: #f9f9f9;
				border-top: 1px solid #eee;
				
				.word-count {
					font-size: 24rpx;
					color: #999;
				}
				
				.text-toolbar {
					display: flex;
					align-items: center;
					gap: 20rpx;
					
					.toolbar-btn {
						display: flex;
						align-items: center;
						// background-color: #f0f0f0;
						padding: 6rpx 12rpx;
						border-radius: 30rpx;
						
						text {
							font-size: 24rpx;
							color: #666;
							margin-left: 4rpx;
						}
						
						&:active {
							background-color: #e0e0e0;
						}
					}
				}
			}
			
			&:focus-within {
				border-color: $pyq-vi-color;
				box-shadow: 0 0 0 2px rgba($pyq-vi-color, 0.1);
			}
		}

		.media-section {
			margin-bottom: 32rpx;
		}

		.images {
			margin-bottom: 32rpx;

			.upload-notice {
				display: flex;
				align-items: center;
				background-color: rgba(33, 150, 243, 0.08);
				padding: 12rpx 16rpx;
				border-radius: 8rpx;
				margin-bottom: 16rpx;
				
				text {
					font-size: 24rpx;
					color: #2196F3;
					margin-left: 8rpx;
				}
			}

			.tip {
				display: block;
				margin-top: 16rpx;
				font-size: 24rpx;
				color: $pyq-text-color-helper;
			}
		}

		.video {
			.video-link-preview {
				position: relative;
				width: 100%;
				padding: 20rpx;
				margin-bottom: 16rpx;
				background-color: #f7f7f7;
				border-radius: 8rpx;
				overflow: hidden;

				.link-container {
					padding-right: 60rpx; // 为删除按钮留出空间
					word-break: break-all;
				}

				.link-text {
					font-size: 28rpx;
					color: #333;
					line-height: 1.5;
				}

				.delete-btn {
					position: absolute;
					top: 15rpx;
					right: 15rpx;
					background: rgba(255, 0, 0, 0.7);
					border-radius: 50%;
					padding: 8rpx;
					z-index: 10;
					width: 40rpx;
					height: 40rpx;
					display: flex;
					align-items: center;
					justify-content: center;
				}
			}

			.video-link-input {
				width: 100%;
				margin-bottom: 16rpx;
				
				.input-container {
					display: flex;
					align-items: center;
					background-color: #f7f7f7;
					border-radius: 8rpx;
					padding: 10rpx 20rpx;
					
					.link-input {
						flex: 1;
						height: 70rpx;
						font-size: 28rpx;
						padding: 0 20rpx;
					}
				}
			}

			.tip {
				display: block;
				font-size: 24rpx;
				color: $pyq-text-color-helper;
			}
		}

		.publish {
			.publish-btn {
				width: 100%;
				height: 88rpx;
				line-height: 88rpx;
				background: linear-gradient(to right, $pyq-vi-color, rgba($pyq-vi-color, 0.6));
				color: #fff;
				font-size: 32rpx;
				border-radius: 44rpx;

				&:active {
					opacity: 0.8;
				}
			}
		}
	
		// 图标自定义面板样式
		.icon-customize-overlay {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(0, 0, 0, 0.6);
			z-index: 9999;
			display: flex;
			align-items: center;
			justify-content: center;
			
			.icon-customize-panel {
				width: 80%;
				max-width: 600rpx;
				background-color: #fff;
				border-radius: 20rpx;
				padding: 30rpx;
				box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
				
				.icon-customize-header {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 30rpx;
					
					.panel-title {
						font-size: 32rpx;
						font-weight: bold;
						color: #333;
					}
					
					.close-btn {
						padding: 10rpx;
					}
				}
				
				.icon-preview {
					width: 200rpx;
					height: 200rpx;
					margin: 0 auto 30rpx;
					border: 1px solid #eee;
					border-radius: 20rpx;
					overflow: hidden;
					display: flex;
					align-items: center;
					justify-content: center;
					
					.preview-image {
						width: 100%;
						height: 100%;
						object-fit: contain;
					}
				}
				
				.customize-controls {
					margin-bottom: 30rpx;
					
					.control-item {
						margin-bottom: 20rpx;
						
						.control-label {
							font-size: 28rpx;
							color: #666;
							margin-bottom: 10rpx;
							display: block;
						}
					}
				}
				
				.customize-buttons {
					display: flex;
					justify-content: space-between;
					gap: 20rpx;
					
					button {
						flex: 1;
						height: 80rpx;
						line-height: 80rpx;
						font-size: 28rpx;
						border-radius: 40rpx;
					}
					
					.cancel-btn {
						background-color: #f5f5f5;
						color: #666;
					}
					
					.save-btn {
						background-color: $pyq-vi-color;
						color: #fff;
					}
				}
			}
		}
	}

	/* 修改 picker 确认按钮的颜色 */
	:deep(.uni-picker-container) {
		.uni-picker-action {
			color: $pyq-vi-color !important;
		}
	}

	/* 移除文本选择样式的全局样式 - 会影响所有textarea */
	:deep(page) {
		/* 微信小程序文本选择样式 */
		/* stylelint-disable-next-line */
		text::selection,
		textarea::selection {
			background-color: rgba(255, 102, 0, 0.2) !important; /* 更明显的选择背景色 */
		}
	}

	/* 覆盖小程序默认的选中样式 */
	.selecting {
		/* 针对微信小程序特定选择样式的覆盖 */
		position: relative;
		user-select: auto;
		-webkit-user-select: auto; /* 增加WebKit支持 */
		
		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			pointer-events: none;
			z-index: 5;
		}
	}
	
	.image-list {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
		
		.image-item {
			position: relative;
			width: 200rpx;
			height: 200rpx;
			
			image {
				width: 100%;
				height: 100%;
				border-radius: 8rpx;
				// 添加样式表明图片可点击
				&:active {
					opacity: 0.8;
				}
			}
			
			.delete-btn {
				position: absolute;
				top: 15rpx;
				right: 15rpx;
				background: rgba(255, 0, 0, 0.7);
				border-radius: 50%;
				padding: 8rpx;
				z-index: 10;
				width: 40rpx;
				height: 40rpx;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.progress-overlay {
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: rgba(0, 0, 0, 0.5);
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				border-radius: 8rpx;

				.progress-text {
					color: #fff;
					font-size: 28rpx;
					margin-bottom: 10rpx;
					font-weight: bold;
					text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
				}

				.progress-bar {
					width: 80%;
					height: 4rpx;
					background: rgba(255, 255, 255, 0.3);
					border-radius: 2rpx;
					overflow: hidden;
					
					.progress {
						height: 100%;
						background: linear-gradient(to right, #fff, #2196F3);
						border-radius: 2rpx;
						transition: width 0.3s ease;
					}
				}
			}
		}
		
		.upload-btn {
			width: 200rpx;
			height: 200rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: #f7f7f7;
			border-radius: 8rpx;
		}
	}

	// 添加视频转换中的动画样式
	.converting-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 8rpx;
		z-index: 5;
		
		.converting-spinner {
			width: 60rpx;
			height: 60rpx;
			border: 4rpx solid rgba(255, 255, 255, 0.3);
			border-top: 4rpx solid #fff;
			border-radius: 50%;
			animation: spin 1s linear infinite;
			margin-bottom: 20rpx;
		}
		
		.converting-text {
			color: #fff;
			font-size: 28rpx;
		}
	}

	// 添加旋转动画
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	// 优化整体布局
	.article-add {
		padding: 20rpx 30rpx; // 减小整体内边距
		
		.form-item {
			margin-bottom: 20rpx; // 减小表单项之间的间距
		}
		
		.section-title {
			font-size: 28rpx; // 减小标题字体大小
			margin-bottom: 10rpx; // 减小标题底部边距
		}
	}

	/* 添加当前仅显示本地分类的提示样式 */
	.location-only-tip {
		display: flex;
		align-items: center;
		background-color: rgba(33, 150, 243, 0.08);
		padding: 8rpx 16rpx;
		border-radius: 8rpx;
		margin-bottom: 16rpx;
		
		text {
			font-size: 24rpx;
			color: #2196F3;
			margin-left: 8rpx;
		}
	}

	// 表情符号面板样式
	.emoji-panel {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #fff;
		border-radius: 20rpx 20rpx 0 0;
		padding: 20rpx;
		box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.1);
		z-index: 999;
		display: flex;
		flex-direction: column;
		max-height: 50vh;
		
		.emoji-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-bottom: 16rpx;
			margin-bottom: 16rpx;
			border-bottom: 1px solid #f0f0f0;
			
			.emoji-title {
				font-size: 28rpx;
				color: #333;
				font-weight: bold;
			}
			
			.emoji-close {
				padding: 8rpx;
				border-radius: 50%;
				background-color: #f5f5f5;
				
				&:active {
					background-color: #e0e0e0;
				}
			}
		}
		
		.emoji-tabs {
			display: flex;
			border-bottom: 1px solid #f0f0f0;
			margin-bottom: 16rpx;
			
			.emoji-tab {
				padding: 12rpx 24rpx;
				font-size: 26rpx;
				color: #666;
				
				&.active {
					color: $pyq-vi-color;
					border-bottom: 2px solid $pyq-vi-color;
				}
			}
		}
		
		.emoji-content {
			flex: 1;
			overflow-y: auto;
			
			.emoji-list {
				display: flex;
				flex-wrap: wrap;
				padding: 10rpx;
				
				.emoji-item {
					width: 70rpx;
					height: 70rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 36rpx;
					margin: 10rpx;
					
					&:active {
						background-color: #f5f5f5;
						border-radius: 8rpx;
					}
				}
			}
		}
	}

	// 模板面板样式
	.template-panel {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		
		.template-container {
			width: 80%;
			max-width: 600rpx;
			background-color: #fff;
			border-radius: 12rpx;
			overflow: hidden;
			max-height: 70vh;
			display: flex;
			flex-direction: column;
			
			.template-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 20rpx;
				background-color: #f9f9f9;
				border-bottom: 1px solid #eee;
				
				.template-title {
					font-size: 30rpx;
					font-weight: bold;
					color: #333;
				}
				
				.close-btn {
					padding: 10rpx;
					border-radius: 50%;
					
					&:active {
						background-color: #e0e0e0;
					}
				}
			}
			
			.template-list {
				flex: 1;
				overflow-y: auto;
				padding: 20rpx;
				
				.template-item {
					padding: 16rpx;
					border-radius: 12rpx;
					background-color: #f9f9f9;
					margin-bottom: 16rpx;
					border: 1px solid #eee;
					
					&:active {
						background-color: rgba($pyq-vi-color, 0.1);
						border-color: rgba($pyq-vi-color, 0.3);
					}
					
					.template-item-header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-bottom: 8rpx;
						
						.template-item-title {
							font-size: 28rpx;
							font-weight: bold;
							color: #333;
						}
					}
					
					.template-preview {
						font-size: 24rpx;
						color: #666;
						line-height: 1.4;
					}
				}
			}
		}
	}

	// 添加图片预览样式
	.image-preview-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.9);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		
		.image-preview-container {
			position: relative;
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			
			.preview-image {
				max-width: 100%;
				max-height: 100%;
			}
			
			.preview-close {
				position: absolute;
				top: 40rpx;
				right: 40rpx;
				width: 80rpx;
				height: 80rpx;
				background-color: rgba(0, 0, 0, 0.5);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}
	}
</style>