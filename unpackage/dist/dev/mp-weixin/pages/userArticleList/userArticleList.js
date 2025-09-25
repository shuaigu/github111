"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const utils_isLogin = require("../../utils/isLogin.js");
require("../../store/authSwitch.js");
const utils_domainConfig = require("../../utils/domainConfig.js");
const _sfc_main = {
  components: {},
  data() {
    return {
      // 分享相关数据
      shareTitle: "",
      shareImageUrl: "",
      shareUserId: "",
      defaultShareImage: "/static/images/logo.png",
      // 默认分享图片
      dynamicShareImage: "",
      // 动态生成的分享图片路径
      linkShareImage: "",
      // 链接分享图片路径，与小程序分享图保持一致
      // 视频播放相关
      videoUrl: "",
      // 默认视频地址
      videoVisible: false,
      // 控制视频组件显示状态
      isVideoPlaying: false,
      // 视频是否正在播放
      videoContext: null,
      // 视频上下文对象
      userClosedVideo: false,
      // 用户是否主动关闭了视频
      // 用户信息和文章列表
      userArticleData: [],
      userArticleInfo: {
        avatarUrl: utils_domainConfig.getDefaultImage("avatar"),
        nickName: "加载中...",
        mobile: "未填写"
      },
      // 最新文章图片
      latestArticleImages: [],
      // 分页相关
      pageNo: 1,
      pageSize: 8,
      // 每页加载的数据条数，与后端默认值保持一致
      // 加载状态
      status: "more",
      // 初始状态为 'more'
      isLoading: false,
      // 是否正在加载
      hasMore: true,
      // 是否还有更多数据
      loadMoreText: {
        contentdown: "上拉加载更多",
        contentrefresh: "加载中...",
        contentnomore: "~ 已经到底啦 ~"
      },
      // 用户信息store
      userStore: null,
      // 头像点击控制状态
      avatarClickEnabled: true,
      // 下拉刷新相关
      isRefreshing: false,
      refreshStartTime: 0,
      // 记录开始刷新的时间
      // 添加触底加载防抖变量
      scrollToLowerTimer: null,
      isScrollLoading: false,
      totalArticleCount: 0,
      // 文章总数
      // 全屏弹窗控制
      showFullScreenPopup: false,
      // 缓存视频URL
      videoUrlCache: []
    };
  },
  props: {
    userId: String
  },
  computed: {
    // 计算文章总数，便于在模板和分享中使用
    articleTotal() {
      return this.totalArticleCount || 0;
    }
  },
  // 页面加载时设置分享数据
  onLoad(options) {
    if (options.userId) {
      this.shareUserId = options.userId;
    }
    this.userStore = store_user.useUserInfoStore();
    this.getSendOnState();
    this.getUserArticleCount();
    this.getArticelList(true).then(() => {
      this.searchAllVideosOnLoad();
    });
    common_vendor.index.showShareMenu({
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"]
      // 显式指定支持分享到朋友圈
    });
    common_vendor.index.$on("viewCountUpdated", (articleId) => {
      this.updateLocalViewCount({ articleId });
    });
    common_vendor.index.$on("articleViewCountUpdated", (data) => {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:124", "用户文章列表收到文章浏览量更新事件:", data);
      if (data && data.articleId) {
        this.updateLocalViewCount(data);
      }
    });
    common_vendor.index.$on("avatarClickChanged", (newState) => {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:132", "用户文章列表页面收到头像点击状态变化事件:", newState);
      this.avatarClickEnabled = newState;
    });
    common_vendor.index.$on("globalRefresh", (data) => {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:138", "用户文章列表收到全局刷新事件:", data);
      if (data && data.pages && data.pages.includes("userArticleList")) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:141", "正在刷新用户文章列表...");
        this.getUserArticleCount();
        this.getArticelList(true);
      }
    });
    this.preloadDefaultShareImage();
  },
  // 页面卸载时移除事件监听
  onUnload() {
    common_vendor.index.$off("viewCountUpdated");
    common_vendor.index.$off("articleViewCountUpdated");
    common_vendor.index.$off("avatarClickChanged");
    common_vendor.index.$off("globalRefresh");
    if (this.scrollToLowerTimer) {
      clearTimeout(this.scrollToLowerTimer);
      this.scrollToLowerTimer = null;
    }
  },
  // 组件销毁前清理资源
  beforeDestroy() {
    if (this.scrollToLowerTimer) {
      clearTimeout(this.scrollToLowerTimer);
      this.scrollToLowerTimer = null;
    }
  },
  // 监听页面触底事件
  onReachBottom() {
    common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:184", "原生触底事件被触发");
    if (this.isScrollLoading || this.scrollToLowerTimer) {
      return;
    }
    this.scrolltolower();
  },
  methods: {
    // 获取权限开关状态
    async getSendOnState() {
      try {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:197", "正在获取按钮状态...");
        const sendOnApi = common_vendor.tr.importObject("sendOn", { customUI: true });
        const res = await sendOnApi.get();
        if (res && res.data && res.data.length > 0) {
          const serverAvatarClickState = res.data[0].avatarClick !== void 0 ? res.data[0].avatarClick : true;
          this.avatarClickEnabled = serverAvatarClickState;
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:209", "头像点击状态:", this.avatarClickEnabled);
        } else {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:211", "获取按钮状态失败: 数据格式不正确");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:214", "获取按钮状态失败:", err);
      }
    },
    // 请求云对象获取文章总数
    async getUserArticleCount() {
      if (!this.userId) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:221", "用户ID不存在，无法获取文章总数");
        return;
      }
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:225", "通过云对象请求文章总数，用户ID:", this.userId);
      try {
        const articleApi = common_vendor.tr.importObject("articleWx", { customUI: true });
        const result = await articleApi.getArticleList(this.userId, 1, 1);
        if (result && result.total !== void 0) {
          this.totalArticleCount = result.total;
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:237", "云对象通过getArticleList获取到文章总数:", this.totalArticleCount);
          this.updateShareInfo();
          return this.totalArticleCount;
        } else {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:244", "云对象获取文章总数失败: 未返回total字段");
          return null;
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:248", "云对象获取文章总数出错:", err);
        this.totalArticleCount = 0;
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:252", "云对象请求失败，设置文章总数为0");
        return null;
      }
    },
    // 预加载默认分享图片
    preloadDefaultShareImage() {
      common_vendor.index.getImageInfo({
        src: this.defaultShareImage,
        success: (res) => {
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:264", "默认分享图片预加载成功:", res);
          this.defaultShareImage = res.path;
          this.linkShareImage = res.path;
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:271", "默认分享图片预加载失败:", err);
        }
      });
    },
    // 统一分享方法 - 返回标准分享信息（分享给好友使用页面截图作为封面）
    getShareInfo() {
      var _a;
      if (this.userArticleInfo) {
        const nickName = ((_a = this.userArticleInfo) == null ? void 0 : _a.nickName) || "用户";
        this.shareTitle = `我是${nickName}，这是我的第${this.articleTotal}条朋友圈，点击查看！`;
      }
      this.shareUserId = this.userId || this.shareUserId;
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:287", "统一分享方法 - 分享给好友使用页面截图作为封面");
      return {
        title: this.shareTitle || "更新了精彩动态，点击查看！",
        path: `/pages/userArticleList/userArticleList?userId=${this.shareUserId}`
        // 不包含imageUrl，使小程序自动截取页面作为分享封面
      };
    },
    // 获取朋友圈分享信息（使用用户头像作为封面）
    getTimelineShareInfo() {
      var _a;
      if (this.userArticleInfo) {
        const nickName = ((_a = this.userArticleInfo) == null ? void 0 : _a.nickName) || "用户";
        this.shareTitle = `我是${nickName}，这是我的第${this.articleTotal}条朋友圈，点击查看！`;
      }
      this.shareUserId = this.userId || this.shareUserId;
      let shareImageUrl = "";
      if (this.userArticleInfo && this.userArticleInfo.avatarUrl) {
        shareImageUrl = this.processImageUrl(this.userArticleInfo.avatarUrl);
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:312", "朋友圈分享 - 使用用户头像作为封面:", shareImageUrl);
      } else {
        shareImageUrl = this.defaultShareImage;
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:316", "朋友圈分享 - 使用默认分享图作为封面:", shareImageUrl);
      }
      return {
        title: this.shareTitle || "更新了精彩动态，点击查看！",
        query: `userId=${this.shareUserId}`,
        imageUrl: shareImageUrl
        // 使用用户头像作为朋友圈分享封面
      };
    },
    // 更新分享信息
    updateShareInfo() {
      var _a;
      if (this.userArticleInfo) {
        const nickName = ((_a = this.userArticleInfo) == null ? void 0 : _a.nickName) || "用户";
        this.shareTitle = `我是${nickName}，这是我的第${this.articleTotal}条朋友圈，点击查看！`;
        this.shareUserId = this.userId || this.shareUserId;
        this.shareImageUrl = this.dynamicShareImage || this.defaultShareImage;
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:340", "更新分享信息:", {
          title: this.shareTitle,
          imageUrl: this.shareImageUrl,
          userId: this.shareUserId
        });
      }
    },
    // 获取用户文章列表（首次加载或重置）
    async getArticelList(isReset = false) {
      this.isLoading = true;
      this.status = "loading";
      if (isReset) {
        this.pageNo = 1;
        this.userArticleData = [];
      }
      return new Promise(async (resolve, reject) => {
        try {
          const articleApi = common_vendor.tr.importObject("articleWx", { customUI: true });
          const res = await articleApi.getArticleList(this.userId, this.pageNo, this.pageSize);
          if (res && res.total !== void 0) {
            this.totalArticleCount = res.total;
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:366", "获取到文章总数:", this.totalArticleCount);
          }
          if (res && res.userInfo) {
            this.userArticleInfo = res.userInfo;
            if (this.userId === this.userStore.userInfo.uid) {
              this.userStore.setUserInfo({
                ...this.userStore.userInfo,
                nickName: res.userInfo.nickName || this.userStore.userInfo.nickName,
                avatarUrl: res.userInfo.avatarUrl ? utils_domainConfig.fixImageUrl(res.userInfo.avatarUrl) : this.userStore.userInfo.avatarUrl ? utils_domainConfig.fixImageUrl(this.userStore.userInfo.avatarUrl) : utils_domainConfig.getDefaultImage("avatar")
              });
            }
            this.$nextTick(() => {
              this.updateShareInfo();
            });
          } else {
            if (this.pageNo === 1 && res && res.data && res.data.length > 0) {
              const firstArticle = res.data[0];
              this.userArticleInfo = {
                avatarUrl: firstArticle.user_avatarUrl ? utils_domainConfig.fixImageUrl(firstArticle.user_avatarUrl) : utils_domainConfig.getDefaultImage("avatar"),
                nickName: firstArticle.user_nickName,
                mobile: firstArticle.user_mobile || "未填写"
              };
            } else {
              if (this.pageNo === 1) {
                this.userArticleInfo = {};
              }
            }
          }
          if (res && res.data) {
            let articlesData = res.data;
            articlesData = articlesData.map((article) => {
              article.hasVideo = this.checkArticleHasVideo(article);
              return article;
            });
            if (isReset) {
              this.userArticleData = articlesData;
            } else {
              this.userArticleData = [...this.userArticleData, ...articlesData];
            }
            this.userArticleData.forEach((article) => {
              if (!article.user_avatarUrl && this.userArticleInfo.avatarUrl) {
                article.user_avatarUrl = this.userArticleInfo.avatarUrl;
              }
              if (!article.user_nickName && this.userArticleInfo.nickName) {
                article.user_nickName = this.userArticleInfo.nickName;
              }
            });
            this.hasMore = res.data.length >= this.pageSize;
            this.status = this.hasMore ? "more" : "noMore";
            this.$nextTick(() => {
              this.updateShareInfo();
              this.extractLatestArticleImages();
              this.extractVideoFromArticles();
            });
          } else {
            if (isReset) {
              this.userArticleData = [];
            }
            this.hasMore = false;
            this.status = "noMore";
          }
          resolve();
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:455", "获取用户文章列表失败:", err);
          if (isReset) {
            this.userArticleData = [];
          }
          this.userArticleInfo = {};
          this.status = "noMore";
          this.hasMore = false;
          common_vendor.index.showToast({
            title: "获取数据失败，请重试",
            icon: "none"
          });
          reject(err);
        } finally {
          this.isLoading = false;
          this.isRefreshing = false;
        }
      });
    },
    // 触底加载时，不影响视频状态
    scrolltolower() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:480", "触底加载被触发，状态:", { isLoading: this.isLoading, hasMore: this.hasMore, isScrollLoading: this.isScrollLoading });
      if (this.isLoading || !this.hasMore || this.isScrollLoading) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:484", "跳过加载: " + (this.isLoading ? "正在加载中" : this.isScrollLoading ? "防抖期间" : "没有更多数据"));
        return;
      }
      this.isScrollLoading = true;
      this.status = "loading";
      if (this.scrollToLowerTimer) {
        clearTimeout(this.scrollToLowerTimer);
      }
      let savedVideoState = null;
      if (this.videoVisible && this.videoContext) {
        savedVideoState = {
          isPlaying: this.isVideoPlaying,
          position: 0,
          visible: this.videoVisible
        };
        try {
          this.videoContext.pause();
          savedVideoState.position = this.videoContext.currentTime || 0;
          if (savedVideoState.isPlaying) {
            this.videoContext.play();
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:517", "保存视频状态时出错:", e);
        }
      }
      this.scrollToLowerTimer = setTimeout(() => {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:523", "开始加载更多数据 (防抖后)，保存的视频状态:", savedVideoState);
        this.loadMoreData(savedVideoState);
      }, 500);
    },
    // 加载更多数据
    async loadMoreData(savedVideoState = null) {
      if (this.isLoading || !this.hasMore) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:533", "跳过加载更多:", { isLoading: this.isLoading, hasMore: this.hasMore });
        this.isScrollLoading = false;
        return;
      }
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:538", `开始加载第${this.pageNo + 1}页数据，视频状态:`, savedVideoState);
      this.status = "loading";
      this.isLoading = true;
      const loadStartTime = Date.now();
      const minLoadingTime = 500;
      this.pageNo++;
      try {
        await this.getArticelList();
        const loadDuration = Date.now() - loadStartTime;
        if (loadDuration < minLoadingTime) {
          await new Promise((resolve) => setTimeout(resolve, minLoadingTime - loadDuration));
        }
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:558", `第${this.pageNo}页数据加载完成, 当前状态:`, {
          articleCount: this.userArticleData.length,
          hasMore: this.hasMore,
          status: this.status
        });
        this.$nextTick(() => {
          this.restoreVideoState(savedVideoState);
        });
      } catch (err) {
        if (err && err.message === "请求进行中") {
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:571", "忽略并发请求:", err.message);
        } else {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:573", "加载更多数据失败:", err);
        }
        this.pageNo--;
        this.status = "more";
        this.$nextTick(() => {
          this.restoreVideoState(savedVideoState);
        });
      } finally {
        this.isLoading = false;
        this.isScrollLoading = false;
      }
    },
    // 恢复视频状态的方法
    restoreVideoState(savedVideoState) {
      if (!savedVideoState)
        return;
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:594", "尝试恢复视频状态:", savedVideoState, "用户关闭标记:", this.userClosedVideo);
      if (this.userClosedVideo) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:598", "用户已主动关闭视频，不恢复视频状态");
        return;
      }
      if (savedVideoState.visible !== this.videoVisible) {
        this.videoVisible = savedVideoState.visible;
      }
      if (this.videoVisible && this.videoUrl) {
        this.videoContext = common_vendor.index.createVideoContext("myVideo", this);
        if (this.videoContext) {
          try {
            if (savedVideoState.position > 0) {
              this.videoContext.seek(savedVideoState.position);
            }
            if (savedVideoState.isPlaying) {
              this.videoContext.play();
              this.isVideoPlaying = true;
            } else {
              this.videoContext.pause();
              this.isVideoPlaying = false;
            }
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:628", "视频状态恢复成功");
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:630", "恢复视频状态时出错:", e);
          }
        }
      }
    },
    // 处理删除
    async handleDelete(article_id) {
      try {
        common_vendor.index.showModal({
          title: "确认删除",
          content: "确定要删除这篇文章吗？",
          success: async (result) => {
            if (result.confirm) {
              common_vendor.index.showLoading({
                title: "删除中...",
                mask: true
              });
              const articleApi = common_vendor.tr.importObject("articleWx", { customUI: true });
              const res = await articleApi.del(article_id, this.userStore.userInfo.uid);
              common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:655", "删除返回结果:", res);
              if (res && res.deleted) {
                const index = this.userArticleData.findIndex((item) => item._id === article_id);
                if (index !== -1) {
                  this.userArticleData.splice(index, 1);
                }
                common_vendor.index.hideLoading();
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success",
                  duration: 1500
                });
              } else {
                throw new Error("删除失败，请重试");
              }
            }
          }
        });
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:679", "删除出错:", err);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: err.message || "删除失败，请重试",
          icon: "none",
          duration: 2e3
        });
      }
    },
    // 图片预览
    previewImage(urls, current) {
      common_vendor.index.previewImage({
        urls,
        current
      });
    },
    // 处理联系方式
    handleContact() {
      if (!this.userStore.userInfo.isLogin) {
        return utils_isLogin.testLogin();
      }
      if (!this.userArticleInfo || this.userArticleInfo.mobile === "未填写") {
        return common_vendor.index.showToast({
          icon: "none",
          title: "他并不想让人联系"
        });
      }
      common_vendor.index.makePhoneCall({
        phoneNumber: this.userArticleInfo.mobile
      });
    },
    // 文章列表触底时触发
    scrolltolower() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:716", "触底加载被触发，状态:", { isLoading: this.isLoading, hasMore: this.hasMore, isScrollLoading: this.isScrollLoading });
      if (this.isLoading || !this.hasMore || this.isScrollLoading) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:720", "跳过加载: " + (this.isLoading ? "正在加载中" : this.isScrollLoading ? "防抖期间" : "没有更多数据"));
        return;
      }
      this.isScrollLoading = true;
      this.status = "loading";
      if (this.scrollToLowerTimer) {
        clearTimeout(this.scrollToLowerTimer);
      }
      let savedVideoState = null;
      if (this.videoVisible && this.videoContext) {
        savedVideoState = {
          isPlaying: this.isVideoPlaying,
          position: 0,
          visible: this.videoVisible
        };
        try {
          this.videoContext.pause();
          savedVideoState.position = this.videoContext.currentTime || 0;
          if (savedVideoState.isPlaying) {
            this.videoContext.play();
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:753", "保存视频状态时出错:", e);
        }
      }
      this.scrollToLowerTimer = setTimeout(() => {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:759", "开始加载更多数据 (防抖后)，保存的视频状态:", savedVideoState);
        this.loadMoreData(savedVideoState);
      }, 500);
    },
    // 更新本地文章浏览量数据
    updateLocalViewCount(data) {
      if (!data || !data.articleId) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:770", "更新浏览量失败：无效的文章数据");
        return;
      }
      const article = this.userArticleData.find((item) => item._id === data.articleId);
      if (article) {
        if (data.viewCount !== void 0) {
          article.look_count = data.viewCount;
        } else if (article.look_count !== void 0) {
          article.look_count++;
        } else {
          article.look_count = 1;
        }
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:785", `文章(${data.articleId})浏览量已更新: ${article.look_count}`);
      } else {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:787", `未找到文章: ${data.articleId}`);
      }
    },
    // 预览最新文章图片
    previewLatestImages(index) {
      if (this.latestArticleImages && this.latestArticleImages.length > 0) {
        common_vendor.index.previewImage({
          current: this.latestArticleImages[index],
          urls: this.latestArticleImages
        });
      }
    },
    // 获取文章的图片
    getArticleImages(article) {
      const images = [];
      if (!article)
        return images;
      if (article.images && article.images.length > 0) {
        article.images.forEach((img) => {
          if (img.thumbnailURL) {
            images.push(this.processImageUrl(img.thumbnailURL));
          } else if (img.compressedURL) {
            images.push(this.processImageUrl(img.compressedURL));
          } else if (img.url) {
            images.push(this.processImageUrl(img.url));
          } else if (typeof img === "string") {
            images.push(this.processImageUrl(img));
          }
        });
      }
      if (article.imgArr && article.imgArr.length > 0) {
        article.imgArr.forEach((img) => {
          images.push(this.processImageUrl(img));
        });
      }
      if (article.coverImage && images.length === 0) {
        images.push(this.processImageUrl(article.coverImage));
      }
      return images;
    },
    // 预览文章图片
    previewArticleImage(article, index) {
      const images = this.getArticleImages(article);
      if (images && images.length > 0) {
        common_vendor.index.previewImage({
          current: images[index],
          urls: images
        });
      }
    },
    // 下拉刷新
    onRefresh() {
      this.isRefreshing = true;
      this.refreshStartTime = Date.now();
      this.getArticelList(true).then(() => {
        const refreshDuration = Date.now() - this.refreshStartTime;
        const minimumDuration = 800;
        if (refreshDuration < minimumDuration) {
          setTimeout(() => {
            this.isRefreshing = false;
            common_vendor.index.showToast({
              title: "刷新成功",
              icon: "success",
              duration: 1500
            });
          }, minimumDuration - refreshDuration);
        } else {
          this.isRefreshing = false;
          common_vendor.index.showToast({
            title: "刷新成功",
            icon: "success",
            duration: 1500
          });
        }
      }).catch(() => {
        const refreshDuration = Date.now() - this.refreshStartTime;
        const minimumDuration = 800;
        if (refreshDuration < minimumDuration) {
          setTimeout(() => {
            this.isRefreshing = false;
            common_vendor.index.showToast({
              title: "刷新失败",
              icon: "none",
              duration: 1500
            });
          }, minimumDuration - refreshDuration);
        } else {
          this.isRefreshing = false;
          common_vendor.index.showToast({
            title: "刷新失败",
            icon: "none",
            duration: 1500
          });
        }
      });
    },
    // 隐藏分享引导蒙层
    hideShareGuide() {
      this.showShareArrow = false;
    },
    // 视频相关方法
    // 初始化视频上下文
    initVideoContext() {
      if (this.videoVisible && this.videoUrl) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:921", "初始化视频上下文");
        this.videoContext = common_vendor.index.createVideoContext("myVideo", this);
      } else {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:924", "视频组件不可见或没有视频URL，跳过初始化");
      }
    },
    // 视频播放事件处理
    onVideoPlay() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:930", "视频开始播放");
      this.isVideoPlaying = true;
    },
    // 视频暂停事件处理
    onVideoPause() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:936", "视频暂停播放");
      this.isVideoPlaying = false;
    },
    // 视频播放结束事件处理
    onVideoEnded() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:942", "视频播放结束");
      this.isVideoPlaying = false;
    },
    // 视频播放错误事件处理
    onVideoError(e) {
      common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:948", "视频播放错误:", e);
      const foundNext = this.findNextVideo();
      if (!foundNext) {
        this.hideVideo();
      }
    },
    // 查找下一个可用视频
    findNextVideo() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:962", "查找下一个可用视频");
      if (this.videoUrlCache && this.videoUrlCache.length > 0) {
        this.videoUrlCache = this.videoUrlCache.filter((url) => url !== this.videoUrl);
        if (this.videoUrlCache.length > 0) {
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:971", "从缓存中找到其他视频:", this.videoUrlCache[0]);
          this.videoUrl = this.videoUrlCache[0];
          this.videoVisible = true;
          this.$nextTick(() => {
            this.initVideoContext();
          });
          return true;
        }
      }
      if (!this.userArticleData || this.userArticleData.length === 0) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:986", "没有文章数据，无法查找视频");
        return false;
      }
      const allVideoUrls = [];
      for (let article of this.userArticleData) {
        const videoUrl = this.extractVideoUrlFromArticle(article);
        if (videoUrl && videoUrl !== this.videoUrl) {
          allVideoUrls.push(videoUrl);
        }
      }
      if (allVideoUrls.length > 0) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1003", "找到其他视频:", allVideoUrls[0]);
        this.videoUrlCache = allVideoUrls;
        this.videoUrl = allVideoUrls[0];
        this.videoVisible = true;
        this.$nextTick(() => {
          this.initVideoContext();
        });
        return true;
      } else {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1018", "没有找到其他可用视频");
        common_vendor.index.showToast({
          title: "未找到其他视频",
          icon: "none"
        });
        return false;
      }
    },
    // 全屏状态变化事件处理
    handleFullscreenChange(e) {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1029", "全屏状态变化:", e.detail.fullScreen);
    },
    // 隐藏视频
    hideVideo() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1034", "隐藏视频组件被调用");
      this.userClosedVideo = true;
      if (this.videoContext) {
        this.videoContext.pause();
      }
      this.videoVisible = false;
      this.videoUrl = "";
    },
    // 显示视频
    showVideo() {
      this.userClosedVideo = false;
      this.videoVisible = true;
      this.$nextTick(() => {
        this.initVideoContext();
      });
    },
    // 从文章列表中提取视频URL
    extractVideoFromArticles() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1059", "尝试从文章中提取视频链接");
      if (this.userClosedVideo) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1063", "用户已主动关闭视频，跳过视频提取");
        return false;
      }
      if (!this.userArticleData || this.userArticleData.length === 0) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1069", "没有文章数据，无法提取视频");
        return false;
      }
      const sortedArticleIndices = this.userArticleData.map((article, index) => ({
        index,
        time: article.create_time || article.createTime || article.time || 0,
        priority: this.getVideoPriority(article),
        // 计算视频优先级
        hasVideo: this.checkArticleHasVideo(article)
        // 预先检查是否包含视频
      })).sort((a, b) => {
        if (a.hasVideo !== b.hasVideo) {
          return a.hasVideo ? -1 : 1;
        }
        if (typeof a.time === "string" && typeof b.time === "string") {
          return new Date(b.time) - new Date(a.time);
        } else if (typeof a.time === "number" && typeof b.time === "number") {
          return b.time - a.time;
        }
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.index - b.index;
      }).map((item) => item.index);
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1103", "优化排序后的文章索引:", sortedArticleIndices.slice(0, 5));
      const allVideoUrls = [];
      let firstFoundVideo = null;
      const maxArticlesToProcess = Math.min(sortedArticleIndices.length, 15);
      for (let i = 0; i < maxArticlesToProcess; i++) {
        const articleIndex = sortedArticleIndices[i];
        const article = this.userArticleData[articleIndex];
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1116", `检查文章索引 ${articleIndex} 是否包含视频`);
        const videoUrl = this.extractVideoUrlFromArticle(article);
        if (videoUrl) {
          if (!firstFoundVideo) {
            firstFoundVideo = videoUrl;
            if (!allVideoUrls.includes(videoUrl)) {
              allVideoUrls.push(videoUrl);
            }
          } else {
            if (!allVideoUrls.includes(videoUrl)) {
              allVideoUrls.push(videoUrl);
            }
          }
          if (allVideoUrls.length >= 3) {
            break;
          }
        }
      }
      if (firstFoundVideo) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1146", "找到视频链接:", firstFoundVideo);
        this.videoUrlCache = allVideoUrls;
        this.videoUrl = firstFoundVideo;
        this.videoVisible = true;
        this.$nextTick(() => {
          this.initVideoContext();
        });
        return true;
      }
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1162", "未在文章中找到有效的视频链接");
      return false;
    },
    // 计算文章中视频的优先级
    getVideoPriority(article) {
      let priority = 0;
      if (article.videoURL || article.videoUrl || article.video_url) {
        priority += 10;
      }
      if (article.videos && Array.isArray(article.videos) && article.videos.length > 0) {
        priority += 8;
      }
      if (article.content && article.content.length > 500) {
        priority += 3;
      }
      if (article.like_count > 5 || article.look_count > 20) {
        priority += 5;
      }
      return priority;
    },
    // 从单个文章中提取视频URL
    extractVideoUrlFromArticle(article) {
      if (!article)
        return null;
      if (article.videoURL && typeof article.videoURL === "string" && this.isValidVideoUrl(article.videoURL)) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1199", "找到videoURL字段中的视频链接:", article.videoURL);
        return article.videoURL;
      }
      const possibleVideoFields = [
        "videoUrl",
        "video_url",
        "video",
        "videoSrc",
        "video_src",
        "url"
      ];
      for (let field of possibleVideoFields) {
        if (article[field] && typeof article[field] === "string" && this.isValidVideoUrl(article[field])) {
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1216", `找到视频链接(${field}):`, article[field]);
          return article[field];
        }
      }
      const possibleVideoArrayFields = [
        "videos",
        "videoArr",
        "video_arr",
        "videoList",
        "video_list"
      ];
      for (let field of possibleVideoArrayFields) {
        if (article[field] && Array.isArray(article[field]) && article[field].length > 0) {
          const videoItem = article[field][0];
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1234", `找到视频数组(${field}):`, videoItem);
          if (typeof videoItem === "string" && this.isValidVideoUrl(videoItem)) {
            return videoItem;
          } else if (typeof videoItem === "object") {
            const possibleUrlProps = ["url", "src", "source", "path", "videoUrl"];
            for (let prop of possibleUrlProps) {
              if (videoItem[prop] && typeof videoItem[prop] === "string" && this.isValidVideoUrl(videoItem[prop])) {
                return videoItem[prop];
              }
            }
          }
        }
      }
      if (article.content) {
        const videoUrlMatch = this.extractVideoUrlFromContent(article.content);
        if (videoUrlMatch) {
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1256", "从内容中提取到视频链接:", videoUrlMatch);
          return videoUrlMatch;
        }
      }
      return null;
    },
    // 从内容中提取视频URL
    extractVideoUrlFromContent(content) {
      if (!content || typeof content !== "string")
        return null;
      const videoUrlRegexes = [
        // 小程序视频路径格式
        /cloud:\/\/[^"'\s<>]+\.(mp4|mov|m3u8)/gi,
        // 文件存储视频路径
        /cloud-file:\/\/[^"'\s<>]+\.(mp4|mov|m3u8)/gi,
        // 常见视频文件扩展名
        /https?:\/\/[^\s<>"']+\.(mp4|avi|mov|wmv|flv|mkv|webm|m3u8|3gp|rm|rmvb)/gi,
        // 特定视频平台
        /https?:\/\/v\.qq\.com\/[^\s<>"']+/gi,
        /https?:\/\/www\.youtube\.com\/watch\?v=[^\s<>"']+/gi,
        /https?:\/\/youtu\.be\/[^\s<>"']+/gi,
        /https?:\/\/vimeo\.com\/[^\s<>"']+/gi,
        /https?:\/\/www\.bilibili\.com\/video\/[^\s<>"']+/gi,
        /https?:\/\/www\.ixigua\.com\/[^\s<>"']+/gi,
        /https?:\/\/www\.kuaishou\.com\/[^\s<>"']+/gi,
        // 通用CDN和文件存储链接
        /https?:\/\/[^\s<>"']+\.bspapp\.com\/[^\s<>"']+/gi,
        /https?:\/\/[^\s<>"']+\.cdn[^\s<>"']*\/[^\s<>"']+/gi,
        // 微信视频
        /https?:\/\/mp\.weixin\.qq\.com\/[^\s<>"']*video[^\s<>"']+/gi,
        /https?:\/\/wxsnsdy\.wxs\.qq\.com\/[^\s<>"']+/gi,
        // 查找HTML视频标签
        /<video[^>]*src=["']([^"']+)["'][^>]*>/gi,
        /<video[^>]*>[\s\S]*?<source[^>]*src=["']([^"']+)["'][^>]*>/gi
      ];
      const htmlMatchRegexes = [
        /<video[^>]*src=["']([^"']+)["'][^>]*>/i,
        /<video[^>]*>[\s\S]*?<source[^>]*src=["']([^"']+)["'][^>]*>/i
      ];
      for (let regex of htmlMatchRegexes) {
        const match = content.match(regex);
        if (match && match[1]) {
          const url = match[1];
          if (this.isValidVideoUrl(url)) {
            return url;
          }
        }
      }
      for (let regex of videoUrlRegexes) {
        const matches = content.match(regex);
        if (matches && matches.length > 0) {
          for (const url of matches) {
            if (this.isValidVideoUrl(url)) {
              return url;
            }
          }
        }
      }
      try {
        const jsonMatches = content.match(/"(https?:\/\/[^"]+\.(mp4|mov|m3u8))"/gi);
        if (jsonMatches && jsonMatches.length > 0) {
          for (let jsonMatch of jsonMatches) {
            const url = jsonMatch.replace(/^"|"$/g, "");
            if (this.isValidVideoUrl(url)) {
              return url;
            }
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:1343", "JSON解析错误:", e);
      }
      return null;
    },
    // 检查URL是否是有效的视频URL
    isValidVideoUrl(url) {
      if (!url || typeof url !== "string")
        return false;
      if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)($|\?)/i)) {
        return false;
      }
      const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm", ".m3u8", ".3gp", ".rm", ".rmvb"];
      const hasVideoExtension = videoExtensions.some((ext) => url.toLowerCase().includes(ext));
      const videoDomains = [
        "youku",
        "youtube",
        "vimeo",
        "bilibili",
        "qq.com/video",
        "weixin.qq",
        "douyin",
        "bspapp.com",
        "ixigua.com",
        "kuaishou.com",
        "cdn",
        "mp4",
        ".video."
      ];
      const hasVideoDomain = videoDomains.some((domain) => url.toLowerCase().includes(domain));
      const isCloudPath = url.startsWith("cloud://") && videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
      const isStreamingUrl = url.includes(".m3u8") || url.includes(".mpd");
      return hasVideoExtension || hasVideoDomain || isCloudPath || isStreamingUrl;
    },
    // 分享到朋友圈 - 显示全屏引导
    shareToTimeline() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1381", "点击分享到朋友圈按钮，显示全屏弹窗");
      this.showFullScreenPopup = true;
    },
    // 关闭全屏弹窗
    closeFullScreenPopup() {
      this.showFullScreenPopup = false;
    },
    // 跳转到发布页面
    goToPublish() {
      if (!this.userStore.userInfo.isLogin) {
        return utils_isLogin.testLogin();
      }
      common_vendor.index.showLoading({
        title: "正在跳转...",
        mask: true
      });
      setTimeout(() => {
        common_vendor.index.navigateTo({
          url: "/pages/fabu/fabu",
          success: () => {
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1409", "跳转到发布页面成功");
            common_vendor.index.hideLoading();
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:1413", "发布页面跳转失败:", err);
            common_vendor.index.hideLoading();
            common_vendor.index.redirectTo({
              url: "/pages/fabu/fabu",
              success: () => {
                common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1420", "使用redirectTo跳转成功");
              },
              fail: (redirectErr) => {
                common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:1423", "redirectTo也失败了:", redirectErr);
                common_vendor.index.reLaunch({
                  url: "/pages/fabu/fabu",
                  fail: (relaunchErr) => {
                    common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:1429", "所有导航方法都失败了:", relaunchErr);
                    common_vendor.index.showToast({
                      title: "页面跳转失败，请重试",
                      icon: "none",
                      duration: 2e3
                    });
                  }
                });
              }
            });
          }
        });
      }, 100);
    },
    // 处理图片URL，确保可以正确加载
    processImageUrl(url) {
      if (!url)
        return utils_domainConfig.getDefaultImage("default");
      if (url.startsWith("/static/") || url.startsWith("wxfile://") || url.startsWith("http://tmp/")) {
        return url;
      }
      try {
        return utils_domainConfig.fixImageUrl(url);
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:1459", "处理图片URL出错:", e);
        return utils_domainConfig.getDefaultImage("default");
      }
    },
    // 从文章列表中提取最新的图片
    extractLatestArticleImages() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1466", "提取最新文章图片");
      if (!this.userArticleData || this.userArticleData.length === 0) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1470", "没有文章数据，无法提取图片");
        this.latestArticleImages = [];
        return [];
      }
      const sortedArticleIndices = this.userArticleData.map((article, index) => ({ index, time: article.create_time || article.createTime || article.time || 0 })).sort((a, b) => {
        if (typeof a.time === "string" && typeof b.time === "string") {
          return new Date(b.time) - new Date(a.time);
        } else if (typeof a.time === "number" && typeof b.time === "number") {
          return b.time - a.time;
        } else {
          return a.index - b.index;
        }
      }).map((item) => item.index);
      const allImages = [];
      for (let i = 0; i < sortedArticleIndices.length && allImages.length < 5; i++) {
        const articleIndex = sortedArticleIndices[i];
        const article = this.userArticleData[articleIndex];
        const articleImages = this.getArticleImages(article);
        if (articleImages && articleImages.length > 0) {
          for (let img of articleImages) {
            if (!allImages.includes(img) && allImages.length < 5) {
              allImages.push(img);
            }
          }
        }
      }
      this.latestArticleImages = allImages;
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1513", "提取到的最新文章图片:", this.latestArticleImages);
      return this.latestArticleImages;
    },
    // 检查文章是否含有视频
    checkArticleHasVideo(article) {
      if (!article)
        return false;
      if (article.videoURL && typeof article.videoURL === "string" && this.isValidVideoUrl(article.videoURL)) {
        return true;
      }
      const possibleVideoFields = [
        "videoUrl",
        "video_url",
        "video",
        "videoSrc",
        "video_src",
        "url"
      ];
      for (let field of possibleVideoFields) {
        if (article[field] && typeof article[field] === "string" && this.isValidVideoUrl(article[field])) {
          return true;
        }
      }
      const possibleVideoArrayFields = [
        "videos",
        "videoArr",
        "video_arr",
        "videoList",
        "video_list"
      ];
      for (let field of possibleVideoArrayFields) {
        if (article[field] && Array.isArray(article[field]) && article[field].length > 0) {
          const videoItem = article[field][0];
          if (typeof videoItem === "string" && this.isValidVideoUrl(videoItem)) {
            return true;
          } else if (typeof videoItem === "object") {
            const possibleUrlProps = ["url", "src", "source", "path", "videoUrl"];
            for (let prop of possibleUrlProps) {
              if (videoItem[prop] && typeof videoItem[prop] === "string" && this.isValidVideoUrl(videoItem[prop])) {
                return true;
              }
            }
          }
        }
      }
      if (article.content) {
        const videoUrlMatch = this.extractVideoUrlFromContent(article.content);
        if (videoUrlMatch) {
          return true;
        }
      }
      return false;
    },
    // 播放特定文章的视频
    playArticleVideo(article) {
      if (!article)
        return;
      const videoUrl = this.extractVideoUrlFromArticle(article);
      if (videoUrl) {
        this.videoUrl = videoUrl;
        this.videoVisible = true;
        this.userClosedVideo = false;
        this.$nextTick(() => {
          this.initVideoContext();
        });
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1597", "正在播放文章视频:", videoUrl);
      } else {
        common_vendor.index.showToast({
          title: "无法提取视频链接",
          icon: "none"
        });
      }
    },
    // 页面加载时搜索所有文章的视频
    async searchAllVideosOnLoad() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1608", "正在搜索所有文章的视频...");
      let allFoundVideos = [];
      if (this.userArticleData && this.userArticleData.length > 0) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1615", `从${this.userArticleData.length}篇已加载文章中搜索视频...`);
        for (let article of this.userArticleData) {
          const videoUrl = this.extractVideoUrlFromArticle(article);
          if (videoUrl && this.isValidVideoUrl(videoUrl)) {
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1621", `在文章(${article._id || "未知ID"})中找到视频: ${videoUrl}`);
            if (!allFoundVideos.includes(videoUrl)) {
              allFoundVideos.push(videoUrl);
            }
          }
        }
      }
      const totalArticles = this.totalArticleCount || 0;
      const loadedArticles = this.userArticleData ? this.userArticleData.length : 0;
      if (allFoundVideos.length > 0 || loadedArticles >= totalArticles) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1635", `已找到${allFoundVideos.length}个视频，不需要加载更多文章`);
      } else if (totalArticles > loadedArticles && this.hasMore) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1638", `已加载${loadedArticles}篇文章，共有${totalArticles}篇，尝试加载更多来搜索视频...`);
        try {
          const originalPageNo = this.pageNo;
          const maxPagesToLoad = 3;
          for (let i = 0; i < maxPagesToLoad && this.hasMore && allFoundVideos.length === 0; i++) {
            this.pageNo++;
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1648", `加载第${this.pageNo}页文章来搜索视频...`);
            await this.getArticelList(false);
            if (this.userArticleData && this.userArticleData.length > loadedArticles) {
              const newArticles = this.userArticleData.slice(loadedArticles);
              common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1657", `从新加载的${newArticles.length}篇文章中搜索视频...`);
              for (let article of newArticles) {
                const videoUrl = this.extractVideoUrlFromArticle(article);
                if (videoUrl && this.isValidVideoUrl(videoUrl)) {
                  common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1662", `在新加载文章(${article._id || "未知ID"})中找到视频: ${videoUrl}`);
                  if (!allFoundVideos.includes(videoUrl)) {
                    allFoundVideos.push(videoUrl);
                  }
                  if (allFoundVideos.length >= 5) {
                    break;
                  }
                }
              }
            }
          }
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:1676", "加载更多文章搜索视频时出错:", err);
        }
      }
      if (allFoundVideos.length > 0) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1682", `共找到${allFoundVideos.length}个视频链接:`, allFoundVideos);
        this.videoUrlCache = allFoundVideos;
        if (!this.userClosedVideo) {
          this.videoUrl = allFoundVideos[0];
          this.videoVisible = true;
          this.$nextTick(() => {
            this.initVideoContext();
          });
        }
        common_vendor.index.$emit("videosFound", {
          count: allFoundVideos.length,
          videos: allFoundVideos
        });
        return allFoundVideos;
      } else {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1706", "未找到任何视频链接");
        return [];
      }
    }
  },
  // 分享给朋友
  onShareAppMessage() {
    return this.getShareInfo();
  },
  // 分享到朋友圈
  onShareTimeline() {
    const shareInfo = this.getTimelineShareInfo();
    return shareInfo;
  }
};
if (!Array) {
  const _easycom_user_header2 = common_vendor.resolveComponent("user-header");
  const _easycom_articleItem2 = common_vendor.resolveComponent("articleItem");
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  (_easycom_user_header2 + _easycom_articleItem2 + _easycom_uni_load_more2)();
}
const _easycom_user_header = () => "../../components/user-header/user-header.js";
const _easycom_articleItem = () => "../../components/articleItem/articleItem.js";
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
if (!Math) {
  (_easycom_user_header + _easycom_articleItem + _easycom_uni_load_more)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o($options.handleContact),
    b: common_vendor.o($options.goToPublish),
    c: common_vendor.p({
      articleTotal: $options.articleTotal,
      userInfo: $data.userArticleInfo
    }),
    d: $data.videoUrl && $data.videoUrl.length > 0
  }, $data.videoUrl && $data.videoUrl.length > 0 ? {
    e: $data.videoUrl,
    f: common_vendor.o((...args) => $options.onVideoPlay && $options.onVideoPlay(...args)),
    g: common_vendor.o((...args) => $options.onVideoPause && $options.onVideoPause(...args)),
    h: common_vendor.o((...args) => $options.onVideoEnded && $options.onVideoEnded(...args)),
    i: common_vendor.o((...args) => $options.onVideoError && $options.onVideoError(...args)),
    j: common_vendor.o((...args) => $options.handleFullscreenChange && $options.handleFullscreenChange(...args)),
    k: common_vendor.o((...args) => $options.hideVideo && $options.hideVideo(...args))
  } : {}, {
    l: $data.userArticleData && $data.userArticleData.length > 0
  }, $data.userArticleData && $data.userArticleData.length > 0 ? {
    m: common_vendor.f($data.userArticleData, (item, k0, i0) => {
      return common_vendor.e({
        a: item.hasVideo
      }, item.hasVideo ? {
        b: common_vendor.o(($event) => $options.playArticleVideo(item), item._id)
      } : {}, {
        c: common_vendor.o((url, urls) => $options.previewImage(urls, url), item._id),
        d: common_vendor.o($options.handleContact, item._id),
        e: common_vendor.o($options.handleDelete, item._id),
        f: item._id,
        g: "72340410-1-" + i0,
        h: common_vendor.p({
          item,
          avatarClickEnabled: $data.avatarClickEnabled
        })
      });
    })
  } : {}, {
    n: common_vendor.p({
      color: "#d6d6d6",
      status: $data.status,
      ["content-text"]: $data.loadMoreText
    }),
    o: common_vendor.o((...args) => $options.scrolltolower && $options.scrolltolower(...args)),
    p: $data.isRefreshing,
    q: common_vendor.o((...args) => $options.onRefresh && $options.onRefresh(...args)),
    r: common_vendor.o((...args) => $options.shareToTimeline && $options.shareToTimeline(...args)),
    s: $data.showFullScreenPopup
  }, $data.showFullScreenPopup ? {
    t: common_vendor.o((...args) => $options.closeFullScreenPopup && $options.closeFullScreenPopup(...args)),
    v: $data.dynamicShareImage || $data.defaultShareImage,
    w: common_vendor.o((...args) => $options.closeFullScreenPopup && $options.closeFullScreenPopup(...args)),
    x: common_vendor.o(() => {
    }),
    y: common_vendor.o((...args) => $options.closeFullScreenPopup && $options.closeFullScreenPopup(...args))
  } : {}, {
    z: common_vendor.gei(_ctx, "")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-72340410"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/userArticleList/userArticleList.js.map
