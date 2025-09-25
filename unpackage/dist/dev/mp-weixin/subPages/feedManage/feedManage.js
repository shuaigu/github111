"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_formatTime = require("../../utils/formatTime.js");
if (!Array) {
  const _component_up_loading_page = common_vendor.resolveComponent("up-loading-page");
  _component_up_loading_page();
}
const _sfc_main = {
  __name: "feedManage",
  setup(__props) {
    const feedbackList = common_vendor.ref([]);
    const loading = common_vendor.ref(true);
    const getFeedbackList = async () => {
      try {
        const feedbackApi = common_vendor.tr.importObject("feedback", { customUI: true });
        const res = await feedbackApi.getList();
        if (res.success) {
          feedbackList.value = res.data;
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
    const handleDelete = (id) => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要删除这条反馈吗？",
        async success(res) {
          if (res.confirm) {
            try {
              const feedbackApi = common_vendor.tr.importObject("feedback", { customUI: true });
              const res2 = await feedbackApi.remove(id);
              if (res2.success) {
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success"
                });
                getFeedbackList();
              }
            } catch (err) {
              common_vendor.index.showToast({
                title: err.message || "删除失败",
                icon: "none"
              });
            }
          }
        }
      });
    };
    const previewImage = (urls, current) => {
      common_vendor.index.previewImage({
        urls,
        current
      });
    };
    common_vendor.onMounted(() => {
      getFeedbackList();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          loading: loading.value && !feedbackList.value.length
        }),
        b: feedbackList.value.length
      }, feedbackList.value.length ? {
        c: common_vendor.f(feedbackList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.type),
            b: common_vendor.t(common_vendor.unref(utils_formatTime.formatTime)(item.create_time)),
            c: common_vendor.o(($event) => handleDelete(item._id), item._id),
            d: common_vendor.t(item.content),
            e: item.images && item.images.length
          }, item.images && item.images.length ? {
            f: common_vendor.f(item.images, (img, index, i1) => {
              return {
                a: index,
                b: img.url,
                c: common_vendor.o(($event) => previewImage(item.images.map((i) => i.url), img.url), index)
              };
            })
          } : {}, {
            g: item.contact
          }, item.contact ? {
            h: common_vendor.t(item.contact)
          } : {}, {
            i: item._id
          });
        })
      } : !loading.value ? {} : {}, {
        d: !loading.value,
        e: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3bfffafd"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/subPages/feedManage/feedManage.js.map
