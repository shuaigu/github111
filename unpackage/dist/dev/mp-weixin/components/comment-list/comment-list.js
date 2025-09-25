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
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "comment-list",
  props: {
    comments: {
      type: Array,
      default: () => []
    },
    articleId: {
      type: String,
      default: ""
    },
    articleUserId: {
      type: String,
      default: ""
    },
    showMobile: {
      type: Boolean,
      default: false
    }
  },
  emits: ["update:comments", "reply", "delComment"],
  setup(__props, { emit: __emit }) {
    const userInfoStore = store_user.useUserInfoStore();
    const props = __props;
    const emit = __emit;
    const isOwnComment = (comment) => {
      return comment.user_id === userInfoStore.userInfo.uid;
    };
    const handleCommentClick = (comment) => {
      common_vendor.index.__f__("log", "at components/comment-list/comment-list.vue:36", comment);
      if (isOwnComment(comment))
        return;
      emit("reply", comment);
    };
    const handleDeleteComment = (commentId) => {
      emit("delComment", commentId);
    };
    const isPostAuthor = () => {
      if (!userInfoStore.userInfo || !userInfoStore.userInfo.uid) {
        return false;
      }
      if (!props.articleUserId) {
        return false;
      }
      return userInfoStore.userInfo.uid === props.articleUserId;
    };
    const handleCallPhone = (mobile) => {
      if (!isPostAuthor()) {
        return;
      }
      common_vendor.index.showModal({
        title: "拨打电话",
        content: `确定要拨打 ${mobile} 吗？`,
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.makePhoneCall({
              phoneNumber: mobile,
              fail: (err) => {
                common_vendor.index.showToast({
                  title: "拨打电话失败",
                  icon: "none"
                });
              }
            });
          }
        }
      });
    };
    const formatMobile = (mobile) => {
      if (!mobile || mobile.length < 7)
        return mobile;
      if (mobile.length === 11) {
        return mobile.substring(0, 3) + "****" + mobile.substring(7);
      }
      const start = Math.floor(mobile.length / 3);
      const end = mobile.length - start;
      return mobile.substring(0, start) + "****" + mobile.substring(end);
    };
    const previewCommentImage = (imageUrl) => {
      if (!imageUrl)
        return;
      common_vendor.index.previewImage({
        current: imageUrl,
        urls: [imageUrl],
        indicator: "number",
        loop: true,
        fail: (err) => {
          common_vendor.index.__f__("error", "at components/comment-list/comment-list.vue:117", "预览图片失败:", err);
          common_vendor.index.showToast({
            title: "预览图片失败",
            icon: "none"
          });
        }
      });
    };
    const previewCommentImages = (images, currentIndex) => {
      if (!images || images.length === 0)
        return;
      common_vendor.index.previewImage({
        current: images[currentIndex],
        urls: images,
        indicator: "number",
        loop: true,
        fail: (err) => {
          common_vendor.index.__f__("error", "at components/comment-list/comment-list.vue:136", "预览图片失败:", err);
          common_vendor.index.showToast({
            title: "预览图片失败",
            icon: "none"
          });
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({}, {
        d: common_vendor.f(__props.comments, (comment, index, i0) => {
          return common_vendor.e({
            a: comment.avatarUrl,
            b: common_vendor.t(comment.nickName),
            c: __props.showMobile && comment.mobile && isPostAuthor()
          }, __props.showMobile && comment.mobile && isPostAuthor() ? {
            d: "ea2f609f-0-" + i0,
            e: common_vendor.p({
              type: "phone",
              size: "11",
              color: "#399bfe"
            }),
            f: common_vendor.t(formatMobile(comment.mobile)),
            g: common_vendor.o(($event) => handleCallPhone(comment.mobile), index)
          } : {}, {
            h: isOwnComment(comment)
          }, isOwnComment(comment) ? {
            i: "ea2f609f-1-" + i0,
            j: common_vendor.p({
              ["custom-prefix"]: "iconfont",
              type: "icon-shanchu1",
              size: "16",
              color: "#999"
            }),
            k: common_vendor.o(($event) => handleDeleteComment(comment._id), index)
          } : {}, {
            l: comment.reply_to
          }, comment.reply_to ? {
            m: common_vendor.t(comment.reply_to.nickName)
          } : {}, {
            n: comment.content
          }, comment.content ? {
            o: common_vendor.t(comment.content)
          } : {}, {
            p: comment.imageUrl && (!comment.images || comment.images.length === 0)
          }, comment.imageUrl && (!comment.images || comment.images.length === 0) ? {
            q: comment.imageUrl,
            r: common_vendor.o(($event) => previewCommentImage(comment.imageUrl), index)
          } : {}, {
            s: comment.images && comment.images.length > 0
          }, comment.images && comment.images.length > 0 ? {
            t: common_vendor.f(comment.images, (img, imgIndex, i1) => {
              return {
                a: img,
                b: imgIndex,
                c: common_vendor.o(($event) => previewCommentImages(comment.images, imgIndex), imgIndex)
              };
            })
          } : {}, {
            v: common_vendor.t(common_vendor.unref(utils_formatTime.formatTime)(comment.create_time)),
            w: common_vendor.o(($event) => handleCommentClick(comment), index),
            x: isOwnComment(comment) ? 1 : "",
            y: index
          });
        }),
        e: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ea2f609f"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/comment-list/comment-list.js.map
