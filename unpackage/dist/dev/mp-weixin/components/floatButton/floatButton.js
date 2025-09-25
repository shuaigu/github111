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
const _sfc_main = {
  __name: "floatButton",
  props: {
    // 按钮大小
    size: {
      type: Number,
      default: 90
    },
    // 按钮位置
    position: {
      type: Object,
      default() {
        return {
          bottom: "120rpx",
          right: "40rpx"
        };
      }
    },
    icon: {
      type: String,
      default: "plus"
    }
  },
  emits: ["click"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const handleClick = () => {
      emit("click");
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          type: __props.icon,
          size: "26",
          color: "#fff"
        }),
        b: __props.size + "rpx",
        c: __props.size + "rpx",
        d: __props.position.bottom,
        e: __props.position.right,
        f: common_vendor.o(handleClick),
        g: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c199bce7"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/floatButton/floatButton.js.map
