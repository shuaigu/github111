<script setup>
	import { ref, watch } from 'vue'

	const props = defineProps({
		show: {
			type: Boolean,
			default: false
		},
		title: {
			type: String,
			default: '添加分类'
		},
		editValue: {
			type: String,
			default: ''
		},
		imageUrl: {
			type: String,
			default: ''
		},
		imageUploading: {
			type: Boolean,
			default: false
		},
		uploadProgress: {
			type: Number,
			default: 0
		},
		isVisible: {
			type: Boolean,
			default: true
		}
	})

	const emit = defineEmits(['update:show', 'confirm', 'choose-image'])

	// 输入内容
	const inputValue = ref('')
	// 本地图片URL
	const localImageUrl = ref('')
	// 是否可见
	const visibleState = ref(true)

	// 监听 show 和 editValue 的组合变化
	watch([() => props.show, () => props.editValue, () => props.imageUrl, () => props.isVisible], ([showVal, editVal, imgVal, visibleVal]) => {
		if (showVal) {
			// 当弹窗显示且有编辑值时，设置输入值
			if (editVal) {
				inputValue.value = editVal
			}
			// 设置图片URL
			localImageUrl.value = imgVal
			// 设置可见性状态
			visibleState.value = visibleVal
		} else {
			// 当弹窗关闭时，清空输入值和图片
			inputValue.value = ''
			localImageUrl.value = ''
			visibleState.value = true
		}
	})

	// 输入事件处理
	const handleInput = (e) => {
		inputValue.value = e.detail.value
	}

	// 选择图片
	const chooseImage = () => {
		emit('choose-image')
	}

	// 确认
	const handleConfirm = () => {
		if (!inputValue.value.trim()) {
			uni.showToast({
				title: '请输入分类名称',
				icon: 'none'
			})
			return
		}
		
		// 发送确认事件，传递分类名称和图片URL
		emit('confirm', {
			cate_name: inputValue.value,
			cate_img: props.imageUrl,
			is_visible: visibleState.value
		})
		
		emit('update:show', false)
		inputValue.value = ''
	}

	// 取消
	const handleCancel = () => {
		emit('update:show', false)
	}
</script>

<template>
	<view class="popup-wrapper" v-if="props.show">
		<!-- 遮罩层 -->
		<view class="mask" @click="handleCancel"></view>
		<!-- 弹窗内容 -->
		<view class="popup-content">
			<view class="popup-title">{{ title }}</view>
			
			<!-- 图片上传区域 -->
			<view class="image-upload-area">
				<view class="image-preview" v-if="props.imageUrl" @click="chooseImage">
					<image :src="props.imageUrl" mode="aspectFill" class="preview-image"></image>
					<view class="image-overlay" v-if="props.imageUploading">
						<view class="progress-text">{{ props.uploadProgress }}%</view>
						<view class="progress-bar">
							<view class="progress" :style="{width: props.uploadProgress + '%'}"></view>
						</view>
					</view>
				</view>
				<view class="image-upload-btn" v-else @click="chooseImage">
					<uni-icons type="camera" size="24" color="#999"></uni-icons>
					<text class="upload-text">点击上传图标</text>
				</view>
			</view>
			
			<view class="popup-body">
				<input type="text" :value="inputValue" @input="handleInput" placeholder="请输入分类名称"
					class="input" />
				
				<view class="visibility-toggle">
					<text class="toggle-label">隐藏此分类</text>
					<switch :checked="!visibleState" @change="e => visibleState = !e.detail.value" color="#399bfe" />
				</view>
			</view>
			<view class="popup-footer">
				<button class="btn cancel-btn" @click="handleCancel">取消</button>
				<button class="btn confirm-btn" @click="handleConfirm">确定</button>
			</view>
		</view>
	</view>
</template>
<style lang="scss" scoped>
	.popup-wrapper {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 9998;
	}

	.popup-content {
		position: relative;
		width: 560rpx;
		background-color: #fff;
		border-radius: 16rpx;
		padding: 48rpx 32rpx;
		z-index: 10000;
	}
	
	.popup-title {
		text-align: center;
		font-size: 32rpx;
		font-weight: bold;
		color: $pyq-text-color-body;
		margin-bottom: 32rpx;
	}
	
	.image-upload-area {
		margin-bottom: 32rpx;
	}
	
	.image-preview {
		width: 120rpx;
		height: 120rpx;
		margin: 0 auto;
		border-radius: 12rpx;
		overflow: hidden;
		position: relative;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	}
	
	.preview-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.image-overlay {
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
	
	.image-upload-btn {
		width: 120rpx;
		height: 120rpx;
		margin: 0 auto;
		background-color: #f8f8f8;
		border: 1rpx dashed #ddd;
		border-radius: 12rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	
	.upload-text {
		font-size: 24rpx;
		color: #999;
		margin-top: 10rpx;
	}

	.popup-body {
		position: relative;
		margin-bottom: 48rpx;
		z-index: 10001;
	}
	
	.input {
		position: relative;
		width: 100%;
		height: 88rpx;
		padding: 0 24rpx;
		background-color: #f7f7f7;
		border-radius: 8rpx;
		font-size: 28rpx;
		box-sizing: border-box;
		z-index: 10002;
		margin-bottom: 24rpx;
	}
	
	.visibility-toggle {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8rpx 24rpx;
	}
	
	.toggle-label {
		font-size: 28rpx;
		color: $pyq-text-color-body;
	}

	.popup-footer {
		display: flex;
		gap: 24rpx;
	}
	
	.btn {
		flex: 1;
		height: 88rpx;
		line-height: 88rpx;
		text-align: center;
		border-radius: 44rpx;
		font-size: 32rpx;
		margin: 0;
		padding: 0;
	}

	.cancel-btn {
		background-color: #f7f7f7;
		color: $pyq-text-color-body;
	}

	.confirm-btn {
		background: linear-gradient(to right, $pyq-vi-color, rgba($pyq-vi-color, 0.6));
		color: #fff;
	}
</style>