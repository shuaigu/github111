<script setup>
	import { ref, onMounted } from 'vue'
	import { privacyAgreement, vipServer } from '@/utils/ag.js'
	import { useUserInfoStore } from '@/store/user.js'
	// userStore
	const userStore = useUserInfoStore( )
	// 用户云对象
	const userApi = uniCloud.importObject( 'userWx' )
	//授权同意
	const aloneChecked = ref( false )
	// 弹框
	const modelShow = ref( false )
	// 重定向URL
	const redirectUrl = ref('')
	
	// 页面加载时获取重定向参数
	onMounted(() => {
		// 获取当前页面参数
		const pages = getCurrentPages()
		const currentPage = pages[pages.length - 1]
		const options = currentPage.options || {}
		
		// 检查是否有重定向参数
		if (options.redirect) {
			redirectUrl.value = decodeURIComponent(options.redirect)
			console.log('获取到重定向URL:', redirectUrl.value)
		}
	})
	
	// 服务和隐私协议
	const navigateToAgreement = ( type ) => {
		console.log( type )
		let url = ''
		if ( type === 'vipServer' ) {
			// 修改为本地HTML文件路径
			uni.navigateTo({
				url: '/pages/login/2.html'
			})
			return
		} else if ( type === 'privacyAgreement' ) {
			url = privacyAgreement // 隐私权政策链接
			console.log( '隐私' )
		}

		// 使用 `web-view` 打开协议页面
		uni.navigateTo( {
			url: `/pages/webview/webview?url=${encodeURIComponent(url)}`
		} )
	}

	let codeRes
	// 点击登录
	const clickLogin = async ( ) => {
		if ( !aloneChecked.value ) {
			// 自动勾选同意协议
			aloneChecked.value = true
			// 延迟一下再继续登录流程，让用户有时间看到勾选动作
			await new Promise(resolve => setTimeout(resolve, 100))
		}
		const res = await uni.login( )
		codeRes = res.code
		modelShow.value = true
	}

	let userData

	// 用户登录构建数据 类型声明
	const userInfoData = ref( {
		uid: '', //本地平台ID
		nickName: "", //昵称
		avatarUrl: "/static/images/default.png", //头像地址
		mobile: "", //手机号码
		isLogin: false, //登录状态
		role: [ ], //默认角色
		openid_wx: ''
	} )

	// 快手手机号登录
	const getMobile = async ( e ) => {
		console.log( e )
		// 构建请求参数
		let params = {
			code: codeRes,
			encryptedData: e.detail.encryptedData,
			iv: e.detail.iv,
		}
		console.log( params, '构建' )

		// 手机号授权成功 获取用户权限
		if ( e.detail.errMsg === 'getPhoneNumber:ok' ) {
			// 请求服务器手机号登录
			const res = await userApi.loginByPhoneWx( params )
			console.log( res, '服务器返回' )
			// 登录成功
			if ( res.data._id ) {
				// 关闭弹窗
				modelShow.value = false
				// 构建返回数据
				userInfoData.value = {
					uid: res.data._id, //本地平台ID
					nickName: res.data.nickName, //昵称
					avatarUrl: res.data.avatarUrl || "/static/images/default.png", //没有就默认
					mobile: res.data.mobile, //手机号码
					isLogin: true, //登录状态
					role: res.data.role, //默认角色
					openid_wx: res.data.openid_wx
				}

				console.log( userInfoData.value, '用户登录成功' )
				// 储存用户的状态框里
				userStore.setUserInfo( userInfoData.value )
				uni.showToast( {
					icon: "success",
					title: res.message
				} )

				// 调用登录成功跳转
				setTimeout( ( ) => {
					loginSuccess( )
				}, 500 )

			} else {
				// 登录失败
				throw new Error( '登录失败' )
			}
		} else {
			throw new Error( '获取手机号失败' )
		}
	}
	// 登录成功后的处理
	const loginSuccess = ( ) => {
		// 发送登录成功事件
		uni.$emit( 'loginSuccess' )
		
		// 如果有重定向URL，则跳转到该URL
		if (redirectUrl.value) {
			console.log('正在重定向到:', redirectUrl.value)
			uni.redirectTo({
				url: redirectUrl.value,
				fail: (err) => {
					console.error('重定向失败:', err)
					// 如果重定向失败，返回上一页
					uni.navigateBack({
						delta: 1,
						fail: () => {
							// 如果返回失败（没有上一页），则跳转到首页
							uni.switchTab({
								url: '/pages/index/index'
							})
						}
					})
				}
			})
		} else {
			// 如果没有重定向URL，返回上一页
			uni.navigateBack({
				delta: 1,
				fail: () => {
					// 如果返回失败（没有上一页），则跳转到首页
					uni.switchTab({
						url: '/pages/index/index'
					})
				}
			})
		}
	}
</script>

