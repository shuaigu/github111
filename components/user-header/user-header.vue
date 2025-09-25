<script setup>
	import { useUserInfoStore } from '@/store/user'

	const userStore = useUserInfoStore( )
	// 定义组件属性
	const props = defineProps( {
		// 用户头像
		userInfo: {
			type: Object,
			default: ( ) => {

			}
		},
		// 文章总数
		articleTotal: {
			type: Number,
			default: 0
		},
		// 点赞总数
		likesTotal: {
			type: Number,
			default: 0
		}
	} )
	// 定义事件
	const emit = defineEmits( [ 'contact', 'publish' ] )

	// 处理联系按钮点击
	const handleContact = ( ) => {
		emit( 'contact' )
	}
	
	// 处理发布按钮点击
	const handlePublish = () => {
		emit('publish')
	}
</script>

<template>
	<view class="headInfo">
		<view class="background-gradient"></view>
		<!-- 添加发布按钮 -->
		<view class="publish-btn" @click="handlePublish">
			<text class="icon lishuai-qianshuxieyi"></text>
			<text class="publish-text">发布</text>
		</view>
		<view class="left">
			<!-- 用户头像和昵称 -->
			<view class="avatar">
				<image :src="userInfo.avatarUrl" mode="aspectFit"></image>
			</view>
			<view class="nickName">
				{{userInfo.nickName}}
			</view>
		</view>
		<view class="right">
			<!-- 文章信息 -->
			<view class="top">
				<!-- 总发帖 -->
				<view class="articleInfo">
					<view class="articleNum">
						{{articleTotal}}
					</view>
					<view class="textValue">
						总发帖
					</view>
				</view>
				
			</view>
			<!-- 联系方式 -->
			<view class="contarctBtn" @click="handleContact">
				联系方式
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	/*头部*/
	.headInfo {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 80rpx;
		height: 376rpx;
		background-color: transparent;
		position: relative;
		overflow: hidden;
		border-radius: 20rpx;
		box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);

		/* 发布按钮样式 */
		.publish-btn {
			position: absolute;
			top: 30rpx;
			right:30rpx;
			display: flex;
			align-items: center;
			background: rgba(255, 255, 255, 0.25);
			padding: 10rpx 20rpx;
			border-radius: 30rpx;
			cursor: pointer;
			backdrop-filter: blur(5px);
			border: 1px solid rgba(255, 255, 255, 0.3);
			z-index: 10;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
			transition: all 0.3s ease;
			
			.icon {
				font-size: 32rpx;
				color: #fff;
				margin-right: 8rpx;
			}
			
			.publish-text {
				font-size: 26rpx;
				color: #fff;
				font-weight: 500;
			}
			
			&:active {
				transform: scale(0.95);
				background: rgba(255, 255, 255, 0.35);
			}
		}

		.background-gradient {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: linear-gradient(135deg, #6e8efb, #a777e3);
			z-index: -1;
			animation: 渐变背景 15s ease infinite;
			background-size: 400% 400%;
		}

		@keyframes 渐变背景 {
			0% {
				background-position: 0% 50%;
			}
			50% {
				background-position: 100% 50%;
			}
			100% {
				background-position: 0% 50%;
			}
		}

		.left {
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-right: 64rpx;

			/*头像*/
			.avatar {
				margin-bottom: 16rpx;
				width: 180rpx;
				height: 180rpx;
				border-radius: 50%;
				overflow: hidden;
				border: 4rpx solid rgba(255, 255, 255, 0.5);
				box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.15);
				
				image {
					width: 100%;
					height: 100%;
				}
			}

			.nickName {
				font-size: 28rpx;
				color: #fff;
				font-weight: 500;
				@include textShenglue(1)
			}
		}

		.right {
			display: flex;
			flex-direction: column;
			justify-content: center;
			width: 320rpx;
			align-items: center;
			height: 100%;

			.top {
				display: flex;
				justify-content: center;
				align-items: center;
				margin-bottom: 32rpx;
				width: 100%;

				/*发帖*/
				.articleInfo {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					text-align: center;
					
					.articleNum {
						color: #fff;
						font-size: 30rpx;
						line-height: 1.2;
					}
					
					.textValue {
						color: #fff;
						font-size: 24rpx;
						margin-top: 4rpx;
					}
				}
			}

			/*联系方式按钮样式*/
			.contarctBtn {
				padding: 16rpx 24rpx;
				width: 100%;
				text-align: center;
				background-color: rgba(255, 255, 255, 0.25);
				color: #fff;
				border-radius: 32rpx;
				cursor: pointer;
				backdrop-filter: blur(5px);
				border: 1px solid rgba(255, 255, 255, 0.3);

				&:active {
					opacity: 0.8;
				}
			}
		}
	}
</style>