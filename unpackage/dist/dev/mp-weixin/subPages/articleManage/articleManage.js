"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_formatTime = require("../../utils/formatTime.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  __name: "articleManage",
  setup(__props) {
    const userInfoStore = store_user.useUserInfoStore();
    const articleApi = common_vendor.tr.importObject("articleWx", { customUI: true });
    const articleList = common_vendor.ref([]);
    const stats = common_vendor.ref({
      pending: 0,
      approved: 0,
      rejected: 0
    });
    const currentStatus = common_vendor.ref("0");
    const getArticleList = async () => {
      try {
        const params = { state: Number(currentStatus.value) };
        const res = await articleApi.getAdminArticles(params);
        articleList.value = res.data.map((article) => ({
          ...article,
          create_time: utils_formatTime.formatTime(article.create_time)
        }));
        stats.value = res.stats;
      } catch (e) {
        common_vendor.index.showToast({
          title: e.message || "获取文章列表失败",
          icon: "none"
        });
      }
    };
    const handleStatusChange = (status) => {
      currentStatus.value = status;
      getArticleList();
    };
    const handleAudit = async (articleId, state) => {
      try {
        common_vendor.index.showLoading({ title: "处理中..." });
        await articleApi.updateState(articleId, state);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: state === 1 ? "已通过" : "已拒绝",
          icon: "success"
        });
        getArticleList();
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: e.message || "操作失败",
          icon: "none"
        });
      }
    };
    const handleDelete = async (articleId) => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要删除这篇文章吗？",
        async success(res) {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({ title: "删除中..." });
              await articleApi.adminDelete(articleId, userInfoStore.userInfo.role[0]);
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "删除成功",
                icon: "success"
              });
              getArticleList();
            } catch (e) {
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: e.message || "删除失败",
                icon: "none"
              });
            }
          }
        }
      });
    };
    const goToHome = () => {
      common_vendor.index.switchTab({
        url: "/pages/index/index"
      });
    };
    const previewImage = (images, current) => {
      common_vendor.index.previewImage({
        urls: images,
        current
      });
    };
    common_vendor.onMounted(() => {
      getArticleList();
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(stats.value.pending),
        b: common_vendor.t(stats.value.approved),
        c: common_vendor.t(stats.value.rejected),
        d: currentStatus.value === "0" ? 1 : "",
        e: common_vendor.o(($event) => handleStatusChange("0")),
        f: currentStatus.value === "1" ? 1 : "",
        g: common_vendor.o(($event) => handleStatusChange("1")),
        h: currentStatus.value === "2" ? 1 : "",
        i: common_vendor.o(($event) => handleStatusChange("2")),
        j: common_vendor.f(articleList.value, (article, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(article.content),
            b: article.images && article.images.length
          }, article.images && article.images.length ? common_vendor.e({
            c: article.images.length === 1
          }, article.images.length === 1 ? {
            d: article.images[0] + "?thumbnailURL",
            e: common_vendor.o(($event) => previewImage(article.images, article.images[0]), article._id)
          } : {
            f: common_vendor.f(article.images, (img, index, i1) => {
              return {
                a: img + "?thumbnailURL",
                b: common_vendor.o(($event) => previewImage(article.images, img), index),
                c: index
              };
            })
          }) : {}, {
            g: common_vendor.t(article.create_time),
            h: common_vendor.t(article.state === 0 ? "待审核" : article.state === 1 ? "已通过" : "已拒绝"),
            i: article.state === 0 ? 1 : "",
            j: article.state === 1 ? 1 : "",
            k: article.state === 2 ? 1 : "",
            l: article.state === 0
          }, article.state === 0 ? {
            m: common_vendor.o(($event) => handleAudit(article._id, 1), article._id)
          } : {}, {
            n: article.state === 0
          }, article.state === 0 ? {
            o: common_vendor.o(($event) => handleAudit(article._id, 2), article._id)
          } : {}, {
            p: common_vendor.o(($event) => handleDelete(article._id), article._id),
            q: article._id
          });
        }),
        k: common_vendor.o(goToHome),
        l: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-bc942a68"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/subPages/articleManage/articleManage.js.map
