<script setup>
	import { ref, onMounted, computed, nextTick } from 'vue'
	import { onShow, onHide } from '@dcloudio/uni-app'
	
	// 注意：当前环境中可能存在 SharedArrayBuffer 跨域隔离(COOP/COEP)警告
	// 这个警告是由浏览器引擎产生的，在小程序环境中不影响功能
	// 详情参见：https://developer.chrome.com/blog/enabling-shared-array-buffer/
	
	const cateApi = uniCloud.importObject('cateWx', { customUI: true })
	const qiniuCloud = uniCloud.importObject('qiniuyunCloud', { customUI: true })
	
	// 分类列表数据
	const cateList = ref([])
	const loading = ref(false)
	const dataLoaded = ref(false)
	
	// 滚动相关变量
	const scrollTop = ref(0)
	const oldScrollTop = ref(0)
	const scrollViewId = ref('cateScrollView')
	
	// 批量操作状态
	const batchOperationLoading = ref(false)
	
	// 获取分类列表
	const cateListGet = async () => {
		if (loading.value) return
		
		loading.value = true
		try {
			// 使用 get 方法并传递 showAll=true 来获取所有分类(包括隐藏的)
			const res = await cateApi.get(null, true)
			// 确保 res.data 是数组且不为空
			if (res && res.data && Array.isArray(res.data)) {
				cateList.value = res.data.filter(item => item && typeof item === 'object')
			} else {
				cateList.value = []
				console.warn('获取到的分类数据不是有效的数组')
			}
			dataLoaded.value = true
			
			// 数据加载完成后，保持滚动位置或滚动到顶部
			nextTick(() => {
				if (oldScrollTop.value > 0) {
					// 如果有之前的滚动位置，恢复到该位置
					scrollToPosition(oldScrollTop.value);
				} else {
					// 否则滚动到顶部
					scrollToTop();
				}
			});
		} catch (error) {
			console.error('获取分类列表失败:', error)
			cateList.value = [] // 确保发生错误时设置为空数组
			uni.showToast({
				title: '获取分类失败',
				icon: 'none'
			})
		} finally {
			loading.value = false
		}
	}
	
	// 滚动到顶部
	const scrollToTop = () => {
		scrollTop.value = 0;
		oldScrollTop.value = 0;
	}
	
	// 滚动到指定位置
	const scrollToPosition = (position) => {
		scrollTop.value = position;
	}
	
	// 滚动事件处理
	const handleScroll = (e) => {
		oldScrollTop.value = e.detail.scrollTop;
	}
	
	// 页面显示时获取数据
	onShow(() => {
		if (!dataLoaded.value) {
			cateListGet()
		}
	})
	
	// 组件挂载时初始化
	onMounted(() => {
		cateListGet()
		// 获取设备信息并计算rpx比例
		try {
			const info = uni.getWindowInfo()
			screenInfo.value = {
				windowWidth: info.windowWidth,
				windowHeight: info.windowHeight,
				rpxRatio: 750 / info.windowWidth
			}
		} catch (error) {
			console.error('获取设备信息失败:', error)
			// 使用备用方法
			try {
				const systemInfo = uni.getSystemInfoSync()
				screenInfo.value = {
					windowWidth: systemInfo.windowWidth,
					windowHeight: systemInfo.windowHeight,
					rpxRatio: 750 / systemInfo.windowWidth
				}
			} catch (e) {
				console.error('获取系统信息失败:', e)
			}
		}
	})
	
	// 弹窗显示状态 - 初始值设为 false
	const showPopup = ref(false)
	// 是否是编辑模式
	const isEdit = ref(false)
	// 编辑时的初始值
	const editValue = ref('')
	// 当前编辑的分类ID
	const currentId = ref('')
	// 分类图片
	const cateImage = ref('')
	// 图片上传状态
	const imageUploading = ref(false)
	// 图片上传进度
	const uploadProgress = ref(0)
	// 分类是否可见
	const isVisible = ref(true)
	// 是否处于拖拽排序模式
	const isDragMode = ref(false)
	// 当前拖拽的索引
	const dragIndex = ref(-1)
	// 拖拽触摸点的初始y坐标
	const touchStartY = ref(0)
	// 拖拽位置
	const moveY = ref(0)
	// 记录滑动的起始位置
	const startY = ref(0)
	// 记录元素原始位置，用于计算位移
	const initialItemY = ref(0)
	// 判断是否正在滑动
	const isSliding = ref(false)
	// 记录当前拖拽项的高度
	const dragItemHeight = ref(90) // 默认高度为90rpx
	// 记录屏幕尺寸信息
	const screenInfo = ref({
		windowWidth: 375,
		windowHeight: 667,
		rpxRatio: 2 // 初始默认值，将在挂载时更新
	})
	
	// 序号模式
	const showOrdinalMode = ref(false)
	
	// 是否正在编辑序号
	const editingOrdinal = ref(false)
	
	// 序号编辑值
	const ordinalValues = ref({})
	
	// 序号实时预览
	const previewSortedList = computed(() => {
		if (!showOrdinalMode.value || !cateList.value || cateList.value.length === 0) return []
		
		// 创建带索引的序列，用于排序
		const itemsWithIndex = cateList.value.map((item, index) => {
			return {
				...item,
				originalIndex: index,
				sortValue: ordinalValues.value[item._id] !== undefined 
					? Number(ordinalValues.value[item._id]) 
					: (item.sort_order !== undefined ? Number(item.sort_order) : 0)
			}
		})
		
		// 按sortValue排序
		return [...itemsWithIndex].sort((a, b) => {
			return b.sortValue - a.sortValue // 倒序，大的排前面
		})
	})
	
	// 调整序号值
	const adjustOrdinalValue = (id, amount) => {
		if (!ordinalValues.value[id]) {
			ordinalValues.value[id] = 0
		}
		
		// 转为数字并增加/减少
		let currentValue = Number(ordinalValues.value[id]) || 0
		currentValue += amount
		
		// 确保不小于0
		currentValue = Math.max(0, currentValue)
		
		// 更新值
		ordinalValues.value[id] = currentValue
	}
	
	// 防抖优化 - 输入序号变化时延迟更新
	const debouncedUpdateOrdinal = (id, value) => {
		// 为每个ID创建一个定时器
		if (ordinalUpdateTimers[id]) {
			clearTimeout(ordinalUpdateTimers[id])
		}
		
		// 200ms后更新值
		ordinalUpdateTimers[id] = setTimeout(() => {
			updateOrdinalValue(id, value)
		}, 200)
	}
	
	// 序号更新定时器对象
	const ordinalUpdateTimers = {}
	
	// 计算排序后的列表
	const sortedCateList = computed(() => {
		if (!cateList.value || cateList.value.length === 0) return []
		
		return [...cateList.value].sort((a, b) => {
			// 优先使用sort_order字段排序
			const aSort = a.sort_order !== undefined ? Number(a.sort_order) : 0
			const bSort = b.sort_order !== undefined ? Number(b.sort_order) : 0
			return bSort - aSort // 倒序，让大的排在前面
		})
	})
	
	// 切换序号模式
	const toggleOrdinalMode = () => {
		showOrdinalMode.value = !showOrdinalMode.value
		
		if (showOrdinalMode.value) {
			// 初始化序号编辑值
			ordinalValues.value = {}
			sortedCateList.value.forEach((item, index) => {
				// 使用现有的排序值或根据位置创建新的值（倒序）
				const sortValue = item.sort_order !== undefined ? 
					item.sort_order : 
					sortedCateList.value.length - index
				
				ordinalValues.value[item._id] = sortValue
			})
			
			editingOrdinal.value = false
			
			uni.showToast({
				title: '进入序号排序模式',
				icon: 'none',
				duration: 2000
			})
		} else {
			// 清除所有定时器
			Object.keys(ordinalUpdateTimers).forEach(key => {
				clearTimeout(ordinalUpdateTimers[key])
			})
		}
	}
	
	// 开始编辑序号
	const startEditOrdinal = () => {
		editingOrdinal.value = true
	}
	
	// 保存序号排序
	const saveOrdinalSort = async () => {
		try {
			uni.showLoading({
				title: '保存中...',
				mask: true
			})
			
			// 为每个分类设置排序值
			const updatePromises = Object.entries(ordinalValues.value).map(([id, value]) => {
				return cateApi.updateSort(id, Number(value));
			});
			
			await Promise.all(updatePromises);
			
			// 隐藏加载提示
			uni.hideLoading()
			
			uni.showToast({
				title: '排序已保存',
				icon: 'success'
			});
			
			// 重新获取列表，确保数据一致性
			await cateListGet()
			
			// 退出序号模式
			showOrdinalMode.value = false
		} catch (error) {
			console.error('保存排序失败:', error);
			
			// 隐藏加载提示
			uni.hideLoading()
			
			uni.showToast({
				title: '保存排序失败',
				icon: 'none'
			});
		}
	}
	
	// 取消序号排序
	const cancelOrdinalSort = () => {
		showOrdinalMode.value = false
		editingOrdinal.value = false
		
		uni.showToast({
			title: '已取消序号排序',
			icon: 'none'
		})
	}
	
	// 更新序号值
	const updateOrdinalValue = (id, value) => {
		// 确保是数字
		let numValue = Number(value)
		
		// 检查是否为有效数字
		if (isNaN(numValue)) {
			numValue = 0
		}
		
		// 更新序号值
		ordinalValues.value[id] = numValue
	}
	
	// 开始拖拽
	const dragStart = (index, e) => {
		if (!cateList.value || cateList.value.length === 0 || !isDragMode.value) return
		
		// 获取当前触摸的y坐标
		const touch = e.touches && e.touches[0]
		if (!touch) return
		
		// 获取当前索引的项
		const item = cateList.value[index]
		if (!item) return
		
		// 将之前选中的项目复位
		if (dragIndex.value !== -1 && dragIndex.value !== index) {
			dragEnd()
		}
		
		dragIndex.value = index
		// 记录触摸起始位置
		startY.value = touch.pageY
		touchStartY.value = touch.pageY
		initialItemY.value = index * dragItemHeight.value // 记录项的初始位置（rpx单位）
		isSliding.value = true
		
		// 添加轻微延迟，让视觉效果更好
		setTimeout(() => {
			// 轻微振动，提供触感反馈
			try {
				if (uni.vibrateShort) {
					uni.vibrateShort({
						success: () => {},
						fail: () => {}
					})
				}
			} catch (error) {
				// 忽略振动失败错误
			}
		}, 50)
	}
	
	// 拖拽移动
	const dragMove = (e) => {
		if (dragIndex.value === -1 || !isSliding.value || !cateList.value || cateList.value.length === 0 || !isDragMode.value) return
		
		// 获取当前触摸的y坐标
		const touch = e.touches && e.touches[0]
		if (!touch) return
		
		const pageY = touch.pageY
		moveY.value = pageY
		
		// 计算移动距离
		const moveDistance = pageY - startY.value
		
		// 节流，避免频繁更新导致的卡顿
		if (Math.abs(moveDistance) < 5) return // 微小移动不处理
		
		// 计算当前位置对应的索引
		const itemHeight = dragItemHeight.value // 每项高度，单位rpx
		const pxItemHeight = itemHeight / screenInfo.value.rpxRatio // 转换为px
		
		// 使用 uni.nextTick 确保视图更新后进行处理
		uni.nextTick(() => {
			// 获取拖拽区域的位置信息
			const query = uni.createSelectorQuery()
			query.select('.drag-list').boundingClientRect(data => {
				if (!data) return
				
				// 计算相对于拖拽区域顶部的位置
				const relativeY = pageY - data.top
				
				// 计算目标索引（限制在有效范围内）
				let targetIndex = Math.floor(relativeY / pxItemHeight)
				targetIndex = Math.max(0, Math.min(cateList.value.length - 1, targetIndex))
				
				// 如果目标索引不同于当前拖拽索引，则交换位置
				if (targetIndex !== dragIndex.value) {
					// 获取当前拖拽的项
					const dragItem = cateList.value[dragIndex.value]
					if (!dragItem) return
					
					// 创建新数组而不是直接修改
					const newList = [...cateList.value]
					newList.splice(dragIndex.value, 1)
					newList.splice(targetIndex, 0, dragItem)
					
					// 直接更新数组，小程序环境下更可靠
					cateList.value = newList
					
					// 更新当前拖拽的索引
					dragIndex.value = targetIndex
					
					// 提供轻微触感反馈
					try {
						if (uni.vibrateShort) {
							uni.vibrateShort({
								success: () => {},
								fail: () => {}
							})
						}
					} catch (error) {
						// 忽略振动失败错误
					}
					
					// 更新起始位置，避免重复触发
					startY.value = pageY
				}
			}).exec()
		})
	}
	
	// 结束拖拽
	const dragEnd = async () => {
		// 只有在滑动状态时才执行结束操作
		if (isSliding.value && dragIndex.value >= 0) {
			// 拖拽结束时，短振动
			try {
				if (uni.vibrateShort) {
					uni.vibrateShort({
						success: () => {},
						fail: () => {}
					})
				}
			} catch (error) {
				// 忽略振动失败错误
			}
			
			// 如果有实际拖动过（位置发生了变化），自动保存排序
			// 使用一个轻量级提示，不阻塞用户操作
			uni.showLoading({
				title: '保存中...',
				mask: false
			})
			
			// 等待微小延迟确保界面更新完成
			setTimeout(async () => {
				try {
					// 为每个分类设置排序值
					const updatePromises = cateList.value.map((item, index) => {
						// 使用倒序，让大的排序值排在前面
						const sortValue = cateList.value.length - index;
						return cateApi.updateSort(item._id, sortValue);
					});
					
					await Promise.all(updatePromises);
					
					// 隐藏加载提示
					uni.hideLoading()
					
					// 使用较短时间的轻提示
					uni.showToast({
						title: '排序已自动保存',
						icon: 'success',
						duration: 1500
					});
				} catch (error) {
					console.error('自动保存排序失败:', error);
					
					// 隐藏加载提示
					uni.hideLoading()
					
					uni.showToast({
						title: '保存排序失败，请重试',
						icon: 'none'
					});
				}
			}, 200);
		}
		
		// 重置状态
		dragIndex.value = -1
		isSliding.value = false
	}

	// 添加分类
	const handleAddCate = () => {
		console.log(1)
		// isEdit为false代表此时添加操作
		isEdit.value = false
		// 重置图片和编辑值
		cateImage.value = ''
		editValue.value = ''
		isVisible.value = true
		showPopup.value = true
	}

	// 编辑分类
	const edit = async (id) => {
		if (!id) {
			console.error('编辑分类失败：无效的ID');
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			});
			return;
		}
		
		try {
			isEdit.value = true
			currentId.value = id // 保存当前编辑的ID
			// 根据点击id获取对应分类名称
			const res = await cateApi.get(id)
			if (res && res.data && res.data[0]) {
				console.log(res, '单个获取')
				editValue.value = res.data[0]?.cate_name || ''
				cateImage.value = res.data[0]?.cate_img || ''
				isVisible.value = res.data[0]?.is_visible !== false // 默认为true，除非明确设置为false
				showPopup.value = true
			} else {
				throw new Error('获取分类详情失败');
			}
		} catch (error) {
			console.error('获取分类信息失败:', error);
			uni.showToast({
				title: '获取分类信息失败',
				icon: 'none'
			});
			// 重置编辑状态
			isEdit.value = false;
			currentId.value = '';
		}
	}

	// 删除分类
	const del = async (id) => {
		if (!id) {
			console.error('删除分类失败：无效的ID');
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			});
			return;
		}
		
		// 添加确认框，防止误删
		uni.showModal({
			title: '确认删除',
			content: '是否确认删除该分类？删除后无法恢复',
			confirmText: '删除',
			confirmColor: '#ff0000',
			cancelText: '取消',
			success: async (res) => {
				if (res.confirm) {
					try {
						uni.showLoading({
							title: '删除中...',
							mask: true
						})
						
						const result = await cateApi.del(id)
						
						uni.hideLoading()
						
						if (result && result.deleted === 1) {
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							})
							// 重新获取列表
							await cateListGet()
						} else {
							throw new Error('删除失败')
						}
					} catch (error) {
						uni.hideLoading()
						console.error('删除失败:', error)
						uni.showToast({
							title: '删除失败: ' + (error.message || '未知错误'),
							icon: 'none'
						})
					}
				}
			}
		})
	}
	
	// 选择图片
	const chooseImage = async () => {
		try {
			const res = await uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera']
			})
			
			if (res.tempFilePaths && res.tempFilePaths.length > 0) {
				// 先显示本地临时图片
				const tempPath = res.tempFilePaths[0]
				
				// 上传图片到服务器
				await uploadImage(tempPath)
			}
		} catch (e) {
			console.error('选择图片失败:', e)
			if (e.errMsg !== 'chooseImage:fail cancel') {
				uni.showToast({
					title: '选择图片失败',
					icon: 'none'
				})
			}
		}
	}
	
	// 上传图片到服务器
	const uploadImage = async (filePath) => {
		try {
			imageUploading.value = true
			uploadProgress.value = 0
			
			// 计算文件大小，如果过大则进行压缩
			const fileInfo = await new Promise((resolve, reject) => {
				uni.getFileInfo({
					filePath,
					success: res => resolve(res),
					fail: err => reject(err)
				})
			})
			
			let finalFilePath = filePath
			// 如果图片大于1MB，进行压缩
			if (fileInfo.size > 1024 * 1024) {
				finalFilePath = await new Promise((resolve, reject) => {
					uni.compressImage({
						src: filePath,
						quality: 80,
						success: res => resolve(res.tempFilePath),
						fail: err => reject(err)
					})
				})
			}
			
			// 获取文件扩展名
			const fileExt = finalFilePath.substring(finalFilePath.lastIndexOf('.') + 1).toLowerCase()
			
			// 添加缓存控制和唯一文件名
			const timestamp = Date.now()
			const randomStr = Math.random().toString(36).substring(2, 10)
			const cloudPath = `cate_icons/${timestamp}_${randomStr}.${fileExt}`
			
			// 上传到uniCloud云存储
			const result = await uniCloud.uploadFile({
				filePath: finalFilePath,
				cloudPath,
				onUploadProgress: (progressEvent) => {
					uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
				}
			})
			
			console.log('上传结果:', result)
			
			if (result.fileID) {
				// 获取临时访问链接
				const tempUrl = await uniCloud.getTempFileURL({
					fileList: [result.fileID]
				})
				
				console.log('临时链接:', tempUrl)
				
				if (tempUrl.fileList && tempUrl.fileList[0] && tempUrl.fileList[0].tempFileURL) {
					// 更新图片URL
					cateImage.value = result.fileID
					
					uni.showToast({
						title: '图片上传成功',
						icon: 'success'
					})
				} else {
					throw new Error('获取临时链接失败')
				}
			} else {
				throw new Error('上传失败')
			}
		} catch (e) {
			console.error('上传图片错误:', e)
			uni.showToast({
				title: '图片上传失败: ' + (e.message || '未知错误'),
				icon: 'none'
			})
		} finally {
			imageUploading.value = false
		}
	}

	// 确认添加/编辑--弹框确认事件
	const handleConfirm = async (data) => {
		// 检查是否正在上传图片
		if (imageUploading.value) {
			uni.showToast({
				title: '图片正在上传中，请稍候',
				icon: 'none'
			})
			return
		}
		
		// 如果是字符串，则兼容旧版本
		if (typeof data === 'string') {
			data = {
				cate_name: data,
				cate_img: cateImage.value,
				is_visible: isVisible.value
			}
		} else if (!data.cate_img && cateImage.value) {
			// 确保图片URL被包含
			data.cate_img = cateImage.value
		}
		
		if (isEdit.value) {
			// 编辑逻辑
			console.log('编辑', data)
			const upRes = await cateApi.update(currentId.value, data) // 使用保存的ID
			console.log(upRes)
			if (upRes.updated === 1) {
				uni.showToast({
					title: '更新成功',
					icon: 'none'
				})
				cateListGet()
			}
		} else {
			// 添加逻辑
			console.log('添加', data)
			const res = await cateApi.add(data)
			if (res.id) {
				uni.showToast({
					title: '添加成功',
					icon: 'none'
				})
				cateListGet()
			}
		}
		// 重置当前编辑的ID和图片
		currentId.value = ''
		cateImage.value = ''
	}

	// 点击取消
	const handleCanner = () => {
		showPopup.value = false
	}
	
	// 快速切换可见性
	const toggleVisibility = async (id, currentVisibility) => {
		if (!id) {
			console.error('切换可见性失败：无效的ID');
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			});
			return;
		}
		
		// 反转逻辑：当前是可见的，切换后应该隐藏，反之亦然
		const newVisibility = !currentVisibility;
		
		try {
			// 仅更新可见性字段
			const upRes = await cateApi.update(id, {
				is_visible: newVisibility
			});
			
			if (upRes && upRes.updated === 1) {
				uni.showToast({
					title: newVisibility ? '已启用显示' : '已隐藏分类',
					icon: 'none'
				})
				cateListGet()
			} else {
				throw new Error('切换可见性更新失败');
			}
		} catch (error) {
			console.error('切换可见性失败:', error);
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			});
		}
	}
	
	// 切换拖拽排序模式
	const toggleDragMode = () => {
		if (isDragMode.value) {
			// 退出排序模式（不再询问是否保存，因为已经自动保存）
			isDragMode.value = false;
			uni.showToast({
				title: '已退出排序模式',
				icon: 'none'
			});
		} else {
			// 进入排序模式
			isDragMode.value = true;
			uni.showToast({
				title: '上下滑动排序分类，拖动后自动保存',
				icon: 'none',
				duration: 2500
			});
		}
	}
	
	// 保存排序结果
	const saveSortOrders = async () => {
		try {
			uni.showLoading({
				title: '保存中...',
				mask: true
			})
			
			// 为每个分类设置排序值
			const updatePromises = cateList.value.map((item, index) => {
				// 使用倒序，让大的排序值排在前面
				const sortValue = cateList.value.length - index;
				return cateApi.updateSort(item._id, sortValue);
			});
			
			await Promise.all(updatePromises);
			
			// 隐藏加载提示
			uni.hideLoading()
			
			uni.showToast({
				title: '排序已保存',
				icon: 'success'
			});
			
			// 重新获取列表，确保数据一致性
			await cateListGet()
		} catch (error) {
			console.error('保存排序失败:', error);
			
			// 隐藏加载提示
			uni.hideLoading()
			
			uni.showToast({
				title: '保存排序失败',
				icon: 'none'
			});
		}
	}

	// 格式化图片URL
	const formatImageUrl = (imageUrl) => {
		// 当imageUrl为空或无效值时返回默认图片
		if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
			return '/static/images/default.png';
		}
		
		// 如果是云存储fileID，不做处理
		if (imageUrl.startsWith('cloud://') || 
			imageUrl.startsWith('/static/') || 
			imageUrl.startsWith('http')) {
			return imageUrl;
		}
		
		// 处理相对路径
		if (imageUrl.startsWith('/')) {
			return imageUrl;
		}
		
		return '/static/images/default.png';
	}
	
	// 图片加载错误处理函数
	const handleImageError = (item, e) => {
		if (!item) return;
		console.warn('图片加载失败:', e);
		// 设置为本地默认图片
		item.cate_img = '/static/images/default.png';
	}

	// 一键隐藏所有分类
	const hideAllCategories = async () => {
		if (batchOperationLoading.value) return;
		if (!cateList.value || cateList.value.length === 0) {
			uni.showToast({
				title: '没有可隐藏的分类',
				icon: 'none'
			});
			return;
		}
		
		// 统计可隐藏的分类数量
		const visibleCategories = cateList.value.filter(item => item && item.is_visible !== false);
		
		if (visibleCategories.length === 0) {
			uni.showToast({
				title: '所有分类已经是隐藏状态',
				icon: 'none'
			});
			return;
		}
		
		// 确认操作
		uni.showModal({
			title: '确认隐藏',
			content: `是否隐藏所有分类？将有 ${visibleCategories.length} 个分类被隐藏，隐藏后分类将不会在前台显示。`,
			confirmText: '隐藏全部',
			confirmColor: '#399bfe',
			cancelText: '取消',
			success: async (res) => {
				if (res.confirm) {
					try {
						batchOperationLoading.value = true;
						
						uni.showLoading({
							title: '处理中...',
							mask: true
						});
						
						// 使用分批处理
						// 每批处理的最大数量
						const BATCH_SIZE = 10;
						let successCount = 0;
						const totalCount = visibleCategories.length;
						
						// 分批处理
						for (let i = 0; i < totalCount; i += BATCH_SIZE) {
							const batch = visibleCategories.slice(i, i + BATCH_SIZE);
							
							// 更新加载提示，显示进度
							uni.showLoading({
								title: `处理中 ${i + 1}-${Math.min(i + BATCH_SIZE, totalCount)}/${totalCount}...`,
								mask: true
							});
							
							// 并行处理一批请求
							const batchPromises = batch.map(item => 
								cateApi.update(item._id, { is_visible: false })
									.then(() => successCount++)
									.catch(error => {
										console.error(`更新分类 ${item._id} 失败:`, error);
										return null;
									})
							);
							
							// 等待当前批次完成
							await Promise.all(batchPromises);
						}
						
						// 隐藏加载提示
						uni.hideLoading();
						
						// 显示操作结果
						if (successCount === totalCount) {
							uni.showToast({
								title: `已隐藏全部 ${successCount} 个分类`,
								icon: 'success',
								duration: 2000
							});
						} else {
							uni.showModal({
								title: '操作结果',
								content: `成功隐藏 ${successCount}/${totalCount} 个分类，部分操作可能失败，请刷新后检查。`,
								showCancel: false,
								confirmText: '确定'
							});
						}
						
						// 重新获取列表
						await cateListGet();
						
					} catch (error) {
						console.error('批量隐藏分类失败:', error);
						uni.hideLoading();
						uni.showToast({
							title: '操作失败，请重试',
							icon: 'none'
						});
					} finally {
						batchOperationLoading.value = false;
					}
				}
			}
		});
	}
	
	// 一键显示所有分类
	const showAllCategories = async () => {
		if (batchOperationLoading.value) return;
		if (!cateList.value || cateList.value.length === 0) {
			uni.showToast({
				title: '没有可显示的分类',
				icon: 'none'
			});
			return;
		}
		
		// 统计可显示的分类数量
		const hiddenCategories = cateList.value.filter(item => item && item.is_visible === false);
		
		if (hiddenCategories.length === 0) {
			uni.showToast({
				title: '所有分类已经是显示状态',
				icon: 'none'
			});
			return;
		}
		
		// 确认操作
		uni.showModal({
			title: '确认显示',
			content: `是否显示所有分类？将有 ${hiddenCategories.length} 个分类被显示，显示后分类将会在前台可见。`,
			confirmText: '显示全部',
			confirmColor: '#399bfe',
			cancelText: '取消',
			success: async (res) => {
				if (res.confirm) {
					try {
						batchOperationLoading.value = true;
						
						uni.showLoading({
							title: '处理中...',
							mask: true
						});
						
						// 使用分批处理
						// 每批处理的最大数量
						const BATCH_SIZE = 10;
						let successCount = 0;
						const totalCount = hiddenCategories.length;
						
						// 分批处理
						for (let i = 0; i < totalCount; i += BATCH_SIZE) {
							const batch = hiddenCategories.slice(i, i + BATCH_SIZE);
							
							// 更新加载提示，显示进度
							uni.showLoading({
								title: `处理中 ${i + 1}-${Math.min(i + BATCH_SIZE, totalCount)}/${totalCount}...`,
								mask: true
							});
							
							// 并行处理一批请求
							const batchPromises = batch.map(item => 
								cateApi.update(item._id, { is_visible: true })
									.then(() => successCount++)
									.catch(error => {
										console.error(`更新分类 ${item._id} 失败:`, error);
										return null;
									})
							);
							
							// 等待当前批次完成
							await Promise.all(batchPromises);
						}
						
						// 隐藏加载提示
						uni.hideLoading();
						
						// 显示操作结果
						if (successCount === totalCount) {
							uni.showToast({
								title: `已显示全部 ${successCount} 个分类`,
								icon: 'success',
								duration: 2000
							});
						} else {
							uni.showModal({
								title: '操作结果',
								content: `成功显示 ${successCount}/${totalCount} 个分类，部分操作可能失败，请刷新后检查。`,
								showCancel: false,
								confirmText: '确定'
							});
						}
						
						// 重新获取列表
						await cateListGet();
						
					} catch (error) {
						console.error('批量显示分类失败:', error);
						uni.hideLoading();
						uni.showToast({
							title: '操作失败，请重试',
							icon: 'none'
						});
					} finally {
						batchOperationLoading.value = false;
					}
				}
			}
		});
	}
