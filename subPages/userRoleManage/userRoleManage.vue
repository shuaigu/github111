<script setup>
	import { ref, onMounted } from 'vue';
	
	const userId = ref('');
	const userInfo = ref(null);
	const loading = ref(true);
	
	// 定义所有可用角色
	const allRoles = ref([
		{ id: 'admin', name: '管理员', description: '拥有系统管理权限' },
		{ id: 'vip', name: 'VIP用户', description: '拥有特殊内容访问权限' },
		{ id: 'editor', name: '编辑', description: '可以编辑和发布内容' },
		{ id: 'reviewer', name: '审核员', description: '可以审核内容' },
		{ id: 'customer', name: '客服', description: '处理用户反馈' },
		{ id: 'user', name: '普通用户', description: '基础用户权限' }
	]);
	
	// 用户API
	const userApi = uniCloud.importObject('user', { customUI: true });
	
	// 获取用户详情
	const getUserDetail = async () => {
		try {
			loading.value = true;
			const result = await userApi.getUserById(userId.value);
			userInfo.value = result.data;
			
			// 确保用户至少有 user 角色
			if (!userInfo.value.role) {
				userInfo.value.role = ['user'];
			} else if (!userInfo.value.role.includes('user')) {
				userInfo.value.role.push('user');
			}
		} catch (e) {
			uni.showToast({
				title: '获取用户信息失败: ' + e.message,
				icon: 'none'
			});
		} finally {
			loading.value = false;
		}
	};
	
	// 切换角色
	const toggleRole = async (roleId) => {
		// 不允许移除 user 角色
		if (roleId === 'user' && userInfo.value.role && userInfo.value.role.includes('user')) {
			uni.showToast({
				title: '不能移除普通用户角色',
				icon: 'none'
			});
			return;
		}
		
		try {
			uni.showLoading({
				title: '处理中...'
			});
			
			// 检查用户是否已有该角色
			const hasRole = userInfo.value.role && userInfo.value.role.includes(roleId);
			
			// 调用云函数更新用户角色
			await userApi.updateUserRole({
				userId: userId.value,
				action: hasRole ? 'remove' : 'add',
				role: roleId
			});
			
			// 更新本地数据
			if (hasRole) {
				// 移除角色
				const index = userInfo.value.role.indexOf(roleId);
				userInfo.value.role.splice(index, 1);
			} else {
				// 添加角色
				if (!userInfo.value.role) {
					userInfo.value.role = [];
				}
				userInfo.value.role.push(roleId);
			}
			
			uni.showToast({
				title: hasRole ? '已移除角色' : '已添加角色',
				icon: 'success'
			});
		} catch (e) {
			uni.showToast({
				title: '操作失败: ' + e.message,
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	};
	
	// 检查用户是否有特定角色
	const hasRole = (roleId) => {
		return userInfo.value && userInfo.value.role && userInfo.value.role.includes(roleId);
	};
	
	onMounted(() => {
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		const options = currentPage.$page?.options;
		
		if (options && options.id) {
			userId.value = options.id;
			getUserDetail();
		} else {
			uni.showToast({
				title: '用户ID不存在',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		}
	});
</script>

<template>
	<view class="role-manage">
		<view v-if="loading" class="loading">
			<uni-load-more status="loading" :contentText="{ contentdown: '加载中...' }"></uni-load-more>
		</view>
		
		<view v-else-if="userInfo" class="role-container">
			<view class="user-info">
				<image class="avatar" :src="userInfo.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
				<view class="info">
					<view class="name">{{userInfo.nickName || '未设置昵称'}}</view>
					<view class="mobile">{{userInfo.mobile}}</view>
				</view>
			</view>
			
			<view class="role-list">
				<view class="section-title">角色管理</view>
				<view class="role-item" v-for="role in allRoles" :key="role.id"
					:class="{'role-item-user': role.id === 'user'}">
					<view class="role-info">
						<view class="role-name">{{role.name}}</view>
						<view class="role-desc">{{role.description}}</view>
						<view v-if="role.id === 'user'" class="role-default-badge">默认</view>
					</view>
					<view :class="{'switch-disabled': role.id === 'user' && hasRole('user')}">
						<switch :checked="hasRole(role.id)" color="#399bfe" @change="toggleRole(role.id)" 
							:disabled="role.id === 'user' && hasRole('user')" />
					</view>
				</view>
			</view>
			
			<view class="tips">
				<view class="tip-item">* 角色变更将立即生效</view>
				<view class="tip-item">* 请谨慎分配管理员权限</view>
			</view>
		</view>
		
		<view v-else class="no-data">
			<text>用户信息不存在</text>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	@import "@/style/common.scss";
	
	.role-manage {
		@include pagesBaseStyle;
		padding: 20rpx;
		
		.loading, .no-data {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 300rpx;
			background-color: #fff;
			border-radius: 12rpx;
			
			.no-data {
				color: #999;
				font-size: 28rpx;
			}
		}
		
		.role-container {
			background-color: #fff;
			border-radius: 12rpx;
			overflow: hidden;
			
			.user-info {
				display: flex;
				align-items: center;
				padding: 30rpx;
				border-bottom: 1px solid #eee;
				
				.avatar {
					width: 100rpx;
					height: 100rpx;
					border-radius: 50%;
					margin-right: 20rpx;
				}
				
				.info {
					.name {
						font-size: 32rpx;
						color: #333;
						margin-bottom: 10rpx;
					}
					
					.mobile {
						font-size: 26rpx;
						color: #999;
					}
				}
			}
			
			.role-list {
				padding: 20rpx;
				
				.section-title {
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 20rpx;
					padding-left: 20rpx;
					border-left: 6rpx solid #399bfe;
				}
				
				.role-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 20rpx 0;
					border-bottom: 1px solid #eee;
					
					&:last-child {
						border-bottom: none;
					}
					
					&.role-item-user {
						background-color: #f8f8f8;
					}
					
					.role-info {
						.role-name {
							font-size: 28rpx;
							color: #333;
							margin-bottom: 6rpx;
						}
						
						.role-desc {
							font-size: 24rpx;
							color: #999;
						}
						
						.role-default-badge {
							display: inline-block;
							font-size: 20rpx;
							padding: 2rpx 10rpx;
							background-color: #e1f5fe;
							color: #399bfe;
							border-radius: 20rpx;
							margin-top: 6rpx;
						}
					}
					
					.switch-disabled {
						opacity: 0.6;
					}
				}
			}
			
			.tips {
				padding: 20rpx;
				background-color: #f9f9f9;
				
				.tip-item {
					font-size: 24rpx;
					color: #999;
					line-height: 1.6;
				}
			}
		}
	}
</style> 