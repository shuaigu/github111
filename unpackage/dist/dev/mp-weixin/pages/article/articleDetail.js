"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const utils_formatTime = require("../../utils/formatTime.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  (_easycom_uni_icons + uniLoadMore + tuijian)();
}
const tuijian = () => "../../components/tuijian/tuijian.js";
const uniLoadMore = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
const IMAGE_LOAD_TIMEOUT = 15e3;
const MAX_RETRY_COUNT = 3;
const _sfc_main = {
  __name: "articleDetail",
  props: {
    article_id: {
      type: String,
      default: ""
    },
    user_id: String
  },
  setup(__props) {
    const props = __props;
    const userStore = store_user.useUserInfoStore();
    const processCDNImage = (url) => {
      if (!url)
        return "";
      if (url.includes("?")) {
        const baseUrl = url.split("?")[0];
        common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:37", "已移除图片压缩参数:", url, "->", baseUrl);
        return baseUrl;
      }
      return url;
    };
    const loginLoadingVisible = common_vendor.ref(false);
    const processPhoneNumbers = (text) => {
      if (!text)
        return text;
      const phoneRegex = /(1[3-9]\d{9}|1[3-9]\d[-\s]?\d{4}[-\s]?\d{4})/g;
      return text.replace(phoneRegex, function(match) {
        var cleanPhone = match.replace(/[-\s]/g, "");
        if (cleanPhone.length === 11 && /^1[3-9]\d{9}$/.test(cleanPhone)) {
          return '<span style="cursor: pointer; padding: 2rpx 4rpx; border-radius: 4rpx;" data-phone="' + cleanPhone + '" class="phone-link">' + match + "</span>";
        }
        return match;
      });
    };
    const handlePhoneClick = function(phone) {
      try {
        common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:72", "准备拨打电话:", phone);
        if (!phone || phone.length !== 11 || !/^1[3-9]\d{9}$/.test(phone)) {
          common_vendor.index.showToast({
            title: "手机号格式不正确",
            icon: "none",
            duration: 2e3
          });
          return;
        }
        customTestLogin().then(function(isLoggedIn) {
          if (!isLoggedIn) {
            common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:87", "用户未登录，无法拨打电话");
            return;
          }
          common_vendor.index.showModal({
            title: "拨打电话",
            content: "是否拨打 " + phone + "？",
            confirmText: "拨打",
            cancelText: "取消",
            success: function(res) {
              if (res.confirm) {
                common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:99", "用户确认拨打电话");
                common_vendor.index.makePhoneCall({
                  phoneNumber: phone,
                  success: function() {
                    common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:104", "成功调起拨号界面");
                  },
                  fail: function(err) {
                    common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:107", "拨打电话失败:", err);
                    var errorMsg = "拨打电话失败";
                    if (err.errMsg) {
                      if (err.errMsg.indexOf("cancel") !== -1) {
                        errorMsg = "用户取消拨打";
                      } else if (err.errMsg.indexOf("fail") !== -1) {
                        errorMsg = "设备不支持拨号功能";
                      }
                    }
                    common_vendor.index.showToast({
                      title: errorMsg,
                      icon: "none",
                      duration: 2e3
                    });
                  }
                });
              } else {
                common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:127", "用户取消拨打电话");
              }
            },
            fail: function(err) {
              common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:131", "显示确认对话框失败:", err);
            }
          });
        }).catch(function(err) {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:135", "登录检查失败:", err);
        });
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:139", "处理电话点击失败:", err);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none",
          duration: 2e3
        });
      }
    };
    const handleRichTextTap = function(e) {
      common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:150", "Rich text tap event:", e);
      var phoneNumber = null;
      if (e.detail && e.detail.target && e.detail.target.dataset && e.detail.target.dataset.phone) {
        phoneNumber = e.detail.target.dataset.phone;
      } else if (e.detail && e.detail.currentTarget && e.detail.currentTarget.dataset && e.detail.currentTarget.dataset.phone) {
        phoneNumber = e.detail.currentTarget.dataset.phone;
      } else if (e.detail && e.detail.target) {
        var targetText = e.detail.target.innerText || e.detail.target.textContent || "";
        if (targetText) {
          var phoneMatch = targetText.match(/1[3-9]\d{9}/);
          if (phoneMatch) {
            phoneNumber = phoneMatch[0];
          }
        }
      }
      if (phoneNumber) {
        common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:177", "检测到手机号:", phoneNumber);
        handlePhoneClick(phoneNumber);
      } else {
        common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:180", "未检测到有效的手机号点击，尝试备用方案");
        handleTextPhoneDetection();
      }
    };
    const handleTextPhoneDetection = function() {
      var text = articleDetail.value && articleDetail.value.content ? articleDetail.value.content : "";
      if (!text)
        return;
      var phoneRegex = /1[3-9]\d{9}/g;
      var matches = text.match(phoneRegex);
      if (matches && matches.length > 0) {
        if (matches.length === 1) {
          handlePhoneClick(matches[0]);
        } else {
          common_vendor.index.showActionSheet({
            itemList: matches.map(function(phone) {
              return "拨打 " + phone;
            }),
            success: function(res) {
              handlePhoneClick(matches[res.tapIndex]);
            },
            fail: function(err) {
              common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:207", "显示手机号选择列表失败:", err);
            }
          });
        }
      } else {
        common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:212", "文本中未找到有效的手机号");
      }
    };
    const processedContent = common_vendor.computed(() => {
      if (!articleDetail.value || !articleDetail.value.content)
        return "";
      return processPhoneNumbers(articleDetail.value.content);
    });
    const handlePageNavigation = async () => {
      try {
        const pages = getCurrentPages();
        if (pages.length === 1) {
          common_vendor.index.switchTab({
            url: "/pages/index/index",
            success: () => {
              setTimeout(() => {
                common_vendor.index.navigateTo({
                  url: `/pages/article/articleDetail?article_id=${props.article_id}`,
                  animationType: "slide-in-right",
                  // 添加右侧滑入动画
                  animationDuration: 300,
                  // 设置动画持续时间为300ms
                  fail: (err) => {
                    common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:241", "跳转回文章详情页失败:", err);
                  }
                });
              }, 300);
            },
            fail: (err) => {
              common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:247", "跳转到首页失败:", err);
              try {
                const cateApi = common_vendor.tr.importObject("cateWx", { customUI: true });
                cateApi.get().catch((err2) => {
                  common_vendor.index.__f__("warn", "at pages/article/articleDetail.vue:252", "预加载首页数据失败", err2);
                });
              } catch (err2) {
                common_vendor.index.__f__("warn", "at pages/article/articleDetail.vue:255", "初始化首页数据失败", err2);
              }
            }
          });
          return true;
        }
        return false;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:264", "页面导航错误：", err);
        return false;
      }
    };
    const isLoading = common_vendor.ref(true);
    common_vendor.ref(false);
    const articleApi = common_vendor.tr.importObject("articleWx", { customUI: true });
    common_vendor.tr.importObject("likeRecord", { customUI: true });
    common_vendor.tr.importObject("userWx", { customUI: true });
    const articleDetail = common_vendor.ref({});
    const isCheckingLogin = common_vendor.ref(false);
    common_vendor.ref(0);
    const imageLoadStatus = common_vendor.ref({});
    const isAnyImageLoading = common_vendor.ref(true);
    const videoLoadStatus = common_vendor.ref("loading");
    const videoContext = common_vendor.ref(null);
    common_vendor.ref(null);
    const tuijianRef = common_vendor.ref(null);
    common_vendor.ref(null);
    common_vendor.ref(null);
    common_vendor.ref(false);
    const processMediaURL = (url, type = "image") => {
      if (!url)
        return "";
      if (url.includes("jingle0350.cn")) {
        if (type === "image") {
          return processCDNImage(url);
        }
      }
      if (url.includes("ixigua.com") || url.includes("aly2.")) {
        return url.includes("?") ? `${url}&referer=no_referer` : `${url}?referer=no_referer`;
      }
      if (type === "video" && url.includes("baidu.com")) {
        return url;
      }
      return url;
    };
    const isValidImageUrl = (url) => {
      if (!url)
        return false;
      return url.startsWith("http") || url.startsWith("https") || url.startsWith("/") || url.startsWith("data:image");
    };
    const imageLoadTimeouts = common_vendor.ref({});
    const imageRetryCount = common_vendor.ref({});
    const shareInfo = common_vendor.ref({
      title: "",
      path: "",
      imageUrl: ""
    });
    const updateShareInfo = () => {
      try {
        let title = articleDetail.value.content ? articleDetail.value.content.substring(0, 30) : "精彩内容";
        if (articleDetail.value.cate_name) {
          title = `【${articleDetail.value.cate_name}】 ${title}`;
        }
        let imageUrl = "";
        if (articleDetail.value.images && articleDetail.value.images.length > 0) {
          const firstImage = articleDetail.value.images[0];
          imageUrl = firstImage.compressedURL || firstImage.thumbnailURL || firstImage.url || "";
        }
        const path = `/pages/article/articleDetail?article_id=${props.article_id}`;
        shareInfo.value = {
          title,
          path,
          imageUrl
        };
        common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:391", "分享信息已更新（朋友圈使用文章图片，微信好友使用页面截图）:", shareInfo.value);
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:393", "更新分享信息失败:", err);
      }
    };
    common_vendor.onShareAppMessage((res) => {
      updateShareInfo();
      return {
        title: shareInfo.value.title,
        path: shareInfo.value.path
        // 微信好友分享不设置imageUrl，使用页面截图作为分享封面
      };
    });
    common_vendor.onShareTimeline(() => {
      updateShareInfo();
      return {
        title: shareInfo.value.title,
        path: shareInfo.value.path,
        imageUrl: shareInfo.value.imageUrl
        // 朋友圈分享使用文章第一张图片作为封面
      };
    });
    common_vendor.index.$on("setShareInfo", (data) => {
      if (data) {
        shareInfo.value = {
          title: data.title || shareInfo.value.title,
          path: data.path || shareInfo.value.path,
          imageUrl: data.imageUrl || shareInfo.value.imageUrl
        };
      }
    });
    common_vendor.onBeforeUnmount(() => {
      common_vendor.index.$off("setShareInfo");
    });
    const getArticleDetail = async () => {
      try {
        const needRedirect = await handlePageNavigation();
        if (needRedirect) {
          return;
        }
        if (!props.article_id) {
          throw new Error("文章ID不能为空");
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
        const res = await articleApi.getArticleDetal(props.article_id);
        if (!res || !res.articleRes || !res.articleRes.data || !Array.isArray(res.articleRes.data)) {
          throw new Error("获取文章详情失败：返回数据格式错误");
        }
        const articleData = res.articleRes.data[0];
        if (!articleData.content) {
          articleData.content = "暂无内容";
        }
        if (articleData.videoURL) {
          articleData.videoURL = processMediaURL(articleData.videoURL, "video");
          videoLoadStatus.value = "loading";
        }
        if (articleData.images && articleData.images.length) {
          imageLoadStatus.value = {};
          imageRetryCount.value = {};
          Object.keys(imageLoadTimeouts.value).forEach((key) => {
            clearTimeout(imageLoadTimeouts.value[key]);
          });
          imageLoadTimeouts.value = {};
          articleData.images = articleData.images.map((img, index) => {
            if (!img.compressedURL && img.url) {
              img.compressedURL = img.url;
            }
            if (img.compressedURL) {
              img.compressedURL = processMediaURL(img.compressedURL, "image");
            }
            if (!img.thumbnailURL && img.compressedURL) {
              img.thumbnailURL = img.compressedURL;
            }
            if (!isValidImageUrl(img.compressedURL) && !isValidImageUrl(img.thumbnailURL) && !isValidImageUrl(img.url)) {
              common_vendor.index.__f__("warn", "at pages/article/articleDetail.vue:540", `图片 ${index} 的URL无效:`, img);
              img.compressedURL = "/static/images/default.png";
              img.thumbnailURL = "/static/images/default.png";
            }
            imageLoadStatus.value[index] = "loading";
            imageLoadTimeouts.value[index] = setTimeout(() => {
              if (imageLoadStatus.value[index] === "loading") {
                common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:552", `图片 ${index} 加载超时`);
                imageLoadStatus.value[index] = "error";
                checkAllImagesLoaded();
              }
            }, IMAGE_LOAD_TIMEOUT);
            return img;
          });
          isAnyImageLoading.value = true;
          setTimeout(() => {
            if (isAnyImageLoading.value) {
              common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:567", "图片加载全局超时，强制显示内容");
              isAnyImageLoading.value = false;
            }
          }, IMAGE_LOAD_TIMEOUT + 2e3);
        } else {
          isAnyImageLoading.value = false;
        }
        if (articleData.cate_id) {
          try {
            const cateApi = common_vendor.tr.importObject("cateWx", { customUI: true });
            const cateRes = await cateApi.get(articleData.cate_id);
            if (cateRes.data && cateRes.data[0]) {
              articleData.cate_name = cateRes.data[0].cate_name;
            }
          } catch (err) {
            common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:584", "获取分类名称失败:", err);
          }
        }
        articleDetail.value = {
          _id: articleData._id || "",
          content: articleData.content || "",
          user_id: articleData.user_id || "",
          user_nickName: articleData.user_nickName || "",
          user_avatarUrl: articleData.user_avatarUrl || "",
          user_mobile: articleData.user_mobile || "",
          cate_id: articleData.cate_id || "",
          cate_name: articleData.cate_name || "",
          create_time: articleData.create_time || Date.now(),
          look_count: articleData.look_count || 0,
          like_count: articleData.like_count || 0,
          address: articleData.address || "",
          // 添加地址字段
          district: articleData.district || "",
          // 添加区域字段
          images: articleData.images || [],
          videoURL: articleData.videoURL || null
        };
        common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:608", "文章详情位置信息调试:", {
          originalAddress: articleData.address,
          originalDistrict: articleData.district,
          finalAddress: articleDetail.value.address,
          finalDistrict: articleDetail.value.district,
          getSimplifiedLocationResult: getSimplifiedLocation()
        });
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:617", "获取文章详情失败：", err);
        if (err.message && (err.message.includes("lotteryVisibility") || err.message.includes("lottery") || err.message.includes("currentCommentPosition"))) {
          common_vendor.index.__f__("warn", "at pages/article/articleDetail.vue:621", "检测到抽奖相关错误，已忽略：", err.message);
          common_vendor.index.showToast({
            title: "请清理缓存后重试",
            icon: "none",
            duration: 3e3
          });
        } else {
          common_vendor.index.showToast({
            title: "获取文章详情失败",
            icon: "none"
          });
        }
      }
    };
    const refreshPage = async () => {
      try {
        isLoading.value = true;
        Object.keys(imageLoadTimeouts.value).forEach((key) => {
          clearTimeout(imageLoadTimeouts.value[key]);
        });
        imageLoadStatus.value = {};
        imageLoadTimeouts.value = {};
        imageRetryCount.value = {};
        isAnyImageLoading.value = true;
        await getArticleDetail();
        await updatePageView();
        common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:662", "页面数据已刷新");
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:664", "刷新页面数据失败:", error);
        common_vendor.index.showToast({
          title: "刷新数据失败",
          icon: "none"
        });
      } finally {
        isLoading.value = false;
        common_vendor.index.stopPullDownRefresh();
      }
    };
    common_vendor.onPullDownRefresh(() => {
      refreshPage();
    });
    const goToHome = () => {
      common_vendor.index.switchTab({
        url: "/pages/index/index"
      });
    };
    const handleCall = async () => {
      try {
        const isLoggedIn = await customTestLogin();
        if (!isLoggedIn) {
          return;
        }
        if (articleDetail.value.user_mobile === "未填写") {
          return common_vendor.index.showToast({
            icon: "none",
            title: "没有联系方式"
          });
        }
        common_vendor.index.makePhoneCall({
          phoneNumber: articleDetail.value.user_mobile,
          fail: (err) => {
            common_vendor.index.showToast({
              title: "拨打电话失败",
              icon: "none"
            });
          }
        });
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:725", "拨打电话失败:", err);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      }
    };
    const customTestLogin = async () => {
      if (isCheckingLogin.value)
        return false;
      isCheckingLogin.value = true;
      try {
        if (userStore.userInfo && userStore.userInfo.uid) {
          if (!userStore.userInfo.mobile) {
            try {
              const localUserInfo = common_vendor.index.getStorageSync("userInfo");
              if (localUserInfo && localUserInfo.mobile) {
                userStore.setUserInfo({
                  ...userStore.userInfo,
                  mobile: localUserInfo.mobile
                });
              } else {
                try {
                  const userInfoApi = common_vendor.tr.importObject("userWx", { customUI: true });
                  const userResult = await userInfoApi.getUserInfo(userStore.userInfo.uid);
                  if (userResult && userResult.data && userResult.data.mobile) {
                    userStore.setUserInfo({
                      ...userStore.userInfo,
                      mobile: userResult.data.mobile
                    });
                    common_vendor.index.setStorageSync("userInfo", {
                      ...userStore.userInfo,
                      mobile: userResult.data.mobile
                    });
                  }
                } catch (err) {
                }
              }
            } catch (err) {
              common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:778", "获取用户手机号失败:", err);
            }
          }
          isCheckingLogin.value = false;
          return true;
        }
        if (!loginLoadingVisible.value) {
          loginLoadingVisible.value = true;
          common_vendor.index.showLoading({
            title: "登录中...",
            mask: true
          });
        }
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const currentRoute = currentPage.route;
        const currentOptions = currentPage.options || {};
        let redirectUrl = "/" + currentRoute;
        const queryParams = [];
        for (const key in currentOptions) {
          if (currentOptions.hasOwnProperty(key)) {
            queryParams.push(`${key}=${encodeURIComponent(currentOptions[key])}`);
          }
        }
        if (queryParams.length > 0) {
          redirectUrl += "?" + queryParams.join("&");
        }
        if (loginLoadingVisible.value) {
          common_vendor.index.hideLoading();
          loginLoadingVisible.value = false;
        }
        common_vendor.index.navigateTo({
          url: `/pages/login/login?redirect=${encodeURIComponent(redirectUrl)}`,
          complete: () => {
            isCheckingLogin.value = false;
          }
        });
        return false;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:835", "登录检查失败:", err);
        if (loginLoadingVisible.value) {
          common_vendor.index.hideLoading();
          loginLoadingVisible.value = false;
        }
        common_vendor.index.showToast({
          title: "登录检查失败，请重试",
          icon: "none",
          duration: 2e3
        });
        const currentRoute = `/pages/article/articleDetail?article_id=${props.article_id}`;
        const redirectUrl = encodeURIComponent(currentRoute);
        setTimeout(() => {
          common_vendor.index.navigateTo({
            url: `/pages/login/login?redirect=${redirectUrl}`,
            complete: () => {
              isCheckingLogin.value = false;
            }
          });
        }, 1500);
        return false;
      } finally {
        isCheckingLogin.value = false;
      }
    };
    const isUpdatingPageView = common_vendor.ref(false);
    const updatePageView = async () => {
      var _a, _b;
      try {
        if (!props.article_id) {
          return;
        }
        if (isUpdatingPageView.value) {
          common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:883", "浏览量更新已在进行中，跳过重复操作");
          return;
        }
        isUpdatingPageView.value = true;
        const viewedKey = `viewed_${props.article_id}`;
        const lastViewTime = common_vendor.index.getStorageSync(viewedKey);
        const currentTime = Date.now();
        if (lastViewTime && currentTime - lastViewTime < 3 * 1e3) {
          common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:897", "3秒钟内已浏览过此文章，不增加浏览量");
          isUpdatingPageView.value = false;
          return;
        }
        common_vendor.index.setStorageSync(viewedKey, currentTime);
        const result = await articleApi.updateLookCount(props.article_id);
        if (result && result.code === 0) {
          const updatedViewCount = ((_a = result.data) == null ? void 0 : _a.look_count) || (((_b = articleDetail.value) == null ? void 0 : _b.look_count) || 0) + 1;
          if (articleDetail.value) {
            articleDetail.value.look_count = updatedViewCount;
            common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:916", "文章浏览量已更新为:", articleDetail.value.look_count);
          }
          common_vendor.index.$emit("articleViewCountUpdated", {
            articleId: props.article_id,
            viewCount: updatedViewCount
          });
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:926", "更新浏览量失败:", err);
        if (articleDetail.value) {
          const localViewCount = (articleDetail.value.look_count || 0) + 1;
          articleDetail.value.look_count = localViewCount;
          common_vendor.index.$emit("articleViewCountUpdated", {
            articleId: props.article_id,
            viewCount: localViewCount
          });
        }
      } finally {
        isUpdatingPageView.value = false;
      }
    };
    const saveViewedArticle = () => {
      try {
        if (!articleDetail.value || !articleDetail.value._id)
          return;
        const article = {
          _id: articleDetail.value._id,
          title: articleDetail.value.content ? articleDetail.value.content.substring(0, 30) : "无标题",
          content: articleDetail.value.content || "",
          cate_name: articleDetail.value.cate_name || "未分类",
          create_time: articleDetail.value.create_time,
          view_time: Date.now(),
          // 浏览时间
          images: articleDetail.value.images && articleDetail.value.images.length > 0 ? [articleDetail.value.images[0]] : []
        };
        let viewedArticles = common_vendor.index.getStorageSync("viewedArticles") || [];
        const existingIndex = viewedArticles.findIndex((item) => item._id === article._id);
        if (existingIndex !== -1) {
          viewedArticles.splice(existingIndex, 1);
        }
        viewedArticles.unshift(article);
        if (viewedArticles.length > 50) {
          viewedArticles = viewedArticles.slice(0, 50);
        }
        common_vendor.index.setStorageSync("viewedArticles", viewedArticles);
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:985", "保存浏览记录失败:", err);
      }
    };
    common_vendor.onMounted(async () => {
      var _a;
      try {
        isLoading.value = true;
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const options = ((_a = currentPage.$page) == null ? void 0 : _a.options) || {};
        const articleId = options.article_id || props.article_id;
        if (!articleId) {
          throw new Error("文章ID不能为空");
        }
        await getArticleDetail();
        isLoading.value = false;
        if (articleDetail.value.videoURL) {
          setTimeout(() => {
            videoContext.value = common_vendor.index.createVideoContext("articleVideo");
          }, 300);
        }
        updatePageView().catch((err) => {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1022", "更新浏览量失败:", err);
        });
        saveViewedArticle();
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1029", "页面初始化失败:", err);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
      } finally {
        isLoading.value = false;
      }
    });
    common_vendor.onUnmounted(() => {
    });
    const previewImage = (current) => {
      if (!articleDetail.value.images || !articleDetail.value.images.length)
        return;
      const validImages = articleDetail.value.images.filter((img) => {
        const url = img.compressedURL || img.thumbnailURL || img.url;
        return url && (url.startsWith("http") || url.startsWith("/"));
      });
      if (validImages.length === 0) {
        common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1055", "没有有效的图片可以预览");
        common_vendor.index.showToast({
          title: "图片无法预览",
          icon: "none"
        });
        return;
      }
      const urls = validImages.map((img) => img.compressedURL || img.thumbnailURL || img.url);
      if (!current || typeof current === "string" && !urls.includes(current)) {
        current = urls[0];
      }
      common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1070", `准备预览图片，有效图片数: ${urls.length}，当前图片: ${current}`);
      common_vendor.index.previewImage({
        current,
        // 当前显示图片的索引
        urls,
        // 需要预览的图片链接列表
        indicator: "number",
        loop: true,
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1078", "预览图片失败:", err);
          common_vendor.index.showToast({
            title: "预览图片失败",
            icon: "none"
          });
        }
      });
    };
    const getSimplifiedLocation = () => {
      if (!articleDetail.value)
        return "";
      const { address, district } = articleDetail.value;
      if (address && address.trim()) {
        let simplifiedAddress = address.trim();
        if (simplifiedAddress.length > 50) {
          simplifiedAddress = simplifiedAddress.substring(0, 47) + "...";
        }
        return simplifiedAddress;
      }
      if (district && district.trim()) {
        return district.trim();
      }
      return "";
    };
    common_vendor.ref(false);
    common_vendor.ref(0);
    const handleImageLoad = (index) => {
      common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1174", `图片 ${index} 加载成功`);
      if (imageLoadTimeouts.value[index]) {
        clearTimeout(imageLoadTimeouts.value[index]);
        delete imageLoadTimeouts.value[index];
      }
      imageLoadStatus.value[index] = "loaded";
      checkAllImagesLoaded();
    };
    const handleImageError = (index) => {
      common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1191", "图片加载失败:", index, articleDetail.value.images && articleDetail.value.images[index]);
      if (imageLoadTimeouts.value[index]) {
        clearTimeout(imageLoadTimeouts.value[index]);
        delete imageLoadTimeouts.value[index];
      }
      if (!imageRetryCount.value[index]) {
        imageRetryCount.value[index] = 1;
      } else {
        imageRetryCount.value[index]++;
      }
      if (!articleDetail.value || !articleDetail.value.images || !articleDetail.value.images[index]) {
        imageLoadStatus.value[index] = "error";
        checkAllImagesLoaded();
        return;
      }
      if (imageRetryCount.value[index] <= MAX_RETRY_COUNT) {
        const img = articleDetail.value.images[index];
        let shouldRetry = false;
        let newUrl = "";
        try {
          if (imageRetryCount.value[index] === 1) {
            if (img.compressedURL !== img.url && img.url) {
              common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1224", "尝试使用原始URL加载图片:", img.url);
              newUrl = img.url;
              shouldRetry = true;
            }
          } else if (imageRetryCount.value[index] === 2) {
            const timestamp = (/* @__PURE__ */ new Date()).getTime();
            const baseUrl = img.url || img.compressedURL;
            if (baseUrl) {
              newUrl = baseUrl.includes("?") ? `${baseUrl}&t=${timestamp}` : `${baseUrl}?t=${timestamp}`;
              shouldRetry = true;
            }
          } else if (imageRetryCount.value[index] === 3) {
            const baseUrl = img.url || img.compressedURL;
            if (baseUrl) {
              const timestamp = (/* @__PURE__ */ new Date()).getTime() + 1e3;
              newUrl = baseUrl.includes("?") ? `${baseUrl}&t=${timestamp}&retry=final` : `${baseUrl}?t=${timestamp}&retry=final`;
              shouldRetry = true;
            }
          }
          if (shouldRetry && newUrl) {
            common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1254", `图片 ${index} 重试 (${imageRetryCount.value[index]}/${MAX_RETRY_COUNT}): ${newUrl}`);
            articleDetail.value.images[index] = {
              ...articleDetail.value.images[index],
              compressedURL: newUrl
            };
            imageLoadStatus.value[index] = "loading";
            const increasedTimeout = IMAGE_LOAD_TIMEOUT + imageRetryCount.value[index] * 5e3;
            common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1267", `图片 ${index} 设置加载超时: ${increasedTimeout}ms`);
            imageLoadTimeouts.value[index] = setTimeout(() => {
              if (imageLoadStatus.value[index] === "loading") {
                common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1271", `图片 ${index} 重试后依然超时`);
                imageLoadStatus.value[index] = "error";
                checkAllImagesLoaded();
              }
            }, increasedTimeout);
            return;
          }
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1280", "处理图片重试失败:", err);
          imageLoadStatus.value[index] = "error";
          checkAllImagesLoaded();
          return;
        }
      }
      imageLoadStatus.value[index] = "error";
      common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1290", `图片${index}加载失败，已标记为错误状态 (已重试${imageRetryCount.value[index]}次)`);
      checkAllImagesLoaded();
      if (index === 0) {
        setTimeout(() => {
          isAnyImageLoading.value = false;
        }, 300);
      }
    };
    const checkAllImagesLoaded = () => {
      if (!articleDetail.value || !articleDetail.value.images || !articleDetail.value.images.length) {
        isAnyImageLoading.value = false;
        return;
      }
      const imageCount = articleDetail.value.images.length;
      let loadedCount = 0;
      let errorCount = 0;
      for (let i = 0; i < imageCount; i++) {
        if (imageLoadStatus.value[i] === "loaded") {
          loadedCount++;
        } else if (imageLoadStatus.value[i] === "error") {
          errorCount++;
        }
      }
      common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1320", `图片加载状态: 已加载 ${loadedCount}, 错误 ${errorCount}, 总数 ${imageCount}`);
      if (loadedCount + errorCount >= imageCount) {
        isAnyImageLoading.value = false;
      }
      if (loadedCount > imageCount * 0.7) {
        isAnyImageLoading.value = false;
      }
    };
    const handleArticleClick = (articleId) => {
      if (articleId === props.article_id) {
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/article/articleDetail?article_id=${articleId}`,
        success: () => {
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1405", "跳转到文章详情页失败:", err);
          common_vendor.index.showToast({
            title: "跳转失败",
            icon: "none"
          });
        }
      });
    };
    common_vendor.onReachBottom(() => {
      if (tuijianRef.value) {
        tuijianRef.value.loadMore();
      }
    });
    const handleVideoLoad = () => {
      videoLoadStatus.value = "loaded";
    };
    const handleVideoError = () => {
      videoLoadStatus.value = "error";
      common_vendor.index.showToast({
        title: "视频加载失败",
        icon: "none"
      });
    };
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("setShareInfo");
      common_vendor.index.$off("viewCountUpdated");
      common_vendor.index.$off("updateArticleLikeStatus");
    });
    common_vendor.onLoad(async () => {
      imageLoadStatus.value = {};
      imageRetryCount.value = {};
      Object.keys(imageLoadTimeouts.value).forEach((key) => {
        clearTimeout(imageLoadTimeouts.value[key]);
      });
      imageLoadTimeouts.value = {};
      isLoading.value = true;
      isAnyImageLoading.value = true;
      try {
        await getArticleDetail();
        await updatePageView();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1512", "页面加载失败:", error);
      } finally {
        isLoading.value = false;
      }
    });
    common_vendor.onShow(() => {
      common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1522", "页面显示");
    });
    const preloadImages = (imageList, startIndex = 0) => {
      if (!imageList || !Array.isArray(imageList) || imageList.length === 0) {
        common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1528", "无图片可预加载");
        return;
      }
      const totalCount = imageList.length;
      let loadedCount = 0;
      let errorCount = 0;
      const updateLoadingStatus = () => {
        if (loadedCount + errorCount === totalCount) {
          isAnyImageLoading.value = false;
          common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1541", `图片加载完成: 成功 ${loadedCount}, 失败 ${errorCount}`);
        } else {
          common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1543", `图片加载状态: 已加载 ${loadedCount}, 错误 ${errorCount}, 总数 ${totalCount}`);
        }
      };
      const loadNextImage = (index) => {
        if (index >= totalCount) {
          updateLoadingStatus();
          return;
        }
        const img = imageList[index];
        if (!img) {
          common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1556", `图片 ${index} 为空`);
          errorCount++;
          loadNextImage(index + 1);
          return;
        }
        let url = img.compressedURL || img.thumbnailURL || img.url;
        if (!url) {
          common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1567", `图片 ${index} 没有有效URL`);
          errorCount++;
          loadNextImage(index + 1);
          return;
        }
        loadedCount++;
        common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1576", `标记图片 ${index} 为已加载，URL: ${url.substring(0, 50)}${url.length > 50 ? "..." : ""}`);
        loadNextImage(index + 1);
      };
      loadNextImage(startIndex);
    };
    const handleArticleLoaded = () => {
      setTimeout(() => {
        if (articleDetail.value && articleDetail.value.images) {
          preloadImages(articleDetail.value.images);
          articleDetail.value.images.forEach((img, index) => {
            imageLoadStatus.value[index] = "loaded";
          });
          isAnyImageLoading.value = false;
          common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1601", "文章已加载完成，标记所有图片为已加载状态");
        }
      }, 300);
    };
    common_vendor.watch(() => articleDetail.value._id, (newVal) => {
      if (newVal) {
        common_vendor.nextTick$1(() => {
          handleArticleLoaded();
        });
      }
    });
    common_vendor.watch(() => isLoading.value, (newVal, oldVal) => {
      if (oldVal === true && newVal === false) {
        handleArticleLoaded();
      }
    });
    const handleEdit = () => {
      if (!userStore.userInfo || !userStore.userInfo.uid || userStore.userInfo.uid !== articleDetail.value.user_id) {
        common_vendor.index.showToast({
          title: "只能编辑自己的文章",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/fabu/fabu?mode=edit&article_id=${props.article_id}`,
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1639", "跳转编辑页面失败:", err);
          common_vendor.index.showToast({
            title: "跳转失败",
            icon: "none"
          });
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: isLoading.value && !articleDetail.value._id
      }, isLoading.value && !articleDetail.value._id ? {
        b: common_vendor.p({
          type: "spinner-cycle",
          size: "48",
          color: "#399bfe"
        })
      } : {}, {
        c: articleDetail.value.videoURL
      }, articleDetail.value.videoURL ? common_vendor.e({
        d: videoLoadStatus.value === "loading"
      }, videoLoadStatus.value === "loading" ? {
        e: common_vendor.p({
          status: "loading",
          contentText: {
            contentrefresh: "视频加载中..."
          }
        })
      } : {}, {
        f: videoLoadStatus.value === "error"
      }, videoLoadStatus.value === "error" ? {
        g: common_vendor.p({
          type: "videocam-slash",
          size: "50",
          color: "#CCCCCC"
        })
      } : {}, {
        h: articleDetail.value.videoURL,
        i: articleDetail.value.images && articleDetail.value.images[0] ? articleDetail.value.images[0].compressedURL : "",
        j: common_vendor.o(handleVideoError),
        k: common_vendor.o(handleVideoLoad)
      }) : {}, {
        l: articleDetail.value.images && articleDetail.value.images.length
      }, articleDetail.value.images && articleDetail.value.images.length ? common_vendor.e({
        m: common_vendor.f(articleDetail.value.images.slice(0, articleDetail.value.images.length > 9 ? 9 : articleDetail.value.images.length), (item, index, i0) => {
          return common_vendor.e({
            a: imageLoadStatus.value[index] === "error"
          }, imageLoadStatus.value[index] === "error" ? {
            b: "786907d5-3-" + i0,
            c: common_vendor.p({
              type: "image",
              size: "24",
              color: "#999999"
            })
          } : imageLoadStatus.value[index] !== "loaded" ? {
            e: "786907d5-4-" + i0,
            f: common_vendor.p({
              type: "spinner-cycle",
              size: "24",
              color: "#666666"
            })
          } : {}, {
            d: imageLoadStatus.value[index] !== "loaded",
            g: item.compressedURL || item.thumbnailURL || item.url || "/static/images/default.png",
            h: common_vendor.o(($event) => handleImageLoad(index), index),
            i: common_vendor.o(($event) => handleImageError(index), index),
            j: imageLoadStatus.value[index] === "loaded" ? 1 : 0,
            k: index === 8 && articleDetail.value.images.length > 9
          }, index === 8 && articleDetail.value.images.length > 9 ? {
            l: common_vendor.t(articleDetail.value.images.length - 9)
          } : {}, {
            m: index,
            n: common_vendor.o(($event) => previewImage(item.compressedURL || item.thumbnailURL || item.url), index)
          });
        }),
        n: common_vendor.n({
          "single-image": articleDetail.value.images.length === 1,
          "double-image": articleDetail.value.images.length === 2,
          "triple-image": articleDetail.value.images.length === 3,
          "grid-image": articleDetail.value.images.length > 3
        }),
        o: articleDetail.value.images.length > 1
      }, articleDetail.value.images.length > 1 ? {
        p: common_vendor.t(articleDetail.value.images.length)
      } : {}) : {}, {
        q: common_vendor.p({
          type: "calendar",
          size: "18",
          color: "#666666"
        }),
        r: common_vendor.t(common_vendor.unref(utils_formatTime.formatTime)(articleDetail.value.create_time)),
        s: common_vendor.p({
          type: "eye",
          size: "18",
          color: "#666666"
        }),
        t: common_vendor.t(articleDetail.value.look_count || 0),
        v: articleDetail.value.cate_name
      }, articleDetail.value.cate_name ? {
        w: common_vendor.p({
          type: "tag",
          size: "18",
          color: "#399bfe"
        }),
        x: common_vendor.t(articleDetail.value.cate_name)
      } : {}, {
        y: articleDetail.value.content
      }, articleDetail.value.content ? common_vendor.e({
        z: processedContent.value,
        A: common_vendor.o(handleRichTextTap),
        B: !processedContent.value
      }, !processedContent.value ? {
        C: common_vendor.t(articleDetail.value.content),
        D: common_vendor.o(handleTextPhoneDetection)
      } : {}) : {}, {
        E: articleDetail.value.images && articleDetail.value.images.length
      }, articleDetail.value.images && articleDetail.value.images.length ? {
        F: common_vendor.t(articleDetail.value.images.length),
        G: common_vendor.f(articleDetail.value.images, (item, index, i0) => {
          return common_vendor.e({
            a: imageLoadStatus.value[index] === "error"
          }, imageLoadStatus.value[index] === "error" ? {
            b: "786907d5-8-" + i0,
            c: common_vendor.p({
              type: "image",
              size: "32",
              color: "#cccccc"
            })
          } : imageLoadStatus.value[index] !== "loaded" ? {
            e: "786907d5-9-" + i0,
            f: common_vendor.p({
              type: "spinner-cycle",
              size: "32",
              color: "#666666"
            })
          } : {}, {
            d: imageLoadStatus.value[index] !== "loaded",
            g: item.compressedURL || item.thumbnailURL || item.url || "/static/images/default.png",
            h: common_vendor.o(($event) => previewImage(item.compressedURL || item.thumbnailURL || item.url), index),
            i: common_vendor.o(($event) => handleImageLoad(index), index),
            j: common_vendor.o(($event) => handleImageError(index), index),
            k: imageLoadStatus.value[index] === "loaded" ? 1 : 0,
            l: index
          });
        })
      } : {}, {
        H: articleDetail.value.address || articleDetail.value.district
      }, articleDetail.value.address || articleDetail.value.district ? {
        I: common_vendor.p({
          type: "location",
          size: "16",
          color: "#399bfe"
        }),
        J: common_vendor.t(getSimplifiedLocation())
      } : {}, {
        K: common_vendor.sr(tuijianRef, "786907d5-11", {
          "k": "tuijianRef"
        }),
        L: common_vendor.o(handleArticleClick),
        M: common_vendor.p({
          ["current-article-id"]: __props.article_id,
          cate_id: articleDetail.value.cate_id
        }),
        N: common_vendor.o(($event) => {
          var _a;
          return (_a = tuijianRef.value) == null ? void 0 : _a.loadMore();
        }),
        O: articleDetail.value._id,
        P: common_vendor.p({
          type: "home",
          size: "24",
          color: "#444444"
        }),
        Q: common_vendor.o(goToHome),
        R: common_vendor.unref(userStore).userInfo && common_vendor.unref(userStore).userInfo.uid === articleDetail.value.user_id
      }, common_vendor.unref(userStore).userInfo && common_vendor.unref(userStore).userInfo.uid === articleDetail.value.user_id ? {
        S: common_vendor.p({
          type: "compose",
          size: "24",
          color: "#444444"
        }),
        T: common_vendor.o(handleEdit)
      } : {}, {
        U: common_vendor.o(handleCall),
        V: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-786907d5"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/article/articleDetail.js.map
