<script setup>
	import { ref, onMounted } from 'vue'
	import formatTime from '@/utils/formatTime'
	import { useUserInfoStore } from '@/store/user.js'

	const userInfoStore = useUserInfoStore( )
	const articleApi = uniCloud.importObject( 'articleWx', { customUI: true } )

	// 文章列表数据
	const articleList = ref( [ ] )
	// 统计数据
	const stats = ref( {
		pending: 0,
		approved: 0,
		rejected: 0
	} )
	// 当前选中的状态
	const currentStatus = ref( '0' ) // 默认显示待审核

	// 获取文章列表
	const getArticleList = async ( ) => {
		try {
			const params = { state: Number( currentStatus.value ) }
			const res = await articleApi.getAdminArticles( params )

			articleList.value = res.data.map( article => ( {
				...article,
				create_time: formatTime( article.create_time )
			} ) )

			// 使用后端返回的统计数据
			stats.value = res.stats
		} catch ( e ) {
			uni.showToast( {
				title: e.message || '获取文章列表失败',
				icon: 'none'
			} )
		}
	}

	// 处理状态切换
	const handleStatusChange = ( status ) => {
		currentStatus.value = status
		getArticleList( )
	}

	// 处理文章审核
	const handleAudit = async ( articleId, state ) => {
		try {
			uni.showLoading( { title: '处理中...' } )
			await articleApi.updateState( articleId, state )
			uni.hideLoading( )
			uni.showToast( {
				title: state === 1 ? '已通过' : '已拒绝',
				icon: 'success'
			} )
			getArticleList( )
		} catch ( e ) {
			uni.hideLoading( )
			uni.showToast( {
				title: e.message || '操作失败',
				icon: 'none'
			} )
		}
	}

	// 处理文章删除
	const handleDelete = async ( articleId ) => {
		uni.showModal( {
			title: '提示',
			content: '确定要删除这篇文章吗？',
			async success( res ) {
				if ( res.confirm ) {
					try {
						uni.showLoading( { title: '删除中...' } )
						await articleApi.adminDelete( articleId, userInfoStore.userInfo.role[ 0 ] )
						uni.hideLoading( )
						uni.showToast( {
							title: '删除成功',
							icon: 'success'
						} )
						getArticleList( )
					} catch ( e ) {
						uni.hideLoading( )
						uni.showToast( {
							title: e.message || '删除失败',
							icon: 'none'
						} )
					}
				}
			}
		} )
	}

	// 跳转到首页
	const goToHome = ( ) => {
		uni.switchTab( {
			url: '/pages/index/index'
		} )
	}

	// 预览图片
	const previewImage = ( images, current ) => {
		uni.previewImage( {
			urls: images,
			current: current
		} )
	}

	onMounted( ( ) => {
		getArticleList( )
	} )
</script>

