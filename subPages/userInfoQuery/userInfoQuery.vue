<script setup>
	import { ref, reactive } from 'vue';
	
	const searchForm = reactive({
		mobile: '',
		nickName: ''
	});
	
	const userList = ref([]);
	const loading = ref(false);
	const hasMore = ref(true);
	const page = ref(1);
	const pageSize = 10;
	
	// 定义可用的角色列表
	const availableRoles = [
		{ id: 'user', name: '普通用户', description: '基础用户权限' },
		{ id: 'admin', name: '管理员', description: '拥有系统管理权限' },
		{ id: 'vip', name: 'VIP用户', description: '拥有特殊内容访问权限' },
		{ id: 'editor', name: '编辑', description: '可以编辑和发布内容' }
	];
	
	// 用户API
	const userApi = uniCloud.importObject('user', { customUI: true });
	
	// 搜索用户
	const searchUsers = async () => {
		// 检查是否至少有一个搜索条件
		if (!searchForm.mobile && !searchForm.nickName) {
			uni.showToast({
				title: '请输入手机号或昵称',
				icon: 'none'
			});
			return;
		}
		
		try {
			loading.value = true;
			page.value = 1;
			const result = await userApi.queryUsers({
				...searchForm,
				page: page.value,
				pageSize
			});
			
			// 确保每个用户都有 user 角色
			userList.value = result.data.map(user => ensureUserRole(user));
			hasMore.value = result.data.length >= pageSize;
			
			if (userList.value.length === 0) {
				uni.showToast({
					title: '未找到匹配的用户',
					icon: 'none'
				});
			}
		} catch (e) {
			uni.showToast({
				title: '查询失败: ' + e.message,
				icon: 'none'
			});
		} finally {
			loading.value = false;
		}
	};
	
	// 加载更多
	const loadMore = async () => {
		if (!hasMore.value || loading.value) return;
		
		try {
			loading.value = true;
			page.value++;
			
			const result = await userApi.queryUsers({
				...searchForm,
				page: page.value,
				pageSize
			});
			
			// 确保每个用户都有 user 角色
			const newUsers = result.data.map(user => ensureUserRole(user));
			userList.value = [...userList.value, ...newUsers];
			hasMore.value = result.data.length >= pageSize;
		} catch (e) {
			uni.showToast({
				title: '加载失败: ' + e.message,
				icon: 'none'
			});
			page.value--; // 恢复页码
		} finally {
			loading.value = false;
		}
	};
	
	// 重置搜索
	const resetSearch = () => {
		searchForm.mobile = '';
		searchForm.nickName = '';
		userList.value = [];
		page.value = 1;
		hasMore.value = true;
	};
	
	// 查看用户详情
	const viewUserDetail = (user) => {
		uni.navigateTo({
			url: `/subPages/userDetail/userDetail?id=${user._id}`
		});
	};
	
	// 切换用户角色
	const toggleUserRole = async (user, roleId, event) => {
		// 阻止事件冒泡，避免触发点击整行的事件
		event.stopPropagation();
		
		// 不允许移除 user 角色
		if (roleId === 'user' && user.role && user.role.includes('user')) {
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
			const hasRole = user.role && user.role.includes(roleId);
			
			// 找到角色名称用于提示
			const roleName = availableRoles.find(r => r.id === roleId)?.name || roleId;
			
			// 调用云函数更新用户角色
			await userApi.updateUserRole({
				userId: user._id,
				action: hasRole ? 'remove' : 'add',
				role: roleId
			});
			
			// 更新本地数据
			if (hasRole) {
				// 移除角色
				const index = user.role.indexOf(roleId);
				user.role.splice(index, 1);
			} else {
				// 添加角色
				if (!user.role) {
					user.role = [];
				}
				user.role.push(roleId);
			}
			
			uni.showToast({
				title: hasRole ? `已移除${roleName}权限` : `已设为${roleName}`,
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
	const hasRole = (user, roleId) => {
		return user.role && user.role.includes(roleId);
	};
	
	// 打开角色管理弹窗
	const showRoleManagePopup = (user) => {
		uni.navigateTo({
			url: `/subPages/userRoleManage/userRoleManage?id=${user._id}`
		});
	};
	
	// 确保用户至少有 user 角色
	const ensureUserRole = (user) => {
		if (!user.role) {
			user.role = ['user'];
		} else if (!user.role.includes('user')) {
			user.role.push('user');
		}
		return user;
	};
</script>

<template>
	<view class="user-info-query">
		<view class="search-form">
			<view class="form-title">用户查询</view>
			<view class="form-item">
				<text class="label">手机号码:</text>
				<input type="text" v-model="searchForm.mobile" placeholder="请输入手机号" />
			</view>
			<view class="form-item">
				<text class="label">昵称:</text>
				<input type="text" v-model="searchForm.nickName" placeholder="请输入昵称" />
			</view>
			<view class="form-tips">提示: 可以只输入手机号的一部分进行模糊查询</view>
			<view class="form-actions">
				<button class="btn-search" @click="searchUsers">查询用户</button>
				<button class="btn-reset" @click="resetSearch">重置</button>
			</view>
		</view>
		
		<view class="user-list">
			<view v-if="userList.length === 0 && !loading" class="empty-tip">
				暂无匹配用户，请输入手机号或昵称进行查询
			</view>
			
			<view v-for="(user, index) in userList" :key="index" class="user-item" @click="viewUserDetail(user)">
				<view class="user-avatar">
					<image :src="user.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
				</view>
				<view class="user-info">
					<view class="user-name">{{user.nickName || '未设置昵称'}}</view>
					<view class="user-mobile">
						{{user.mobile}}
					</view>
					<view class="user-roles">
						<view class="user-status" :class="{'status-normal': user.status === 0, 'status-disabled': user.status === 1, 'status-banned': user.status === 2}">
							{{user.status === 0 ? '正常' : user.status === 1 ? '禁用' : '封禁'}}
						</view>
						<view class="role-tags">
							<view v-for="role in availableRoles" :key="role.id" 
								class="role-tag" :class="{'active': hasRole(user, role.id)}"
								@click.stop="toggleUserRole(user, role.id, $event)">
								{{role.name}}
							</view>
							<view class="more-roles" @click.stop="showRoleManagePopup(user)">
								<uni-icons type="more-filled" size="18" color="#999"></uni-icons>
							</view>
						</view>
					</view>
				</view>
				<uni-icons type="right" size="20" color="#CCCCCC"></uni-icons>
			</view>
			
			<view v-if="loading" class="loading">加载中...</view>
			<view v-if="!hasMore && userList.length > 0" class="no-more">没有更多数据了</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	@import "@/style/common.scss";
	
	.user-info-query {
		@include pagesBaseStyle;
		padding: 20rpx;
		
		.search-form {
			background-color: #fff;
			border-radius: 12rpx;
			padding: 20rpx;
			margin-bottom: 20rpx;
			
			.form-title {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 20rpx;
				padding-left: 20rpx;
				border-left: 6rpx solid #399bfe;
			}
			
			.form-item {
				display: flex;
				align-items: center;
				margin-bottom: 20rpx;
				
				.label {
					width: 150rpx;
					font-size: 28rpx;
					color: #333;
				}
				
				input {
					flex: 1;
					height: 70rpx;
					border: 1px solid #eee;
					border-radius: 8rpx;
					padding: 0 20rpx;
					font-size: 28rpx;
				}
			}
			
			.form-tips {
				font-size: 24rpx;
				color: #999;
				margin-bottom: 20rpx;
				padding: 0 20rpx;
			}
			
			.form-actions {
				display: flex;
				justify-content: space-between;
				margin-top: 30rpx;
				
				button {
					width: 45%;
					height: 80rpx;
					line-height: 80rpx;
					font-size: 28rpx;
					border-radius: 8rpx;
				}
				
				.btn-search {
					background-color: #399bfe;
					color: #fff;
				}
				
				.btn-reset {
					background-color: #f5f5f5;
					color: #333;
				}
			}
		}
		
		.user-list {
			background-color: #fff;
			border-radius: 12rpx;
			padding: 20rpx;
			
			.empty-tip {
				text-align: center;
				padding: 40rpx 0;
				color: #999;
				font-size: 28rpx;
			}
			
			.user-item {
				display: flex;
				align-items: center;
				padding: 20rpx 0;
				border-bottom: 1px solid #eee;
				
				&:last-child {
					border-bottom: none;
				}
				
				.user-avatar {
					width: 100rpx;
					height: 100rpx;
					margin-right: 20rpx;
					
					image {
						width: 100%;
						height: 100%;
						border-radius: 50%;
					}
				}
				
				.user-info {
					flex: 1;
					
					.user-name {
						font-size: 30rpx;
						color: #333;
						margin-bottom: 10rpx;
					}
					
					.user-mobile {
						font-size: 26rpx;
						color: #999;
						margin-bottom: 10rpx;
					}
					
					.user-roles {
						display: flex;
						align-items: center;
						flex-wrap: wrap;
						
						.role-tags {
							display: flex;
							flex-wrap: wrap;
							margin-left: 20rpx;
							
							.role-tag {
								font-size: 22rpx;
								padding: 4rpx 12rpx;
								border-radius: 30rpx;
								margin-right: 10rpx;
								margin-bottom: 6rpx;
								background-color: #f5f5f5;
								color: #666;
								border: 1px solid #eee;
								
								&.active {
									background-color: #e1f5fe;
									color: #399bfe;
									border-color: #399bfe;
								}
							}
							
							.more-roles {
								display: flex;
								align-items: center;
								justify-content: center;
								width: 40rpx;
								height: 40rpx;
								margin-left: 6rpx;
							}
						}
					}
					
					.user-status {
						display: inline-block;
						font-size: 24rpx;
						padding: 4rpx 12rpx;
						border-radius: 6rpx;
						
						&.status-normal {
							background-color: #e8f5e9;
							color: #4caf50;
						}
						
						&.status-disabled {
							background-color: #fff8e1;
							color: #ffc107;
						}
						
						&.status-banned {
							background-color: #ffebee;
							color: #f44336;
						}
					}
				}
			}
			
			.loading, .no-more {
				text-align: center;
				padding: 20rpx 0;
				font-size: 26rpx;
				color: #999;
			}
		}
	}
</style> 