"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "my",
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    const userApi = common_vendor.tr.importObject("userWx", { customUI: true });
    const clickLogin = async () => {
      common_vendor.index.navigateTo({
        url: "/pages/login/login"
      });
    };
    const onChooseAvatar = async (e) => {
      const { avatarUrl } = e.detail;
      if (avatarUrl) {
        try {
          await uploadAndSaveAvatar(avatarUrl);
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/my/my.vue:76", "更新头像失败:", error);
          common_vendor.index.showToast({
            title: error.message || "头像更新失败",
            icon: "none"
          });
        }
      }
    };
    const uploadAndSaveAvatar = async (tempFilePath) => {
      common_vendor.index.showLoading({
        title: "更新头像中..."
      });
      try {
        const uploadRes = await common_vendor.tr.uploadFile({
          filePath: tempFilePath,
          cloudPath: `avatar/${userStore.userInfo.uid}_${Date.now()}.jpg`
        });
        if (!uploadRes.fileID) {
          throw new Error("头像上传失败");
        }
        const result = await userApi.updateUserProfile({
          uid: userStore.userInfo.uid,
          avatarUrl: uploadRes.fileID
        });
        if (result.code === 0) {
          userStore.updateUserAvatar(uploadRes.fileID);
          common_vendor.index.showToast({
            title: "头像更新成功",
            icon: "success"
          });
        } else {
          throw new Error(result.message || "头像更新失败");
        }
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const onNicknameChange = (e) => {
      const nickName = e.detail.value;
      if (nickName && nickName !== userStore.userInfo.nickName) {
        updateNickName(nickName);
      }
    };
    const updateNickName = async (nickName) => {
      try {
        common_vendor.index.showLoading({
          title: "更新昵称中..."
        });
        const result = await userApi.updateUserProfile({
          uid: userStore.userInfo.uid,
          nickName
        });
        if (result.code === 0) {
          userStore.updateUserNickName(nickName);
          common_vendor.index.showToast({
            title: "昵称更新成功",
            icon: "success"
          });
        } else {
          throw new Error(result.message || "昵称更新失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/my/my.vue:159", "更新昵称失败:", error);
        common_vendor.index.showToast({
          title: error.message || "昵称更新失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const contarct = () => {
      common_vendor.index.navigateTo({
        url: "/subPages/contarct/contarct"
      });
    };
    const feedBack = () => {
      common_vendor.index.navigateTo({
        url: "/subPages/feedBack/feedBack"
      });
    };
    const isAdmin = common_vendor.computed(() => userStore.userInfo.role[0] === "admin");
    const adminManage = () => {
      if (isAdmin.value) {
        try {
          common_vendor.index.navigateTo({
            url: "/subPages/adminManage/adminManage",
            fail: (err) => {
              common_vendor.index.__f__("error", "at pages/my/my.vue:260", "跳转到管理页面失败:", err);
              common_vendor.index.showToast({
                title: "页面不存在或配置错误",
                icon: "none",
                duration: 2e3
              });
            }
          });
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/my/my.vue:269", "导航异常:", e);
          common_vendor.index.showToast({
            title: "跳转异常，请重试",
            icon: "none",
            duration: 2e3
          });
        }
      } else {
        common_vendor.index.showToast({
          title: "您没有管理员权限",
          icon: "none",
          duration: 2e3
        });
      }
    };
    const maskedMobile = common_vendor.computed(() => {
      if (!userStore.userInfo.mobile)
        return "";
      const mobile = userStore.userInfo.mobile;
      if (mobile.length !== 11)
        return mobile;
      return mobile.substring(0, 3) + "****" + mobile.substring(7);
    });
    common_vendor.onMounted(() => {
      if (userStore.userInfo.uid)
        ;
    });
    const loginOut = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗",
        success(res) {
          if (res.confirm) {
            userStore.cleanUserInfo();
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(userStore).userInfo.avatarUrl,
        b: common_vendor.unref(userStore).userInfo.isLogin
      }, common_vendor.unref(userStore).userInfo.isLogin ? {
        c: common_vendor.p({
          type: "camera-filled",
          color: "#fff",
          size: "20"
        })
      } : {}, {
        d: common_vendor.o(onChooseAvatar),
        e: common_vendor.unref(userStore).userInfo.isLogin
      }, common_vendor.unref(userStore).userInfo.isLogin ? {
        f: common_vendor.o(onNicknameChange),
        g: common_vendor.unref(userStore).userInfo.nickName,
        h: common_vendor.t(maskedMobile.value)
      } : {
        i: common_vendor.o(clickLogin)
      }, {
        j: common_vendor.p({
          color: "#46b0fe",
          type: "wallet",
          size: "22"
        }),
        k: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        l: common_vendor.o(contarct),
        m: common_vendor.p({
          color: "#46b0fe",
          ["custom-prefix"]: "iconfont",
          type: "icon-yijianfankui",
          size: "22"
        }),
        n: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        o: common_vendor.o(feedBack),
        p: common_vendor.unref(userStore).userInfo.role[0] == "admin"
      }, common_vendor.unref(userStore).userInfo.role[0] == "admin" ? {
        q: common_vendor.p({
          color: "#46b0fe",
          ["custom-prefix"]: "iconfont",
          type: "icon-houtaiguanli",
          size: "22"
        }),
        r: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        s: common_vendor.o(adminManage)
      } : {}, {
        t: common_vendor.unref(userStore).userInfo.isLogin
      }, common_vendor.unref(userStore).userInfo.isLogin ? {
        v: common_vendor.p({
          color: "#ff6b6b",
          ["custom-prefix"]: "iconfont",
          type: "icon-tuichudenglu",
          size: "22"
        }),
        w: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        x: common_vendor.o(loginOut)
      } : {}, {
        y: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2f1ef635"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/my/my.js.map