<template>
	<view class="articleManage">
		<!-- 顶部统计 -->
		<view class="header">
			<view class="stat-item">
				<text class="number">{{stats.pending}}</text>
				<text class="label">待审核</text>
			</view>
			<view class="stat-item">
				<text class="number">{{stats.approved}}</text>
				<text class="label">已通过</text>
			</view>
			<view class="stat-item">
				<text class="number">{{stats.rejected}}</text>
				<text class="label">已拒绝</text>
			</view>
		</view>

		<!-- 文章列表 -->
		<view class="article-list">
			<view class="list-header">
				<text class="title">文章列表</text>
				<scroll-view scroll-x class="status-filter" :show-scrollbar="false">
					<view class="filter-wrapper">
						<text class="filter-item" :class="{ active: currentStatus === '0' }"
							@click="handleStatusChange('0')">待审核</text>
						<text class="filter-item" :class="{ active: currentStatus === '1' }"
							@click="handleStatusChange('1')">已通过</text>
						<text class="filter-item" :class="{ active: currentStatus === '2' }"
							@click="handleStatusChange('2')">已拒绝</text>
					</view>
				</scroll-view>
			</view>

			<!-- 列表内容 -->
			<scroll-view scroll-y class="list-content" :style="{ paddingBottom: '160rpx' }">
				<view class="article-item" v-for="article in articleList" :key="article._id">
					<view class="item-content">
						<!-- 内容 -->
						<view class="article-text">
							{{article.content}}
						</view>
						<!-- 图片区域 -->
						<view class="image-list" v-if="article.images && article.images.length">
							<view class="image-wrapper">
								<template v-if="true">
									<!-- 单图模式 -->
									<view class="single-image" v-if="article.images.length === 1">
										<image :src="article.images[0] + '?thumbnailURL'" mode="widthFix"
											@click="previewImage(article.images, article.images[0])"></image>
									</view>
									<!-- 多图模式 -->
									<view class="multi-image" v-else>
										<view class="image-item" v-for="(img, index) in article.images" :key="index">
											<image :src="img + '?thumbnailURL'" mode="aspectFill"
												@click="previewImage(article.images, img)"></image>
										</view>
									</view>
								</template>
							</view>
						</view>
						<!-- 底部信息 -->
						<view class="article-footer">
							<view class="info">
								<text class="time">{{article.create_time}}</text>
								<text class="status" :class="{
										pending: article.state === 0,
										approved: article.state === 1,
										rejected: article.state === 2
									}">
									{{article.state === 0 ? '待审核' : article.state === 1 ? '已通过' : '已拒绝'}}
								</text>
							</view>
							<view class="actions">
								<view class="action-btn approve" v-if="article.state === 0"
									@click.stop="handleAudit(article._id, 1)">通过</view>
								<view class="action-btn reject" v-if="article.state === 0"
									@click.stop="handleAudit(article._id, 2)">拒绝</view>
								<view class="action-btn delete" @click.stop="handleDelete(article._id)">删除</view>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 底部栏 -->
		<view class="footer">
			<view class="home-btn" @click="goToHome">
				返回首页
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.articleManage {
		min-height: 100vh;
		background-color: #f5f7fa;
		padding: 24rpx;
		padding-bottom: 0; // 移除底部内边距，由底部栏占位

		/* 顶部统计 */
		.header {
			display: flex;
			justify-content: space-around;
			padding: 32rpx;
			background-color: #fff;
			border-radius: 16rpx;
			margin-bottom: 24rpx;

			.stat-item {
				display: flex;
				flex-direction: column;
				align-items: center;

				.number {
					font-size: 36rpx;
					font-weight: 600;
					color: $pyq-text-color-body;
					margin-bottom: 8rpx;
				}

				.label {
					font-size: 24rpx;
					color: $pyq-text-color-helper;
				}
			}
		}

		/* 文章列表 */
		.article-list {
			background-color: #fff;
			border-radius: 16rpx;
			margin-bottom: 164rpx; // 为底部栏留出空间
			padding: 24rpx;

			.list-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding-bottom: 24rpx;
				border-bottom: 1px solid $pyq-border-color-translucent;

				.title {
					font-size: 32rpx;
					font-weight: 600;
					color: $pyq-text-color-body;
				}

				.status-filter {
					width: 400rpx;
					white-space: nowrap;

					.filter-wrapper {
						display: inline-flex;
						padding: 0 8rpx;
					}

					.filter-item {
						margin: 0 8rpx;
						font-size: 24rpx;
						color: $pyq-text-color-helper;
						padding: 8rpx 24rpx;
						border-radius: 32rpx;

						&.active {
							background-color: $pyq-vi-color;
							color: #fff;
						}

						&:active {
							opacity: 0.8;
						}
					}
				}
			}

			.list-content {
				height: calc(100vh - 504rpx); // 减去顶部统计、标题和底部栏的高度

				.article-item {
					padding: 24rpx;
					border-bottom: 1px solid $pyq-border-color-translucent;
					background-color: #fff;

					.item-content {
						.article-text {
							font-size: 26rpx;
							color: $pyq-text-color-body-secondary;
							line-height: 1.6;
							margin-bottom: 16rpx;
						}

						.image-list {
							margin-bottom: 16rpx;

							.image-wrapper {
								width: 100%;

								.single-image {
									width: 400rpx;
									max-height: 400rpx;
									overflow: hidden;
									border-radius: 8rpx;

									image {
										width: 100%;
										height: auto;
									}
								}

								.multi-image {
									display: grid;
									grid-template-columns: repeat(3, 1fr);
									gap: 8rpx;

									.image-item {
										position: relative;
										width: 100%;
										padding-bottom: 100%;
										/* 1:1 宽高比 */

										image {
											position: absolute;
											top: 0;
											left: 0;
											width: 100%;
											height: 100%;
											object-fit: cover;
											border-radius: 8rpx;
										}
									}
								}
							}
						}

						.article-footer {
							display: flex;
							justify-content: space-between;
							margin-top: 16rpx;

							.info {
								font-size: 24rpx;
								color: $pyq-text-color-helper;

								.time {
									margin-right: 16rpx;
								}

								.status {
									padding: 4rpx 12rpx;
									border-radius: 16rpx;
									font-size: 22rpx;

									&.pending {
										background-color: #fff7e6;
										color: #fa8c16;
									}

									&.approved {
										background-color: #f6ffed;
										color: #52c41a;
									}

									&.rejected {
										background-color: #fff1f0;
										color: #ff4d4f;
									}
								}
							}

							.actions {
								display: flex;
								gap: 12rpx;

								.action-btn {
									padding: 8rpx 24rpx;
									border-radius: 32rpx;
									font-size: 24rpx;

									&.approve {
										background-color: #52c41a;
										color: #fff;
									}

									&.reject {
										background-color: #ff4d4f;
										color: #fff;
									}

									&.delete {
										background-color: #f5f5f5;
										color: #ff4d4f;
									}

									&:active {
										opacity: 0.8;
									}
								}
							}
						}
					}
				}
			}
		}

		/* 底部栏 */
		.footer {
			position: fixed;
			left: 0;
			bottom: 0;
			display: flex;
			justify-content: center;
			padding: 16rpx 32rpx;
			width: 100%;
			height: 164rpx;
			background-color: #fff;
			box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

			.home-btn {
				width: 100%;
				height: 88rpx;
				line-height: 88rpx;
				text-align: center;
				background-color: $pyq-vi-color;
				color: #fff;
				font-size: 32rpx;
				border-radius: 44rpx;

				&:active {
					opacity: 0.8;
				}
			}
		}
	}
</style>