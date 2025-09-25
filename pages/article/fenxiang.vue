<template>
  <button open-type="share">菜单分享</button>
  <button @click="handleShare">按钮触发</button>
</template>

<script setup>
import { ref } from 'vue'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'

const dynamicTitle = ref('自定义标题123')

// 右上角分享
onShareAppMessage(() => ({
  title: dynamicTitle.value,
  path: '/pages/index/index?id=123',
  imageUrl: '/static/images/logo.png'
}))

// 朋友圈分享
onShareTimeline(() => ({
  title: '朋友圈标题456',
  query: 'from=timeline',
  imageUrl: '/static/timeline.jpg'
}))

// 自定义按钮分享
const handleShare = () => {
  uni.share({
    title: '按钮触发的分享',
    path: '/pages/index/index',
    success: () => console.log('分享成功')
  })
}
</script>
