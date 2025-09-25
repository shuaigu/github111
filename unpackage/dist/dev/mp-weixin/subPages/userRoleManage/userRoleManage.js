"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  _easycom_uni_load_more2();
}
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
if (!Math) {
  _easycom_uni_load_more();
}
const _sfc_main = {
  __name: "userRoleManage",
  setup(__props) {
    const userId = common_vendor.ref("");
    const userInfo = common_vendor.ref(null);
    const loading = common_vendor.ref(true);
    const allRoles = common_vendor.ref([
      { id: "admin", name: "管理员", description: "拥有系统管理权限" },
      { id: "vip", name: "VIP用户", description: "拥有特殊内容访问权限" },
      { id: "editor", name: "编辑", description: "可以编辑和发布内容" },
      { id: "reviewer", name: "审核员", description: "可以审核内容" },
      { id: "customer", name: "客服", description: "处理用户反馈" },
      { id: "user", name: "普通用户", description: "基础用户权限" }
    ]);
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
    const toggleRole = async (roleId) => {
      if (roleId === "user" && userInfo.value.role && userInfo.value.role.includes("user")) {
        common_vendor.index.showToast({
          title: "不能移除普通用户角色",
          icon: "none"
        });
        return;
      }
      try {
        common_vendor.index.showLoading({
          title: "处理中..."
        });
        const hasRole2 = userInfo.value.role && userInfo.value.role.includes(roleId);
        await userApi.updateUserRole({
          userId: userId.value,
          action: hasRole2 ? "remove" : "add",
          role: roleId
        });
        if (hasRole2) {
          const index = userInfo.value.role.indexOf(roleId);
          userInfo.value.role.splice(index, 1);
        } else {
          if (!userInfo.value.role) {
            userInfo.value.role = [];
          }
          userInfo.value.role.push(roleId);
        }
        common_vendor.index.showToast({
          title: hasRole2 ? "已移除角色" : "已添加角色",
          icon: "success"
        });
      } catch (e) {
        common_vendor.index.showToast({
          title: "操作失败: " + e.message,
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const hasRole = (roleId) => {
      return userInfo.value && userInfo.value.role && userInfo.value.role.includes(roleId);
    };
    common_vendor.onMounted(() => {
      var _a;
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = (_a = currentPage.$page) == null ? void 0 : _a.options;
      if (options && options.id) {
        userId.value = options.id;
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
      }, loading.value ? {
        b: common_vendor.p({
          status: "loading",
          contentText: {
            contentdown: "加载中..."
          }
        })
      } : userInfo.value ? {
        d: userInfo.value.avatarUrl || "/static/images/default-avatar.png",
        e: common_vendor.t(userInfo.value.nickName || "未设置昵称"),
        f: common_vendor.t(userInfo.value.mobile),
        g: common_vendor.f(allRoles.value, (role, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(role.name),
            b: common_vendor.t(role.description),
            c: role.id === "user"
          }, role.id === "user" ? {} : {}, {
            d: hasRole(role.id),
            e: common_vendor.o(($event) => toggleRole(role.id), role.id),
            f: role.id === "user" && hasRole("user"),
            g: role.id === "user" && hasRole("user") ? 1 : "",
            h: role.id,
            i: role.id === "user" ? 1 : ""
          });
        })
      } : {}, {
        c: userInfo.value,
        h: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-62f23709"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/subPages/userRoleManage/userRoleManage.js.map
