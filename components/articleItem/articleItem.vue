<script setup>
	import { ref, watch, computed, onUnmounted } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	import { fixImageUrl, getDefaultImage } from '@/utils/domainConfig.js'
	const userStore = useUserInfoStore( )

	// 定义组件属性
	const props = defineProps( {
		item: {
			type: Object,
			require: true,
			default: ( ) => ( {
				user_info: {
					nickName: '未知用户',
					avatarUrl: '/static/images/default-avatar.png',
					mobile: '未填写'
				}
			} )
		},
		// 是否显示评论区
		showComments: {
			type: Boolean,
			default: false
		},
		// 是否启用头像点击功能
		avatarClickEnabled: {
			type: Boolean,
			default: true
		}
	} )

	// 视频默认缩略图
	const defaultVideoThumbnail = '/static/images/video-thumbnail.png'
	
	// 获取视频缩略图
	const getVideoThumbnail = (video) => {
		if (!video) return defaultVideoThumbnail
		
		if (video.thumbnailURL) {
			return video.thumbnailURL
		}
		
		return defaultVideoThumbnail
	}

	// 自定义格式化日期函数
	const formatDate = (timestamp) => {
		if (!timestamp) return '未知时间'
		
		const now = Date.now()
		const diff = now - timestamp
		
		// 转换为秒
		const seconds = Math.floor(diff / 1000)
		// 转换为分钟
		const minutes = Math.floor(seconds / 60)
		// 转换为小时
		const hours = Math.floor(minutes / 60)
		// 转换为天
		const days = Math.floor(hours / 24)
		
		// 刚刚
		if (seconds < 60) {
			return '刚刚'
		}
		// xx分钟前
		else if (minutes < 60) {
			return `${minutes}分钟前`
		}
		// xx小时前
		else if (hours < 24) {
			return `${hours}小时前`
		}
		// xx天前 (最多显示180天)
		else if (days < 180) {
			return `${days}天前`
		}
		// 具体日期
		else {
			const date = new Date(timestamp)
			const year = date.getFullYear()
			const month = date.getMonth() + 1
			const day = date.getDate()
			const hour = date.getHours()
			const minute = date.getMinutes()
			
			// 格式化为两位数
			const formattedMonth = month < 10 ? `0${month}` : month
			const formattedDay = day < 10 ? `0${day}` : day
			const formattedHour = hour < 10 ? `0${hour}` : hour
			const formattedMinute = minute < 10 ? `0${minute}` : minute
			const timeStr = `${formattedHour}:${formattedMinute}`
			
			// 如果是今年，只显示月日时分
			const nowYear = new Date().getFullYear()
			if (year === nowYear) {
				return `${formattedMonth}月${formattedDay}日 ${timeStr}`
			}
			// 如果不是今年，显示年月日时分
			return `${year}年${formattedMonth}月${formattedDay}日 ${timeStr}`
		}
	}

	// 定义事件
	const emit = defineEmits( [ 'delete', 'contact', 'comment', 'like', 'preview', 'userList',
		'update:comments'
	] )

	// 处理用户列表点击
	const handleUserList = ( user_id ) => {
		// 检查头像点击功能是否启用
		if (!props.avatarClickEnabled) {
			console.log('头像点击功能已禁用')
			uni.showToast({
				title: '此功能开发中',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		emit( 'userList', user_id )
	}

	// 处理删除
	const handleDelete = ( id ) => {
		emit( 'delete', id )
	}

	// 处理联系
	const handleContact = ( mobile ) => {
		emit( 'contact', mobile )
	}

	// 处理评论
	const handleComment = ( id ) => {
		if ( props.showComments ) {
			// 在详情页中，触发评论事件
			emit( 'comment' )
		} else {
			// 在其他页面中，跳转到详情页，同时传递必要的用户信息
			uni.navigateTo( {
				url: `/pages/article/articleDetail?article_id=${id}&user_id=${props.item.user_id}`,
				animationType: 'slide-in-right', // 添加滑入动画
				animationDuration: 300 // 设置动画持续时间为300ms
			} )
		}
	}

	// 处理点赞
	const handleLove = ( id ) => {
		emit( 'like', id )
	}

	// 处理评论更新
	const handleCommentsUpdate = ( newComments ) => {
		emit( 'update:comments', newComments )
	}

	// 点击详情
	const handleDetail = ( article_id ) => {
		console.log( article_id, '跳转文章详情' )
		uni.navigateTo( {
			url: `/pages/article/articleDetail?article_id=${article_id}`,
			animationType: 'slide-in-right', // 添加滑入动画
			animationDuration: 300 // 设置动画持续时间为300ms
		} )
	}

	// 跳转到文章详情
	const goToDetail = ( item ) => {
		if ( !props.showComments ) { // 如果不是在详情页中
			uni.navigateTo( {
				url: `/pages/article/articleDetail?article_id=${item._id}&user_id=${item.user_id}`,
				animationType: 'slide-in-right', // 添加滑入动画
				animationDuration: 300 // 设置动画持续时间为300ms
			} )
		}
	}

	// 计算用户信息
	const userInfo = computed( ( ) => {
		return props.item || {
			nickName: '未知用户',
			avatarUrl: getDefaultImage('avatar'),
			mobile: '未填写'
		}
	} )
	
	// 处理用户头像URL
	const userAvatarUrl = computed(() => {
		const avatarUrl = userInfo.value.user_avatarUrl || userInfo.value.avatarUrl
		if (!avatarUrl || avatarUrl === getDefaultImage('avatar')) {
			return getDefaultImage('avatar')
		}
		return fixImageUrl(avatarUrl)
	})
	
	// 处理文章图片URL
	const processedImages = computed(() => {
		if (!props.item.images || !props.item.images.length) {
			return []
		}
		
		return props.item.images.map(img => {
			const originalUrl = img.compressedURL || img.thumbnailURL || img.url
			if (!originalUrl) {
				return {
					...img,
					processedUrl: getDefaultImage('default')
				}
			}
			
			return {
				...img,
				processedUrl: fixImageUrl(originalUrl)
			}
		})
	})

	const onAvatarError = ( e ) => {
		e.target.src = getDefaultImage('avatar')
	}

	const handlePreview = (url, index) => {
		if (!url) return
		console.log('Preview URL:', url)
		
		// 获取有效图片列表
		const validImages = processedImages.value.filter(img => img.processedUrl)
		// 最多只预览9张图片
		const limitedImages = validImages.slice(0, 9)
		
		if (limitedImages.length) {
			// 提取所有图片URL列表 - 使用处理后的URL
			const urls = limitedImages.map(img => img.processedUrl)
			
			// 使用uni.previewImage实现图片预览和左右滑动功能
			uni.previewImage({
				urls: urls,           // 需要预览的图片链接列表
				current: urls[index], // 当前显示图片的链接
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
				}
			});
		}
	}

	// Add a new function for image preview on long press
	const handleLongPressPreview = (url, index) => {
		if (!url) return
		console.log('Original URL:', url)
		
		// 获取有效图片列表
		const validImages = processedImages.value.filter(img => img.processedUrl)
		// 最多只预览9张图片
		const limitedImages = validImages.slice(0, 9)
		
		if (limitedImages.length) {
			// 提取所有图片URL列表 - 使用处理后的URL
			const urls = limitedImages.map(img => img.processedUrl)
			
			// 传递所有图片URL到父组件进行预览
			emit('preview', urls[index], urls)
		}
	}
</script>

<template>
	<view class="pyqContent">
		<!-- 动态头部 -->
		<view class="pyq-head">
			<view class="left" @click="handleUserList(item.user_id)" :class="{'disabled': !avatarClickEnabled}">
				<view class="userAvatar">
					<image class="avatar-image" :src="userAvatarUrl" mode="aspectFill" @error="onAvatarError"></image>
				</view>
				<view class="info">
					<view class="top">
						<view class="nickName">
							{{userInfo.user_nickName}}
						</view>
						<!-- 审核状态样式 -->
						<view class="examine">
							<slot></slot>
						</view>
					</view>
					<view class="address">
						<uni-icons custom-prefix="icon" type="lishuai-dingwei" size="12" color="#8a8a8a"></uni-icons>
						<text class="address-text">{{item.district || '未知位置'}}</text>
						<text class="time-divider">|</text>
						<text class="time-text">{{ formatDate(item.create_time) }}</text>
					</view>
				</view>
			</view>

			<!-- 文章的功能操作 -->
			<view class="right">
				<view class="operation">
					<!-- 统一根据用户ID判断显示按钮 -->
					<view class="action-btn" v-if="item.user_id === userStore.userInfo.uid"
						@click="handleDelete(item._id)">
						<uni-icons color="#999999" custom-prefix="icon" type="lishuai-shanchu" size="18"></uni-icons>
					</view>
					<view class="action-btn" v-else @click="handleContact(item.user_mobile)">
						<uni-icons color="#5cb85c" custom-prefix="icon" type="lishuai-dianhua" size="18"></uni-icons>
					</view>
				</view>
			</view>
		</view>
		<!-- 动态发布的内容 -->
		<view class="pyq-c" @click="goToDetail(item)">
			<view class="text-content">{{item.content}}</view>
		</view>
		<!-- 动态照片 -->
		<view class="pyq-img" v-if="processedImages?.length">
			<!-- 单张图片显示 -->
			<view class="single-img" v-if="processedImages.length === 1">
				<image class="single-img-item" :lazy-load="true" :src="processedImages[0].processedUrl" mode="widthFix"
					@click="goToDetail(item)"
					@longtap="() => handleLongPressPreview(processedImages[0].processedUrl, 0)"></image>
			</view>
			<!-- 多张图片显示，最多显示9张 -->
			<view class="multi-img" v-else>
				<view :class="['img-grid', `grid-${Math.min(processedImages.length, 9)}`]">
					<image class="grid-item" :lazy-load="true" v-for="(img, index) in processedImages.slice(0, 9)" :key="index" :src="img.processedUrl"
						mode="aspectFill" 
						@click="goToDetail(item)"
						@longtap="() => handleLongPressPreview(img.processedUrl, index)"></image>
				</view>
			</view>
		</view>
		
		<!-- 动态操作功能 -->
		<view class="pyq-gn">
			<!-- 左侧区域，可以放置其他内容或保留空白 -->
			<view class="left-area">
				<!-- 视频标识图标 -->
				<view v-if="item.videoURL || item.video?.videoURL" class="video-info">
					<uni-icons custom-prefix="icon" type="lishuai-shipin" size="14" color="#999999"></uni-icons>
				</view>
			</view>
			
			<!-- 右侧功能区 - 只显示浏览量 -->
			<view class="right">
				<!-- 浏览次数 -->
				<view class="publicTime view-info">
					{{ item.look_count || 0 }}次浏览
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	/*朋友圈动态*/
	.pyqContent {
		flex: 1;
		margin-bottom: 2rpx;
		padding: 24rpx;
		background-color: #fff;

		/* 显示详情按钮 */
		.detail-btn {
			padding: 8rpx 20rpx;
			background-color: #1890ff;
			color: #ffffff;
			border-radius: 8rpx;
			font-size: 24rpx;
		}
		
		/*头部-用户基本信息*/
		.pyq-head {
			display: flex;
			justify-content: space-between;
			align-items: center;

			/*左侧用户信息*/
			.left {
				display: flex;
				align-items: center;

				&.disabled {
					cursor: not-allowed;
					opacity: 0.9;
				}

				/*头像*/
				.userAvatar {
					width: 80rpx;
					height: 80rpx;
					border-radius: 8rpx;
					overflow: hidden;
					
					.avatar-image {
						width: 100%;
						height: 100%;
					}
				}

				.info {
					margin: 0 16rpx;

					.top {
						display: flex;

						/*昵称*/
						.nickName {
							@include gradientText;
							font-size: 28rpx;
						}

						/*审核样式*/
						.examine {
							margin-left: 16rpx;
							color: #fa8c16;
						}
					}

					/*定位*/
					.address {
						font-size: 28rpx;
						color: $pyq-text-color-helper;
						display: flex;
						align-items: center;
						
						.address-text {
							margin-left: 4rpx;
						}

						.time-divider {
							margin: 0 8rpx;
							color: $pyq-text-color-helper;
						}

						.time-text {
							color: $pyq-text-color-helper;
						}
					}
				}
			}

			/*顶部右侧功能*/
			.right {
				display: flex;
				align-items: center;

				.operation {
					position: relative;
					display: flex;
					align-items: center;

					.action-btn {
						padding: 20rpx;
						cursor: pointer;

						&:active {
							opacity: 0.7;
						}
					}
				}
			}
		}

		/*内容-发布文字内容*/
		.pyq-c {
			margin-left: 96rpx;
			font-size: 32rpx;
			color: $pyq-text-color-body;
			cursor: pointer;

			&:active {
				opacity: 0.7;
			}
		}

		/*文字内容*/
		.text-content {
			@include textShenglue(5);
			margin-bottom: 16rpx;
		}

		/*发布的图片*/
		.pyq-img {
			margin-left: 96rpx;

			// 单张图片样式
			.single-img {
				width: 300rpx;
				min-height: 100rpx;
				max-height: 600rpx;
				border-radius: 8rpx;
				overflow: hidden;

				.single-img-item {
					width: 100%;
					height: auto;
					vertical-align: top;
				}
			}

			// 多张图片样式
			.multi-img {
				.img-grid {
					display: flex;
					flex-wrap: wrap;
					gap: 8rpx;

					.grid-item {
						width: 180rpx;
						height: 180rpx;
						border-radius: 8rpx;
					}

					// 4张图片特殊处理
					&.grid-4 {
						width: 420rpx;
					}

					&.grid-9 {
						width: 630rpx;
					}
				}
			}
		}

		/*朋友圈动态操作功能区*/
		.pyq-gn {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-top: 24rpx;
			padding-left: 96rpx;

			/*左侧区域，可以放置其他内容或保留空白 */
			.left-area {
				// 视频信息样式
				.video-info {
					display: flex;
					align-items: center;
					
					.uni-icons {
						position: relative;
						top: 2rpx;
					}
				}
			}

			/*右侧功能区 - 只显示浏览量 */
			.right {
				display: flex;
				align-items: center;

				/*浏览量*/
				.publicTime {
					font-size: 24rpx;
					color: $pyq-text-color-placeholder;
					display: flex;
					align-items: center;
				}
			}
		}
	}
</style>