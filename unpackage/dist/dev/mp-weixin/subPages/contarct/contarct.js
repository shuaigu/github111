"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _component_up_loading_page = common_vendor.resolveComponent("up-loading-page");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  (_component_up_loading_page + _easycom_uni_icons2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "contarct",
  setup(__props) {
    const companyInfo = common_vendor.ref({
      name: "XX科技有限公司",
      // 默认值，加载前显示
      slogan: "创新科技，引领未来",
      address: "深圳市南山区科技园南区XX大厦A座15楼",
      phone: "",
      email: "",
      workTime: ""
    });
    const loading = common_vendor.ref(true);
    const getCompanyInfo = async () => {
      try {
        const companyApi = common_vendor.tr.importObject("company", { customUI: true });
        const res = await companyApi.getInfo();
        if (res.success && res.data) {
          companyInfo.value = res.data;
        }
      } catch (err) {
        common_vendor.index.showToast({
          title: err.message || "加载失败",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const makePhoneCall = () => {
      if (!companyInfo.value.phone)
        return;
      common_vendor.index.makePhoneCall({
        phoneNumber: companyInfo.value.phone
      });
    };
    const sendEmail = () => {
      if (!companyInfo.value.email)
        return;
      common_vendor.index.setClipboardData({
        data: companyInfo.value.email,
        success: () => {
          common_vendor.index.showToast({
            title: "邮箱已复制",
            icon: "success"
          });
        }
      });
    };
    common_vendor.onMounted(() => {
      getCompanyInfo();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          loading: loading.value
        }),
        b: common_vendor.t(companyInfo.value.name),
        c: common_vendor.t(companyInfo.value.slogan),
        d: common_vendor.p({
          color: "#999999",
          type: "map-pin-ellipse",
          size: "40"
        }),
        e: common_vendor.t(companyInfo.value.address),
        f: companyInfo.value.phone
      }, companyInfo.value.phone ? {
        g: common_vendor.p({
          color: "#999999",
          type: "phone",
          size: "40"
        }),
        h: common_vendor.t(companyInfo.value.phone),
        i: common_vendor.o(makePhoneCall)
      } : {}, {
        j: companyInfo.value.email
      }, companyInfo.value.email ? {
        k: common_vendor.p({
          color: "#999999",
          type: "email",
          size: "40"
        }),
        l: common_vendor.t(companyInfo.value.email),
        m: common_vendor.o(sendEmail)
      } : {}, {
        n: companyInfo.value.workTime
      }, companyInfo.value.workTime ? {
        o: common_vendor.p({
          color: "#999999",
          type: "calendar",
          size: "40"
        }),
        p: common_vendor.t(companyInfo.value.workTime)
      } : {}, {
        q: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-62e28e12"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/subPages/contarct/contarct.js.map
