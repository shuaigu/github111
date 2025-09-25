<template>
	<view class="container">
		<view class="content">
			<!-- Your page content goes here -->
			<text>Main Page Content</text>
		</view>
		
		<footer-horizontal :footerItems="footerItems" @item-click="onFooterItemClick"></footer-horizontal>
	</view>
</template>

<script>
import FooterHorizontal from '@/components/footer-horizontal/footer-horizontal.vue'

export default {
	components: {
		FooterHorizontal
	},
	data() {
		return {
			footerItems: [
				{
					icon: '/static/icons/home.png',
					text: '首页',
					path: '/pages/index/index'
				},
				{
					icon: '/static/icons/message.png',
					text: '消息',
					path: '/pages/liaotian/liaotian'
				},
				{
					icon: '/static/icons/publish.png',
					text: '发布',
					path: '/pages/fabu/fabu'
				},
				{
					icon: '/static/icons/user.png',
					text: '我的',
					path: '/pages/my/my'
				}
			]
		}
	},
	methods: {
		onFooterItemClick(item) {
			console.log('Clicked:', item.text);
			uni.navigateTo({
				url: item.path
			});
		}
	}
}
</script>

<style>
.container {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
}

.content {
	flex: 1;
	padding: 20px;
}
</style> 