"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "userDetail",
  setup(__props) {
    const userId = common_vendor.ref("");
    const userInfo = common_vendor.ref(null);
    const loading = common_vendor.ref(true);
    const enableScroll = common_vendor.ref(true);
    const scrollHeight = common_vendor.ref(0);
    const allRoles = [
      { id: "admin", name: "管理员", description: "拥有系统管理权限" },
      { id: "vip", name: "VIP用户", description: "拥有特殊内容访问权限" },
      { id: "editor", name: "编辑", description: "可以编辑和发布内容" },
      { id: "reviewer", name: "审核员", description: "可以审核内容" },
      { id: "customer", name: "客服", description: "处理用户反馈" },
      { id: "user", name: "普通用户", description: "基础用户权限" }
    ];
    const userApi = common_vendor.tr.importObject("user", { customUI: true });
    const getUserDetail = async () => {
      try {
        loading.value = true;
        const result = await userApi.getUserById(userId.value);
        userInfo.value = result.data;
        if (!userInfo.value.role) {
          userInfo.value.role = ["user"];
        } else if (!userInfo.value.role.includes("user")) {
          userInfo.value.role.push("user");
        }
      } catch (e) {
        common_vendor.index.showToast({
          title: "获取用户信息失败: " + e.message,
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const updateUserStatus = async (status) => {
      try {
        common_vendor.index.showLoading({
          title: "更新中..."
        });
        await userApi.updateUserStatus({
          userId: userId.value,
          status
        });
        common_vendor.index.showToast({
          title: "状态更新成功",
          icon: "success"
        });
        getUserDetail();
      } catch (e) {
        common_vendor.index.showToast({
          title: "更新失败: " + e.message,
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const getRoleName = (roleId) => {
      const role = allRoles.find((r) => r.id === roleId);
      return role ? role.name : roleId;
    };
    const manageUserRoles = () => {
      if (userId.value) {
        common_vendor.index.__f__("log", "at subPages/userDetail/userDetail.vue:85", "跳转到角色管理页面，用户ID:", userId.value);
        try {
          common_vendor.index.setStorageSync("CURRENT_MANAGE_USER_ID", userId.value);
          common_vendor.index.__f__("log", "at subPages/userDetail/userDetail.vue:91", "用户ID已保存到本地存储:", userId.value);
        } catch (e) {
          common_vendor.index.__f__("error", "at subPages/userDetail/userDetail.vue:93", "保存用户ID到本地存储失败:", e);
        }
        common_vendor.index.navigateTo({
          url: "/subPages/userRoleManage/userRoleManage",
          success: () => {
            common_vendor.index.__f__("log", "at subPages/userDetail/userDetail.vue:100", "成功跳转到角色管理页面");
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at subPages/userDetail/userDetail.vue:103", "跳转失败:", err);
            common_vendor.index.showToast({
              title: "页面跳转失败",
              icon: "none"
            });
          }
        });
      } else {
        common_vendor.index.showToast({
          title: "用户ID不存在，无法管理角色",
          icon: "none"
        });
      }
    };
    common_vendor.onMounted(() => {
      var _a, _b, _c;
      common_vendor.index.getSystemInfo({
        success: (res) => {
          scrollHeight.value = res.windowHeight;
        }
      });
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      let id = "";
      if ((_b = (_a = currentPage.$page) == null ? void 0 : _a.options) == null ? void 0 : _b.id) {
        id = currentPage.$page.options.id;
      } else if ((_c = currentPage.options) == null ? void 0 : _c.id) {
        id = currentPage.options.id;
      } else {
        const query = common_vendor.index.getStorageSync("CURRENT_USER_ID");
        if (query) {
          id = query;
          common_vendor.index.removeStorageSync("CURRENT_USER_ID");
        }
      }
      if (id) {
        userId.value = id;
        getUserDetail();
      } else {
        common_vendor.index.showToast({
          title: "用户ID不存在",
          icon: "none"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : userInfo.value ? common_vendor.e({
        c: userInfo.value.avatarUrl || "/static/images/default-avatar.png",
        d: common_vendor.t(userInfo.value.nickName || "未设置昵称"),
        e: common_vendor.t(userInfo.value.status === 0 ? "正常" : userInfo.value.status === 1 ? "禁用" : "封禁"),
        f: userInfo.value.status === 0 ? 1 : "",
        g: userInfo.value.status === 1 ? 1 : "",
        h: userInfo.value.status === 2 ? 1 : "",
        i: common_vendor.t(userInfo.value._id),
        j: common_vendor.t(userInfo.value.mobile),
        k: common_vendor.t(userInfo.value.gender === 1 ? "男" : userInfo.value.gender === 2 ? "女" : "未知"),
        l: common_vendor.t(userInfo.value.role ? userInfo.value.role.join(", ") : "无"),
        m: common_vendor.t(new Date(userInfo.value.create_time).toLocaleString()),
        n: common_vendor.t(new Date(userInfo.value.update_time).toLocaleString()),
        o: common_vendor.o(manageUserRoles),
        p: userInfo.value.role && userInfo.value.role.length > 0
      }, userInfo.value.role && userInfo.value.role.length > 0 ? {
        q: common_vendor.f(userInfo.value.role, (roleId, k0, i0) => {
          return {
            a: common_vendor.t(getRoleName(roleId)),
            b: roleId
          };
        })
      } : {}, {
        r: common_vendor.t(userInfo.value.openid_wx || "未绑定"),
        s: common_vendor.t(userInfo.value.openid_ds || "未绑定"),
        t: common_vendor.t(userInfo.value.openid_ks || "未绑定"),
        v: userInfo.value.status === 0 ? 1 : "",
        w: common_vendor.o(($event) => userInfo.value.status !== 0 && updateUserStatus(0)),
        x: userInfo.value.status === 1 ? 1 : "",
        y: common_vendor.o(($event) => userInfo.value.status !== 1 && updateUserStatus(1)),
        z: userInfo.value.status === 2 ? 1 : "",
        A: common_vendor.o(($event) => userInfo.value.status !== 2 && updateUserStatus(2))
      }) : {}, {
        b: userInfo.value,
        B: scrollHeight.value + "px",
        C: "overflow:" + (enableScroll.value ? "auto" : "hidden"),
        D: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-904b5e03"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/subPages/userDetail/userDetail.js.map
