<script setup>
	import { ref } from 'vue';
	import { useUserInfoStore } from '@/store/user.js'
	import { testLogin } from '@/utils/isLogin';

	// 反馈内容
	const feedbackContent = ref( '' )
	// 图片数据
	const imageValue = ref( [ ] )
	// 反馈类型
	const selectedType = ref( '功能建议' )
	// 联系方式
	const contactInfo = ref( '' )
	// 用户store
	const userStore = useUserInfoStore( )
	// 反馈类型列表
	const feedbackTypes = [ '功能建议', '界面设计', '性能问题', '其他' ]
	// 是否正在提交
	const isSubmitting = ref( false )

	// 选择反馈类型
	const selectType = ( type ) => {
		selectedType.value = type
	}

	// 上传成功回调
	const success = ( e ) => {
		const { tempFiles } = e
		imageValue.value = tempFiles
		uni.showToast( {
			title: '上传成功',
			icon: 'success'
		} )
	}

	// 上传失败回调
	const fail = ( e ) => {
		console.error( '上传失败:', e )
		uni.showToast( {
			title: '上传失败',
			icon: 'error'
		} )
	}

	// 提交反馈
	const submitFeedback = async ( ) => {
		// 登录检查
		if ( !userStore.userInfo.isLogin ) {
			return testLogin( )
		}

		// 防止重复提交
		if ( isSubmitting.value ) return

		// 内容验证
		if ( feedbackContent.value.length < 10 ) {
			return uni.showToast( {
				title: '反馈内容至少10个字',
				icon: 'none'
			} )
		}

		// 验证联系方式格式（如果填写了的话）
		if ( contactInfo.value ) {
			const phoneReg = /^1[3-9]\d{9}$/
			const emailReg = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
			if ( !phoneReg.test( contactInfo.value ) && !emailReg.test( contactInfo.value ) ) {
				return uni.showToast( {
					title: '请输入正确的手机号或邮箱',
					icon: 'none'
				} )
			}
		}

		try {
			isSubmitting.value = true
			uni.showLoading( {
				title: '提交中...',
				mask: true
			} )

			const feedbackApi = uniCloud.importObject( 'feedback' )
			const res = await feedbackApi.add( {
				type: selectedType.value,
				content: feedbackContent.value,
				contact: contactInfo.value,
				images: imageValue.value,
				user_id: userStore.userInfo.uid
			} )

			if ( res.success ) {
				uni.hideLoading( )
				uni.showToast( {
					title: '提交成功',
					icon: 'success'
				} )
				// 延迟返回
				setTimeout( ( ) => {
					uni.navigateBack( )
				}, 1500 )
			}
		} catch ( err ) {
			uni.hideLoading( )
			uni.showToast( {
				title: err.message || '提交失败',
				icon: 'none'
			} )
		} finally {
			isSubmitting.value = false
		}
	}

	// 删除图片
	const deleteImage = ( index ) => {
		imageValue.value = imageValue.value.filter( ( _, i ) => i !== index )
	}
</script>

