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
const pageSize = 10;
const _sfc_main = {
  __name: "userInfoQuery",
  setup(__props) {
    const searchForm = common_vendor.reactive({
      mobile: "",
      nickName: ""
    });
    const userList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const hasMore = common_vendor.ref(true);
    const page = common_vendor.ref(1);
    const availableRoles = [
      { id: "user", name: "普通用户", description: "基础用户权限" },
      { id: "admin", name: "管理员", description: "拥有系统管理权限" },
      { id: "vip", name: "VIP用户", description: "拥有特殊内容访问权限" },
      { id: "editor", name: "编辑", description: "可以编辑和发布内容" }
    ];
    const userApi = common_vendor.tr.importObject("user", { customUI: true });
    const searchUsers = async () => {
      if (!searchForm.mobile && !searchForm.nickName) {
        common_vendor.index.showToast({
          title: "请输入手机号或昵称",
          icon: "none"
        });
        return;
      }
      try {
        loading.value = true;
        page.value = 1;
        const result = await userApi.queryUsers({
          ...searchForm,
          page: page.value,
          pageSize
        });
        userList.value = result.data.map((user) => ensureUserRole(user));
        hasMore.value = result.data.length >= pageSize;
        if (userList.value.length === 0) {
          common_vendor.index.showToast({
            title: "未找到匹配的用户",
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.showToast({
          title: "查询失败: " + e.message,
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const resetSearch = () => {
      searchForm.mobile = "";
      searchForm.nickName = "";
      userList.value = [];
      page.value = 1;
      hasMore.value = true;
    };
    const viewUserDetail = (user) => {
      common_vendor.index.navigateTo({
        url: `/subPages/userDetail/userDetail?id=${user._id}`
      });
    };
    const toggleUserRole = async (user, roleId, event) => {
      var _a;
      event.stopPropagation();
      if (roleId === "user" && user.role && user.role.includes("user")) {
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
        const hasRole2 = user.role && user.role.includes(roleId);
        const roleName = ((_a = availableRoles.find((r) => r.id === roleId)) == null ? void 0 : _a.name) || roleId;
        await userApi.updateUserRole({
          userId: user._id,
          action: hasRole2 ? "remove" : "add",
          role: roleId
        });
        if (hasRole2) {
          const index = user.role.indexOf(roleId);
          user.role.splice(index, 1);
        } else {
          if (!user.role) {
            user.role = [];
          }
          user.role.push(roleId);
        }
        common_vendor.index.showToast({
          title: hasRole2 ? `已移除${roleName}权限` : `已设为${roleName}`,
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
    const hasRole = (user, roleId) => {
      return user.role && user.role.includes(roleId);
    };
    const showRoleManagePopup = (user) => {
      common_vendor.index.navigateTo({
        url: `/subPages/userRoleManage/userRoleManage?id=${user._id}`
      });
    };
    const ensureUserRole = (user) => {
      if (!user.role) {
        user.role = ["user"];
      } else if (!user.role.includes("user")) {
        user.role.push("user");
      }
      return user;
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: searchForm.mobile,
        b: common_vendor.o(($event) => searchForm.mobile = $event.detail.value),
        c: searchForm.nickName,
        d: common_vendor.o(($event) => searchForm.nickName = $event.detail.value),
        e: common_vendor.o(searchUsers),
        f: common_vendor.o(resetSearch),
        g: userList.value.length === 0 && !loading.value
      }, userList.value.length === 0 && !loading.value ? {} : {}, {
        h: common_vendor.f(userList.value, (user, index, i0) => {
          return {
            a: user.avatarUrl || "/static/images/default-avatar.png",
            b: common_vendor.t(user.nickName || "未设置昵称"),
            c: common_vendor.t(user.mobile),
            d: common_vendor.t(user.status === 0 ? "正常" : user.status === 1 ? "禁用" : "封禁"),
            e: user.status === 0 ? 1 : "",
            f: user.status === 1 ? 1 : "",
            g: user.status === 2 ? 1 : "",
            h: common_vendor.f(availableRoles, (role, k1, i1) => {
              return {
                a: common_vendor.t(role.name),
                b: role.id,
                c: hasRole(user, role.id) ? 1 : "",
                d: common_vendor.o(($event) => toggleUserRole(user, role.id, $event), role.id)
              };
            }),
            i: "4bcb11a3-0-" + i0,
            j: common_vendor.o(($event) => showRoleManagePopup(user), index),
            k: "4bcb11a3-1-" + i0,
            l: index,
            m: common_vendor.o(($event) => viewUserDetail(user), index)
          };
        }),
        i: common_vendor.p({
          type: "more-filled",
          size: "18",
          color: "#999"
        }),
        j: common_vendor.p({
          type: "right",
          size: "20",
          color: "#CCCCCC"
        }),
        k: loading.value
      }, loading.value ? {} : {}, {
        l: !hasMore.value && userList.value.length > 0
      }, !hasMore.value && userList.value.length > 0 ? {} : {}, {
        m: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4bcb11a3"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/subPages/userInfoQuery/userInfoQuery.js.map
