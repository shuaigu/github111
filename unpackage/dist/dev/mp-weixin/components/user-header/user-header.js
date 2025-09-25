"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  __name: "user-header",
  props: {
    // 用户头像
    userInfo: {
      type: Object,
      default: () => {
      }
    },
    // 文章总数
    articleTotal: {
      type: Number,
      default: 0
    },
    // 点赞总数
    likesTotal: {
      type: Number,
      default: 0
    }
  },
  emits: ["contact", "publish"],
  setup(__props, { emit: __emit }) {
    store_user.useUserInfoStore();
    const emit = __emit;
    const handleContact = () => {
      emit("contact");
    };
    const handlePublish = () => {
      emit("publish");
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(handlePublish),
        b: __props.userInfo.avatarUrl,
        c: common_vendor.t(__props.userInfo.nickName),
        d: common_vendor.t(__props.articleTotal),
        e: common_vendor.o(handleContact),
        f: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fb8a6be5"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/user-header/user-header.js.map
