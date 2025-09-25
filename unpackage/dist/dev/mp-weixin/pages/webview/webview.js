"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "webview",
  setup(__props) {
    const url = common_vendor.ref("");
    common_vendor.onLoad((options) => {
      common_vendor.index.__f__("log", "at pages/webview/webview.vue:7", options, "确认设置存在");
      url.value = decodeURIComponent(options.url);
    });
    return (_ctx, _cache) => {
      return {
        a: url.value,
        b: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-deb32cb9"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/webview/webview.js.map
