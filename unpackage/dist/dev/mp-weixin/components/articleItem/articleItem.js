"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const utils_domainConfig = require("../../utils/domainConfig.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "articleItem",
  props: {
    item: {
      type: Object,
      require: true,
      default: () => ({
        user_info: {
          nickName: "未知用户",
          avatarUrl: "/static/images/default-avatar.png",
          mobile: "未填写"
        }
      })
    },
    // 是否显示评论区
    showComments: {
      type: Boolean,
      default: false
    },
    // 是否启用头像点击功能
    avatarClickEnabled: {
      type: Boolean,
      default: true
    }
  },
  emits: [
    "delete",
    "contact",
    "comment",
    "like",
    "preview",
    "userList",
    "update:comments"
  ],
  setup(__props, { emit: __emit }) {
    const userStore = store_user.useUserInfoStore();
    const props = __props;
    const formatDate = (timestamp) => {
      if (!timestamp)
        return "未知时间";
      const now = Date.now();
      const diff = now - timestamp;
      const seconds = Math.floor(diff / 1e3);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      if (seconds < 60) {
        return "刚刚";
      } else if (minutes < 60) {
        return `${minutes}分钟前`;
      } else if (hours < 24) {
        return `${hours}小时前`;
      } else if (days < 180) {
        return `${days}天前`;
      } else {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const formattedMonth = month < 10 ? `0${month}` : month;
        const formattedDay = day < 10 ? `0${day}` : day;
        const formattedHour = hour < 10 ? `0${hour}` : hour;
        const formattedMinute = minute < 10 ? `0${minute}` : minute;
        const timeStr = `${formattedHour}:${formattedMinute}`;
        const nowYear = (/* @__PURE__ */ new Date()).getFullYear();
        if (year === nowYear) {
          return `${formattedMonth}月${formattedDay}日 ${timeStr}`;
        }
        return `${year}年${formattedMonth}月${formattedDay}日 ${timeStr}`;
      }
    };
    const emit = __emit;
    const handleUserList = (user_id) => {
      if (!props.avatarClickEnabled) {
        common_vendor.index.__f__("log", "at components/articleItem/articleItem.vue:113", "头像点击功能已禁用");
        common_vendor.index.showToast({
          title: "此功能开发中",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      emit("userList", user_id);
    };
    const handleDelete = (id) => {
      emit("delete", id);
    };
    const handleContact = (mobile) => {
      emit("contact", mobile);
    };
    const goToDetail = (item) => {
      if (!props.showComments) {
        common_vendor.index.navigateTo({
          url: `/pages/article/articleDetail?article_id=${item._id}&user_id=${item.user_id}`,
          animationType: "slide-in-right",
          // 添加滑入动画
          animationDuration: 300
          // 设置动画持续时间为300ms
        });
      }
    };
    const userInfo = common_vendor.computed(() => {
      return props.item || {
        nickName: "未知用户",
        avatarUrl: utils_domainConfig.getDefaultImage("avatar"),
        mobile: "未填写"
      };
    });
    const userAvatarUrl = common_vendor.computed(() => {
      const avatarUrl = userInfo.value.user_avatarUrl || userInfo.value.avatarUrl;
      if (!avatarUrl || avatarUrl === utils_domainConfig.getDefaultImage("avatar")) {
        return utils_domainConfig.getDefaultImage("avatar");
      }
      return utils_domainConfig.fixImageUrl(avatarUrl);
    });
    const processedImages = common_vendor.computed(() => {
      if (!props.item.images || !props.item.images.length) {
        return [];
      }
      return props.item.images.map((img) => {
        const originalUrl = img.compressedURL || img.thumbnailURL || img.url;
        if (!originalUrl) {
          return {
            ...img,
            processedUrl: utils_domainConfig.getDefaultImage("default")
          };
        }
        return {
          ...img,
          processedUrl: utils_domainConfig.fixImageUrl(originalUrl)
        };
      });
    });
    const onAvatarError = (e) => {
      e.target.src = utils_domainConfig.getDefaultImage("avatar");
    };
    const handleLongPressPreview = (url, index) => {
      if (!url)
        return;
      common_vendor.index.__f__("log", "at components/articleItem/articleItem.vue:261", "Original URL:", url);
      const validImages = processedImages.value.filter((img) => img.processedUrl);
      const limitedImages = validImages.slice(0, 9);
      if (limitedImages.length) {
        const urls = limitedImages.map((img) => img.processedUrl);
        emit("preview", urls[index], urls);
      }
    };
    return (_ctx, _cache) => {
      var _a, _b, _c, _d;
      return common_vendor.e({
        a: userAvatarUrl.value,
        b: common_vendor.o(onAvatarError),
        c: common_vendor.t(userInfo.value.user_nickName),
        d: common_vendor.p({
          ["custom-prefix"]: "icon",
          type: "lishuai-dingwei",
          size: "12",
          color: "#8a8a8a"
        }),
        e: common_vendor.t(__props.item.district || "未知位置"),
        f: common_vendor.t(formatDate(__props.item.create_time)),
        g: common_vendor.o(($event) => handleUserList(__props.item.user_id)),
        h: !__props.avatarClickEnabled ? 1 : "",
        i: __props.item.user_id === common_vendor.unref(userStore).userInfo.uid
      }, __props.item.user_id === common_vendor.unref(userStore).userInfo.uid ? {
        j: common_vendor.p({
          color: "#999999",
          ["custom-prefix"]: "icon",
          type: "lishuai-shanchu",
          size: "18"
        }),
        k: common_vendor.o(($event) => handleDelete(__props.item._id))
      } : {
        l: common_vendor.p({
          color: "#5cb85c",
          ["custom-prefix"]: "icon",
          type: "lishuai-dianhua",
          size: "18"
        }),
        m: common_vendor.o(($event) => handleContact(__props.item.user_mobile))
      }, {
        n: common_vendor.t(__props.item.content),
        o: common_vendor.o(($event) => goToDetail(__props.item)),
        p: (_a = processedImages.value) == null ? void 0 : _a.length
      }, ((_b = processedImages.value) == null ? void 0 : _b.length) ? common_vendor.e({
        q: processedImages.value.length === 1
      }, processedImages.value.length === 1 ? {
        r: processedImages.value[0].processedUrl,
        s: common_vendor.o(($event) => goToDetail(__props.item)),
        t: common_vendor.o(() => handleLongPressPreview(processedImages.value[0].processedUrl, 0))
      } : {
        v: common_vendor.f(processedImages.value.slice(0, 9), (img, index, i0) => {
          return {
            a: index,
            b: img.processedUrl,
            c: common_vendor.o(($event) => goToDetail(__props.item), index),
            d: common_vendor.o(() => handleLongPressPreview(img.processedUrl, index), index)
          };
        }),
        w: common_vendor.n(`grid-${Math.min(processedImages.value.length, 9)}`)
      }) : {}, {
        x: __props.item.videoURL || ((_c = __props.item.video) == null ? void 0 : _c.videoURL)
      }, __props.item.videoURL || ((_d = __props.item.video) == null ? void 0 : _d.videoURL) ? {
        y: common_vendor.p({
          ["custom-prefix"]: "icon",
          type: "lishuai-shipin",
          size: "14",
          color: "#999999"
        })
      } : {}, {
        z: common_vendor.t(__props.item.look_count || 0),
        A: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-caed195d"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/articleItem/articleItem.js.map