</script>

<template>
	<view class="cateManage page-scroll">
		<view class="header-actions">
			<!-- 排序方式切换按钮组 -->
			<view class="action-buttons">
				<view 
					class="action-btn" 
					:class="{'active': showOrdinalMode}"
					@click="toggleOrdinalMode"
				>
					<text>序号排序</text>
				</view>
				<view 
					class="action-btn" 
					:class="{'active': isDragMode}"
					@click="toggleDragMode"
				>
					<text>{{ isDragMode ? '退出排序' : '滑动排序' }}</text>
				</view>
			</view>
		</view>
		
		<!-- 批量操作按钮 -->
		<view class="batch-actions" v-if="!loading && cateList.length > 0 && !isDragMode && !showOrdinalMode">
			<view class="batch-title">批量操作：</view>
			<view class="batch-buttons">
				<view class="batch-btn show-all" @click="showAllCategories">
					<uni-icons type="eye-filled" size="18" color="#399bfe"></uni-icons>
					<text>全部显示</text>
				</view>
				<view class="batch-btn hide-all" @click="hideAllCategories">
					<uni-icons type="eye-slash-filled" size="18" color="#666"></uni-icons>
					<text>全部隐藏</text>
				</view>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view class="loading-container" v-if="loading">
			<uni-icons type="spinner-cycle" size="30" color="#399bfe"></uni-icons>
			<text class="loading-text">加载中...</text>
		</view>
		
		<!-- 空状态提示 -->
		<view class="empty-container" v-else-if="cateList.length === 0">
			<uni-icons type="info" size="50" color="#999"></uni-icons>
			<text class="empty-text">暂无分类数据</text>
		</view>
		
		<scroll-view 
			class="cateName" 
			:class="{'sort-mode': isDragMode, 'ordinal-mode': showOrdinalMode}" 
			v-else
			scroll-y="true"
			:enable-back-to-top="true"
			:scroll-with-animation="true"
			:bounces="true"
			:show-scrollbar="true"
			:scroll-top="scrollTop"
			@scroll="handleScroll"
			:id="scrollViewId"
		>
			<!-- 序号排序模式 -->
			<view class="ordinal-list" v-if="showOrdinalMode">
				<view class="ordinal-header">
					<text class="ordinal-title">通过修改序号进行排序 (数字越大排越前)</text>
					<view class="ordinal-actions">
						<button class="btn cancel-btn" @click="cancelOrdinalSort">取消</button>
						<button class="btn save-btn" @click="saveOrdinalSort">保存</button>
					</view>
				</view>
				
				<!-- 排序预览标题 -->
				<view class="preview-header" v-if="previewSortedList.length > 0">
					<text class="preview-title">排序预览</text>
				</view>
				
				<!-- 序号排序项 -->
				<view class="ordinal-item" v-for="item in previewSortedList" :key="item._id">
					<view class="name-container">
						<image 
							class="cate-image" 
							:src="formatImageUrl(item && item.cate_img)" 
							mode="aspectFill" 
							@error="(e) => handleImageError(item, e)"
							@load="() => {}"
						></image>
						<view class="name" :class="{ 'hidden-category': !item.is_visible }">
							{{item ? item.cate_name : ''}}
							<text class="hidden-label" v-if="item && !item.is_visible">(已隐藏)</text>
							<text class="visible-label" v-else-if="item">(已显示)</text>
						</view>
					</view>
					<view class="ordinal-controls">
						<view class="ordinal-btn decrease" @click="adjustOrdinalValue(item._id, -1)">
							<uni-icons type="minus" size="20" color="#666"></uni-icons>
						</view>
						<view class="ordinal-input-wrapper">
							<input 
								type="number" 
								class="ordinal-input" 
								:value="ordinalValues[item._id]" 
								@input="e => debouncedUpdateOrdinal(item._id, e.detail.value)"
								maxlength="5"
							/>
						</view>
						<view class="ordinal-btn increase" @click="adjustOrdinalValue(item._id, 1)">
							<uni-icons type="plus" size="20" color="#399bfe"></uni-icons>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 普通模式 -->
			<view class="normal-list" v-else-if="!isDragMode">
				<view class="value" v-for="(item, index) in sortedCateList" :key="item._id">
					<view class="order-badge">{{item.sort_order || (sortedCateList.length - index)}}</view>
					<view class="name-container">
						<image 
							class="cate-image" 
							:src="formatImageUrl(item && item.cate_img)" 
							mode="aspectFill" 
							@error="(e) => handleImageError(item, e)"
							@load="() => {}"
						></image>
						<view class="name" :class="{ 'hidden-category': !item.is_visible }">
							{{item ? item.cate_name : ''}}
							<text class="hidden-label" v-if="item && !item.is_visible">(已隐藏)</text>
							<text class="visible-label" v-else-if="item">(已显示)</text>
						</view>
					</view>
					<view class="right">
						<switch 
							:checked="item && item.is_visible !== false" 
							@change="() => toggleVisibility(item._id, item && item.is_visible !== false)" 
							color="#399bfe"
							style="margin-right: 16rpx;"
							scale="0.8"
						/>
						<uni-icons @click="edit(item._id)" style="margin-right: 16rpx;" color="#399bfe"
							type="compose" size="22"></uni-icons>
						<uni-icons @click="del(item._id)" color="#e65c00" custom-prefix="iconfont"
							type="icon-shanchu1" size="20"></uni-icons>
					</view>
				</view>
			</view>
			
			<!-- 拖动排序模式 -->
			<view class="drag-list" v-else>
				<movable-area :style="{ width: '100%', height: cateList.length * dragItemHeight + 'rpx' }">
					<movable-view 
						v-for="(item, index) in cateList" 
						:key="item && item._id ? item._id : index"
						direction="vertical"
						:x="0"
						:y="index * dragItemHeight" 
						:style="{ 
							width: '100%', 
							height: dragItemHeight + 'rpx', 
							zIndex: dragIndex === index ? 10 : 1,
							transition: dragIndex === index ? 'none' : 'transform 0.3s ease, background-color 0.2s ease',
							transform: dragIndex === index ? 'scale(1.02)' : 'scale(1)'
						}"
						:animation="dragIndex === index ? false : true"
						@touchstart="(e) => dragStart(index, e)"
						@touchmove="dragMove"
						@touchend="dragEnd"
						@touchcancel="dragEnd"
						:class="{ 'being-dragged': dragIndex === index }"
						:damping="50"
						:friction="10"
					>
						<view class="value" :class="{ 'sliding': dragIndex === index }">
							<view class="name-container">
								<image 
									class="cate-image" 
									:src="formatImageUrl(item && item.cate_img)" 
									mode="aspectFill" 
									@error="(e) => handleImageError(item, e)"
									@load="() => {}"
								></image>
								<view class="name" :class="{ 'hidden-category': item && !item.is_visible }">
									{{item ? item.cate_name : ''}}
									<text class="hidden-label" v-if="item && !item.is_visible">(已隐藏)</text>
									<text class="visible-label" v-else-if="item">(已显示)</text>
								</view>
							</view>
							<view class="right">
								<view class="drag-handle">
									<uni-icons type="bars" size="22" color="#999"></uni-icons>
								</view>
							</view>
						</view>
					</movable-view>
				</movable-area>
			</view>
			
			<!-- 添加底部空白区域确保有滚动空间 -->
			<view class="bottom-space"></view>
		</scroll-view>
	</view>
	<!-- 弹框 -->
	<manage-popup 
		:show="showPopup" 
		:title="isEdit ? '编辑分类' : '添加分类'" 
		:edit-value="editValue"
		:image-url="cateImage"
		:image-uploading="imageUploading"
		:upload-progress="uploadProgress"
		:is-visible="isVisible"
		@choose-image="chooseImage"
		@confirm="handleConfirm" 
		@update:show="handleCanner" 
	/>
	<!-- 悬浮按钮 -->
	<floatButton icon="plus" :size="100" :position="{bottom: '120rpx', right: '40rpx'}"
		@click="handleAddCate"></floatButton>
