<script setup>
	import {
		computed,
		onMounted,
		ref,
	} from 'vue'
	import {
		useUserInfoStore
	} from '@/store/user.js'
	// 导入用户信息store
	const userStore = useUserInfoStore()
	// 用户云对象
	const userApi = uniCloud.importObject('userWx', { customUI: true })

	// 点击登录
	const clickLogin = async () => {
		uni.navigateTo({
			url: "/pages/login/login"
		})
	}

	// 修改头像
	const changeAvatar = () => {
		// 判断是否已登录
		if (!userStore.userInfo.isLogin) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			})
			return
		}
		
		// 检查环境是否支持微信官方的头像选择接口
		// #ifdef MP-WEIXIN
		const version = wx.getSystemInfoSync().SDKVersion
		const canUseChooseAvatar = compareVersion(version, '2.21.2') >= 0
		
		if (canUseChooseAvatar) {
			// 小程序环境下已经使用了button的open-type="chooseAvatar"
			// 此处无需额外处理，用户点击头像会触发原生的选择头像功能
			uni.showToast({
				title: '点击选择头像按钮进行更换',
				icon: 'none'
			})
			return
		}
		// #endif
		
		// 非小程序环境或低版本基础库使用通用的chooseImage
		uni.chooseImage({
			count: 1, // 默认9
			sizeType: ['compressed'], // 压缩图片
			sourceType: ['album', 'camera'], // 从相册选择或拍照
			success: async (res) => {
				try {
					const tempFilePath = res.tempFilePaths[0]
					await uploadAndSaveAvatar(tempFilePath)
				} catch (error) {
					console.error('更新头像失败:', error)
					uni.showToast({
						title: error.message || '头像更新失败',
						icon: 'none'
					})
				}
			}
		})
	}
	
	// 处理微信头像选择回调
	const onChooseAvatar = async (e) => {
		const { avatarUrl } = e.detail
		if (avatarUrl) {
			try {
				await uploadAndSaveAvatar(avatarUrl)
			} catch (error) {
				console.error('更新头像失败:', error)
				uni.showToast({
					title: error.message || '头像更新失败',
					icon: 'none'
				})
			}
		}
	}
	
	// 上传并保存头像的通用方法
	const uploadAndSaveAvatar = async (tempFilePath) => {
		// 显示上传提示
		uni.showLoading({
			title: '更新头像中...'
		})
		
		try {
			// 上传图片到云存储
			const uploadRes = await uniCloud.uploadFile({
				filePath: tempFilePath,
				cloudPath: `avatar/${userStore.userInfo.uid}_${Date.now()}.jpg`
			})
			
			if (!uploadRes.fileID) {
				throw new Error('头像上传失败')
			}
			
			// 调用云函数更新用户头像
			const result = await userApi.updateUserProfile({
				uid: userStore.userInfo.uid,
				avatarUrl: uploadRes.fileID
			})
			
			if (result.code === 0) {
				// 更新本地store
				userStore.updateUserAvatar(uploadRes.fileID)
				
				uni.showToast({
					title: '头像更新成功',
					icon: 'success'
				})
			} else {
				throw new Error(result.message || '头像更新失败')
			}
		} finally {
			uni.hideLoading()
		}
	}
	
	// 修改昵称 - 微信原生昵称输入框的值改变事件
	const onNicknameChange = (e) => {
		const nickName = e.detail.value
		if (nickName && nickName !== userStore.userInfo.nickName) {
			updateNickName(nickName)
		}
	}
	
	// 更新昵称的通用方法
	const updateNickName = async (nickName) => {
		try {
			// 显示提示
			uni.showLoading({
				title: '更新昵称中...'
			})
			
			// 调用云函数更新昵称
			const result = await userApi.updateUserProfile({
				uid: userStore.userInfo.uid,
				nickName: nickName
			})
			
			if (result.code === 0) {
				// 更新本地store
				userStore.updateUserNickName(nickName)
				
				uni.showToast({
					title: '昵称更新成功',
					icon: 'success'
				})
			} else {
				throw new Error(result.message || '昵称更新失败')
			}
		} catch (error) {
			console.error('更新昵称失败:', error)
			uni.showToast({
				title: error.message || '昵称更新失败',
				icon: 'none'
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 比较版本号
	const compareVersion = (v1, v2) => {
		v1 = v1.split('.')
		v2 = v2.split('.')
		const len = Math.max(v1.length, v2.length)
		
		while (v1.length < len) {
			v1.push('0')
		}
		while (v2.length < len) {
			v2.push('0')
		}
		
		for (let i = 0; i < len; i++) {
			const num1 = parseInt(v1[i])
			const num2 = parseInt(v2[i])
			
			if (num1 > num2) {
				return 1
			} else if (num1 < num2) {
				return -1
			}
		}
		
		return 0
	}
	
	// 修改昵称
	const changeNickName = () => {
		// 判断是否已登录
		if (!userStore.userInfo.isLogin) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			})
			return
		}
		
		// #ifdef MP-WEIXIN
		const version = wx.getSystemInfoSync().SDKVersion
		const canUseNicknameInput = compareVersion(version, '2.21.2') >= 0
		
		if (canUseNicknameInput) {
			// 小程序环境下已经使用了input type="nickname"
			// 此处无需额外处理，用户点击昵称会弹出原生输入框
			uni.showToast({
				title: '点击输入框修改昵称',
				icon: 'none'
			})
			return
		}
		// #endif
		
		// 非小程序环境或低版本基础库使用对话框
		uni.showModal({
			title: '修改昵称',
			editable: true,
			placeholderText: '请输入新昵称',
			content: userStore.userInfo.nickName,
			success: async (res) => {
				if (res.confirm && res.content) {
					updateNickName(res.content)
				}
			}
		})
	}

	// 信息公示跳转
	const contarct = () => {
		uni.navigateTo({
			url: "/subPages/contarct/contarct"
		})
	}

	// 意见反馈跳转
	const feedBack = () => {
		uni.navigateTo({
			url: "/subPages/feedBack/feedBack"
		})
	}

	// 角色判断
	const isAdmin = computed(() => userStore.userInfo.role[0] === 'admin')
	// 后台管理
	const adminManage = () => {
		if (isAdmin.value) {
			// 检查页面是否存在
			try {
				uni.navigateTo({
					url: "/subPages/adminManage/adminManage",
					fail: (err) => {
						console.error('跳转到管理页面失败:', err)
						uni.showToast({
							title: '页面不存在或配置错误',
							icon: 'none',
							duration: 2000
						})
					}
				})
			} catch (e) {
				console.error('导航异常:', e)
				uni.showToast({
					title: '跳转异常，请重试',
					icon: 'none',
					duration: 2000
				})
			}
		} else {
			uni.showToast({
				title: '您没有管理员权限',
				icon: 'none',
				duration: 2000
			})
		}
	}

	// 处理手机号显示，中间4位用8代替
	const maskedMobile = computed(() => {
		if (!userStore.userInfo.mobile) return '';
		const mobile = userStore.userInfo.mobile;
		if (mobile.length !== 11) return mobile;
		return mobile.substring(0, 3) + '****' + mobile.substring(7);
	})

	onMounted(() => {
		if (userStore.userInfo.uid) {
			// userOrderGet() 函数未定义，暂时注释掉
			// userOrderGet()
		}
	})
	// 点击退出登录
	const loginOut = () => {
		uni.showModal({
			title: '提示',
			content: '确定要退出登录吗',
			success(res) {
				if (res.confirm) {
					userStore.cleanUserInfo()
				}
			}
		})
	}
</script>

<template>
	<view class="my">
		<!-- 头部 -->
		<view class="myHead">
			<!-- 头像区域 -->
			<!-- #ifdef MP-WEIXIN -->
			<button open-type="chooseAvatar" @chooseavatar="onChooseAvatar" class="avatar-button">
				<view class="avatar">
					<image :src="userStore.userInfo.avatarUrl" mode="aspectFill"></image>
					<view class="edit-icon" v-if="userStore.userInfo.isLogin">
						<uni-icons type="camera-filled" color="#fff" size="20"></uni-icons>
					</view>
				</view>
			</button>
			<!-- #endif -->
			
			<!-- #ifndef MP-WEIXIN -->
			<view class="avatar" @click="changeAvatar">
				<image :src="userStore.userInfo.avatarUrl" mode="aspectFill"></image>
				<view class="edit-icon" v-if="userStore.userInfo.isLogin">
					<uni-icons type="camera-filled" color="#fff" size="20"></uni-icons>
				</view>
			</view>
			<!-- #endif -->
			
			<!-- 已经登录 -->
			<view class="userInfo" v-if="userStore.userInfo.isLogin">
				<!-- 昵称区域 -->
				<!-- #ifdef MP-WEIXIN -->
				<view class="nickname">
					<input type="nickname" @change="onNicknameChange" :value="userStore.userInfo.nickName" class="nickname-input" placeholder="点击输入昵称"/>
				</view>
				<!-- #endif -->
				
				<!-- #ifndef MP-WEIXIN -->
				<view class="nickname" @click="changeNickName">
					<text class="nickname-text">{{userStore.userInfo.nickName || '点击设置昵称'}}</text>
				</view>
				<!-- #endif -->
				
				<view class="mobile">
					手机号：{{maskedMobile}}
				</view>
				
			</view>
			<!-- 未登录 -->
			<view class="login-btn" @click="clickLogin" v-else>
				点击登录
			</view>

		</view>
		<!-- 内容 -->
		<view class="myContent">
			<!-- 菜单列表 -->
			<view class="menu-list">
				<!-- 联系我们 -->
				<view class="menu-item" @click="contarct">
					<view class="left">
						<uni-icons color="#46b0fe" type="wallet" size="22"></uni-icons>
						<text class="value">信息公示</text>
					</view>
					<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line" size="30"></uni-icons>
				</view>
				<!-- 意见反馈 -->
				<view class="menu-item" @click="feedBack">
					<view class="left">
						<uni-icons color="#46b0fe" custom-prefix="iconfont" type="icon-yijianfankui" size="22"></uni-icons>
						<text class="value">意见反馈</text>
					</view>
					<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line" size="30"></uni-icons>
				</view>
				<!-- 后台管理 -->
				<view class="menu-item" @click="adminManage" v-if="userStore.userInfo.role[0]=='admin'">
					<view class="left">
						<uni-icons color="#46b0fe" custom-prefix="iconfont" type="icon-houtaiguanli" size="22"></uni-icons>
						<text class="value">后台管理</text>
					</view>
					<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line" size="30"></uni-icons>
				</view>
			</view>
			
			<!-- 退出登录 -->
			<view class="logout-section" v-if="userStore.userInfo.isLogin">
				<view class="menu-item logout" @click="loginOut">
					<view class="left">
						<uni-icons color="#ff6b6b" custom-prefix="iconfont" type="icon-tuichudenglu" size="22"></uni-icons>
						<text class="value">退出登录</text>
					</view>
					<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line" size="30"></uni-icons>
				</view>
			</view>

			<!-- 版本信息 -->
			<view class="version-info">
				<text>酒旅圈圈 v1.0.0</text>
			</view>
		</view>
	</view>
</template>


<style lang="scss" scoped>
	.my {
		min-height: 100vh;
		background-color: #f7f7f7;

		/*头部*/
		.myHead {
			display: flex;
			align-items: center;
			padding: 40rpx 30rpx;
			height: 320rpx;
			color: #fff;
			background: linear-gradient(135deg, #46b0fe, #6385ff);
			position: relative;
			overflow: hidden;
			box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
			
			&::before {
				content: '';
				position: absolute;
				top: -100rpx;
				right: -100rpx;
				width: 400rpx;
				height: 400rpx;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.1);
				z-index: 0;
			}
			
			&::after {
				content: '';
				position: absolute;
				bottom: -150rpx;
				left: -100rpx;
				width: 300rpx;
				height: 300rpx;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.08);
				z-index: 0;
			}

			/*头像*/
			.avatar {
				margin-right: 30rpx;
				width: 140rpx;
				height: 140rpx;
				border-radius: 50%;
				overflow: hidden;
				position: relative;
				border: 4rpx solid rgba(255, 255, 255, 0.6);
				z-index: 1;
				box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.15);
				
				image {
					width: 100%;
					height: 100%;
				}
				
				.edit-icon {
					position: absolute;
					bottom: 0;
					left: 0;
					right: 0;
					height: 40rpx;
					background-color: rgba(0, 0, 0, 0.4);
					display: flex;
					justify-content: center;
					align-items: center;
				}
			}
			
			/* 微信头像选择按钮样式 */
			.avatar-button {
				padding: 0;
				width: 140rpx;
				height: 140rpx;
				margin-right: 30rpx;
				background-color: transparent;
				border: none;
				z-index: 1;
				
				&::after {
					border: none;
				}
			}

			/*未登录*/
			.login-btn {
				font-size: 36rpx;
				font-weight: 500;
				background-color: rgba(255, 255, 255, 0.2);
				padding: 16rpx 40rpx;
				border-radius: 40rpx;
				z-index: 1;
				transition: all 0.3s;
				
				&:active {
					background-color: rgba(255, 255, 255, 0.3);
				}
			}

			/*已登录*/
			.userInfo {
				z-index: 1;
				
				.nickname {
					font-size: 36rpx;
					font-weight: 600;
					display: flex;
					align-items: center;
					margin-bottom: 16rpx;
					max-width: 450rpx;
					
					.nickname-text {
						max-width: 340rpx;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
					
					.nickname-input {
						font-size: 36rpx;
						font-weight: 600;
						color: #fff;
						background-color: transparent;
						max-width: 340rpx;
						min-width: 140rpx;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						padding-right: 10rpx;
						
						&::placeholder {
							color: rgba(255, 255, 255, 0.8);
							font-size: 32rpx;
						}
					}
				}

				.mobile {
					font-size: 28rpx;
					opacity: 0.9;
				}	
			}
		}

		/*内容*/
		.myContent {
			position: relative;
			padding: 30rpx;
			margin-top: -40rpx;
			border-radius: 32rpx 32rpx 0 0;
			background-color: #f7f7f7;
			min-height: calc(100vh - 320rpx + 40rpx);
			z-index: 2;

			.menu-list {
				background-color: #fff;
				border-radius: 16rpx;
				overflow: hidden;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
				margin-bottom: 30rpx;
			}
			
			.logout-section {
				background-color: #fff;
				border-radius: 16rpx;
				overflow: hidden;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
				margin-bottom: 30rpx;
				
				.logout {
					.value {
						color: #ff6b6b;
					}
				}
			}

			/*菜单项*/
			.menu-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 32rpx 30rpx;
				position: relative;
				transition: all 0.3s;
				
				&:active {
					background-color: #f9f9f9;
				}
				
				&:not(:last-child)::after {
					content: '';
					position: absolute;
					left: 30rpx;
					right: 30rpx;
					bottom: 0;
					height: 1px;
					background-color: #f0f0f0;
				}
			}

			/*icon的公共样式*/
			.left {
				display: flex;
				align-items: center;

				.value {
					margin-left: 20rpx;
					font-size: 32rpx;
					color: #333;
				}
			}
			
			/*版本信息*/
			.version-info {
				text-align: center;
				font-size: 24rpx;
				color: #999;
				margin-top: 60rpx;
				padding: 20rpx 0;
			}
		}
	}
</style>