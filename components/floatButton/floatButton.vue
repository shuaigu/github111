<script setup>
	const props = defineProps( {
		// 按钮大小
		size: {
			type: Number,
			default: 90
		},
		// 按钮位置
		position: {
			type: Object,
			default() {
				return {
					bottom: '120rpx',
					right: '40rpx'
				}
			}
		},
		icon: {
			type: String,
			default: 'plus'
		}
	} )

	// 点击事件
	const emit = defineEmits( [ 'click' ] )
	const handleClick = ( ) => {
		emit( 'click' )
	}
</script>

<template>
	<view class="float-button" :style="{
			  width: size + 'rpx',
			  height: size + 'rpx',
			  bottom: position.bottom,
			  right: position.right
		  }" @click="handleClick">
		<uni-icons :type="icon" size="26" color="#fff"></uni-icons>
	</view>
</template>

<style lang="scss" scoped>
	.float-button {
		position: fixed;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #399bfe;
		border-radius: 50%;
		box-shadow: 0 3rpx 20rpx rgba(0, 0, 0, 0.15);
	}
</style>