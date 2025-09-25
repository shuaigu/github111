"use strict";
const common_vendor = require("../common/vendor.js");
const store_user = require("../store/user.js");
const testLogin = () => {
  const userStore = store_user.useUserInfoStore();
  common_vendor.index.__f__("log", "at utils/isLogin.js:8", "检查登录状态 - store中的用户信息:", userStore.userInfo);
  if (userStore.userInfo && userStore.userInfo.uid) {
    common_vendor.index.__f__("log", "at utils/isLogin.js:12", "用户已在store中登录，UID:", userStore.userInfo.uid);
    return true;
  }
  const userInfo = common_vendor.index.getStorageSync("userInfo");
  common_vendor.index.__f__("log", "at utils/isLogin.js:18", "检查登录状态 - 本地存储中的用户信息:", userInfo);
  if (userInfo && userInfo.uid) {
    common_vendor.index.__f__("log", "at utils/isLogin.js:22", "从本地存储中找到用户信息，正在更新store");
    userStore.setUserInfo(userInfo);
    return true;
  }
  common_vendor.index.showModal({
    title: "提示",
    content: "请登录后继续",
    confirmColor: "#399bfe",
    confirmText: "去登录",
    success: (res) => {
      if (res.confirm) {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const currentRoute = currentPage.route;
        const currentOptions = currentPage.options || {};
        let redirectUrl = "/" + currentRoute;
        const queryParams = [];
        for (const key in currentOptions) {
          if (currentOptions.hasOwnProperty(key)) {
            queryParams.push(`${key}=${encodeURIComponent(currentOptions[key])}`);
          }
        }
        if (queryParams.length > 0) {
          redirectUrl += "?" + queryParams.join("&");
        }
        common_vendor.index.navigateTo({
          url: `/pages/login/login?redirect=${encodeURIComponent(redirectUrl)}`
        });
      }
    }
  });
  return false;
};
exports.testLogin = testLogin;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/isLogin.js.map
