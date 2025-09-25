"use strict";
const uni_modules_uviewPlus_components_uCheckbox_props = require("./props.js");
const uni_modules_uviewPlus_libs_mixin_mpMixin = require("../../libs/mixin/mpMixin.js");
const uni_modules_uviewPlus_libs_mixin_mixin = require("../../libs/mixin/mixin.js");
const uni_modules_uviewPlus_libs_function_index = require("../../libs/function/index.js");
const uni_modules_uviewPlus_libs_function_test = require("../../libs/function/test.js");
const common_vendor = require("../../../../common/vendor.js");
const _sfc_main = {
  name: "u-checkbox",
  mixins: [uni_modules_uviewPlus_libs_mixin_mpMixin.mpMixin, uni_modules_uviewPlus_libs_mixin_mixin.mixin, uni_modules_uviewPlus_components_uCheckbox_props.props],
  data() {
    return {
      isChecked: false,
      // 父组件的默认值，因为头条小程序不支持在computed中使用this.parent.shape的形式
      // 故只能使用如此方法
      parentData: {
        iconSize: 12,
        labelDisabled: null,
        disabled: null,
        shape: "square",
        activeColor: null,
        inactiveColor: null,
        size: 18,
        modelValue: null,
        iconColor: null,
        placement: "row",
        borderBottom: false,
        iconPlacement: "left"
      }
    };
  },
  computed: {
    // 是否禁用，如果父组件u-radios-group禁用的话，将会忽略子组件的配置
    elDisabled() {
      return this.disabled !== "" ? this.disabled : this.parentData.disabled !== null ? this.parentData.disabled : false;
    },
    // 是否禁用label点击
    elLabelDisabled() {
      return this.labelDisabled !== "" ? this.labelDisabled : this.parentData.labelDisabled !== null ? this.parentData.labelDisabled : false;
    },
    // 组件尺寸，对应size的值，默认值为21px
    elSize() {
      return this.size ? this.size : this.parentData.size ? this.parentData.size : 21;
    },
    // 组件的勾选图标的尺寸，默认12px
    elIconSize() {
      return this.iconSize ? this.iconSize : this.parentData.iconSize ? this.parentData.iconSize : 12;
    },
    // 组件选中激活时的颜色
    elActiveColor() {
      return this.activeColor ? this.activeColor : this.parentData.activeColor ? this.parentData.activeColor : "#2979ff";
    },
    // 组件选未中激活时的颜色
    elInactiveColor() {
      return this.inactiveColor ? this.inactiveColor : this.parentData.inactiveColor ? this.parentData.inactiveColor : "#c8c9cc";
    },
    // label的颜色
    elLabelColor() {
      return this.labelColor ? this.labelColor : this.parentData.labelColor ? this.parentData.labelColor : "#606266";
    },
    // 组件的形状
    elShape() {
      return this.shape ? this.shape : this.parentData.shape ? this.parentData.shape : "circle";
    },
    // label大小
    elLabelSize() {
      return uni_modules_uviewPlus_libs_function_index.addUnit(this.labelSize ? this.labelSize : this.parentData.labelSize ? this.parentData.labelSize : "15");
    },
    elIconColor() {
      const iconColor = this.iconColor ? this.iconColor : this.parentData.iconColor ? this.parentData.iconColor : "#ffffff";
      if (this.elDisabled) {
        return this.isChecked ? this.elInactiveColor : "transparent";
      } else {
        return this.isChecked ? iconColor : "transparent";
      }
    },
    iconClasses() {
      let classes = [];
      classes.push("u-checkbox__icon-wrap--" + this.elShape);
      if (this.elDisabled) {
        classes.push("u-checkbox__icon-wrap--disabled");
      }
      if (this.isChecked && this.elDisabled) {
        classes.push("u-checkbox__icon-wrap--disabled--checked");
      }
      return classes;
    },
    iconWrapStyle() {
      const style = {};
      style.backgroundColor = this.isChecked && !this.elDisabled ? this.elActiveColor : "#ffffff";
      style.borderColor = this.isChecked && !this.elDisabled ? this.elActiveColor : this.elInactiveColor;
      style.width = uni_modules_uviewPlus_libs_function_index.addUnit(this.elSize);
      style.height = uni_modules_uviewPlus_libs_function_index.addUnit(this.elSize);
      if (!this.usedAlone) {
        if (this.parentData.iconPlacement === "right") {
          style.marginRight = 0;
        }
      }
      return style;
    },
    checkboxStyle() {
      const style = {};
      if (!this.usedAlone) {
        if (this.parentData.borderBottom && this.parentData.placement === "row") {
          uni_modules_uviewPlus_libs_function_index.error("检测到您将borderBottom设置为true，需要同时将u-checkbox-group的placement设置为column才有效");
        }
        if (this.parentData.borderBottom && this.parentData.placement === "column") {
          style.paddingBottom = "8px";
        }
      }
      return uni_modules_uviewPlus_libs_function_index.deepMerge(style, uni_modules_uviewPlus_libs_function_index.addStyle(this.customStyle));
    }
  },
  mounted() {
    this.init();
  },
  emits: ["change", "update:checked"],
  methods: {
    init() {
      if (!this.usedAlone) {
        this.updateParentData();
        if (!this.parent) {
          uni_modules_uviewPlus_libs_function_index.error("u-checkbox必须搭配u-checkbox-group组件使用");
        }
        const value = this.parentData.modelValue;
        if (this.checked) {
          this.isChecked = true;
        } else if (!this.usedAlone && uni_modules_uviewPlus_libs_function_test.test.array(value)) {
          this.isChecked = value.some((item) => {
            return item === this.name;
          });
        }
      } else {
        if (this.checked) {
          this.isChecked = true;
        }
      }
    },
    updateParentData() {
      this.getParentData("u-checkbox-group");
    },
    // 横向两端排列时，点击组件即可触发选中事件
    wrapperClickHandler(e) {
      if (!this.usedAlone) {
        this.parentData.iconPlacement === "right" && this.iconClickHandler(e);
      } else {
        this.iconClickHandler(e);
      }
    },
    // 点击图标
    iconClickHandler(e) {
      this.preventEvent(e);
      if (!this.elDisabled) {
        this.setRadioCheckedStatus();
      }
    },
    // 点击label
    labelClickHandler(e) {
      this.preventEvent(e);
      if (!this.elLabelDisabled && !this.elDisabled) {
        this.setRadioCheckedStatus();
      }
    },
    emitEvent() {
      this.$emit("change", this.isChecked);
      if (this.usedAlone) {
        this.$emit("update:checked", this.isChecked);
      }
      this.$nextTick(() => {
        uni_modules_uviewPlus_libs_function_index.formValidate(this, "change");
      });
    },
    // 改变组件选中状态
    // 这里的改变的依据是，更改本组件的checked值为true，同时通过父组件遍历所有u-checkbox实例
    // 将本组件外的其他u-checkbox的checked都设置为false(都被取消选中状态)，因而只剩下一个为选中状态
    setRadioCheckedStatus() {
      this.isChecked = !this.isChecked;
      this.emitEvent();
      if (!this.usedAlone) {
        typeof this.parent.unCheckedOther === "function" && this.parent.unCheckedOther(this);
      }
    }
  },
  watch: {
    checked(newValue, oldValue) {
      if (newValue !== this.isChecked) {
        this.isChecked = newValue;
      }
    }
  }
};
if (!Array) {
  const _easycom_u_icon2 = common_vendor.resolveComponent("u-icon");
  _easycom_u_icon2();
}
const _easycom_u_icon = () => "../u-icon/u-icon.js";
if (!Math) {
  _easycom_u_icon();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      name: "checkbox-mark",
      size: $options.elIconSize,
      color: $options.elIconColor
    }),
    b: common_vendor.r("icon", {
      elIconSize: $options.elIconSize,
      elIconColor: $options.elIconColor
    }),
    c: common_vendor.o((...args) => $options.iconClickHandler && $options.iconClickHandler(...args)),
    d: common_vendor.n($options.iconClasses),
    e: common_vendor.s($options.iconWrapStyle),
    f: common_vendor.t(_ctx.label),
    g: $options.elDisabled ? $options.elInactiveColor : $options.elLabelColor,
    h: $options.elLabelSize,
    i: $options.elLabelSize,
    j: common_vendor.r("label", {
      label: _ctx.label,
      elDisabled: $options.elDisabled
    }),
    k: common_vendor.o((...args) => $options.labelClickHandler && $options.labelClickHandler(...args)),
    l: common_vendor.s($options.checkboxStyle),
    m: common_vendor.o((...args) => $options.wrapperClickHandler && $options.wrapperClickHandler(...args)),
    n: common_vendor.n(`u-checkbox-label--${$data.parentData.iconPlacement}`),
    o: common_vendor.n($data.parentData.borderBottom && $data.parentData.placement === "column" && "u-border-bottom"),
    p: common_vendor.gei(_ctx, "")
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-41713600"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/uni_modules/uview-plus/components/u-checkbox/u-checkbox.js.map
