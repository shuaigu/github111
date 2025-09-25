"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const uni_modules_uviewPlus_index = require("./uni_modules/uview-plus/index.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/my/my.js";
  "./pages/login/login.js";
  "./pages/webview/webview.js";
  "./pages/article/articleDetail.js";
  "./pages/userArticleList/userArticleList.js";
  "./pages/fabu/fabu.js";
  "./pages/video-preview/video-preview.js";
  "./pages/liaotian/liaotian.js";
  "./pages/article/fenxiang.js";
  "./subPages/contarct/contarct.js";
  "./subPages/feedBack/feedBack.js";
  "./subPages/adminManage/adminManage.js";
  "./subPages/cateManage/cateManage.js";
  "./subPages/articleManage/articleManage.js";
  "./subPages/feedManage/feedManage.js";
  "./subPages/companyInfo/companyInfo.js";
  "./subPages/userInfoQuery/userInfoQuery.js";
  "./subPages/userDetail/userDetail.js";
  "./subPages/userRoleManage/userRoleManage.js";
  "./subPages/qiniuyun/qiniuyun.js";
  "./subPages/subChoujiang/subChoujiang.js";
}
const _sfc_main = {
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:4", "App Launch");
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:7", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:10", "App Hide");
  }
};
const createPersistedState = (options = {}) => {
  const storage = {
    getItem: (key) => common_vendor.index.getStorageSync(key),
    setItem: (key, value) => common_vendor.index.setStorageSync(key, value)
  };
  return ({ store }) => {
    if (!options.stores || options.stores.includes(store.$id)) {
      const storageKey = `${options.prefix || "pinia"}-${store.$id}`;
      const persisted = storage.getItem(storageKey);
      if (persisted) {
        store.$patch(JSON.parse(persisted));
      }
      store.$subscribe((_, state) => {
        storage.setItem(storageKey, JSON.stringify(state));
      });
    }
  };
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  const pinia = common_vendor.createPinia();
  pinia.use(createPersistedState({
    // 可选：指定哪些store需要持久化
    stores: ["userInfo", "cart", "settings"],
    // 示例，根据实际需求修改
    // 可选：存储前缀
    prefix: "wx2-"
  }));
  app.use(pinia);
  app.use(uni_modules_uviewPlus_index.uviewPlus);
  uni_modules_uviewPlus_index.mount$u();
  return {
    app,
    pinia
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
