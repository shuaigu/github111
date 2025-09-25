"use strict";
const common_vendor = require("../common/vendor.js");
const useUserInfoStore = common_vendor.defineStore("userInfo", () => {
  const defaultUserInfo = {
    uid: "",
    //本地平台ID
    nickName: "",
    //昵称
    avatarUrl: "/static/images/defalut.png",
    //头像地址
    mobile: "未填写",
    //手机号码
    isLogin: false,
    //登录状态
    role: []
    //默认角色
  };
  const userInfo = common_vendor.ref({
    ...defaultUserInfo
  });
  const setUserInfo = (obj = {}) => {
    userInfo.value = obj;
    if (obj && obj.uid) {
      userInfo.value.isLogin = true;
    } else {
      userInfo.value.isLogin = false;
    }
    common_vendor.index.setStorageSync("userInfo", userInfo.value);
  };
  const cleanUserInfo = () => {
    userInfo.value = {
      ...defaultUserInfo
      // 恢复默认值
    };
    likeRecords.value = [];
  };
  const updateUserAvatar = (avatarUrl) => {
    userInfo.value.avatarUrl = avatarUrl;
    common_vendor.index.setStorageSync("userInfo", userInfo.value);
  };
  const updateUserNickName = (nickName) => {
    userInfo.value.nickName = nickName;
    common_vendor.index.setStorageSync("userInfo", userInfo.value);
  };
  const likeRecords = common_vendor.ref([]);
  const setLikeRecords = (records) => {
    likeRecords.value = records;
  };
  const isLiked = (article_id) => {
    return likeRecords.value.some((record) => record.article_id === article_id);
  };
  return {
    userInfo,
    setUserInfo,
    cleanUserInfo,
    updateUserAvatar,
    updateUserNickName,
    likeRecords,
    setLikeRecords,
    isLiked
  };
}, {
  persist: {
    // 使用 uni storage 代替 localStorage
    storage: {
      getItem(key) {
        return common_vendor.index.getStorageSync(key);
      },
      setItem(key, value) {
        common_vendor.index.setStorageSync(key, value);
      }
    }
  }
});
exports.useUserInfoStore = useUserInfoStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/user.js.map
