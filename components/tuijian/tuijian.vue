<template>
	<view class="more-articles">
		<view class="section-divider"></view>
		<view class="section-title">
			{{ cate_id ? '相关推荐' : '更多文章' }}
		</view>
		
		<!-- 文章列表 -->
		<view v-if="articles.length > 0" class="article-list">
			<view 
				v-for="item in articles" 
				:key="item._id" 
				class="article-item"
				@click="handleArticleClick(item._id)"
			>
				<view class="article-content">
					<!-- 左侧图片部分 -->
					<view class="image-wrapper">
						<image 
							class="article-image"
							:src="getProcessedImageUrl(item)" 
							mode="aspectFill"
							@click.stop="item.images && item.images.length ? handleImagePreview(item.images) : null"
							@error="handleImageError"
							:data-article-id="item._id"
						></image>
						<!-- 添加图片计数器，当有多张图片时显示 -->
						<view class="image-counter" v-if="item.images && item.images.length > 1">
							<uni-icons type="image" size="12" color="#fff"></uni-icons>
							<text class="counter-text">{{item.images.length}}</text>
						</view>
					</view>
					
					<!-- 右侧文字部分 -->
					<view class="text-content">
						<view class="content-preview">
							<text class="category-name">{{item.cate_name || '未分类'}}</text>丨{{item.content}}
						</view>
						<view class="info">
							<text class="time">{{formatTime(item.create_time)}}</text>
							<text class="views">{{item.look_count || 0}}次浏览</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view class="load-more-wrapper">
			<uni-load-more 
				:status="isLoadingMore ? 'loading' : loadMoreStatus"
				:contentText="{
					contentdown: '上拉加载更多',
					contentrefresh: '加载中...',
					contentnomore: cate_id ? '没有更多相关文章了' : '没有更多文章了'
				}"
				iconType="auto"
				color="#cccccc"
			/>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import formatTime from '@/utils/formatTime.js'
import { fixImageUrl, getDefaultImage } from '@/utils/domainConfig.js'

// 定义组件的props
const props = defineProps({
	// 当前文章ID
	currentArticleId: {
		type: String,
		required: true
	},
	// 分类ID
	cate_id: {
		type: String,
		default: ''
	}
})

// 定义事件
const emit = defineEmits(['click'])

// 状态变量
const articles = ref([])
const pageNo = ref(1)
const pageSize = ref(8)
const isLoadingMore = ref(false)
const loadMoreStatus = ref('more')
const articleApi = uniCloud.importObject('articleWx', { customUI: true })
const cateApi = uniCloud.importObject('cateWx', { customUI: true })

// 获取分类名称
const getCategoryName = async (cateId) => {
	try {
		if (!cateId) return '未分类'
		const res = await cateApi.get(cateId)
		return res.data && res.data[0] ? res.data[0].cate_name : '未分类'
	} catch (err) {
		console.error('获取分类名称失败:', err)
		return '未分类'
	}
}

// 获取分类图片
const getCategoryImage = async (cateId) => {
	try {
		if (!cateId) return '/static/images/default.png'
		const res = await cateApi.get(cateId)
		return res.data && res.data[0] && res.data[0].cate_img ? res.data[0].cate_img : '/static/images/default.png'
	} catch (err) {
		console.error('获取分类图片失败:', err)
		return '/static/images/default.png'
	}
}

// 获取更多文章
const getMoreArticles = async (refresh = false) => {
	try {
		if (refresh) {
			pageNo.value = 1
			loadMoreStatus.value = 'loading'
		}
		
		isLoadingMore.value = true
		
		// 使用分类ID获取相关文章
		const res = await articleApi.getArticle(
			props.cate_id || '01', // 如果没有分类ID，则获取最新文章
			pageNo.value, 
			pageSize.value
		)
		
		if (res.code === 0 && res.data) {
			// 过滤掉当前文章
			const filteredData = res.data.filter(item => item._id !== props.currentArticleId)
			
			// 为每篇文章获取分类名称和分类图片
			const articlesWithCategory = await Promise.all(
				filteredData.map(async (article) => {
					if (!article.cate_name) {
						article.cate_name = await getCategoryName(article.cate_id)
					}
					
					// 如果文章没有图片，获取分类图片作为默认图片
					if (!article.images || article.images.length === 0) {
						const categoryImage = await getCategoryImage(article.cate_id)
						// 修复分类图片的域名问题
						article.category_image = fixImageUrl(categoryImage)
					}
					
					return article
				})
			)
			
			// 更新文章列表
			if (refresh || pageNo.value === 1) {
				articles.value = articlesWithCategory
			} else {
				articles.value = [...articles.value, ...articlesWithCategory]
			}
			
			// 设置加载状态
			if (filteredData.length === 0) {
				loadMoreStatus.value = 'noMore'
			} else if (filteredData.length < pageSize.value && pageNo.value > 1) {
				loadMoreStatus.value = 'noMore'
			} else {
				loadMoreStatus.value = 'more'
			}
		} else {
			throw new Error(res.message || '获取更多文章失败')
		}
	} catch (err) {
		console.error('获取更多文章失败:', err)
		loadMoreStatus.value = 'more'
	} finally {
		isLoadingMore.value = false
	}
}

// 加载更多文章
const loadMore = async () => {
	if (isLoadingMore.value || loadMoreStatus.value === 'noMore') return
	
	pageNo.value++
	await getMoreArticles(false)
}

