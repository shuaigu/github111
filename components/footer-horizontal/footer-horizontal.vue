<template>
	<view class="footer-container">
		<view class="footer-content">
			<view class="home-item" @click="handleHomeClick">
				<uni-icons type="home" size="24" color="#444444"></uni-icons>
				<view class="text">首页</view>
			</view>
			<view class="call-btn" @click="handleCallClick">打电话</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'footer-horizontal',
	methods: {
		handleHomeClick() {
			this.$emit('home-click');
		},
		handleCallClick() {
			this.$emit('call-click');
		}
	}
}
</script>

<style lang="scss">
.footer-container {
	width: 100%;
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #ffffff;
	border-top: 1px solid #e5e5e5;
	padding-bottom: env(safe-area-inset-bottom);
	
	.footer-content {
		display: flex;
		flex-direction: row;
		align-items: center;
		height: 120rpx;
		padding: 16rpx 24rpx;
		
		.home-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-right: 48rpx;
			padding: 8rpx;
			
			.text {
				margin-top: 8rpx;
				font-size: 24rpx;
				color: #333;
			}
			
			&:active {
				opacity: 0.7;
			}
		}
		
		.call-btn {
			flex: 1;
			height: 80rpx;
			line-height: 80rpx;
			text-align: center;
			background-color: #3c98ff;
			color: #fff;
			border-radius: 8rpx;
			font-size: 28rpx;
			font-weight: 500;
			
			&:active {
				opacity: 0.8;
			}
		}
	}
}
</style> 