</template>

<style lang="scss" scoped>
	/*防止分包页面公共样式无法读取*/
	@import "@/style/common.scss";

	.page-scroll {
		min-height: 100vh;
		height: 100vh;
		overflow-y: scroll;
		position: relative;
		-webkit-overflow-scrolling: touch; /* 增强iOS滚动体验 */
		padding-bottom: 150rpx; /* 为悬浮按钮预留空间 */
		box-sizing: border-box;
	}

	.cateManage {
		@include pagesBaseStyle;
		height: auto;
		overflow: visible;
		padding-bottom: 100rpx;
		display: flex;
		flex-direction: column;
		
		.header-actions {
			display: flex;
			justify-content: flex-end;
			padding: 20rpx 24rpx;
			position: sticky;
			top: 0;
			z-index: 10;
			background-color: #f7f7f7;
			border-bottom: 1rpx solid #eee;
			
			.action-buttons {
				display: flex;
				gap: 16rpx;
				
				.action-btn {
					background-color: #399bfe;
					color: #fff;
					font-size: 26rpx;
					padding: 12rpx 24rpx;
					border-radius: 30rpx;
					box-shadow: 0 2rpx 8rpx rgba(57, 155, 254, 0.3);
					transition: all 0.3s;
					
					&.active {
						background-color: #fff;
						color: #399bfe;
						border: 1px solid #399bfe;
					}
				}
			}
		}
		
		.batch-actions {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20rpx 24rpx;
			position: relative;
			z-index: 9;
			background-color: #fff;
			border-bottom: 1rpx solid #eee;
			margin-bottom: 16rpx;
			
			.batch-title {
				font-size: 28rpx;
				color: #666;
			}
			
			.batch-buttons {
				display: flex;
				gap: 16rpx;
				
				.batch-btn {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 8rpx;
					font-size: 26rpx;
					padding: 10rpx 20rpx;
					border-radius: 30rpx;
					transition: all 0.3s;
					
					&.show-all {
						background-color: #eef9ff;
						color: #399bfe;
						border: 1px solid #399bfe;
					}
					
					&.hide-all {
						background-color: #f7f7f7;
						color: #666;
						border: 1px solid #ddd;
					}
					
					&:active {
						transform: scale(0.98);
						opacity: 0.9;
					}
				}
			}
		}
		
		.loading-container,
		.empty-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 80rpx 0;
			background-color: #fff;
			border-radius: 24rpx;
			margin-bottom: 40rpx;
			
			.loading-text,
			.empty-text {
				font-size: 28rpx;
				color: #999;
				margin-top: 20rpx;
			}
		}

		.cateName {
			padding: 24rpx;
			border-radius: 24rpx;
			background-color: #fff;
			margin-bottom: 30rpx;
			flex: 1;
			overflow-y: visible;
			
			.normal-list {
				height: auto;
				overflow-y: visible;
			}
			
			&.sort-mode {
				.value {
					touch-action: none;
					
					&.sliding {
						background-color: #f0f9ff;
						transform: scale(1.01);
						box-shadow: 0 4rpx 16rpx rgba(57, 155, 254, 0.2);
						border-left: 6rpx solid #399bfe;
					}
				}
				
				.drag-list {
					width: 100%;
					height: auto;
					position: relative;
					
					movable-view {
						will-change: transform;
						
						&.being-dragged {
							.value {
								background-color: #f0f9ff;
								border-left: 6rpx solid #399bfe;
								box-shadow: 0 4rpx 16rpx rgba(57, 155, 254, 0.25);
							}
						}
					}
				}
			}

			&.ordinal-mode {
				.ordinal-list {
					width: 100%;
					height: auto;
					position: relative;
					
					.ordinal-header {
						display: flex;
						flex-direction: column;
						justify-content: center;
						padding: 16rpx;
						margin-bottom: 16rpx;
						border-bottom: 1px solid #eee;
						position: sticky;
						top: 0;
						z-index: 9;
						background-color: #fff;
						
						.ordinal-title {
							font-size: 28rpx;
							color: $pyq-text-color-body;
							margin-bottom: 16rpx;
							text-align: center;
						}
						
						.ordinal-actions {
							display: flex;
							justify-content: space-between;
							gap: 16rpx;
							
							.btn {
								margin: 0;
								padding: 0;
								height: 70rpx;
								line-height: 70rpx;
								flex: 1;
								font-size: 28rpx;
								border-radius: 35rpx;
							}
							
							.cancel-btn {
								background-color: #f5f5f5;
								color: #666;
							}
							
							.save-btn {
								background-color: #399bfe;
								color: #fff;
							}
						}
					}
					
					.preview-header {
						padding: 12rpx 16rpx;
						background-color: #f7f9fc;
						margin-bottom: 10rpx;
						border-radius: 8rpx;
						
						.preview-title {
							font-size: 26rpx;
							color: #666;
							text-align: center;
						}
					}
					
					.ordinal-item {
						display: flex;
						align-items: center;
						justify-content: space-between;
						padding: 16rpx;
						border-bottom: 1px solid $pyq-border-color-translucent;
						
						&:nth-last-child(1) {
							border: none;
						}
						
						.name-container {
							display: flex;
							align-items: center;
							flex: 1;
							
							.cate-image {
								width: 60rpx;
								height: 60rpx;
								border-radius: 8rpx;
								margin-right: 16rpx;
								background-color: #f5f5f5;
								object-fit: cover;
								box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
							}
							
							.name {
								font-size: 28rpx;
								
								&.hidden-category {
									color: #999;
								}
								
								.hidden-label {
									font-size: 24rpx;
									color: #999;
									margin-left: 8rpx;
								}
								
								.visible-label {
									font-size: 24rpx;
									color: #399bfe;
									margin-left: 8rpx;
								}
							}
						}
						
						.ordinal-controls {
							display: flex;
							align-items: center;
							
							.ordinal-btn {
								width: 70rpx;
								height: 70rpx;
								display: flex;
								align-items: center;
								justify-content: center;
								background-color: #f5f5f5;
								border-radius: 8rpx;
								
								&.decrease {
									margin-right: 8rpx;
									border: 1px solid #ddd;
								}
								
								&.increase {
									margin-left: 8rpx;
									background-color: #eef8ff;
									border: 1px solid #c0e0ff;
								}
								
								&:active {
									opacity: 0.8;
									transform: scale(0.95);
								}
							}
							
							.ordinal-input-wrapper {
								min-width: 80rpx;
								width: 80rpx;
								height: 70rpx;
								border: 1px solid #ddd;
								border-radius: 8rpx;
								display: flex;
								align-items: center;
								justify-content: center;
								background-color: #fcfcfc;
								
								.ordinal-input {
									width: 100%;
									height: 100%;
									border: none;
									outline: none;
									text-align: center;
									font-size: 28rpx;
									background-color: transparent;
									color: #399bfe;
								}
							}
						}
					}
				}
			}

			.value {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 16rpx;
				font-size: 28rpx;
				color: $pyq-text-color-body;
				border-bottom: 1px solid $pyq-border-color-translucent;
				background-color: #fff;
				transition: all 0.2s ease;
				position: relative;

				&:nth-last-child(1) {
					border: none;
				}
				
				.order-badge {
					position: absolute;
					left: 0;
					top: 0;
					height: 36rpx;
					min-width: 36rpx;
					padding: 0 8rpx;
					background-color: #399bfe;
					color: #fff;
					font-size: 22rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					border-bottom-right-radius: 8rpx;
				}

				.name-container {
					display: flex;
					align-items: center;
					margin-left: 16rpx;
					
					.cate-image {
						width: 60rpx;
						height: 60rpx;
						border-radius: 8rpx;
						margin-right: 16rpx;
						background-color: #f5f5f5;
						object-fit: cover;
						box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
					}
					
					.name {
						font-size: 28rpx;
						
						&.hidden-category {
							color: #999;
						}
						
						.hidden-label {
							font-size: 24rpx;
							color: #999;
							margin-left: 8rpx;
						}
						
						.visible-label {
							font-size: 24rpx;
							color: #399bfe;
							margin-left: 8rpx;
						}
					}
				}

				.right {
					display: flex;
					align-items: center;
					
					.drag-handle {
						padding: 10rpx;
					}
				}
			}
		}
		
		.bottom-space {
			height: 120rpx; /* 底部留空 */
		}
	}
</style>