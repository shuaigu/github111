<script setup>
	import { ref, onUnmounted } from 'vue';
	import { onShow } from '@dcloudio/uni-app'
	import { useAuthSwitchStore } from '@/store/authSwitch'
	const authSwitchStore = useAuthSwitchStore( )
	const sendOnApi = uniCloud.importObject( 'sendOn' )
	
	// 获取权限状态
	const sendOnget = async ( ) => {
		try {
			uni.showLoading({
				title: '获取按钮状态...',
				mask: true
			})
			
			const res = await sendOnApi.get( )
			if (res && res.data && res.data.length > 0) {
				// 设置按钮控制状态
				publishButtonState.value = res.data[0].publishButton !== undefined ? res.data[0].publishButton : false
				floatButtonState.value = res.data[0].floatButton !== undefined ? res.data[0].floatButton : false
				// 设置头像点击控制状态
				avatarClickState.value = res.data[0].avatarClick !== undefined ? res.data[0].avatarClick : false
				// 设置评论显示控制状态
				commentVisibilityState.value = res.data[0].commentVisibility !== undefined ? res.data[0].commentVisibility : false
				// 设置抽奖模块显示控制状态
				lotteryVisibilityState.value = res.data[0].lotteryVisibility !== undefined ? res.data[0].lotteryVisibility : false
				
				// 为了保持兼容性，仍然更新总开关状态
				authSwitchStore.setAuthValue(true)
				
				console.log('发布按钮状态:', publishButtonState.value)
				console.log('悬浮按钮状态:', floatButtonState.value)
				console.log('头像点击状态:', avatarClickState.value)
				console.log('评论显示状态:', commentVisibilityState.value)
				console.log('抽奖模块状态:', lotteryVisibilityState.value)
			} else {
				console.error('获取按钮状态失败: 数据格式不正确')
				uni.showToast({
					icon: 'none',
					title: '获取按钮状态失败'
				})
			}
		} catch (error) {
			console.error('获取按钮状态失败:', error)
			uni.showToast({
				icon: 'none',
				title: '获取按钮状态失败'
			})
		} finally {
			uni.hideLoading()
		}
	}

	// 页面显示时获取最新状态
	onShow( ( ) => {
		sendOnget( )
	} )
	
	// 添加发布按钮和悬浮按钮的状态控制
	const publishButtonState = ref(false)
	const floatButtonState = ref(false)
	// 添加头像点击状态控制
	const avatarClickState = ref(false)
	// 添加评论显示控制状态
	const commentVisibilityState = ref(false)
	// 添加抽奖模块显示控制状态
	const lotteryVisibilityState = ref(false)
	
	// 切换发布按钮状态
	const togglePublishButton = async (e) => {
		e.stopPropagation()
		const newState = e.detail.value
		
		try {
			uni.showLoading({
				title: '更新中...',
				mask: true
			})
			
			// 先更新本地状态
			publishButtonState.value = newState
			
			// 更新服务器状态，传递所有按钮状态
			const res = await sendOnApi.update(true, newState, floatButtonState.value, avatarClickState.value, commentVisibilityState.value, lotteryVisibilityState.value)
			console.log('发布按钮状态更新结果:', res)
			
			// 广播状态变化事件
			uni.$emit('publishButtonChanged', newState)
			
			uni.showToast({
				icon: "success",
				title: newState ? '发布按钮已开启' : '发布按钮已关闭',
				duration: 2000
			})
		} catch (error) {
			console.error('更新发布按钮状态失败:', error)
			// 出错时回滚本地状态
			publishButtonState.value = !newState
			
			uni.showToast({
				icon: "error",
				title: '操作失败',
				duration: 2000
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 切换悬浮按钮状态
	const toggleFloatButton = async (e) => {
		e.stopPropagation()
		const newState = e.detail.value
		
		try {
			uni.showLoading({
				title: '更新中...',
				mask: true
			})
			
			// 先更新本地状态
			floatButtonState.value = newState
			
			// 更新服务器状态，传递所有按钮状态
			const res = await sendOnApi.update(true, publishButtonState.value, newState, avatarClickState.value, commentVisibilityState.value, lotteryVisibilityState.value)
			console.log('悬浮按钮状态更新结果:', res)
			
			// 广播状态变化事件
			uni.$emit('floatButtonChanged', newState)
			
			uni.showToast({
				icon: "success",
				title: newState ? '悬浮按钮已开启' : '悬浮按钮已关闭',
				duration: 2000
			})
		} catch (error) {
			console.error('更新悬浮按钮状态失败:', error)
			// 出错时回滚本地状态
			floatButtonState.value = !newState
			
			uni.showToast({
				icon: "error",
				title: '操作失败',
				duration: 2000
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 切换头像点击状态
	const toggleAvatarClick = async (e) => {
		e.stopPropagation()
		const newState = e.detail.value
		
		try {
			uni.showLoading({
				title: '更新中...',
				mask: true
			})
			
			// 先更新本地状态
			avatarClickState.value = newState
			
			// 更新服务器状态，传递所有按钮状态
			const res = await sendOnApi.update(true, publishButtonState.value, floatButtonState.value, newState, commentVisibilityState.value, lotteryVisibilityState.value)
			console.log('头像点击状态更新结果:', res)
			
			// 广播状态变化事件
			uni.$emit('avatarClickChanged', newState)
			
			uni.showToast({
				icon: "success",
				title: newState ? '头像点击已开启' : '头像点击已关闭',
				duration: 2000
			})
		} catch (error) {
			console.error('更新头像点击状态失败:', error)
			// 出错时回滚本地状态
			avatarClickState.value = !newState
			
			uni.showToast({
				icon: "error",
				title: '操作失败',
				duration: 2000
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 切换评论显示状态
	const toggleCommentVisibility = async (e) => {
		e.stopPropagation()
		const newState = e.detail.value
		
		try {
			uni.showLoading({
				title: '更新中...',
				mask: true
			})
			
			// 先更新本地状态
			commentVisibilityState.value = newState
			
			// 更新服务器状态，传递所有按钮状态
			const res = await sendOnApi.update(true, publishButtonState.value, floatButtonState.value, avatarClickState.value, newState, lotteryVisibilityState.value)
			console.log('评论显示状态更新结果:', res)
			
			// 广播状态变化事件
			uni.$emit('commentVisibilityChanged', newState)
			
			uni.showToast({
				icon: "success",
				title: newState ? '评论功能已开启' : '评论功能已关闭',
				duration: 2000
			})
		} catch (error) {
			console.error('更新评论显示状态失败:', error)
			// 出错时回滚本地状态
			commentVisibilityState.value = !newState
			
			uni.showToast({
				icon: "error",
				title: '操作失败',
				duration: 2000
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 切换抽奖模块显示状态
	const toggleLotteryVisibility = async (e) => {
		e.stopPropagation()
		const newState = e.detail.value
		
		try {
			uni.showLoading({
				title: '更新中...',
				mask: true
			})
			
			// 先更新本地状态
			lotteryVisibilityState.value = newState
			
			// 更新服务器状态，传递所有按钮状态
			const res = await sendOnApi.update(true, publishButtonState.value, floatButtonState.value, avatarClickState.value, commentVisibilityState.value, newState)
			console.log('抽奖模块显示状态更新结果:', res)
			
			// 广播状态变化事件
			uni.$emit('lotteryVisibilityChanged', newState)
			
			uni.showToast({
				icon: "success",
				title: newState ? '抽奖模块已开启' : '抽奖模块已关闭',
				duration: 2000
			})
		} catch (error) {
			console.error('更新抽奖模块显示状态失败:', error)
			// 出错时回滚本地状态
			lotteryVisibilityState.value = !newState
			
			uni.showToast({
				icon: "error",
				title: '操作失败',
				duration: 2000
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 监听来自其他页面的状态变化事件
	uni.$on('publishButtonChanged', (newState) => {
		console.log('收到发布按钮状态变化事件:', newState)
		publishButtonState.value = newState
	})
	
	uni.$on('floatButtonChanged', (newState) => {
		console.log('收到悬浮按钮状态变化事件:', newState)
		floatButtonState.value = newState
	})
	
	uni.$on('avatarClickChanged', (newState) => {
		console.log('收到头像点击状态变化事件:', newState)
		avatarClickState.value = newState
	})
	
	uni.$on('commentVisibilityChanged', (newState) => {
		console.log('收到评论显示状态变化事件:', newState)
		commentVisibilityState.value = newState
	})
	
	uni.$on('lotteryVisibilityChanged', (newState) => {
		console.log('收到抽奖模块显示状态变化事件:', newState)
		lotteryVisibilityState.value = newState
	})
	
	// 页面卸载时移除事件监听
	onUnmounted(() => {
		uni.$off('publishButtonChanged')
		uni.$off('floatButtonChanged')
		uni.$off('avatarClickChanged')
		uni.$off('commentVisibilityChanged')
		uni.$off('lotteryVisibilityChanged')
	})
	
	// 后期想做新的功能，直接添加就好
	const data = ref( [ '分类管理', '文章管理', '用户反馈', '公司信息', '悬浮按钮控制', '发布按钮控制', '头像点击控制', '评论功能控制', '抽奖模块控制', '用户信息查询', '抽奖管理' ] )
	// 处理点击事件跳转页面
	const handleItem = ( dataItem ) => {
		switch ( dataItem ) {
			case '分类管理':
				console.log( '跳转分类管理' )
				uni.navigateTo( {
					url: "/subPages/cateManage/cateManage"
				} )
				break
			case '文章管理':
				console.log( '跳转文章管理' )
				uni.navigateTo( {
					url: "/subPages/articleManage/articleManage"
				} )
				break
			case '用户反馈':
				console.log( '跳转用户反馈' )
				uni.navigateTo( {
					url: "/subPages/feedManage/feedManage"
				} )
				break
			case '公司信息':
				console.log( '跳转公司信息' )
				uni.navigateTo( {
					url: "/subPages/companyInfo/companyInfo"
				} )
				break
			case '悬浮按钮控制':
				console.log('点击悬浮按钮控制，不执行任何操作')
				break
			case '发布按钮控制':
				console.log('点击发布按钮控制，不执行任何操作')
				break
			case '头像点击控制':
				console.log('点击头像点击控制，不执行任何操作')
				break
			case '评论功能控制':
				console.log('点击评论功能控制，不执行任何操作')
				break
			case '用户信息查询':
				console.log( '跳转用户信息查询' )
				uni.navigateTo( {
					url: "/subPages/userInfoQuery/userInfoQuery"
				} )
				break
			case '抽奖管理':
				console.log( '跳转抽奖管理' )
				uni.navigateTo( {
					url: "/subPages/subChoujiang/subChoujiang"
				} )
				break
		}
	}
</script>

<template>
	<view class="adminManage">
		<view class="content">
			<view class="item" v-for="item in data" :key="item" @click="handleItem(item)">
				<view class="left">
					<!-- 占位 -->
					<view class="box">

					</view>
					<view class="value">
						{{item}}
					</view>
				</view>
				<template v-if="item === '发布按钮控制'">
					<view class="switch-container" @click.stop>
						<switch :checked="publishButtonState" @change="togglePublishButton" />
					</view>
				</template>
				<template v-else-if="item === '悬浮按钮控制'">
					<view class="switch-container" @click.stop>
						<switch :checked="floatButtonState" @change="toggleFloatButton" />
					</view>
				</template>
				<template v-else-if="item === '头像点击控制'">
					<view class="switch-container" @click.stop>
						<switch :checked="avatarClickState" @change="toggleAvatarClick" />
					</view>
				</template>
				<template v-else-if="item === '评论功能控制'">
					<view class="switch-container" @click.stop>
						<switch :checked="commentVisibilityState" @change="toggleCommentVisibility" />
					</view>
				</template>
				<template v-else-if="item === '抽奖模块控制'">
					<view class="switch-container" @click.stop>
						<switch :checked="lotteryVisibilityState" @change="toggleLotteryVisibility" />
					</view>
				</template>
				<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line"
					size="30"></uni-icons>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	/*防止分包页面公共样式无法读取*/
	@import "@/style/common.scss";

	.adminManage {
		@include pagesBaseStyle;

		.content {
			border-radius: 24rpx;
			background-color: #fff;

			.item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 24rpx;
				width: 100%;
				box-sizing: border-box;
				border-bottom: 1px solid $pyq-border-color-translucent;

				&:nth-last-child(1) {
					border: none;
				}

				.left {
					display: flex;
					align-items: center;

					.box {
						margin-right: 16rpx;
						height: 24rpx;
						width: 8rpx;
						background-color: $pyq-vi-color;
						border-radius: 4rpx;
					}

					.value {
						font-size: 28rpx;
						color: $pyq-text-color-body;
					}
				}
				
				.switch-container {
					padding: 0 10rpx;
				}
			}
		}

	}
</style>