// 处理文章点击
const handleArticleClick = (articleId) => {
	emit('click', articleId)
}

// 获取处理后的图片URL
const getProcessedImageUrl = (item) => {
	if (item.images && item.images.length > 0) {
		// 优先使用compressedURL，如果没有则使用原始URL
		const imageUrl = item.images[0].compressedURL || item.images[0].url
		return fixImageUrl(imageUrl)
	}
	
	// 使用分类图片或默认图片
	return item.category_image ? fixImageUrl(item.category_image) : getDefaultImage('default')
}

// 处理图片加载错误
const handleImageError = (e) => {
	console.warn('图片加载失败，使用默认图片:', e)
	
	// 获取失败的图片元素
	const target = e.target || e.detail
	if (target && target.src) {
		// 替换为默认图片
		target.src = getDefaultImage('default')
		console.log('已替换为默认图片:', getDefaultImage('default'))
	}
}

// 处理图片预览
const handleImagePreview = (images) => {
	if (!images || !images.length) return
	
	// 提取所有图片的URL并修复域名
	const urls = images.map(img => {
		const imageUrl = img.compressedURL || img.url
		return fixImageUrl(imageUrl)
	})
	
	// 过滤掉无效的URL
	const validUrls = urls.filter(url => url && !url.includes('/static/images/'))
	
	if (validUrls.length === 0) {
		uni.showToast({
			title: '暂无可预览的图片',
			icon: 'none'
		})
		return
	}
	
	uni.previewImage({
		current: validUrls[0], // 默认显示第一张
		urls: validUrls,
		indicator: 'number',
		loop: true,
		fail: (err) => {
			console.error('预览图片失败:', err)
			uni.showToast({
				title: '预览图片失败',
				icon: 'none'
			})
		}
	})
}

// 监听分类ID变化
watch(() => props.cate_id, (newVal, oldVal) => {
	if (newVal !== oldVal) {
		getMoreArticles(true)
	}
})

// 组件挂载时获取数据
onMounted(() => {
	getMoreArticles(true)
})

// 暴露方法给父组件
defineExpose({
	loadMore,
	refresh: () => getMoreArticles(true)
})
</script>

<style lang="scss" scoped>
.more-articles {
	margin-top: 32rpx;
	padding: 0 24rpx;
	background-color: #fff;
	
	.section-divider {
		height: 16rpx;
		background-color: #f5f5f5;
		margin: 0 -24rpx;
	}
	
	.section-title {
		font-size: 32rpx;
		font-weight: 500;
		color: #333;
		margin: 32rpx 0 16rpx;
	}
	
	.article-list {
		.article-item {
			padding: 24rpx;
			background: #fff;
			border-radius: 12rpx;
			margin-bottom: 24rpx;
			border-bottom: 1px solid #eee;
			
			&:last-child {
				border-bottom: none;
			}
			
			.article-content {
				display: flex;
				align-items: flex-start;
				
				.image-wrapper {
					width: 200rpx;
					height: 150rpx;
					border-radius: 8rpx;
					overflow: hidden;
					flex-shrink: 0;
					margin-right: 24rpx;
					background-color: #f5f5f5;
					position: relative;
					
					// 添加加载动画效果
					&::before {
						content: '';
						position: absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						width: 40rpx;
						height: 40rpx;
						border: 2px solid #ddd;
						border-top-color: #399bfe;
						border-radius: 50%;
						animation: loading 1s linear infinite;
						z-index: 1;
						opacity: 0;
						transition: opacity 0.3s ease;
					}
					
					.article-image {
						width: 100%;
						height: 100%;
						object-fit: cover;
						transition: transform 0.3s ease, opacity 0.3s ease;
						
						// 图片加载中时显示加载动画
						&:not([src]),
						&[src=""] {
							opacity: 0;
							
							+ .image-wrapper::before {
								opacity: 1;
							}
						}
						
						// 图片悬停效果
						&:hover {
							transform: scale(1.05);
						}
					}
					
					.image-counter {
						position: absolute;
						right: 8rpx;
						bottom: 8rpx;
						background-color: rgba(0, 0, 0, 0.6);
						color: #fff;
						padding: 4rpx 10rpx;
						border-radius: 12rpx;
						font-size: 20rpx;
						display: flex;
						align-items: center;
						z-index: 2;
						
						.counter-text {
							margin-left: 4rpx;
						}
					}
				}
				
				.text-content {
					flex: 1;
					
					.content-preview {
						font-size: 28rpx;
						color: #666;
						line-height: 1.6;
						margin-bottom: 16rpx;
						display: -webkit-box;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 2;
						overflow: hidden;
						
						.category-name {
							color: #399bfe;
						}
					}
					
					.info {
						display: flex;
						align-items: center;
						font-size: 24rpx;
						color: #999;
						
						.time {
							margin-right: 24rpx;
						}
					}
				}
			}
			
			// 添加过渡动画
			transition: transform 0.2s ease;
			
			&:active {
				transform: scale(0.98);
				background-color: #f8f8f8;
			}
		}
	}
}

// 添加加载动画关键帧
@keyframes loading {
	0% {
		transform: translate(-50%, -50%) rotate(0deg);
	}
	100% {
		transform: translate(-50%, -50%) rotate(360deg);
	}
}

.load-more-wrapper {
	padding: 20rpx 0;
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>