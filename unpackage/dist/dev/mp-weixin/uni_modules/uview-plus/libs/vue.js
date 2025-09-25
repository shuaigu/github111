"use strict";
const common_vendor = require("../../../common/vendor.js");
function defineMixin(options) {
  if (options && typeof options === "object") {
    return options;
  }
  if (!options) {
    common_vendor.index.__f__("warn", "at uni_modules/uview-plus/libs/vue.js:15", "defineMixin received invalid options");
    return {};
  }
  try {
    return Object(options);
  } catch (e) {
    common_vendor.index.__f__("error", "at uni_modules/uview-plus/libs/vue.js:23", "defineMixin error:", e);
    return {};
  }
}
exports.defineMixin = defineMixin;
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/uni_modules/uview-plus/libs/vue.js.map
