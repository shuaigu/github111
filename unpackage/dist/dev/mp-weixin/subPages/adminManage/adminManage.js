"use strict";
const common_vendor = require("../../common/vendor.js");
const store_authSwitch = require("../../store/authSwitch.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "adminManage",
  setup(__props) {
    const authSwitchStore = store_authSwitch.useAuthSwitchStore();
    const sendOnApi = common_vendor.tr.importObject("sendOn");
    const sendOnget = async () => {
      try {
        common_vendor.index.showLoading({
          title: "获取按钮状态...",
          mask: true
        });
        const res = await sendOnApi.get();
        if (res && res.data && res.data.length > 0) {
          publishButtonState.value = res.data[0].publishButton !== void 0 ? res.data[0].publishButton : false;
          floatButtonState.value = res.data[0].floatButton !== void 0 ? res.data[0].floatButton : false;
          avatarClickState.value = res.data[0].avatarClick !== void 0 ? res.data[0].avatarClick : false;
          commentVisibilityState.value = res.data[0].commentVisibility !== void 0 ? res.data[0].commentVisibility : false;
          lotteryVisibilityState.value = res.data[0].lotteryVisibility !== void 0 ? res.data[0].lotteryVisibility : false;
          authSwitchStore.setAuthValue(true);
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:31", "发布按钮状态:", publishButtonState.value);
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:32", "悬浮按钮状态:", floatButtonState.value);
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:33", "头像点击状态:", avatarClickState.value);
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:34", "评论显示状态:", commentVisibilityState.value);
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:35", "抽奖模块状态:", lotteryVisibilityState.value);
        } else {
          common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:37", "获取按钮状态失败: 数据格式不正确");
          common_vendor.index.showToast({
            icon: "none",
            title: "获取按钮状态失败"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:44", "获取按钮状态失败:", error);
        common_vendor.index.showToast({
          icon: "none",
          title: "获取按钮状态失败"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    common_vendor.onShow(() => {
      sendOnget();
    });
    const publishButtonState = common_vendor.ref(false);
    const floatButtonState = common_vendor.ref(false);
    const avatarClickState = common_vendor.ref(false);
    const commentVisibilityState = common_vendor.ref(false);
    const lotteryVisibilityState = common_vendor.ref(false);
    const togglePublishButton = async (e) => {
      e.stopPropagation();
      const newState = e.detail.value;
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        publishButtonState.value = newState;
        const res = await sendOnApi.update(true, newState, floatButtonState.value, avatarClickState.value, commentVisibilityState.value, lotteryVisibilityState.value);
        common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:85", "发布按钮状态更新结果:", res);
        common_vendor.index.$emit("publishButtonChanged", newState);
        common_vendor.index.showToast({
          icon: "success",
          title: newState ? "发布按钮已开启" : "发布按钮已关闭",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:96", "更新发布按钮状态失败:", error);
        publishButtonState.value = !newState;
        common_vendor.index.showToast({
          icon: "error",
          title: "操作失败",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const toggleFloatButton = async (e) => {
      e.stopPropagation();
      const newState = e.detail.value;
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        floatButtonState.value = newState;
        const res = await sendOnApi.update(true, publishButtonState.value, newState, avatarClickState.value, commentVisibilityState.value, lotteryVisibilityState.value);
        common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:126", "悬浮按钮状态更新结果:", res);
        common_vendor.index.$emit("floatButtonChanged", newState);
        common_vendor.index.showToast({
          icon: "success",
          title: newState ? "悬浮按钮已开启" : "悬浮按钮已关闭",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:137", "更新悬浮按钮状态失败:", error);
        floatButtonState.value = !newState;
        common_vendor.index.showToast({
          icon: "error",
          title: "操作失败",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const toggleAvatarClick = async (e) => {
      e.stopPropagation();
      const newState = e.detail.value;
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        avatarClickState.value = newState;
        const res = await sendOnApi.update(true, publishButtonState.value, floatButtonState.value, newState, commentVisibilityState.value, lotteryVisibilityState.value);
        common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:167", "头像点击状态更新结果:", res);
        common_vendor.index.$emit("avatarClickChanged", newState);
        common_vendor.index.showToast({
          icon: "success",
          title: newState ? "头像点击已开启" : "头像点击已关闭",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:178", "更新头像点击状态失败:", error);
        avatarClickState.value = !newState;
        common_vendor.index.showToast({
          icon: "error",
          title: "操作失败",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const toggleCommentVisibility = async (e) => {
      e.stopPropagation();
      const newState = e.detail.value;
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        commentVisibilityState.value = newState;
        const res = await sendOnApi.update(true, publishButtonState.value, floatButtonState.value, avatarClickState.value, newState, lotteryVisibilityState.value);
        common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:208", "评论显示状态更新结果:", res);
        common_vendor.index.$emit("commentVisibilityChanged", newState);
        common_vendor.index.showToast({
          icon: "success",
          title: newState ? "评论功能已开启" : "评论功能已关闭",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:219", "更新评论显示状态失败:", error);
        commentVisibilityState.value = !newState;
        common_vendor.index.showToast({
          icon: "error",
          title: "操作失败",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const toggleLotteryVisibility = async (e) => {
      e.stopPropagation();
      const newState = e.detail.value;
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        lotteryVisibilityState.value = newState;
        const res = await sendOnApi.update(true, publishButtonState.value, floatButtonState.value, avatarClickState.value, commentVisibilityState.value, newState);
        common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:249", "抽奖模块显示状态更新结果:", res);
        common_vendor.index.$emit("lotteryVisibilityChanged", newState);
        common_vendor.index.showToast({
          icon: "success",
          title: newState ? "抽奖模块已开启" : "抽奖模块已关闭",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:260", "更新抽奖模块显示状态失败:", error);
        lotteryVisibilityState.value = !newState;
        common_vendor.index.showToast({
          icon: "error",
          title: "操作失败",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    common_vendor.index.$on("publishButtonChanged", (newState) => {
      common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:276", "收到发布按钮状态变化事件:", newState);
      publishButtonState.value = newState;
    });
    common_vendor.index.$on("floatButtonChanged", (newState) => {
      common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:281", "收到悬浮按钮状态变化事件:", newState);
      floatButtonState.value = newState;
    });
    common_vendor.index.$on("avatarClickChanged", (newState) => {
      common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:286", "收到头像点击状态变化事件:", newState);
      avatarClickState.value = newState;
    });
    common_vendor.index.$on("commentVisibilityChanged", (newState) => {
      common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:291", "收到评论显示状态变化事件:", newState);
      commentVisibilityState.value = newState;
    });
    common_vendor.index.$on("lotteryVisibilityChanged", (newState) => {
      common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:296", "收到抽奖模块显示状态变化事件:", newState);
      lotteryVisibilityState.value = newState;
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("publishButtonChanged");
      common_vendor.index.$off("floatButtonChanged");
      common_vendor.index.$off("avatarClickChanged");
      common_vendor.index.$off("commentVisibilityChanged");
      common_vendor.index.$off("lotteryVisibilityChanged");
    });
    const data = common_vendor.ref(["分类管理", "文章管理", "用户反馈", "公司信息", "悬浮按钮控制", "发布按钮控制", "头像点击控制", "评论功能控制", "抽奖模块控制", "用户信息查询", "抽奖管理"]);
    const handleItem = (dataItem) => {
      switch (dataItem) {
        case "分类管理":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:315", "跳转分类管理");
          common_vendor.index.navigateTo({
            url: "/subPages/cateManage/cateManage"
          });
          break;
        case "文章管理":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:321", "跳转文章管理");
          common_vendor.index.navigateTo({
            url: "/subPages/articleManage/articleManage"
          });
          break;
        case "用户反馈":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:327", "跳转用户反馈");
          common_vendor.index.navigateTo({
            url: "/subPages/feedManage/feedManage"
          });
          break;
        case "公司信息":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:333", "跳转公司信息");
          common_vendor.index.navigateTo({
            url: "/subPages/companyInfo/companyInfo"
          });
          break;
        case "悬浮按钮控制":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:339", "点击悬浮按钮控制，不执行任何操作");
          break;
        case "发布按钮控制":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:342", "点击发布按钮控制，不执行任何操作");
          break;
        case "头像点击控制":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:345", "点击头像点击控制，不执行任何操作");
          break;
        case "评论功能控制":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:348", "点击评论功能控制，不执行任何操作");
          break;
        case "用户信息查询":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:351", "跳转用户信息查询");
          common_vendor.index.navigateTo({
            url: "/subPages/userInfoQuery/userInfoQuery"
          });
          break;
        case "抽奖管理":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:357", "跳转抽奖管理");
          common_vendor.index.navigateTo({
            url: "/subPages/subChoujiang/subChoujiang"
          });
          break;
      }
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(data.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item),
            b: item === "发布按钮控制"
          }, item === "发布按钮控制" ? {
            c: publishButtonState.value,
            d: common_vendor.o(togglePublishButton, item),
            e: common_vendor.o(() => {
            }, item)
          } : item === "悬浮按钮控制" ? {
            g: floatButtonState.value,
            h: common_vendor.o(toggleFloatButton, item),
            i: common_vendor.o(() => {
            }, item)
          } : item === "头像点击控制" ? {
            k: avatarClickState.value,
            l: common_vendor.o(toggleAvatarClick, item),
            m: common_vendor.o(() => {
            }, item)
          } : item === "评论功能控制" ? {
            o: commentVisibilityState.value,
            p: common_vendor.o(toggleCommentVisibility, item),
            q: common_vendor.o(() => {
            }, item)
          } : item === "抽奖模块控制" ? {
            s: lotteryVisibilityState.value,
            t: common_vendor.o(toggleLotteryVisibility, item),
            v: common_vendor.o(() => {
            }, item)
          } : {}, {
            f: item === "悬浮按钮控制",
            j: item === "头像点击控制",
            n: item === "评论功能控制",
            r: item === "抽奖模块控制",
            w: "b5b6feed-0-" + i0,
            x: item,
            y: common_vendor.o(($event) => handleItem(item), item)
          });
        }),
        b: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        c: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b5b6feed"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/subPages/adminManage/adminManage.js.map
