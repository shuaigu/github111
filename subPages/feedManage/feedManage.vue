<script setup>
	import { ref, onMounted } from 'vue'
	import formatTime from '@/utils/formatTime.js'

	// 反馈列表数据
	const feedbackList = ref( [ ] )
	// 加载状态
	const loading = ref( true )

	// 获取反馈列表
	const getFeedbackList = async ( ) => {
		try {
			const feedbackApi = uniCloud.importObject( 'feedback', { customUI: true } )
			const res = await feedbackApi.getList( )

			if ( res.success ) {
				feedbackList.value = res.data
			}
		} catch ( err ) {
			uni.showToast( {
				title: err.message || '加载失败',
				icon: 'none'
			} )
		} finally {
			loading.value = false
		}
	}

	// 删除反馈
	const handleDelete = ( id ) => {
		uni.showModal( {
			title: '提示',
			content: '确定要删除这条反馈吗？',
			async success( res ) {
				if ( res.confirm ) {
					try {
						const feedbackApi = uniCloud.importObject( 'feedback', { customUI: true } )
						const res = await feedbackApi.remove( id )
						if ( res.success ) {
							uni.showToast( {
								title: '删除成功',
								icon: 'success'
							} )
							// 重新加载数据
							getFeedbackList( )
						}
					} catch ( err ) {
						uni.showToast( {
							title: err.message || '删除失败',
							icon: 'none'
						} )
					}
				}
			}
		} )
	}

	// 预览图片
	const previewImage = ( urls, current ) => {
		uni.previewImage( {
			urls,
			current
		} )
	}

	// 生命周期
	onMounted( ( ) => {
		getFeedbackList( )
	} )
</script>

<template>
	<view class="feedback-manage">
		<!-- 加载状态 -->
		<up-loading-page :loading="loading && !feedbackList.length"></up-loading-page>

		<!-- 反馈列表 -->
		<view class="feedback-list" v-if="feedbackList.length">
			<view class="feedback-item" v-for="item in feedbackList" :key="item._id">
				<!-- 头部信息 -->
				<view class="item-header">
					<view class="left">
						<text class="type">{{ item.type }}</text>
						<text class="time">{{ formatTime(item.create_time) }}</text>
					</view>
					<view class="right">
						<button class="delete-btn" size="mini" @click="handleDelete(item._id)">删除</button>
					</view>
				</view>

				<!-- 内容区域 -->
				<view class="item-content">
					<text class="content-text">{{ item.content }}</text>

					<!-- 图片区域 -->
					<view class="image-list" v-if="item.images && item.images.length">
						<image v-for="(img, index) in item.images" :key="index" :src="img.url" mode="aspectFill"
							@click="previewImage(item.images.map(i => i.url), img.url)"></image>
					</view>
				</view>

				<!-- 联系方式 -->
				<view class="item-footer" v-if="item.contact">
					<text class="contact">联系方式：{{ item.contact }}</text>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty" v-else-if="!loading">
			<text>暂无反馈数据</text>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.feedback-manage {
		min-height: 100vh;
		background-color: #f5f7fa;
		padding: 24rpx;
	}

	.feedback-list {
		.feedback-item {
			background-color: #fff;
			border-radius: 16rpx;
			padding: 32rpx;
			margin-bottom: 24rpx;

			.item-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 24rpx;

				.left {
					.type {
						font-size: 28rpx;
						color: $pyq-vi-color;
						margin-right: 16rpx;
					}

					.time {
						font-size: 24rpx;
						color: $pyq-text-color-helper;
					}
				}

				.delete-btn {
					font-size: 24rpx;
					color: $pyq-text-color-error;
					background: none;
					padding: 8rpx 24rpx;

					&::after {
						border: none;
					}
				}
			}

			.item-content {
				.content-text {
					font-size: 28rpx;
					color: $pyq-text-color-body;
					line-height: 1.6;
				}

				.image-list {
					display: flex;
					flex-wrap: wrap;
					gap: 16rpx;
					margin-top: 24rpx;

					image {
						width: 180rpx;
						height: 180rpx;
						border-radius: 8rpx;
					}
				}
			}

			.item-footer {
				margin-top: 24rpx;
				padding-top: 24rpx;
				border-top: 2rpx solid $pyq-text-color-placeholder;

				.contact {
					font-size: 24rpx;
					color: $pyq-text-color-helper;
				}
			}
		}
	}

	.empty {
		text-align: center;
		padding: 48rpx;
		color: $pyq-text-color-helper;
		font-size: 28rpx;
	}
</style>