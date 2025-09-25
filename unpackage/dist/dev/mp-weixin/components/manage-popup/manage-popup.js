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
  __name: "manage-popup",
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: "添加分类"
    },
    editValue: {
      type: String,
      default: ""
    },
    imageUrl: {
      type: String,
      default: ""
    },
    imageUploading: {
      type: Boolean,
      default: false
    },
    uploadProgress: {
      type: Number,
      default: 0
    },
    isVisible: {
      type: Boolean,
      default: true
    }
  },
  emits: ["update:show", "confirm", "choose-image"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const inputValue = common_vendor.ref("");
    const localImageUrl = common_vendor.ref("");
    const visibleState = common_vendor.ref(true);
    common_vendor.watch([() => props.show, () => props.editValue, () => props.imageUrl, () => props.isVisible], ([showVal, editVal, imgVal, visibleVal]) => {
      if (showVal) {
        if (editVal) {
          inputValue.value = editVal;
        }
        localImageUrl.value = imgVal;
        visibleState.value = visibleVal;
      } else {
        inputValue.value = "";
        localImageUrl.value = "";
        visibleState.value = true;
      }
    });
    const handleInput = (e) => {
      inputValue.value = e.detail.value;
    };
    const chooseImage = () => {
      emit("choose-image");
    };
    const handleConfirm = () => {
      if (!inputValue.value.trim()) {
        common_vendor.index.showToast({
          title: "请输入分类名称",
          icon: "none"
        });
        return;
      }
      emit("confirm", {
        cate_name: inputValue.value,
        cate_img: props.imageUrl,
        is_visible: visibleState.value
      });
      emit("update:show", false);
      inputValue.value = "";
    };
    const handleCancel = () => {
      emit("update:show", false);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: props.show
      }, props.show ? common_vendor.e({
        b: common_vendor.o(handleCancel),
        c: common_vendor.t(__props.title),
        d: props.imageUrl
      }, props.imageUrl ? common_vendor.e({
        e: props.imageUrl,
        f: props.imageUploading
      }, props.imageUploading ? {
        g: common_vendor.t(props.uploadProgress),
        h: props.uploadProgress + "%"
      } : {}, {
        i: common_vendor.o(chooseImage)
      }) : {
        j: common_vendor.p({
          type: "camera",
          size: "24",
          color: "#999"
        }),
        k: common_vendor.o(chooseImage)
      }, {
        l: inputValue.value,
        m: common_vendor.o(handleInput),
        n: !visibleState.value,
        o: common_vendor.o((e) => visibleState.value = !e.detail.value),
        p: common_vendor.o(handleCancel),
        q: common_vendor.o(handleConfirm),
        r: common_vendor.gei(_ctx, "")
      }) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-21adf0f7"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/manage-popup/manage-popup.js.map
