<script setup>
	import { ref, onMounted } from 'vue'

	// 公司信息
	const companyInfo = ref({
		name: 'XX科技有限公司', // 默认值，加载前显示
		slogan: '创新科技，引领未来',
		address: '深圳市南山区科技园南区XX大厦A座15楼',
		phone: '',
		email: '',
		workTime: ''
	})

	// 加载状态
	const loading = ref(true)

	// 获取公司信息
	const getCompanyInfo = async () => {
		try {
			const companyApi = uniCloud.importObject('company', { customUI: true })
			const res = await companyApi.getInfo()
			if (res.success && res.data) {
				companyInfo.value = res.data
			}
		} catch (err) {
			uni.showToast({
				title: err.message || '加载失败',
				icon: 'none'
			})
		} finally {
			loading.value = false
		}
	}

	// 拨打电话
	const makePhoneCall = () => {
		if (!companyInfo.value.phone) return
		uni.makePhoneCall({
			phoneNumber: companyInfo.value.phone
		})
	}

	// 发送邮件
	const sendEmail = () => {
		if (!companyInfo.value.email) return
		// 复制邮箱到剪贴板
		uni.setClipboardData({
			data: companyInfo.value.email,
			success: () => {
				uni.showToast({
					title: '邮箱已复制',
					icon: 'success'
				})
			}
		})
	}

	// 生命周期
	onMounted(() => {
		getCompanyInfo()
	})
</script>

<template>
	<view class="company-container">
		<up-loading-page :loading="loading"></up-loading-page>

		<view class="company-card">
			<view class="company-header">
				<text class="company-name">{{ companyInfo.name }}</text>
				<text class="company-slogan">{{ companyInfo.slogan }}</text>
			</view>

			<view class="info-section">
				<!-- 地址信息 -->
				<view class="info-item">
					<uni-icons color="#999999" type="map-pin-ellipse" size="40"></uni-icons>
					<view class="info-content">
						<text class="label">公司地址</text>
						<text class="value">{{ companyInfo.address }}</text>
					</view>
				</view>

				<!-- 联系电话 -->
				<view class="info-item" v-if="companyInfo.phone" @click="makePhoneCall">
					<uni-icons color="#999999" type="phone" size="40"></uni-icons>
					<view class="info-content">
						<text class="label">联系电话</text>
						<text class="value">{{ companyInfo.phone }}</text>
					</view>
				</view>

				<!-- 电子邮箱 -->
				<view class="info-item" v-if="companyInfo.email" @click="sendEmail">
					<uni-icons color="#999999" type="email" size="40"></uni-icons>
					<view class="info-content">
						<text class="label">电子邮箱</text>
						<text class="value">{{ companyInfo.email }}</text>
					</view>
				</view>

				<!-- 工作时间 -->
				<view class="info-item" v-if="companyInfo.workTime">
					<uni-icons color="#999999" type="calendar" size="40"></uni-icons>
					<view class="info-content">
						<text class="label">工作时间</text>
						<text class="value">{{ companyInfo.workTime }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.company-container {
		padding: 40rpx;
		background-color: #f5f7fa;
		min-height: 100vh;
	}

	.company-card {
		background-color: #ffffff;
		border-radius: 24rpx;
		padding: 48rpx;
		box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
	}

	.company-header {
		text-align: center;
		margin-bottom: 64rpx;
		padding-bottom: 40rpx;
		border-bottom: 2rpx solid $pyq-text-color-placeholder;

		.company-name {
			display: block;
			font-size: 48rpx;
			font-weight: 600;
			color: $pyq-text-color-body;
			margin-bottom: 16rpx;
		}

		.company-slogan {
			font-size: 28rpx;
			color: $pyq-text-color-body-secondary;
		}
	}

	.info-section {
		.info-item {
			display: flex;
			align-items: flex-start;
			margin-bottom: 48rpx;

			&:last-child {
				margin-bottom: 0;
			}

			.icon {
				font-size: 20px;
				margin-right: 12px;
				margin-top: 2px;
			}

			.info-content {
				flex: 1;
				margin-left: 16rpx;

				.label {
					display: block;
					font-size: 32rpx;
					margin-bottom: 8rpx;
					color: $pyq-text-color-body-secondary;
				}

				.value {
					display: block;
					font-size: 28rpx;
					color: $pyq-text-color-helper;
					line-height: 1.5;
				}
			}
		}
	}
</style>