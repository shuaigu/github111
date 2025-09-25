"use strict";
const formatTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 6e4) {
    return "刚刚";
  }
  if (diff < 36e5) {
    return Math.floor(diff / 6e4) + "分钟前";
  }
  if (diff < 864e5) {
    return Math.floor(diff / 36e5) + "小时前";
  }
  if (diff < 2592e6) {
    return Math.floor(diff / 864e5) + "天前";
  }
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};
exports.formatTime = formatTime;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/formatTime.js.map
