<script setup>
	import { ref, onMounted } from 'vue'

	// 公司信息
	const companyInfo = ref({
		name: '', // 公司名称
		slogan: '', // 公司口号
		address: '', // 公司地址
		phone: '', // 联系电话
		email: '', // 电子邮箱
		workTime: '' // 工作时间
	})

	// 加载状态
	const loading = ref(true)
	// 保存状态
	const saving = ref(false)

	// 获取公司信息
	const getCompanyInfo = async () => {
		try {
			const companyApi = uniCloud.importObject('company', { customUI: true })
			const res = await companyApi.getInfo()
			if (res.success) {
				companyInfo.value = res.data || companyInfo.value
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

	// 保存公司信息
	const saveCompanyInfo = async () => {
		// 表单验证
		if (!companyInfo.value.name.trim()) {
			return uni.showToast({
				title: '请输入公司名称',
				icon: 'none'
			})
		}

		// 验证电话格式
		if (companyInfo.value.phone && !/^1[3-9]\d{9}$/.test(companyInfo.value.phone)) {
			return uni.showToast({
				title: '请输入正确的手机号码',
				icon: 'none'
			})
		}

		// 验证邮箱格式
		if (companyInfo.value.email && !/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(companyInfo.value.email)) {
			return uni.showToast({
				title: '请输入正确的邮箱地址',
				icon: 'none'
			})
		}

		try {
			saving.value = true
			const companyApi = uniCloud.importObject('company', { customUI: true })
			const res = await companyApi.updateInfo(companyInfo.value)
			
			if (res.success) {
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				})
			}
		} catch (err) {
			uni.showToast({
				title: err.message || '保存失败',
				icon: 'none'
			})
		} finally {
			saving.value = false
		}
	}

	// 生命周期
	onMounted(() => {
		getCompanyInfo()
	})
</script>

<template>
	<view class="company-info">
		<up-loading-page :loading="loading"></up-loading-page>

		<view class="info-form" v-if="!loading">
			<!-- 公司名称 -->
			<view class="form-item">
				<text class="label">公司名称</text>
				<input class="input" v-model="companyInfo.name" placeholder="请输入公司名称" />
			</view>

			<!-- 公司口号 -->
			<view class="form-item">
				<text class="label">公司口号</text>
				<input class="input" v-model="companyInfo.slogan" placeholder="请输入公司口号" />
			</view>

			<!-- 公司地址 -->
			<view class="form-item">
				<text class="label">公司地址</text>
				<input class="input" v-model="companyInfo.address" placeholder="请输入公司地址" />
			</view>

			<!-- 联系电话 -->
			<view class="form-item">
				<text class="label">联系电话</text>
				<input class="input" v-model="companyInfo.phone" placeholder="请输入联系电话" type="number" />
			</view>

			<!-- 电子邮箱 -->
			<view class="form-item">
				<text class="label">电子邮箱</text>
				<input class="input" v-model="companyInfo.email" placeholder="请输入电子邮箱" type="email" />
			</view>

			<!-- 工作时间 -->
			<view class="form-item">
				<text class="label">工作时间</text>
				<input class="input" v-model="companyInfo.workTime" placeholder="请输入工作时间" />
			</view>

			<!-- 保存按钮 -->
			<button class="save-btn" 
				:disabled="saving" 
				:loading="saving"
				@click="saveCompanyInfo">
				{{ saving ? '保存中...' : '保存' }}
			</button>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.company-info {
		min-height: 100vh;
		background-color: #f5f7fa;
		padding: 24rpx;
	}

	.info-form {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 32rpx;

		.form-item {
			margin-bottom: 32rpx;

			.label {
				display: block;
				font-size: 28rpx;
				color: $pyq-text-color-body;
				margin-bottom: 16rpx;
			}

			.input {
				width: 100%;
				height: 80rpx;
				background-color: #f5f7fa;
				border-radius: 8rpx;
				padding: 0 24rpx;
				font-size: 28rpx;
				color: $pyq-text-color-body;
				box-sizing: border-box;

				&::placeholder {
					color: $pyq-text-color-placeholder;
				}
			}
		}

		.save-btn {
			margin-top: 48rpx;
			width: 100%;
			height: 88rpx;
			background-color: $pyq-vi-color;
			color: #fff;
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
	}
</style>