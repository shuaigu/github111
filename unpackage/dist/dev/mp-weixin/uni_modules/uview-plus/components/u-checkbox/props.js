"use strict";
const uni_modules_uviewPlus_libs_vue = require("../../libs/vue.js");
const uni_modules_uviewPlus_libs_config_props = require("../../libs/config/props.js");
const props = uni_modules_uviewPlus_libs_vue.defineMixin({
  props: {
    // checkbox的名称
    name: {
      type: [String, Number, Boolean],
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.name
    },
    // 形状，square为方形，circle为圆型
    shape: {
      type: String,
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.shape
    },
    // 整体的大小
    size: {
      type: [String, Number],
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.size
    },
    // 是否默认选中
    checked: {
      type: Boolean,
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.checked
    },
    // 是否禁用
    disabled: {
      type: [String, Boolean],
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.disabled
    },
    // 选中状态下的颜色，如设置此值，将会覆盖parent的activeColor值
    activeColor: {
      type: String,
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.activeColor
    },
    // 未选中的颜色
    inactiveColor: {
      type: String,
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.inactiveColor
    },
    // 图标的大小，单位px
    iconSize: {
      type: [String, Number],
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.iconSize
    },
    // 图标颜色
    iconColor: {
      type: String,
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.iconColor
    },
    // label提示文字，因为nvue下，直接slot进来的文字，由于特殊的结构，无法修改样式
    label: {
      type: [String, Number],
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.label
    },
    // label的字体大小，px单位
    labelSize: {
      type: [String, Number],
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.labelSize
    },
    // label的颜色
    labelColor: {
      type: String,
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.labelColor
    },
    // 是否禁止点击提示语选中复选框
    labelDisabled: {
      type: [String, Boolean],
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.checkbox.labelDisabled
    },
    // 是否独立使用
    usedAlone: {
      type: [Boolean],
      default: () => false
    }
  }
});
exports.props = props;
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/uni_modules/uview-plus/components/u-checkbox/props.js.map
