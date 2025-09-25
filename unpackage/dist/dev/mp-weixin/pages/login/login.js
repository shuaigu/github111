"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const utils_ag = require("../../utils/ag.js");
const store_user = require("../../store/user.js");
if (!Array) {
  const _easycom_u_checkbox2 = common_vendor.resolveComponent("u-checkbox");
  _easycom_u_checkbox2();
}
const _easycom_u_checkbox = () => "../../uni_modules/uview-plus/components/u-checkbox/u-checkbox.js";
if (!Math) {
  _easycom_u_checkbox();
}
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    const userApi = common_vendor.tr.importObject("userWx");
    const aloneChecked = common_vendor.ref(false);
    const modelShow = common_vendor.ref(false);
    const redirectUrl = common_vendor.ref("");
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options || {};
      if (options.redirect) {
        redirectUrl.value = decodeURIComponent(options.redirect);
        common_vendor.index.__f__("log", "at pages/login/login.vue:26", "获取到重定向URL:", redirectUrl.value);
      }
    });
    const navigateToAgreement = (type) => {
      common_vendor.index.__f__("log", "at pages/login/login.vue:32", type);
      let url = "";
      if (type === "vipServer") {
        common_vendor.index.navigateTo({
          url: "/pages/login/2.html"
        });
        return;
      } else if (type === "privacyAgreement") {
        url = utils_ag.privacyAgreement;
        common_vendor.index.__f__("log", "at pages/login/login.vue:42", "隐私");
      }
      common_vendor.index.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(url)}`
      });
    };
    let codeRes;
    const clickLogin = async () => {
      if (!aloneChecked.value) {
        aloneChecked.value = true;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const res = await common_vendor.index.login();
      codeRes = res.code;
      modelShow.value = true;
    };
    const userInfoData = common_vendor.ref({
      uid: "",
      //本地平台ID
      nickName: "",
      //昵称
      avatarUrl: "/static/images/default.png",
      //头像地址
      mobile: "",
      //手机号码
      isLogin: false,
      //登录状态
      role: [],
      //默认角色
      openid_wx: ""
    });
    const getMobile = async (e) => {
      common_vendor.index.__f__("log", "at pages/login/login.vue:80", e);
      let params = {
        code: codeRes,
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      };
      common_vendor.index.__f__("log", "at pages/login/login.vue:87", params, "构建");
      if (e.detail.errMsg === "getPhoneNumber:ok") {
        const res = await userApi.loginByPhoneWx(params);
        common_vendor.index.__f__("log", "at pages/login/login.vue:93", res, "服务器返回");
        if (res.data._id) {
          modelShow.value = false;
          userInfoData.value = {
            uid: res.data._id,
            //本地平台ID
            nickName: res.data.nickName,
            //昵称
            avatarUrl: res.data.avatarUrl || "/static/images/default.png",
            //没有就默认
            mobile: res.data.mobile,
            //手机号码
            isLogin: true,
            //登录状态
            role: res.data.role,
            //默认角色
            openid_wx: res.data.openid_wx
          };
          common_vendor.index.__f__("log", "at pages/login/login.vue:109", userInfoData.value, "用户登录成功");
          userStore.setUserInfo(userInfoData.value);
          common_vendor.index.showToast({
            icon: "success",
            title: res.message
          });
          setTimeout(() => {
            loginSuccess();
          }, 500);
        } else {
          throw new Error("登录失败");
        }
      } else {
        throw new Error("获取手机号失败");
      }
    };
    const loginSuccess = () => {
      common_vendor.index.$emit("loginSuccess");
      if (redirectUrl.value) {
        common_vendor.index.__f__("log", "at pages/login/login.vue:137", "正在重定向到:", redirectUrl.value);
        common_vendor.index.redirectTo({
          url: redirectUrl.value,
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/login/login.vue:141", "重定向失败:", err);
            common_vendor.index.navigateBack({
              delta: 1,
              fail: () => {
                common_vendor.index.switchTab({
                  url: "/pages/index/index"
                });
              }
            });
          }
        });
      } else {
        common_vendor.index.navigateBack({
          delta: 1,
          fail: () => {
            common_vendor.index.switchTab({
              url: "/pages/index/index"
            });
          }
        });
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_assets._imports_0,
        b: common_vendor.o((e) => {
          aloneChecked.value = e;
        }),
        c: common_vendor.p({
          activeColor: "#46b0fe",
          name: "agree",
          checked: aloneChecked.value,
          shape: "circle"
        }),
        d: common_vendor.o(($event) => navigateToAgreement("vipServer")),
        e: common_vendor.o(($event) => navigateToAgreement("privacyAgreement")),
        f: common_vendor.o(clickLogin),
        g: modelShow.value
      }, modelShow.value ? {
        h: common_assets._imports_1,
        i: common_vendor.o(($event) => modelShow.value = false),
        j: common_vendor.o(getMobile)
      } : {}, {
        k: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
