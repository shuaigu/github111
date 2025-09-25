"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const utils_isLogin = require("../../utils/isLogin.js");
if (!Array) {
  const _component_up_textarea = common_vendor.resolveComponent("up-textarea");
  const _easycom_uni_file_picker2 = common_vendor.resolveComponent("uni-file-picker");
  (_component_up_textarea + _easycom_uni_file_picker2)();
}
const _easycom_uni_file_picker = () => "../../uni_modules/uni-file-picker/components/uni-file-picker/uni-file-picker.js";
if (!Math) {
  _easycom_uni_file_picker();
}
const _sfc_main = {
  __name: "feedBack",
  setup(__props) {
    const feedbackContent = common_vendor.ref("");
    const imageValue = common_vendor.ref([]);
    const selectedType = common_vendor.ref("功能建议");
    const contactInfo = common_vendor.ref("");
    const userStore = store_user.useUserInfoStore();
    const feedbackTypes = ["功能建议", "界面设计", "性能问题", "其他"];
    const isSubmitting = common_vendor.ref(false);
    const selectType = (type) => {
      selectedType.value = type;
    };
    const success = (e) => {
      const { tempFiles } = e;
      imageValue.value = tempFiles;
      common_vendor.index.showToast({
        title: "上传成功",
        icon: "success"
      });
    };
    const fail = (e) => {
      common_vendor.index.__f__("error", "at subPages/feedBack/feedBack.vue:38", "上传失败:", e);
      common_vendor.index.showToast({
        title: "上传失败",
        icon: "error"
      });
    };
    const submitFeedback = async () => {
      if (!userStore.userInfo.isLogin) {
        return utils_isLogin.testLogin();
      }
      if (isSubmitting.value)
        return;
      if (feedbackContent.value.length < 10) {
        return common_vendor.index.showToast({
          title: "反馈内容至少10个字",
          icon: "none"
        });
      }
      if (contactInfo.value) {
        const phoneReg = /^1[3-9]\d{9}$/;
        const emailReg = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
        if (!phoneReg.test(contactInfo.value) && !emailReg.test(contactInfo.value)) {
          return common_vendor.index.showToast({
            title: "请输入正确的手机号或邮箱",
            icon: "none"
          });
        }
      }
      try {
        isSubmitting.value = true;
        common_vendor.index.showLoading({
          title: "提交中...",
          mask: true
        });
        const feedbackApi = common_vendor.tr.importObject("feedback");
        const res = await feedbackApi.add({
          type: selectedType.value,
          content: feedbackContent.value,
          contact: contactInfo.value,
          images: imageValue.value,
          user_id: userStore.userInfo.uid
        });
        if (res.success) {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "提交成功",
            icon: "success"
          });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        }
      } catch (err) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: err.message || "提交失败",
          icon: "none"
        });
      } finally {
        isSubmitting.value = false;
      }
    };
    const deleteImage = (index) => {
      imageValue.value = imageValue.value.filter((_, i) => i !== index);
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(feedbackTypes, (type, k0, i0) => {
          return {
            a: common_vendor.t(type),
            b: type,
            c: selectedType.value === type ? 1 : "",
            d: common_vendor.o(($event) => selectType(type), type)
          };
        }),
        b: common_vendor.o(($event) => feedbackContent.value = $event),
        c: common_vendor.p({
          placeholder: "请详细描述您的问题或建议（最少10字）",
          count: true,
          modelValue: feedbackContent.value
        }),
        d: contactInfo.value,
        e: common_vendor.o(($event) => contactInfo.value = $event.detail.value),
        f: common_vendor.o(success),
        g: common_vendor.o(fail),
        h: common_vendor.o(deleteImage),
        i: common_vendor.o(($event) => imageValue.value = $event),
        j: common_vendor.p({
          fileMediatype: "image",
          mode: "grid",
          limit: 3,
          ["image-styles"]: {
            width: 200,
            height: 200
          },
          modelValue: imageValue.value
        }),
        k: common_vendor.t(isSubmitting.value ? "提交中..." : "提交反馈"),
        l: common_vendor.o(submitFeedback),
        m: isSubmitting.value,
        n: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-62a65bfd"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/subPages/feedBack/feedBack.js.map
