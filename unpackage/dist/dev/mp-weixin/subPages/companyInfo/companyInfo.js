"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _component_up_loading_page = common_vendor.resolveComponent("up-loading-page");
  _component_up_loading_page();
}
const _sfc_main = {
  __name: "companyInfo",
  setup(__props) {
    const companyInfo = common_vendor.ref({
      name: "",
      // 公司名称
      slogan: "",
      // 公司口号
      address: "",
      // 公司地址
      phone: "",
      // 联系电话
      email: "",
      // 电子邮箱
      workTime: ""
      // 工作时间
    });
    const loading = common_vendor.ref(true);
    const saving = common_vendor.ref(false);
    const getCompanyInfo = async () => {
      try {
        const companyApi = common_vendor.tr.importObject("company", { customUI: true });
        const res = await companyApi.getInfo();
        if (res.success) {
          companyInfo.value = res.data || companyInfo.value;
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
    const saveCompanyInfo = async () => {
      if (!companyInfo.value.name.trim()) {
        return common_vendor.index.showToast({
          title: "请输入公司名称",
          icon: "none"
        });
      }
      if (companyInfo.value.phone && !/^1[3-9]\d{9}$/.test(companyInfo.value.phone)) {
        return common_vendor.index.showToast({
          title: "请输入正确的手机号码",
          icon: "none"
        });
      }
      if (companyInfo.value.email && !/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(companyInfo.value.email)) {
        return common_vendor.index.showToast({
          title: "请输入正确的邮箱地址",
          icon: "none"
        });
      }
      try {
        saving.value = true;
        const companyApi = common_vendor.tr.importObject("company", { customUI: true });
        const res = await companyApi.updateInfo(companyInfo.value);
        if (res.success) {
          common_vendor.index.showToast({
            title: "保存成功",
            icon: "success"
          });
        }
      } catch (err) {
        common_vendor.index.showToast({
          title: err.message || "保存失败",
          icon: "none"
        });
      } finally {
        saving.value = false;
      }
    };
    common_vendor.onMounted(() => {
      getCompanyInfo();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          loading: loading.value
        }),
        b: !loading.value
      }, !loading.value ? {
        c: companyInfo.value.name,
        d: common_vendor.o(($event) => companyInfo.value.name = $event.detail.value),
        e: companyInfo.value.slogan,
        f: common_vendor.o(($event) => companyInfo.value.slogan = $event.detail.value),
        g: companyInfo.value.address,
        h: common_vendor.o(($event) => companyInfo.value.address = $event.detail.value),
        i: companyInfo.value.phone,
        j: common_vendor.o(($event) => companyInfo.value.phone = $event.detail.value),
        k: companyInfo.value.email,
        l: common_vendor.o(($event) => companyInfo.value.email = $event.detail.value),
        m: companyInfo.value.workTime,
        n: common_vendor.o(($event) => companyInfo.value.workTime = $event.detail.value),
        o: common_vendor.t(saving.value ? "保存中..." : "保存"),
        p: saving.value,
        q: saving.value,
        r: common_vendor.o(saveCompanyInfo)
      } : {}, {
        s: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a4ff917f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/subPages/companyInfo/companyInfo.js.map
