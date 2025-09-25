<script setup>
	import { ref } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';

	const url = ref( '' )
	onLoad( ( options ) => {
		console.log( options, '确认设置存在' )

		url.value = decodeURIComponent( options.url )
	} )
</script>
<template>
	<view class="webview-container">
		<web-view :src="url"></web-view>
	</view>
</template>


<style scoped>
	.webview-container {
		height: 100%;
	}
</style>