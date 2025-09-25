<script setup>
	import { useUserInfoStore } from "@/store/user.js"
	import formatTime from '@/utils/formatTime.js'
	const userInfoStore = useUserInfoStore( )

	// 定义组件属性
	const props = defineProps( {
		comments: {
			type: Array,
			default: ( ) => [ ]
		},
		articleId: {
			type: String,
			default: ''
		},
		articleUserId: {
			type: String,
			default: ''
		},
		showMobile: {
			type: Boolean,
			default: false
		}
	} )

	// 定义事件
	const emit = defineEmits( [ 'update:comments', 'reply', 'delComment' ] )

	// 判断是否是自己的评论
	const isOwnComment = ( comment ) => {
		return comment.user_id === userInfoStore.userInfo.uid
	}

	// 处理评论点击
	const handleCommentClick = ( comment ) => {
		console.log( comment )
		// 如果是自己的评论，不做任何响应
		if ( isOwnComment( comment ) ) return

		// 如果是别人的评论，触发回复事件
		emit( 'reply', comment )
	}

	// 处理删除评论
	const handleDeleteComment = ( commentId ) => {
		emit( 'delComment', commentId )
	}
	
	// 判断是否是帖子发布者
	const isPostAuthor = () => {
		// 确保当前用户已登录
		if (!userInfoStore.userInfo || !userInfoStore.userInfo.uid) {
			return false
		}
		
		// 确保articleUserId存在
		if (!props.articleUserId) {
			return false
		}
		
		// 检查当前用户是否是帖子的发布者
		return userInfoStore.userInfo.uid === props.articleUserId
	}
	
	// 处理拨打电话
	const handleCallPhone = (mobile) => {
		// 只有帖子发布者才能拨打电话
		if (!isPostAuthor()) {
			return
		}
		
		// 拨打电话前确认
		uni.showModal({
			title: '拨打电话',
			content: `确定要拨打 ${mobile} 吗？`,
			success: (res) => {
				if (res.confirm) {
					uni.makePhoneCall({
						phoneNumber: mobile,
						fail: (err) => {
							uni.showToast({
								title: '拨打电话失败',
								icon: 'none'
							})
						}
					})
				}
			}
		})
	}
	
	// 格式化手机号，隐藏中间4位
	const formatMobile = (mobile) => {
		if (!mobile || mobile.length < 7) return mobile
		
		// 标准手机号处理 (例如：138****1234)
		if (mobile.length === 11) {
			return mobile.substring(0, 3) + '****' + mobile.substring(7)
		}
		
		// 其他格式的号码，简单处理
		const start = Math.floor(mobile.length / 3)
		const end = mobile.length - start
		return mobile.substring(0, start) + '****' + mobile.substring(end)
	}

	// 处理预览单张评论图片
	const previewCommentImage = (imageUrl) => {
		if (!imageUrl) return
		
		uni.previewImage({
			current: imageUrl,
			urls: [imageUrl],
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
	
	// 处理预览多张评论图片
	const previewCommentImages = (images, currentIndex) => {
		if (!images || images.length === 0) return
		
		uni.previewImage({
			current: images[currentIndex],
			urls: images,
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
</script>

<template>
	<view class="comment-list">
		<view class="debug-panel" v-if="false">
			调试信息: showMobile={{showMobile}} | articleUserId={{articleUserId}} | 
			当前用户={{userInfoStore.userInfo?.uid}}
		</view>
		
		<view v-for="(comment,index) in comments" :key="index" class="comment-item">
			<!-- 用户头像 -->
			<image class="avatar" :src="comment.avatarUrl" mode="aspectFill"></image>

			<view class="comment-content" @click="handleCommentClick(comment)"
				:class="{ 'own-comment': isOwnComment(comment) }">
				<!-- 用户名和时间 -->
				<view class="comment-header">
					<view class="user-info">
						<view class="name-container">
							<text class="username">{{comment.nickName}}</text>
							<!-- 手机号显示在昵称后面 - 仅对帖子发布者显示 -->
							<view class="mobile-badge clickable" 
								v-if="showMobile && comment.mobile && isPostAuthor()" 
								@click.stop="handleCallPhone(comment.mobile)"
							>
								<uni-icons type="phone" size="11" color="#399bfe"></uni-icons>
								<text>{{formatMobile(comment.mobile)}}</text>
							</view>
						</view>
					</view>
					<view class="time-action">
						<!-- 显示删除按钮（自己的评论或文章作者） -->
						<view 
							v-if="isOwnComment(comment)" 
							class="delete-btn"
							@click.stop="handleDeleteComment(comment._id)"
						>
							<uni-icons 
								custom-prefix="iconfont" 
								type="icon-shanchu1" 
								size="16" 
								color="#999"
							></uni-icons>
						</view>
					</view>
				</view>

				<!-- 评论内容 -->
				<view class="comment-text">
					<!-- 如果是回复其他评论 -->
					<template v-if="comment.reply_to">
						<text class="reply-text">回复</text>
						<text class="reply-name">{{comment.reply_to.nickName}}</text>
					</template>
					
					<view class="content-time-wrapper">
						<view class="comment-text-container">
							<text class="content" v-if="comment.content">{{comment.content}}</text>
							
							<!-- 单张图片评论（旧版本兼容） -->
							<view class="comment-image-wrapper" v-if="comment.imageUrl && (!comment.images || comment.images.length === 0)">
								<image 
									:src="comment.imageUrl" 
									mode="widthFix" 
									class="comment-image" 
									@click.stop="previewCommentImage(comment.imageUrl)"
								></image>
							</view>
							
							<!-- 多张图片评论（新版本） -->
							<view class="comment-images-grid" v-if="comment.images && comment.images.length > 0">
								<view 
									v-for="(img, imgIndex) in comment.images" 
									:key="imgIndex" 
									class="comment-image-item"
									@click.stop="previewCommentImages(comment.images, imgIndex)"
								>
									<image 
										:src="img" 
										mode="aspectFill" 
										class="grid-image"
									></image>
								</view>
							</view>
							
							<text class="time">{{formatTime(comment.create_time)}}</text>
						</view>
					</view>
				</view>
				
				<!-- 评论底部区域取消 -->
				<view class="comment-footer" style="display: none;">
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	/*评论列表*/
	.comment-list {
		padding: 0 24rpx;

		.comment-item {
			display: flex;
			align-items: flex-start;
			padding: 24rpx 0;
			border-bottom: 1px solid #f5f5f5;

			.avatar {
				width: 64rpx;
				height: 64rpx;
				border-radius: 8rpx;
				margin-right: 16rpx;
				background-color: #f5f5f5;
			}

			.comment-content {
				position: relative;
				flex: 1;

				&:active:not(.own-comment) {
					opacity: 0.7;
				}

				&.own-comment {
					cursor: default;
				}

				.comment-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 12rpx;
					
					.user-info {
						display: flex;
						align-items: center;
						flex-wrap: wrap;
						
						.name-container {
							display: flex;
							align-items: center;
							flex-wrap: wrap;
						}
						
						.username {
							color: $pyq-vi-color;
							font-weight: 500;
							font-size: 28rpx;
						}
						
						.mobile-badge {
							display: inline-flex;
							align-items: center;
							font-size: 20rpx;
							color: #399bfe;
							margin-left: 8rpx;
							padding: 0 6rpx;
							border-radius: 4rpx;
							max-width: 140rpx;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
							border: 1px solid rgba(57, 155, 254, 0.2);
							background-color: rgba(57, 155, 254, 0.05);
							height: 28rpx;
							vertical-align: middle;
							
							&.clickable {
								position: relative;
								cursor: pointer;
								
								&:active {
									opacity: 0.7;
									background-color: rgba(57, 155, 254, 0.1);
								}
							}
							
							text {
								margin-left: 2rpx;
								font-size: 18rpx;
								transform-origin: left center;
								display: inline-block;
								line-height: 1;
							}
							
							uni-icons {
								transform: scale(0.85);
							}
						}
					}

					.time-action {
						display: flex;
						align-items: center;
						justify-content: flex-end;

						.delete-btn {
							padding: 4rpx 12rpx;
							margin-left: auto;
							background-color: #f8f8f8;
							border-radius: 20rpx;
							display: flex;
							align-items: center;
							
							&::after {
								content: "删除";
								font-size: 22rpx;
								color: #666;
								margin-left: 4rpx;
							}
							
							&:active {
								background-color: #eeeeee;
								opacity: 0.8;
							}
						}
					}
				}

				.comment-text {
					font-size: 28rpx;
					color: $pyq-text-color-body;
					position: relative;
					
					.reply-text {
						color: $pyq-text-color-helper;
						margin: 0 8rpx;
					}

					.reply-name {
						color: $pyq-vi-color;
						font-weight: 500;
					}

					.content-time-wrapper {
						margin-top: 4rpx;
						line-height: 1.5;
						margin-left: 8rpx;
						display: block;
						
						.comment-text-container {
							display: block;
							width: 100%;
						}
						
						.content {
							font-size: 28rpx;
							color: $pyq-text-color-body;
							word-break: break-all;
							white-space: pre-wrap;
						}
						
						.time {
							font-size: 22rpx;
							color: #999;
							margin-left: 8rpx;
							vertical-align: baseline;
						}
					}

					.comment-image-wrapper {
						margin: 10rpx 0;
						width: 100%;
						max-width: 400rpx;
						border-radius: 8rpx;
						overflow: hidden;
						background-color: #f5f5f5;
						
						.comment-image {
							width: 100%;
							border-radius: 8rpx;
						}
					}
					
					// 多图网格布局
					.comment-images-grid {
						display: flex;
						flex-wrap: wrap;
						gap: 8rpx;
						margin-top: 8rpx;
						margin-bottom: 8rpx;
					}
					
					.comment-image-item {
						width: 150rpx;
						height: 150rpx;
						overflow: hidden;
						border-radius: 8rpx;
					}
					
					.grid-image {
						width: 100%;
						height: 100%;
						object-fit: cover;
					}
				}
				
				.comment-footer {
					display: flex;
					justify-content: flex-end;
					margin-top: 16rpx;
				}
			}
		}
	}
</style>