<template>
	<!-- 整体容器 -->
	<view class="feedback-container">
		<!-- 反馈表单卡片 -->
		<view class="feedback-card">
			<!-- 标题区域 -->
			<view class="feedback-header">
				<text class="feedback-title">意见反馈</text>
				<text class="feedback-desc">您的建议是我们进步的动力</text>
			</view>

			<!-- 反馈内容区域 -->
			<view class="feedback-section">
				<!-- 反馈类型选择 -->
				<view class="feedback-item">
					<text class="label">反馈类型</text>
					<view class="type-group">
						<text v-for="type in feedbackTypes" :key="type" class="type-tag"
							:class="{ active: selectedType === type }" @click="selectType(type)">
							{{ type }}
						</text>
					</view>
				</view>

				<!-- 反馈内容输入 -->
				<view class="feedback-item">
					<text class="label">反馈内容</text>
					<up-textarea v-model="feedbackContent" placeholder="请详细描述您的问题或建议（最少10字）"
						count></up-textarea>
				</view>

				<!-- 联系方式 -->
				<view class="feedback-item">
					<text class="label">联系方式（选填）</text>
					<input class="contact-input" v-model="contactInfo" placeholder="请留下您的手机号或邮箱"
						placeholder-style="padding: 0 32rpx;" placeholder-class="placeholder-style" />
				</view>

				<!-- 图片上传区域 -->
				<view class="feedback-item">
					<text class="label">上传图片（选填，最多3张）</text>
					<uni-file-picker v-model="imageValue" fileMediatype="image" mode="grid" :limit="3"
						@success="success" @fail="fail" @delete="deleteImage" :image-styles="{
							width: 200,
							height: 200
						}" />
				</view>
			</view>

			<!-- 提交按钮 -->
			<button class="submit-btn" @click="submitFeedback" :disabled="isSubmitting">
				{{ isSubmitting ? '提交中...' : '提交反馈' }}
			</button>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	/* 页面整体容器样式 */
	.feedback-container {
		padding: 24rpx 24rpx 160rpx 24rpx;
		background-color: #f5f7fa;
		min-height: 100vh;
	}

	/* 反馈表单卡片样式 */
	.feedback-card {
		background-color: #ffffff;
		border-radius: 24rpx;
		padding: 48rpx;
		box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
	}

	/* 标题区域样式 */
	.feedback-header {
		text-align: center;
		margin-bottom: 64rpx;
		padding-bottom: 40rpx;
		border-bottom: 2rpx solid $pyq-text-color-placeholder;

		.feedback-title {
			display: block;
			font-size: 48rpx;
			font-weight: 600;
			color: $pyq-text-color-body;
			margin-bottom: 16rpx;
		}

		.feedback-desc {
			font-size: 28rpx;
			color: $pyq-text-color-body-secondary;
		}
	}

	/* 反馈内容区域样式 */
	.feedback-section {
		.feedback-item {
			margin-bottom: 48rpx;

			.label {
				display: block;
				font-size: 32rpx;
				color: $pyq-text-color-body-secondary;
				margin-bottom: 24rpx;
			}

			/* 反馈类型标签组 */
			.type-group {
				display: flex;
				flex-wrap: wrap;
				gap: 24rpx;

				.type-tag {
					padding: 16rpx 32rpx;
					border-radius: 32rpx;
					font-size: 28rpx;
					color: $pyq-text-color-body-secondary;
					background-color: #f5f7fa;
					border: 2rpx solid transparent;

					&.active {
						color: #399bfe;
						background-color: rgba(57, 155, 254, 0.1);
						border-color: #399bfe;
					}
				}
			}

			/* 文本域样式 */
			.feedback-textarea {
				width: 100%;
				height: 240rpx;
				padding: 24rpx !important;
				border-radius: 16rpx;
				background-color: #f5f7fa;
				font-size: 28rpx;
				color: $pyq-text-color-body;
				box-sizing: border-box;
			}

			/* 输入框样式 */
			.contact-input {
				width: 100%;
				height: 88rpx;
				padding: 0 24rpx !important;
				border-radius: 16rpx;
				background-color: #f5f7fa;
				font-size: 28rpx;
				color: $pyq-text-color-body;
				box-sizing: border-box;
			}
		}
	}

	/* 提交按钮样式 */
	.submit-btn {
		margin-top: 48rpx;
		width: 100%;
		height: 88rpx;
		background-color: #399bfe;
		color: #ffffff;
		font-size: 32rpx;
		border-radius: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;

		&[disabled] {
			opacity: 0.6;
			cursor: not-allowed;
		}

		&:active {
			opacity: 0.8;
		}
	}

	/* placeholder样式 */
	.placeholder-style {
		color: $pyq-text-color-placeholder;
		font-size: 28rpx;
		padding: 24rpx;
	}
</style>