"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "fenxiang",
  setup(__props) {
    const dynamicTitle = common_vendor.ref("自定义标题123");
    common_vendor.onShareAppMessage(() => ({
      title: dynamicTitle.value,
      path: "/pages/index/index?id=123",
      imageUrl: "/static/images/logo.png"
    }));
    common_vendor.onShareTimeline(() => ({
      title: "朋友圈标题456",
      query: "from=timeline",
      imageUrl: "/static/timeline.jpg"
    }));
    const handleShare = () => {
      common_vendor.index.share({
        title: "按钮触发的分享",
        path: "/pages/index/index",
        success: () => common_vendor.index.__f__("log", "at pages/article/fenxiang.vue:31", "分享成功")
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(handleShare)
      };
    };
  }
};
_sfc_main.__runtimeHooks = 6;
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/article/fenxiang.js.map