<template>
	<view class="loginPages">
		<view class="bg">
		</view>
		<!-- 标题 -->
		<view class="title">
			<view class="logo">
				<image src="/static/images/logo.png" mode="aspectFit"></image>
			</view>
			<!-- 提示词 -->
			<view class="wenben">
				欢迎登录进行使用
			</view>
		</view>
		<!-- 隐私协议 -->
		<view class="authLogin">
			<view class="agree">
				<u-checkbox activeColor="#46b0fe" class="checkbox" name="agree" :checked="aloneChecked" @change="(e) => { aloneChecked = e }" shape="circle">
				</u-checkbox>
				<view class="text-wrapper">
					<text class="normal-text">我已阅读并同意</text>
					<view class="link-text" @click="navigateToAgreement('vipServer')">
						服务协议
					</view>
					<text class="normal-text">和</text>
					<view class="link-text" @click="navigateToAgreement('privacyAgreement')">
						隐私政策
					</view>
				</view>
			</view>
			<!-- 登录按钮 -->
			<view class="login">
				<button class="btn" @click="clickLogin">一键登录</button>
			</view>
		</view>
		<!-- 手机号登录弹框 -->
		<view class="mobileLoginModel" v-if="modelShow">
			<!-- 弹框 -->
			<view class="model">
				<!-- 图标区域 -->
				<view class="icon-area">
					<image src="/static/images/default.png" mode="aspectFit" class="auth-icon"></image>
				</view>
				<!-- 文字区域 -->
				<view class="textValue">
					<view class="titleModel">
						请先完善个人信息
					</view>
					<view class="contentModel">
						手机号作为多端信息同步使用
					</view>
				</view>
				<!-- 按钮 -->
				<view class="caozuo">
					<button class="cannal" @click="modelShow = false">取消</button>
					<button class="confirm" open-type="getPhoneNumber" @getphonenumber="getMobile">确定</button>
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.loginPages {
		height: 100vh;
		background: linear-gradient(to top, #ccd8f7, #fff);

		.bg {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 600rpx;
			background: linear-gradient(to right, #ccd8f7, #fce1e2);
			-webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 70%);
			mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 70%);
		}

		/*标题*/
		.title {
			position: fixed;
			left: 50%;
			top: 20%;
			transform: translateX(-50%);

			.logo {
				margin-bottom: 40rpx;
				height: 100rpx;
				width: 400rpx;
			}

			.wenben {
				text-align: center;
				font-size: 36rpx;
				color: $pyq-text-color-body-secondary;
			}
		}

		/*授权登录*/
		.authLogin {
			width: 100%;

			/*同意*/
			.agree {
				display: flex;
				align-items: center;
				padding-top: 600rpx;
				margin: auto;
				width: fit-content;
				font-size: 24rpx;
				color: $pyq-text-color-helper;

				.checkbox {
					margin-right: 8rpx;
				}

				.text-wrapper {
					flex: 1;
					display: flex;
					align-items: center;
					flex-wrap: wrap;

					.normal-text {
						font-size: 24rpx;
						color: $pyq-text-color-helper;
						padding: 0 4rpx;
					}

					.link-text {
						color: $pyq-vi-color;
						font-size: 28rpx;
						padding: 4rpx 8rpx;

						&:active {
							opacity: 0.7;
						}
					}
				}
			}

			/*登录*/
			.login {
				padding: 40rpx;
				background: rgba(0, 0, 0, 0);

				.btn {
					background-color: $pyq-vi-color;
					border: none;
					color: #fff;
					border-radius: 64rpx;
					transition: all 0.3s;
				}
			}
		}

		/*授权弹框*/
		.mobileLoginModel {
			position: fixed;
			left: 0;
			top: 0;
			height: 100vh;
			width: 100%;
			background: rgba(0, 0, 0, 0.5);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 999;

			.model {
				display: flex;
				flex-direction: column;
				width: 560rpx;
				background-color: #fff;
				border-radius: 24rpx;
				box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
				overflow: hidden;
				
				.icon-area {
					display: flex;
					justify-content: center;
					padding: 40rpx 0 20rpx;
					
					.auth-icon {
						width: 120rpx;
						height: 120rpx;
						border-radius: 60rpx;
					}
				}

				.textValue {
					display: flex;
					flex-direction: column;
					align-items: center;
					padding: 20rpx 40rpx 40rpx;

					.titleModel {
						font-size: 34rpx;
						font-weight: 500;
						color: $pyq-text-color-title;
						margin-bottom: 16rpx;
					}

					.contentModel {
						font-size: 28rpx;
						color: $pyq-text-color-helper;
						text-align: center;
					}
				}

				/*按钮*/
				.caozuo {
					display: flex;
					border-top: 1px solid rgba(0, 0, 0, 0.05);

					button {
						font-size: 28rpx;
						border: none;
						outline: none;
						height: 90rpx;
						line-height: 90rpx;
						transition: all 0.3s;
					}

					.cannal {
						flex: 1;
						border: none;
						background-color: #fff;
						color: #999;
						
						&:active {
							background-color: #f5f5f5;
						}
					}

					.confirm {
						flex: 1;
						border: none;
						background-color: #fff;
						color: $pyq-vi-color;
						font-weight: 500;
						position: relative;
						
						&::before {
							content: '';
							position: absolute;
							left: 0;
							top: 20rpx;
							bottom: 20rpx;
							width: 1px;
							background-color: rgba(0, 0, 0, 0.05);
						}
						
						&:active {
							background-color: #f5f5f5;
						}
					}
				}
			}
		}
	}
</style>