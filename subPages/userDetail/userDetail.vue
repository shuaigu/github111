<script setup>
	import { ref, onMounted } from 'vue';
	
	const userId = ref('');
	const userInfo = ref(null);
	const loading = ref(true);
	const enableScroll = ref(true);
	const scrollHeight = ref(0);
	
	// 定义所有可用角色
	const allRoles = [
		{ id: 'admin', name: '管理员', description: '拥有系统管理权限' },
		{ id: 'vip', name: 'VIP用户', description: '拥有特殊内容访问权限' },
		{ id: 'editor', name: '编辑', description: '可以编辑和发布内容' },
		{ id: 'reviewer', name: '审核员', description: '可以审核内容' },
		{ id: 'customer', name: '客服', description: '处理用户反馈' },
		{ id: 'user', name: '普通用户', description: '基础用户权限' }
	];
	
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
	
	// 更新用户状态
	const updateUserStatus = async (status) => {
		try {
			uni.showLoading({
				title: '更新中...'
			});
			
			await userApi.updateUserStatus({
				userId: userId.value,
				status: status
			});
			
			uni.showToast({
				title: '状态更新成功',
				icon: 'success'
			});
			
			// 重新获取用户信息
			getUserDetail();
		} catch (e) {
			uni.showToast({
				title: '更新失败: ' + e.message,
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	};
	
	// 获取角色名称
	const getRoleName = (roleId) => {
		const role = allRoles.find(r => r.id === roleId);
		return role ? role.name : roleId;
	};
	
	// 管理用户角色
	const manageUserRoles = () => {
		// 确保userId有值
		if (userId.value) {
			console.log('跳转到角色管理页面，用户ID:', userId.value);
			
			// 使用更可靠的方式保存用户ID
			try {
				// 确保存储成功
				uni.setStorageSync('CURRENT_MANAGE_USER_ID', userId.value);
				console.log('用户ID已保存到本地存储:', userId.value);
			} catch (e) {
				console.error('保存用户ID到本地存储失败:', e);
			}
			
			// 尝试直接使用本地存储，不通过URL参数传递
			uni.navigateTo({
				url: '/subPages/userRoleManage/userRoleManage',
				success: () => {
					console.log('成功跳转到角色管理页面');
				},
				fail: (err) => {
					console.error('跳转失败:', err);
					uni.showToast({
						title: '页面跳转失败',
						icon: 'none'
					});
				}
			});
		} else {
			uni.showToast({
				title: '用户ID不存在，无法管理角色',
				icon: 'none'
			});
		}
	};
	
	onMounted(() => {
		// 获取系统信息设置滚动区域高度
		uni.getSystemInfo({
			success: (res) => {
				scrollHeight.value = res.windowHeight;
			}
		});
		
		// 获取页面参数的多种方式
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		
		// 尝试多种方式获取参数
		let id = '';
		
		// 方式1: 通过 $page?.options (您当前的方式)
		if (currentPage.$page?.options?.id) {
			id = currentPage.$page.options.id;
		} 
		// 方式2: 通过 options 直接获取
		else if (currentPage.options?.id) {
			id = currentPage.options.id;
		}
		// 方式3: 通过 route 参数获取 (H5常用)
		else {
			const query = uni.getStorageSync('CURRENT_USER_ID');
			if (query) {
				id = query;
				// 使用后清除
				uni.removeStorageSync('CURRENT_USER_ID');
			}
		}
		
		if (id) {
			userId.value = id;
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
	<page-meta :page-style="'overflow:' + (enableScroll ? 'auto' : 'hidden')">
	<scroll-view 
		scroll-y="true" 
		enable-flex="true" 
		class="user-detail-scroll" 
		:style="{ height: scrollHeight + 'px' }"
		show-scrollbar="true"
		enhanced="true"
		bounces="true"
		:scroll-anchoring="true"
	>
		<view class="user-detail">
			<view v-if="loading" class="loading">
				<view class="custom-loader">
					<view class="loader-icon"></view>
					<view class="loader-text">加载中...</view>
				</view>
			</view>
			
			<view v-else-if="userInfo" class="user-info-container">
				<view class="user-header">
					<image class="avatar" :src="userInfo.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
					<view class="name">{{userInfo.nickName || '未设置昵称'}}</view>
					<view class="status" :class="{'status-normal': userInfo.status === 0, 'status-disabled': userInfo.status === 1, 'status-banned': userInfo.status === 2}">
						{{userInfo.status === 0 ? '正常' : userInfo.status === 1 ? '禁用' : '封禁'}}
					</view>
				</view>
				
				<view class="info-section">
					<view class="section-title">基本信息</view>
					<view class="info-item">
						<view class="text-label">用户ID:</view>
						<view class="text-value">{{userInfo._id}}</view>
					</view>
					<view class="info-item">
						<view class="text-label">手机号:</view>
						<view class="text-value">{{userInfo.mobile}}</view>
					</view>
					<view class="info-item">
						<view class="text-label">性别:</view>
						<view class="text-value">{{userInfo.gender === 1 ? '男' : userInfo.gender === 2 ? '女' : '未知'}}</view>
					</view>
					<view class="info-item">
						<view class="text-label">角色:</view>
						<view class="text-value">{{userInfo.role ? userInfo.role.join(', ') : '无'}}</view>
					</view>
					<view class="info-item">
						<view class="text-label">注册时间:</view>
						<view class="text-value">{{new Date(userInfo.create_time).toLocaleString()}}</view>
					</view>
					<view class="info-item">
						<view class="text-label">最后更新:</view>
						<view class="text-value">{{new Date(userInfo.update_time).toLocaleString()}}</view>
					</view>
				</view>
				
				<view class="info-section">
					<view class="section-title">
						用户角色
						<view class="manage-btn" @click="manageUserRoles">管理角色</view>
					</view>
					<view v-if="userInfo.role && userInfo.role.length > 0" class="role-tags">
						<view v-for="roleId in userInfo.role" :key="roleId" class="role-tag">
							{{getRoleName(roleId)}}
						</view>
					</view>
					<view v-else class="no-roles">
						未分配角色
					</view>
				</view>
				
				<view class="info-section">
					<view class="section-title">第三方账号</view>
					<view class="info-item">
						<view class="text-label">微信:</view>
						<view class="text-value">{{userInfo.openid_wx || '未绑定'}}</view>
					</view>
					<view class="info-item">
						<view class="text-label">抖音:</view>
						<view class="text-value">{{userInfo.openid_ds || '未绑定'}}</view>
					</view>
					<view class="info-item">
						<view class="text-label">快手:</view>
						<view class="text-value">{{userInfo.openid_ks || '未绑定'}}</view>
					</view>
				</view>
				
				<view class="action-section">
					<view class="section-title">账号操作</view>
					<view class="action-buttons">
						<view class="btn btn-normal" :class="{disabled: userInfo.status === 0}" @click="userInfo.status !== 0 && updateUserStatus(0)">设为正常</view>
						<view class="btn btn-disable" :class="{disabled: userInfo.status === 1}" @click="userInfo.status !== 1 && updateUserStatus(1)">禁用账号</view>
						<view class="btn btn-ban" :class="{disabled: userInfo.status === 2}" @click="userInfo.status !== 2 && updateUserStatus(2)">封禁账号</view>
					</view>
				</view>
			</view>
			
			<view v-else class="no-data">
				<text>用户信息不存在</text>
			</view>
		</view>
	</scroll-view>
	</page-meta>
</template>

<style lang="scss" scoped>
	@import "@/style/common.scss";
	
	.user-detail {
		@include pagesBaseStyle;
		padding: 20rpx;
		min-height: 121vh;
		padding-bottom: 200rpx;
		
		.loading, .no-data {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 300rpx;
			background-color: #fff;
			border-radius: 12rpx;
			
			.loading-container {
				width: 100%;
				text-align: center;
			}
		}
		
		.no-data {
			color: #999;
			font-size: 28rpx;
		}
		
		.user-info-container {
			background-color: #fff;
			border-radius: 12rpx;
			overflow: hidden;
			
			.user-header {
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 40rpx 0;
				background-color: $pyq-vi-color;
				
				.avatar {
					width: 150rpx;
					height: 150rpx;
					border-radius: 50%;
					border: 4rpx solid rgba(255, 255, 255, 0.8);
					margin-bottom: 20rpx;
				}
				
				.name {
					font-size: 36rpx;
					color: #fff;
					margin-bottom: 10rpx;
				}
				
				.status {
					padding: 6rpx 20rpx;
					border-radius: 30rpx;
					font-size: 24rpx;
					
					&.status-normal {
						background-color: #4caf50;
						color: #fff;
					}
					
					&.status-disabled {
						background-color: #ffc107;
						color: #fff;
					}
					
					&.status-banned {
						background-color: #f44336;
						color: #fff;
					}
				}
			}
			
			.info-section {
				padding: 20rpx;
				border-bottom: 1px solid $pyq-border-color-translucent;
				
				.section-title {
					font-size: 32rpx;
					font-weight: bold;
					color: $pyq-text-color-body;
					margin-bottom: 20rpx;
					padding-left: 20rpx;
					border-left: 6rpx solid $pyq-vi-color;
					display: flex;
					justify-content: space-between;
					align-items: center;
					
					.manage-btn {
						font-size: 24rpx;
						font-weight: normal;
						color: #399bfe;
						padding: 4rpx 16rpx;
						border: 1px solid #399bfe;
						border-radius: 30rpx;
					}
				}
				
				.info-item {
					display: flex;
					padding: 16rpx 0;
					font-size: 28rpx;
					
					.text-label {
						width: 180rpx;
						color: #999;
					}
					
					.text-value {
						flex: 1;
						color: $pyq-text-color-body;
						word-break: break-all;
					}
				}
			}
			
			.role-tags {
				display: flex;
				flex-wrap: wrap;
				padding: 10rpx 0;
				
				.role-tag {
					font-size: 26rpx;
					padding: 8rpx 20rpx;
					border-radius: 30rpx;
					margin-right: 16rpx;
					margin-bottom: 16rpx;
					background-color: #e1f5fe;
					color: #399bfe;
					border: 1px solid #399bfe;
				}
			}
			
			.no-roles {
				padding: 20rpx 0;
				font-size: 28rpx;
				color: #999;
			}
			
			.action-section {
				padding: 20rpx;
				margin-bottom: 320rpx;
				
				.section-title {
					font-size: 32rpx;
					font-weight: bold;
					color: $pyq-text-color-body;
					margin-bottom: 20rpx;
					padding-left: 20rpx;
					border-left: 6rpx solid $pyq-vi-color;
				}
				
				.action-buttons {
					display: flex;
					justify-content: space-between;
					
					.btn {
						width: 30%;
						font-size: 28rpx;
						margin: 0;
						padding: 20rpx 0;
						border-radius: 8rpx;
					}
					
					.btn-normal {
						background-color: #4caf50;
						color: #fff;
					}
					
					.btn-disable {
						background-color: #ffc107;
						color: #fff;
					}
					
					.btn-ban {
						background-color: #f44336;
						color: #fff;
					}
					
					.btn[disabled] {
						opacity: 0.5;
					}
				}
			}
		}
	}
	
	/* 确保所有选择器都是类选择器，避免使用标签选择器 */
	.role-tag {
		/* 替代可能存在的标签选择器 */
	}
	
	.text-label {
		width: 180rpx;
		color: #999;
	}
	
	.text-value {
		flex: 1;
		color: $pyq-text-color-body;
		word-break: break-all;
	}
	
	/* 自定义加载器样式 */
	.custom-loader {
		display: flex;
		flex-direction: column;
		align-items: center;
		
		.loader-icon {
			width: 40rpx;
			height: 40rpx;
			border: 4rpx solid #f3f3f3;
			border-top: 4rpx solid #3498db;
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}
		
		.loader-text {
			margin-top: 20rpx;
			font-size: 28rpx;
			color: #666;
		}
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style> 