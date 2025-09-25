"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_isLogin = require("../../utils/isLogin.js");
const store_user = require("../../store/user.js");
const utils_domainConfig = require("../../utils/domainConfig.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_articleItem2 = common_vendor.resolveComponent("articleItem");
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  (_easycom_uni_icons2 + _easycom_articleItem2 + _easycom_uni_load_more2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_articleItem = () => "../../components/articleItem/articleItem.js";
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_articleItem + _easycom_uni_load_more)();
}
const pageSize = 8;
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const loadingManager = {
      isLoading: false,
      showLoading(title = "加载中...", mask = true) {
        this.isLoading = true;
      },
      hideLoading() {
        this.isLoading = false;
      }
    };
    const avatarClickState = common_vendor.ref(true);
    const getSendOnState = async () => {
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:33", "首页正在获取按钮状态...");
        const sendOnApi = common_vendor.tr.importObject("sendOn", { customUI: true });
        const res = await sendOnApi.get();
        if (res && res.data && res.data.length > 0) {
          const serverAvatarClickState = res.data[0].avatarClick !== void 0 ? res.data[0].avatarClick : true;
          avatarClickState.value = serverAvatarClickState;
          common_vendor.index.__f__("log", "at pages/index/index.vue:45", "首页头像点击状态:", avatarClickState.value);
        } else {
          common_vendor.index.__f__("error", "at pages/index/index.vue:47", "获取按钮状态失败: 数据格式不正确");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:50", "获取按钮状态失败:", err);
      }
    };
    const userStore = store_user.useUserInfoStore();
    common_vendor.ref(null);
    const cateList = common_vendor.ref([]);
    const activeIndex = common_vendor.ref(0);
    const currentCateId = common_vendor.ref("");
    const cateApi = common_vendor.tr.importObject("cateWx", { customUI: true });
    const articleApi = common_vendor.tr.importObject("articleWx", { customUI: true });
    common_vendor.tr.importObject("fabuWx", { customUI: true });
    const locationInfo = common_vendor.ref(null);
    const cateListGet = async () => {
      try {
        let locationRes = await common_vendor.index.getLocation({
          type: "gcj02"
        }).catch((err) => {
          common_vendor.index.__f__("error", "at pages/index/index.vue:89", "获取位置失败:", err);
          return { longitude: 116.397428, latitude: 39.90923 };
        });
        const res = await cateApi.get(null, false);
        if (!res || !res.data) {
          throw new Error("获取分类失败，返回数据格式错误");
        }
        const addrInfo = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`);
        locationInfo.value = {
          address: addrInfo.address || "未知地址",
          district: addrInfo.district || "未知区域",
          longitude: locationRes.longitude,
          latitude: locationRes.latitude
        };
        let processedCateList = res.data.map((cate) => {
          const isLocationCategory = cate.cate_name && addrInfo.district && (cate.cate_name.includes(addrInfo.district) || addrInfo.district.includes(cate.cate_name));
          return {
            ...cate,
            cate_img: getCategoryIcon(cate),
            isLocationCategory,
            district: isLocationCategory ? addrInfo.district : ""
          };
        });
        processedCateList.sort((a, b) => {
          if (a.isLocationCategory && !b.isLocationCategory)
            return -1;
          if (!a.isLocationCategory && b.isLocationCategory)
            return 1;
          return 0;
        });
        cateList.value = processedCateList;
        common_vendor.index.__f__("log", "at pages/index/index.vue:136", "分类列表加载成功:", cateList.value);
        if (processedCateList.length > 0) {
          currentCateId.value = processedCateList[0]._id;
          activeIndex.value = 0;
        }
        pageNo.value = 1;
        getArticleList(currentCateId.value);
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:149", "获取分类失败:", err);
        common_vendor.index.showToast({
          title: "获取分类失败，请重试",
          icon: "none",
          duration: 2e3
        });
        getArticleList();
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const pageNo = common_vendor.ref(1);
    const hanleHeadTab = (index, id) => {
      activeIndex.value = index;
      pageNo.value = 1;
      status.value = "more";
      currentCateId.value = id;
      getArticleList(id);
    };
    const articleList = common_vendor.ref([]);
    let tempCateId = "";
    const isLoading = common_vendor.ref(true);
    const getArticleList = async (cate_id) => {
      if (loadingManager.isLoading)
        return;
      try {
        tempCateId = cate_id || "";
        common_vendor.index.__f__("log", "at pages/index/index.vue:188", tempCateId, "临时id");
        loadingManager.showLoading("加载文章列表...", true);
        isLoading.value = true;
        const res = await articleApi.getArticle(cate_id || "", pageNo.value, pageSize);
        common_vendor.index.__f__("log", "at pages/index/index.vue:196", res);
        articleList.value = res.data;
      } catch (err) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:199", err);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        loadingManager.hideLoading();
        isLoading.value = false;
      }
    };
    common_vendor.onPullDownRefresh(async () => {
      if (loadingManager.isLoading) {
        common_vendor.index.stopPullDownRefresh();
        return;
      }
      pageNo.value = 1;
      status.value = "more";
      try {
        await getArticleList(tempCateId);
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:226", "下拉刷新失败:", err);
        common_vendor.index.showToast({
          title: "刷新失败，请重试",
          icon: "none"
        });
      } finally {
        common_vendor.index.stopPullDownRefresh();
      }
    });
    const status = common_vendor.ref("more");
    common_vendor.onReachBottom(async () => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:242", "触底");
      if (status.value === "noMore" || loadingManager.isLoading)
        return;
      status.value = "loading";
      try {
        loadingManager.showLoading("加载更多...", false);
        pageNo.value++;
        const res = await articleApi.getArticle(tempCateId, pageNo.value, pageSize);
        articleList.value = [...articleList.value, ...res.data];
        if (res.data.length > 0) {
          status.value = "more";
        } else {
          status.value = "noMore";
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:267", "加载更多失败:", err);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
        status.value = "more";
      } finally {
        loadingManager.hideLoading();
      }
    });
    const handleDelete = async (articleId) => {
      try {
        common_vendor.index.showModal({
          title: "确认删除",
          content: "确定要删除这篇文章吗？",
          success: async (res) => {
            if (res.confirm) {
              loadingManager.showLoading("删除中...");
              common_vendor.index.__f__("log", "at pages/index/index.vue:292", "正在删除文章ID:", articleId, "用户ID:", userStore.userInfo.uid);
              if (!userStore.userInfo.uid) {
                common_vendor.index.showToast({
                  title: "请先登录",
                  icon: "none",
                  duration: 2e3
                });
                loadingManager.hideLoading();
                return;
              }
              const res2 = await articleApi.del(articleId, userStore.userInfo.uid);
              common_vendor.index.__f__("log", "at pages/index/index.vue:307", "删除接口返回结果:", res2);
              if (res2 && res2.deleted) {
                const index = articleList.value.findIndex((item) => item._id === articleId);
                if (index !== -1) {
                  articleList.value.splice(index, 1);
                }
                loadingManager.hideLoading();
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success",
                  duration: 2e3
                });
              } else {
                throw new Error(res2.message || "删除失败，请重试");
              }
            }
          }
        });
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:329", "删除文章失败:", err);
        loadingManager.hideLoading();
        common_vendor.index.showToast({
          title: err.message || "删除失败，请重试",
          icon: "none",
          duration: 2e3
        });
      }
    };
    const handelContact = (mobile) => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:341", mobile);
      if (!userStore.userInfo.isLogin) {
        return utils_isLogin.testLogin();
      }
      if (mobile === "未填写") {
        return common_vendor.index.showToast({
          icon: "none",
          title: "他并不想让人联系"
        });
      }
      common_vendor.index.makePhoneCall({
        phoneNumber: mobile
      });
    };
    const handelGoUserList = (user_id) => {
      if (!avatarClickState.value) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:364", "头像点击功能已禁用");
        common_vendor.index.showToast({
          title: "联系管理员",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/userArticleList/userArticleList?userId=${user_id}`
      });
    };
    common_vendor.onMounted(() => {
      cateListGet();
      common_vendor.index.$on("articlePublished", (articleId) => {
        common_vendor.index.__f__("log", "at pages/index/index.vue:387", "收到文章发布成功事件，文章ID:", articleId);
        pageNo.value = 1;
        status.value = "more";
        getArticleList(tempCateId);
        common_vendor.index.showToast({
          title: "发布成功，内容已更新",
          icon: "success",
          duration: 2e3
        });
      });
      common_vendor.index.$on("refreshIndexOnce", (articleId) => {
        common_vendor.index.__f__("log", "at pages/index/index.vue:403", "收到一次性刷新事件，文章ID:", articleId);
        pageNo.value = 1;
        status.value = "more";
        setTimeout(() => {
          getArticleList(tempCateId).then(() => {
            if (articleId && articleList.value.length > 0) {
              const index = articleList.value.findIndex((item) => item._id === articleId);
              if (index !== -1) {
                common_vendor.index.__f__("log", "at pages/index/index.vue:425", "找到新发布的文章，位置:", index);
              }
            }
          }).catch((err) => {
            common_vendor.index.__f__("error", "at pages/index/index.vue:430", "刷新文章列表失败:", err);
          });
        }, 300);
      });
      common_vendor.index.$on("viewCountUpdated", (articleId) => {
        updateLocalViewCount(articleId);
      });
      common_vendor.index.$on("articleViewCountUpdated", (data) => {
        common_vendor.index.__f__("log", "at pages/index/index.vue:443", "收到文章浏览量更新事件:", data);
        if (data && data.articleId) {
          updateLocalViewCount(data);
        }
      });
      common_vendor.index.showShareMenu({
        withShareTicket: true
      });
      common_vendor.index.$on("avatarClickChanged", (newState) => {
        common_vendor.index.__f__("log", "at pages/index/index.vue:457", "首页收到头像点击状态变化事件:", newState);
        avatarClickState.value = newState;
      });
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("articlePublished");
      common_vendor.index.$off("refreshIndexOnce");
      common_vendor.index.$off("viewCountUpdated");
      common_vendor.index.$off("articleViewCountUpdated");
      common_vendor.index.$off("avatarClickChanged");
    });
    common_vendor.onPageScroll(() => {
      loadingManager.hideLoading();
    });
    let lastRefreshTime = 0;
    common_vendor.onBackPress((e) => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:480", "检测到返回按钮事件", e);
      const now = Date.now();
      if (now - lastRefreshTime < 1e3) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:487", "距离上次刷新时间不足1秒，跳过刷新");
        return false;
      }
      lastRefreshTime = now;
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.route === "pages/index/index") {
        common_vendor.index.__f__("log", "at pages/index/index.vue:499", "当前在首页，检查是否需要刷新");
        setTimeout(() => {
          pageNo.value = 1;
          status.value = "more";
          getArticleList(tempCateId);
        }, 300);
      }
      return false;
    });
    common_vendor.onActivated(() => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:516", "首页被激活");
      const now = Date.now();
      if (now - lastRefreshTime > 5e3) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:523", "页面激活，自动刷新内容");
        lastRefreshTime = now;
        pageNo.value = 1;
        status.value = "more";
        getArticleList(tempCateId);
      }
    });
    const getCategoryIcon = (category) => {
      if (category && category.cate_img) {
        return utils_domainConfig.fixImageUrl(category.cate_img);
      }
      return utils_domainConfig.getDefaultImage("default");
    };
    const updateLocalViewCount = (data) => {
      if (!data || !data.articleId || !articleList.value.length) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:548", "更新浏览量失败：无效的文章数据或文章列表为空");
        return;
      }
      const index = articleList.value.findIndex((item) => item._id === data.articleId);
      if (index !== -1) {
        if (data.viewCount !== void 0) {
          articleList.value[index].look_count = data.viewCount;
          if (articleList.value[index].view_count !== void 0) {
            articleList.value[index].view_count = data.viewCount;
          }
        } else {
          if (articleList.value[index].look_count !== void 0) {
            articleList.value[index].look_count++;
          } else {
            articleList.value[index].look_count = 1;
          }
          if (articleList.value[index].view_count !== void 0) {
            articleList.value[index].view_count = articleList.value[index].look_count;
          }
        }
        common_vendor.index.__f__("log", "at pages/index/index.vue:575", `文章[${data.articleId}]浏览量已更新为: ${articleList.value[index].look_count}`);
      } else {
        common_vendor.index.__f__("log", "at pages/index/index.vue:577", `未找到文章: ${data.articleId}`);
      }
    };
    const previewImage = (urls, current) => {
      if (!urls || !urls.length) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:585", "预览图片缺少URLs参数");
        return;
      }
      let previewUrls = urls;
      if (typeof current === "object" && current !== null) {
        current = utils_domainConfig.fixImageUrl(current.compressedURL || current.thumbnailURL || current.url);
      } else if (typeof current === "string") {
        current = utils_domainConfig.fixImageUrl(current);
      }
      if (urls.length > 0 && typeof urls[0] === "object") {
        previewUrls = urls.map((img) => utils_domainConfig.fixImageUrl(img.compressedURL || img.thumbnailURL || img.url));
      } else {
        previewUrls = urls.map((url) => utils_domainConfig.fixImageUrl(url));
      }
      common_vendor.index.previewImage({
        urls: previewUrls,
        // 需要预览的图片链接列表（此时已是修复后的URL）
        current: current || previewUrls[0],
        // 当前显示图片的链接
        indicator: "number",
        // 显示页码指示器
        loop: true,
        // 循环预览
        success: () => {
          common_vendor.index.__f__("log", "at pages/index/index.vue:614", "图片预览成功");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/index/index.vue:617", "预览图片失败:", err);
          common_vendor.index.showToast({
            title: "预览图片失败",
            icon: "none"
          });
        },
        complete: () => {
        }
      });
    };
    common_vendor.onShow(() => {
      getSendOnState();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(cateList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.cate_img
          }, item.cate_img ? {
            b: item.cate_img
          } : {}, {
            c: common_vendor.t(item.cate_name),
            d: item.isLocationCategory
          }, item.isLocationCategory ? {} : {}, {
            e: item._id,
            f: currentCateId.value === item._id ? 1 : "",
            g: item.isLocationCategory ? 1 : "",
            h: common_vendor.o(($event) => hanleHeadTab(index, item._id), item._id)
          });
        }),
        b: cateList.value.length == 0
      }, cateList.value.length == 0 ? {
        c: common_vendor.p({
          type: "spinner-cycle",
          size: "24",
          color: "#399bfe"
        })
      } : {}, {
        d: articleList.value.length === 0 && isLoading.value
      }, articleList.value.length === 0 && isLoading.value ? {
        e: common_vendor.p({
          type: "spinner-cycle",
          size: "48",
          color: "#399bfe"
        })
      } : {}, {
        f: articleList.value.length === 0 && !isLoading.value
      }, articleList.value.length === 0 && !isLoading.value ? {
        g: common_vendor.p({
          color: "#5cb85c",
          ["custom-prefix"]: "icon",
          type: "lishuai-a-00jichuiconkongzhuangtaiwuneirong",
          size: "58"
        })
      } : {}, {
        h: common_vendor.f(articleList.value, (item, k0, i0) => {
          return {
            a: item._id,
            b: common_vendor.o(handelContact, item._id),
            c: common_vendor.o((url, urls) => previewImage(urls, url), item._id),
            d: common_vendor.o(handelGoUserList, item._id),
            e: common_vendor.o(handleDelete, item._id),
            f: "1cf27b2a-3-" + i0,
            g: common_vendor.p({
              item,
              avatarClickEnabled: avatarClickState.value
            })
          };
        }),
        i: !articleList.value.length == 0
      }, !articleList.value.length == 0 ? {
        j: common_vendor.p({
          color: "#cccccc",
          iconType: "auto",
          status: status.value
        })
      } : {}, {
        k: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1cf27b2a"]]);
_sfc_main.__runtimeHooks = 1;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
