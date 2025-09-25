"use strict";
const common_vendor = require("../common/vendor.js");
const useAuthSwitchStore = common_vendor.defineStore("auth", () => {
  const authSwitch = common_vendor.ref(false);
  try {
    const savedState = common_vendor.index.getStorageSync("auth-state");
    if (savedState !== "") {
      authSwitch.value = JSON.parse(savedState);
      common_vendor.index.__f__("log", "at store/authSwitch.js:12", "从存储加载权限状态:", authSwitch.value);
    }
  } catch (e) {
    common_vendor.index.__f__("error", "at store/authSwitch.js:15", "加载权限状态失败:", e);
  }
  common_vendor.watch(authSwitch, (newValue) => {
    try {
      common_vendor.index.setStorageSync("auth-state", JSON.stringify(newValue));
      common_vendor.index.__f__("log", "at store/authSwitch.js:22", "权限状态已保存到存储:", newValue);
    } catch (e) {
      common_vendor.index.__f__("error", "at store/authSwitch.js:24", "保存权限状态失败:", e);
    }
  });
  const setAuthValue = (v) => {
    authSwitch.value = v;
  };
  const setAuth = () => {
    authSwitch.value = !authSwitch.value;
  };
  return {
    authSwitch,
    setAuthValue,
    setAuth
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
exports.useAuthSwitchStore = useAuthSwitchStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/authSwitch.js.map
