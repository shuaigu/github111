<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const videoUrl = ref('');
const thumbnailUrl = ref('');
const videoDuration = ref(0);
const videoSize = ref(0);
const videoWidth = ref(0);
const videoHeight = ref(0);
const videoContext = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const showControls = ref(true);
const controlsTimeout = ref(null);

// 格式化时间为 mm:ss 格式
const formatTime = (seconds) => {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

// 格式化视频大小
const formatSize = (bytes) => {
  if (bytes < 1024) {
    return bytes + 'B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + 'KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + 'GB';
  }
};

// 计算视频时长格式化
const formattedDuration = computed(() => {
  return formatTime(videoDuration.value);
});

// 计算当前播放时间格式化
const formattedCurrentTime = computed(() => {
  return formatTime(currentTime.value);
});

// 计算视频大小格式化
const formattedSize = computed(() => {
  return formatSize(videoSize.value);
});

// 计算视频分辨率
const resolution = computed(() => {
  return `${videoWidth.value}x${videoHeight.value}`;
});

onMounted(() => {
  // 修正：使用正确的uni-app API获取页面参数
  const eventChannel = getOpenerEventChannel();
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const query = currentPage.options || {};
  
  console.log('视频预览页面参数:', query);
  
  if (query.videoUrl) {
    videoUrl.value = decodeURIComponent(query.videoUrl);
    console.log('视频URL:', videoUrl.value);
  }
  if (query.thumbnailUrl) {
    thumbnailUrl.value = decodeURIComponent(query.thumbnailUrl);
  }
  if (query.duration) {
    videoDuration.value = parseInt(query.duration) || 0;
  }
  if (query.size) {
    videoSize.value = parseInt(query.size) || 0;
  }
  if (query.width) {
    videoWidth.value = parseInt(query.width) || 0;
  }
  if (query.height) {
    videoHeight.value = parseInt(query.height) || 0;
  }
  
  // 创建视频上下文
  videoContext.value = uni.createVideoContext('myVideo');
  
  // 自动隐藏控制栏
  hideControlsAfterDelay();
});

onUnmounted(() => {
  // 页面卸载时暂停视频
  if (videoContext.value) {
    videoContext.value.pause();
  }
  
  // 清除定时器
  if (controlsTimeout.value) {
    clearTimeout(controlsTimeout.value);
  }
});

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 播放/暂停视频
const togglePlay = () => {
  if (isPlaying.value) {
    videoContext.value.pause();
  } else {
    videoContext.value.play();
  }
  isPlaying.value = !isPlaying.value;
  
  // 显示控制栏并设置自动隐藏
  showControls.value = true;
  hideControlsAfterDelay();
};

// 视频播放状态变化
const onPlay = () => {
  isPlaying.value = true;
};

// 视频暂停状态变化
const onPause = () => {
  isPlaying.value = false;
};

// 视频播放进度更新
const onTimeUpdate = (e) => {
  currentTime.value = e.detail.currentTime;
};

// 点击视频区域
const onVideoClick = () => {
  showControls.value = !showControls.value;
  
  if (showControls.value) {
    hideControlsAfterDelay();
  }
};

// 延迟隐藏控制栏
const hideControlsAfterDelay = () => {
  if (controlsTimeout.value) {
    clearTimeout(controlsTimeout.value);
  }
  
  controlsTimeout.value = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false;
    }
  }, 3000);
};

// 全屏播放
const fullScreen = () => {
  videoContext.value.requestFullScreen({
    direction: 0 // 0: 正常竖屏, 90: 横屏
  });
};

// 视频加载错误处理
const onVideoError = (e) => {
  console.error('视频加载错误:', e);
  uni.showToast({
    title: '视频加载失败',
    icon: 'none'
  });
};
</script>

<template>
  <view class="video-preview" @click="onVideoClick">
    <!-- 顶部导航栏 -->
    <view class="nav-bar" v-if="showControls">
      <view class="back-btn" @click.stop="goBack">
        <uni-icons type="back" size="24" color="#fff"></uni-icons>
      </view>
      <text class="title">视频预览</text>
    </view>
    
    <!-- 视频播放区域 -->
    <view class="video-container">
      <video 
        id="myVideo"
        :src="videoUrl"
        :poster="thumbnailUrl"
        :controls="false"
        :show-center-play-btn="false"
        object-fit="contain"
        class="video"
        @play="onPlay"
        @pause="onPause"
        @timeupdate="onTimeUpdate"
        @error="onVideoError"
      ></video>
      
      <!-- 自定义播放控制 -->
      <view class="custom-controls" v-if="showControls">
        <!-- 中央播放/暂停按钮 -->
        <view class="center-play-btn" @click.stop="togglePlay">
          <uni-icons :type="isPlaying ? 'pause-filled' : 'play-filled'" size="50" color="#fff"></uni-icons>
        </view>
        
        <!-- 底部控制栏 -->
        <view class="bottom-controls">
          <!-- 播放时间信息 -->
          <view class="time-info">
            <text class="current-time">{{formattedCurrentTime}}</text>
            <text class="time-separator">/</text>
            <text class="total-time">{{formattedDuration}}</text>
          </view>
          
          <!-- 全屏按钮 -->
          <view class="fullscreen-btn" @click.stop="fullScreen">
            <uni-icons type="arrow-right" size="24" color="#fff"></uni-icons>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 视频信息 -->
    <view class="video-info" v-if="showControls">
      <view class="info-item">
        <text class="info-label">时长:</text>
        <text class="info-value">{{formattedDuration}}</text>
      </view>
      <view class="info-item">
        <text class="info-label">大小:</text>
        <text class="info-value">{{formattedSize}}</text>
      </view>
      <view class="info-item">
        <text class="info-label">分辨率:</text>
        <text class="info-value">{{resolution}}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.video-preview {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #000;
  
  .nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 88rpx;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10;
    
    .back-btn {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .title {
      flex: 1;
      text-align: center;
      color: #fff;
      font-size: 32rpx;
      margin-right: 60rpx;
    }
  }
  
  .video-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    
    .video {
      width: 100%;
      height: 100%;
    }
    
    .custom-controls {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 5;
      
      .center-play-btn {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100rpx;
        height: 100rpx;
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .bottom-controls {
        position: absolute;
        bottom: 30rpx;
        left: 0;
        width: 100%;
        padding: 0 30rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        .time-info {
          display: flex;
          align-items: center;
          color: #fff;
          font-size: 24rpx;
          
          .time-separator {
            margin: 0 5rpx;
          }
        }
        
        .fullscreen-btn {
          width: 60rpx;
          height: 60rpx;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }
  
  .video-info {
    position: fixed;
    bottom: 100rpx;
    left: 0;
    width: 100%;
    padding: 20rpx 30rpx;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 6;
    
    .info-item {
      display: flex;
      margin-bottom: 10rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .info-label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 24rpx;
        width: 120rpx;
      }
      
      .info-value {
        color: #fff;
        font-size: 24rpx;
      }
    }
  }
}
</style> 