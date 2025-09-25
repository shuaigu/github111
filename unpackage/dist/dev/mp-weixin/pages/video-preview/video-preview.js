"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "video-preview",
  setup(__props) {
    const videoUrl = common_vendor.ref("");
    const thumbnailUrl = common_vendor.ref("");
    const videoDuration = common_vendor.ref(0);
    const videoSize = common_vendor.ref(0);
    const videoWidth = common_vendor.ref(0);
    const videoHeight = common_vendor.ref(0);
    const videoContext = common_vendor.ref(null);
    const isPlaying = common_vendor.ref(false);
    const currentTime = common_vendor.ref(0);
    const showControls = common_vendor.ref(true);
    const controlsTimeout = common_vendor.ref(null);
    const formatTime = (seconds) => {
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60);
      return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    };
    const formatSize = (bytes) => {
      if (bytes < 1024) {
        return bytes + "B";
      } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + "KB";
      } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(2) + "MB";
      } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + "GB";
      }
    };
    const formattedDuration = common_vendor.computed(() => {
      return formatTime(videoDuration.value);
    });
    const formattedCurrentTime = common_vendor.computed(() => {
      return formatTime(currentTime.value);
    });
    const formattedSize = common_vendor.computed(() => {
      return formatSize(videoSize.value);
    });
    const resolution = common_vendor.computed(() => {
      return `${videoWidth.value}x${videoHeight.value}`;
    });
    common_vendor.onMounted(() => {
      getOpenerEventChannel();
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const query = currentPage.options || {};
      common_vendor.index.__f__("log", "at pages/video-preview/video-preview.vue:63", "视频预览页面参数:", query);
      if (query.videoUrl) {
        videoUrl.value = decodeURIComponent(query.videoUrl);
        common_vendor.index.__f__("log", "at pages/video-preview/video-preview.vue:67", "视频URL:", videoUrl.value);
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
      videoContext.value = common_vendor.index.createVideoContext("myVideo");
      hideControlsAfterDelay();
    });
    common_vendor.onUnmounted(() => {
      if (videoContext.value) {
        videoContext.value.pause();
      }
      if (controlsTimeout.value) {
        clearTimeout(controlsTimeout.value);
      }
    });
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const togglePlay = () => {
      if (isPlaying.value) {
        videoContext.value.pause();
      } else {
        videoContext.value.play();
      }
      isPlaying.value = !isPlaying.value;
      showControls.value = true;
      hideControlsAfterDelay();
    };
    const onPlay = () => {
      isPlaying.value = true;
    };
    const onPause = () => {
      isPlaying.value = false;
    };
    const onTimeUpdate = (e) => {
      currentTime.value = e.detail.currentTime;
    };
    const onVideoClick = () => {
      showControls.value = !showControls.value;
      if (showControls.value) {
        hideControlsAfterDelay();
      }
    };
    const hideControlsAfterDelay = () => {
      if (controlsTimeout.value) {
        clearTimeout(controlsTimeout.value);
      }
      controlsTimeout.value = setTimeout(() => {
        if (isPlaying.value) {
          showControls.value = false;
        }
      }, 3e3);
    };
    const fullScreen = () => {
      videoContext.value.requestFullScreen({
        direction: 0
        // 0: 正常竖屏, 90: 横屏
      });
    };
    const onVideoError = (e) => {
      common_vendor.index.__f__("error", "at pages/video-preview/video-preview.vue:169", "视频加载错误:", e);
      common_vendor.index.showToast({
        title: "视频加载失败",
        icon: "none"
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: showControls.value
      }, showControls.value ? {
        b: common_vendor.p({
          type: "back",
          size: "24",
          color: "#fff"
        }),
        c: common_vendor.o(goBack)
      } : {}, {
        d: videoUrl.value,
        e: thumbnailUrl.value,
        f: common_vendor.o(onPlay),
        g: common_vendor.o(onPause),
        h: common_vendor.o(onTimeUpdate),
        i: common_vendor.o(onVideoError),
        j: showControls.value
      }, showControls.value ? {
        k: common_vendor.p({
          type: isPlaying.value ? "pause-filled" : "play-filled",
          size: "50",
          color: "#fff"
        }),
        l: common_vendor.o(togglePlay),
        m: common_vendor.t(formattedCurrentTime.value),
        n: common_vendor.t(formattedDuration.value),
        o: common_vendor.p({
          type: "arrow-right",
          size: "24",
          color: "#fff"
        }),
        p: common_vendor.o(fullScreen)
      } : {}, {
        q: showControls.value
      }, showControls.value ? {
        r: common_vendor.t(formattedDuration.value),
        s: common_vendor.t(formattedSize.value),
        t: common_vendor.t(resolution.value)
      } : {}, {
        v: common_vendor.o(onVideoClick),
        w: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f5f6ca31"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/video-preview/video-preview.js.map
