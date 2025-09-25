"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const utils_isLogin = require("../../utils/isLogin.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "qiniuyun",
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    const qiniuCloud = common_vendor.tr.importObject("qiniuyunCloud", { customUI: true });
    common_vendor.tr.importObject("ext-storage-co", { customUI: true });
    const articleApi = common_vendor.tr.importObject("articleWx", { customUI: true });
    common_vendor.ref([]);
    const imageList = common_vendor.ref([]);
    const videoData = common_vendor.ref(null);
    const isUploading = common_vendor.ref(false);
    const totalProgress = common_vendor.ref(0);
    common_vendor.ref([]);
    const mediaType = common_vendor.ref("image");
    const content = common_vendor.ref("");
    const locationInfo = common_vendor.ref(null);
    const categoryList = common_vendor.ref([]);
    const cateIndex = common_vendor.ref(0);
    const selectedCategory = common_vendor.ref(null);
    const isPublishing = common_vendor.ref(false);
    const publishedArticleId = common_vendor.ref(null);
    const hasVideo = common_vendor.computed(() => videoData.value !== null);
    const getLocaAndCate = async () => {
      try {
        common_vendor.index.showLoading({ title: "加载中..." });
        const locationRes = await common_vendor.index.getLocation({
          type: "gcj02"
        }).catch((err) => {
          common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:221", "获取位置失败:", err);
          return { longitude: 0, latitude: 0 };
        });
        const res = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`);
        common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:227", "获取位置和分类:", res);
        if (res) {
          locationInfo.value = {
            address: res.address || "未知位置",
            district: res.district || ""
          };
          if (res.cateList && res.cateList.length > 0) {
            categoryList.value = res.cateList.map((category) => ({
              ...category,
              cate_img: formatCategoryImageUrl(category.cate_img)
            }));
            selectedCategory.value = null;
            cateIndex.value = -1;
          } else {
            await getCategoriesFromLocal();
          }
        } else {
          await getCategoriesFromLocal();
        }
        common_vendor.index.hideLoading();
      } catch (e) {
        common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:258", "获取位置和分类失败:", e);
        common_vendor.index.hideLoading();
        await getCategoriesFromLocal();
        common_vendor.index.showToast({
          title: "获取信息失败",
          icon: "none"
        });
      }
    };
    const getCategoriesFromLocal = async () => {
      try {
        const storage = common_vendor.index.getStorageSync("categoryList");
        if (storage) {
          categoryList.value = JSON.parse(storage).map((category) => ({
            ...category,
            cate_img: formatCategoryImageUrl(category.cate_img)
          }));
          common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:281", "从本地存储获取分类成功:", categoryList.value);
        } else {
          const result = await articleApi.getCategories();
          if (result && result.length > 0) {
            categoryList.value = result.map((category) => ({
              ...category,
              cate_img: formatCategoryImageUrl(category.cate_img)
            }));
            common_vendor.index.setStorageSync("categoryList", JSON.stringify(result));
            common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:293", "从数据库获取分类成功:", categoryList.value);
          } else {
            categoryList.value = getDefaultCategories();
            common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:297", "使用默认分类:", categoryList.value);
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:301", "获取本地分类失败:", error);
        categoryList.value = getDefaultCategories();
      }
    };
    const getDefaultCategories = () => {
      return [
        {
          _id: "default_1",
          cate_name: "默认分类1",
          cate_img: "/static/category/default1.png"
        },
        {
          _id: "default_2",
          cate_name: "默认分类2",
          cate_img: "/static/category/default2.png"
        },
        {
          _id: "default_3",
          cate_name: "默认分类3",
          cate_img: "/static/category/default3.png"
        },
        {
          _id: "default_4",
          cate_name: "默认分类4",
          cate_img: "/static/category/default4.png"
        }
      ];
    };
    const formatCategoryImageUrl = (url) => {
      if (!url)
        return "/static/category/default.png";
      if (url.startsWith("http"))
        return url;
      if (url.startsWith("/")) {
        return url;
      }
      if (!url.includes("://")) {
        return `https://your-qiniu-domain.com/${url}`;
      }
      return url;
    };
    const handleCategoryImageError = (index) => {
      common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:358", `分类图片加载错误，索引: ${index}`, categoryList.value[index]);
      if (categoryList.value[index]) {
        categoryList.value[index].cate_img = "/static/category/default.png";
      }
    };
    const selectCategory = (index) => {
      common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:368", "选择分类:", categoryList.value[index]);
      cateIndex.value = index;
      selectedCategory.value = categoryList.value[index]._id;
    };
    const checkUserLogin = () => {
      common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:375", "检查用户登录状态:", userStore.userInfo);
      if (!userStore.userInfo || !userStore.userInfo.uid) {
        common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:378", "用户未登录，调用登录函数");
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        utils_isLogin.testLogin();
        return false;
      }
      return true;
    };
    common_vendor.onMounted(() => {
      common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:391", "发布页面已加载");
      getLocaAndCate();
      const pages = getCurrentPages();
      const page = pages[pages.length - 1];
      if (page && page.$getAppWebview) {
        const currentWebview = page.$getAppWebview();
        currentWebview.setStyle({
          popGesture: "none"
          // 禁用侧滑返回
        });
      }
    });
    common_vendor.onBeforeUnmount(() => {
      common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:407", "发布页面即将卸载");
      const hasUploadingMedia = imageList.value.some((item) => item.uploadStatus === "uploading") || videoData.value && videoData.value.uploadStatus === "uploading";
      if (hasUploadingMedia && !isPublishing.value) {
        common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:413", "有正在上传的媒体文件，但用户选择离开页面");
      }
      if (publishedArticleId.value && !isPublishing.value) {
        common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:418", "页面卸载前再次触发刷新事件");
        common_vendor.index.$emit("refreshIndexOnce", publishedArticleId.value);
      }
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:425", "发布页面已完全卸载");
    });
    const chooseImage = async () => {
      try {
        if (!checkUserLogin())
          return;
        if (imageList.value.length >= 9) {
          common_vendor.index.showToast({
            title: "最多只能上传9张图片",
            icon: "none"
          });
          return;
        }
        common_vendor.index.showActionSheet({
          itemList: ["从相册选择", "拍照"],
          success: async (res) => {
            let sourceType = [];
            switch (res.tapIndex) {
              case 0:
                sourceType = ["album"];
                break;
              case 1:
                sourceType = ["camera"];
                break;
            }
            const chooseRes = await common_vendor.index.chooseImage({
              count: 9 - imageList.value.length,
              sizeType: ["original", "compressed"],
              // 同时使用原图和压缩图
              sourceType
            });
            common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:466", "选择图片结果:", chooseRes);
            const tempFiles = chooseRes.tempFilePaths.map((filePath) => {
              const processedPath = filePath.replace(/^kwfile:\/\//, "");
              return {
                type: "image",
                tempPath: processedPath,
                thumbnailURL: processedPath,
                progress: 0,
                uploadStatus: null
              };
            });
            const startIndex = imageList.value.length;
            imageList.value.push(...tempFiles);
            for (let i = 0; i < tempFiles.length; i++) {
              const index = startIndex + i;
              setTimeout(() => {
                uploadImageToQiniu(imageList.value[index], index).then((result) => {
                  common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:493", `图片${index}上传成功:`, result);
                  if (imageList.value[index]) {
                    imageList.value[index] = {
                      ...imageList.value[index],
                      ...result,
                      progress: 100,
                      uploadStatus: "success"
                    };
                  }
                }).catch((error) => {
                  common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:505", `图片${index}上传失败:`, error);
                  if (imageList.value[index]) {
                    imageList.value[index].uploadStatus = "error";
                  }
                  common_vendor.index.showToast({
                    title: `第${index + 1}张图片上传失败`,
                    icon: "none"
                  });
                });
              }, i * 200);
            }
          }
        });
      } catch (e) {
        if (e.errMsg !== "chooseImage:fail cancel") {
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "none"
          });
        }
      }
    };
    const formatImagePath = (path) => {
      if (!path)
        return "";
      let formattedPath = path.replace(/^kwfile:\/\//, "");
      if (formattedPath.startsWith("http")) {
        return formattedPath;
      }
      if (formattedPath.startsWith("tmp/")) {
        return formattedPath;
      }
      return formattedPath;
    };
    const handleImageError = (index) => {
      common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:560", `图片加载错误，索引: ${index}`, imageList.value[index]);
      if (imageList.value[index]) {
        imageList.value[index].loadError = true;
        common_vendor.index.showToast({
          title: "图片加载失败",
          icon: "none"
        });
      }
    };
    const chooseVideo = async () => {
      try {
        if (!checkUserLogin())
          return;
        if (hasVideo.value) {
          common_vendor.index.showToast({
            title: "只能选择一个视频",
            icon: "none"
          });
          return;
        }
        common_vendor.index.showActionSheet({
          itemList: ["从相册选择", "拍摄视频"],
          success: async (res) => {
            let sourceType = [];
            switch (res.tapIndex) {
              case 0:
                sourceType = ["album"];
                break;
              case 1:
                sourceType = ["camera"];
                break;
            }
            const chooseRes = await common_vendor.index.chooseVideo({
              sourceType,
              maxDuration: 60,
              // 限制视频最长60秒
              camera: "back"
            });
            common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:616", "选择视频结果:", chooseRes);
            const maxSize = 500 * 1024 * 1024;
            if (chooseRes.size > maxSize) {
              common_vendor.index.showToast({
                title: "视频过大，请选择小于500MB的视频",
                icon: "none"
              });
              return;
            }
            videoData.value = {
              type: "video",
              tempPath: chooseRes.tempFilePath,
              poster: chooseRes.thumbTempFilePath,
              thumbnailURL: chooseRes.thumbTempFilePath,
              duration: chooseRes.duration,
              size: chooseRes.size,
              width: chooseRes.width,
              height: chooseRes.height,
              format: "mp4",
              // 默认格式
              progress: 0,
              uploadStatus: "uploading"
            };
            common_vendor.index.showToast({
              title: "准备上传视频",
              icon: "loading",
              duration: 2e3
            });
            try {
              uploadVideoToQiniu(videoData.value).then((result) => {
                common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:654", "视频上传成功:", result);
                videoData.value = {
                  ...videoData.value,
                  ...result,
                  progress: 100,
                  uploadStatus: "success"
                };
                common_vendor.index.showToast({
                  title: "视频上传成功",
                  icon: "success",
                  duration: 2e3
                });
              }).catch((error) => {
                common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:672", "视频上传失败:", error);
                if (videoData.value) {
                  videoData.value.uploadStatus = "error";
                  common_vendor.index.showToast({
                    title: "视频上传失败，可继续编辑内容",
                    icon: "none",
                    duration: 2e3
                  });
                }
              });
              common_vendor.index.showToast({
                title: "视频上传中，您可继续编辑",
                icon: "none",
                duration: 2e3
              });
            } catch (error) {
              common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:694", "启动视频上传失败:", error);
              if (videoData.value) {
                videoData.value.uploadStatus = "error";
              }
              common_vendor.index.showToast({
                title: "启动视频上传失败",
                icon: "none",
                duration: 2e3
              });
            }
          }
        });
      } catch (e) {
        if (e.errMsg !== "chooseVideo:fail cancel") {
          common_vendor.index.showToast({
            title: "选择视频失败",
            icon: "none"
          });
        }
      }
    };
    const removeFile = (index) => {
      imageList.value.splice(index, 1);
    };
    const removeVideo = () => {
      videoData.value = null;
    };
    const uploadImageToQiniu = async (file, index) => {
      try {
        file.uploadStatus = "uploading";
        const fileExt = getFileExtension(file.tempPath);
        const uploadConfig = await qiniuCloud.generateUploadToken({
          type: "image",
          ext: fileExt
        });
        common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:745", "获取七牛云上传凭证成功:", uploadConfig);
        if (!uploadConfig || !uploadConfig.token) {
          throw new Error("获取上传凭证失败");
        }
        let uploadDomain = uploadConfig.uploadDomain;
        if (uploadDomain && !uploadDomain.startsWith("https://")) {
          uploadDomain = uploadDomain.replace("http://", "https://");
          common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:755", "已将上传域名转换为HTTPS:", uploadDomain);
        }
        return new Promise((resolve, reject) => {
          let retryCount = 0;
          const maxRetries = 3;
          const performUpload = () => {
            try {
              const uploadTask = common_vendor.index.uploadFile({
                url: uploadDomain,
                filePath: file.tempPath,
                name: "file",
                formData: {
                  token: uploadConfig.token,
                  key: uploadConfig.key
                },
                success: (uploadRes) => {
                  common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:775", "上传响应:", uploadRes);
                  if (uploadRes.statusCode === 200) {
                    try {
                      const data = JSON.parse(uploadRes.data);
                      const fileUrl = `${uploadConfig.domain}/${uploadConfig.key}`;
                      file.uploadStatus = "success";
                      file.fileURL = fileUrl;
                      file.progress = 100;
                      const thumbnailURL = `${fileUrl}?imageView2/1/w/200/h/200`;
                      const compressedURL = `${fileUrl}?imageView2/2/w/800`;
                      resolve({
                        type: "image",
                        url: fileUrl,
                        thumbnailURL,
                        compressedURL
                      });
                    } catch (e) {
                      common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:799", "解析上传响应失败:", e);
                      file.uploadStatus = "error";
                      reject(new Error("解析上传响应失败"));
                    }
                  } else {
                    common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:804", "上传失败状态码:", uploadRes.statusCode);
                    file.uploadStatus = "error";
                    reject(new Error(`上传失败: ${uploadRes.statusCode}`));
                  }
                },
                fail: (error) => {
                  common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:810", "上传失败:", error);
                  if (error.errMsg && error.errMsg.includes("url not in domain list")) {
                    common_vendor.index.showModal({
                      title: "上传域名未授权",
                      content: "请在微信小程序管理后台添加 " + uploadDomain + " 到合法域名列表",
                      showCancel: false
                    });
                    file.uploadStatus = "error";
                    reject(new Error(error.errMsg || "上传失败"));
                    return;
                  }
                  if (error.errMsg && error.errMsg.includes("exceed max upload connection count")) {
                    if (retryCount < maxRetries) {
                      retryCount++;
                      common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:828", `连接数超限，第${retryCount}次重试上传图片...`);
                      setTimeout(() => {
                        performUpload();
                      }, 1e3 * retryCount);
                      return;
                    }
                  }
                  file.uploadStatus = "error";
                  reject(new Error(error.errMsg || "上传失败"));
                }
              });
              uploadTask.onProgressUpdate((res) => {
                file.progress = res.progress;
                updateTotalProgress();
              });
            } catch (e) {
              common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:849", "创建上传任务失败:", e);
              file.uploadStatus = "error";
              reject(new Error("创建上传任务失败: " + e.message));
            }
          };
          performUpload();
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:859", "上传图片错误:", e);
        file.uploadStatus = "error";
        throw new Error(`上传失败：${e.message}`);
      }
    };
    const uploadVideoToQiniu = async (file) => {
      try {
        file.uploadStatus = "uploading";
        const fileExt = getFileExtension(file.tempPath);
        const uploadConfig = await qiniuCloud.generateUploadToken({
          type: "video",
          ext: fileExt
        });
        common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:880", "获取七牛云上传凭证成功:", uploadConfig);
        if (!uploadConfig || !uploadConfig.token) {
          throw new Error("获取上传凭证失败");
        }
        let uploadDomain = uploadConfig.uploadDomain;
        if (uploadDomain && !uploadDomain.startsWith("https://")) {
          uploadDomain = uploadDomain.replace("http://", "https://");
          common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:890", "已将上传域名转换为HTTPS:", uploadDomain);
        }
        const videoStyle = uploadConfig.videoStyle || "standard";
        const styleSeparator = uploadConfig.styleSeparator || "-";
        common_vendor.index.showToast({
          title: "开始上传视频",
          icon: "loading",
          duration: 2e3
        });
        return new Promise((resolve, reject) => {
          let lastUpdateTime = Date.now();
          let uploadSpeed = 0;
          let uploadedSize = 0;
          let estimatedTimeLeft = "计算中...";
          let lastToastTime = 0;
          const updateProgress = (progress, currentSize) => {
            const now = Date.now();
            const timeElapsed = (now - lastUpdateTime) / 1e3;
            if (timeElapsed > 1) {
              const sizeDiff = currentSize - uploadedSize;
              uploadSpeed = sizeDiff / timeElapsed;
              const remainingSize = file.size - currentSize;
              const remainingTime = uploadSpeed > 0 ? remainingSize / uploadSpeed : 0;
              if (remainingTime > 60) {
                estimatedTimeLeft = `约${Math.ceil(remainingTime / 60)}分钟`;
              } else {
                estimatedTimeLeft = `约${Math.ceil(remainingTime)}秒`;
              }
              let speedText = "";
              if (uploadSpeed > 1024 * 1024) {
                speedText = `${(uploadSpeed / (1024 * 1024)).toFixed(2)}MB/s`;
              } else if (uploadSpeed > 1024) {
                speedText = `${(uploadSpeed / 1024).toFixed(2)}KB/s`;
              } else {
                speedText = `${Math.floor(uploadSpeed)}B/s`;
              }
              if (now - lastToastTime > 3e3) {
                common_vendor.index.showToast({
                  title: `上传中: ${progress}%`,
                  icon: "none",
                  duration: 1500
                });
                lastToastTime = now;
              }
              lastUpdateTime = now;
              uploadedSize = currentSize;
            }
          };
          let retryCount = 0;
          const maxRetries = 3;
          const performUpload = () => {
            try {
              const uploadTask = common_vendor.index.uploadFile({
                url: uploadDomain,
                filePath: file.tempPath,
                name: "file",
                formData: {
                  token: uploadConfig.token,
                  key: uploadConfig.key
                },
                success: (uploadRes) => {
                  common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:973", "上传响应:", uploadRes);
                  if (uploadRes.statusCode === 200) {
                    try {
                      const data = JSON.parse(uploadRes.data);
                      const fileUrl = `${uploadConfig.domain}/${uploadConfig.key}`;
                      file.uploadStatus = "success";
                      file.videoURL = fileUrl;
                      file.progress = 100;
                      const thumbnailURL = `${fileUrl}?vframe/jpg/offset/1`;
                      const transcodedURL = videoStyle ? `${fileUrl}${styleSeparator}${videoStyle}` : fileUrl;
                      common_vendor.index.showToast({
                        title: "视频上传成功",
                        icon: "success",
                        duration: 2e3
                      });
                      resolve({
                        type: "video",
                        videoURL: fileUrl,
                        thumbnailURL,
                        playURL: transcodedURL,
                        // 使用单一转码方式
                        duration: data.duration ? parseInt(data.duration) : file.duration,
                        size: file.size,
                        width: file.width,
                        height: file.height,
                        format: file.format || "mp4"
                      });
                    } catch (e) {
                      common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:1010", "解析上传响应失败:", e);
                      file.uploadStatus = "error";
                      common_vendor.index.showToast({
                        title: "解析响应失败",
                        icon: "none",
                        duration: 2e3
                      });
                      reject(new Error("解析上传响应失败"));
                    }
                  } else {
                    common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:1022", "上传失败状态码:", uploadRes.statusCode);
                    file.uploadStatus = "error";
                    common_vendor.index.showToast({
                      title: `上传失败: ${uploadRes.statusCode}`,
                      icon: "none",
                      duration: 2e3
                    });
                    reject(new Error(`上传失败: ${uploadRes.statusCode}`));
                  }
                },
                fail: (error) => {
                  common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:1035", "上传失败:", error);
                  if (error.errMsg && error.errMsg.includes("url not in domain list")) {
                    common_vendor.index.showModal({
                      title: "上传域名未授权",
                      content: "请在微信小程序管理后台添加 " + uploadDomain + " 到合法域名列表",
                      showCancel: false
                    });
                    file.uploadStatus = "error";
                    reject(new Error(error.errMsg || "上传失败"));
                    return;
                  }
                  if (error.errMsg && error.errMsg.includes("exceed max upload connection count")) {
                    if (retryCount < maxRetries) {
                      retryCount++;
                      common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:1053", `连接数超限，第${retryCount}次重试上传视频...`);
                      common_vendor.index.showToast({
                        title: `连接数超限，正在重试(${retryCount}/${maxRetries})`,
                        icon: "none",
                        duration: 2e3
                      });
                      setTimeout(() => {
                        performUpload();
                      }, 2e3 * retryCount);
                      return;
                    }
                  }
                  file.uploadStatus = "error";
                  common_vendor.index.showToast({
                    title: "上传失败，请重试",
                    icon: "none",
                    duration: 2e3
                  });
                  reject(new Error(error.errMsg || "上传失败"));
                }
              });
              uploadTask.onProgressUpdate((res) => {
                file.progress = res.progress;
                updateProgress(res.progress, res.totalBytesWritten);
                updateTotalProgress();
              });
            } catch (e) {
              common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:1091", "创建上传任务失败:", e);
              file.uploadStatus = "error";
              common_vendor.index.showToast({
                title: "创建上传任务失败",
                icon: "none",
                duration: 2e3
              });
              reject(new Error("创建上传任务失败: " + e.message));
            }
          };
          performUpload();
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:1108", "上传视频错误:", e);
        file.uploadStatus = "error";
        common_vendor.index.showToast({
          title: "上传失败: " + e.message,
          icon: "none",
          duration: 2e3
        });
        throw new Error(`上传失败：${e.message}`);
      }
    };
    const getFileExtension = (filePath) => {
      const lastDotIndex = filePath.lastIndexOf(".");
      if (lastDotIndex > 0) {
        return filePath.substring(lastDotIndex + 1).toLowerCase();
      }
      return "";
    };
    const updateTotalProgress = () => {
      let totalFiles = imageList.value.length + (videoData.value ? 1 : 0);
      let totalProgressValue = 0;
      imageList.value.forEach((file) => {
        totalProgressValue += file.progress || 0;
      });
      if (videoData.value) {
        totalProgressValue += videoData.value.progress || 0;
      }
      totalProgress.value = totalFiles > 0 ? Math.floor(totalProgressValue / totalFiles) : 0;
    };
    const publishContent = async () => {
      try {
        if (isPublishing.value) {
          common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:1153", "发布请求正在处理中，请勿重复提交");
          return;
        }
        isPublishing.value = true;
        if (!checkUserLogin()) {
          isPublishing.value = false;
          return;
        }
        if (!selectedCategory.value) {
          common_vendor.index.showToast({
            title: "请选择分类",
            icon: "none"
          });
          isPublishing.value = false;
          return;
        }
        if (!content.value.trim()) {
          common_vendor.index.showToast({
            title: "请输入文字内容",
            icon: "none",
            duration: 2e3
          });
          isPublishing.value = false;
          return;
        }
        if (content.value.trim().length < 5) {
          common_vendor.index.showToast({
            title: "文字内容需大于5个字符",
            icon: "none",
            duration: 2e3
          });
          isPublishing.value = false;
          return;
        }
        const hasUploadingMedia = imageList.value.some((item) => item.uploadStatus === "uploading") || videoData.value && videoData.value.uploadStatus === "uploading";
        if (hasUploadingMedia) {
          common_vendor.index.showModal({
            title: "媒体文件正在上传",
            content: "有媒体文件正在上传中，是否等待上传完成后再发布？",
            confirmText: "等待上传",
            cancelText: "仅发布文字",
            success: (res) => {
              if (res.confirm) {
                common_vendor.index.showToast({
                  title: "请等待上传完成",
                  icon: "none",
                  duration: 2e3
                });
                isPublishing.value = false;
              } else {
                continuePublishWithoutMedia();
              }
            }
          });
          return;
        }
        await publishWithAllMedia();
      } catch (e) {
        common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:1231", "发布失败:", e);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: e.message || "发布失败",
          icon: "none"
        });
        isUploading.value = false;
        isPublishing.value = false;
      }
    };
    const continuePublishWithoutMedia = async () => {
      var _a, _b, _c;
      try {
        common_vendor.index.showLoading({
          title: "正在发布...",
          mask: true
        });
        const paramsArticle = {
          user_id: userStore.userInfo.uid,
          content: content.value.trim(),
          cate_id: selectedCategory.value,
          cate_name: ((_a = categoryList.value[cateIndex.value]) == null ? void 0 : _a.cate_name) || "",
          address: ((_b = locationInfo.value) == null ? void 0 : _b.address) || "",
          district: ((_c = locationInfo.value) == null ? void 0 : _c.district) || "",
          user_nickName: userStore.userInfo.nickName,
          user_avatarUrl: userStore.userInfo.avatarUrl,
          user_mobile: userStore.userInfo.mobile,
          state: 1
        };
        const uploadedImages = imageList.value.filter((item) => item.uploadStatus === "success" && !item.loadError).map((item) => ({
          type: "image",
          url: item.fileURL,
          thumbnailURL: item.thumbnailURL,
          compressedURL: item.compressedURL
        }));
        if (uploadedImages.length > 0) {
          paramsArticle.mediaType = "image";
          paramsArticle.images = uploadedImages;
        }
        if (videoData.value && videoData.value.uploadStatus === "success") {
          paramsArticle.mediaType = "video";
          paramsArticle.video = {
            type: "video",
            videoURL: videoData.value.videoURL,
            thumbnailURL: videoData.value.thumbnailURL,
            playURL: videoData.value.playURL || videoData.value.videoURL,
            duration: videoData.value.duration,
            size: videoData.value.size,
            width: videoData.value.width,
            height: videoData.value.height,
            format: videoData.value.format || "mp4"
          };
        }
        common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:1295", "发布数据(仅已上传完成的媒体):", paramsArticle);
        const res = await articleApi.addArticle(paramsArticle);
        handlePublishSuccess(res);
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:1302", "发布失败:", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: error.message || "发布失败",
          icon: "none"
        });
        isUploading.value = false;
        isPublishing.value = false;
      }
    };
    const publishWithAllMedia = async () => {
      var _a, _b, _c;
      try {
        isUploading.value = true;
        common_vendor.index.showLoading({
          title: "正在发布...",
          mask: true
        });
        const uploadedImages = imageList.value.filter((item) => item.uploadStatus === "success" && !item.loadError).map((item) => ({
          type: "image",
          url: item.fileURL,
          thumbnailURL: item.thumbnailURL,
          compressedURL: item.compressedURL
        }));
        let uploadedVideo = null;
        if (videoData.value && videoData.value.uploadStatus === "success") {
          uploadedVideo = {
            type: "video",
            videoURL: videoData.value.videoURL,
            thumbnailURL: videoData.value.thumbnailURL,
            playURL: videoData.value.playURL || videoData.value.videoURL,
            duration: videoData.value.duration,
            size: videoData.value.size,
            width: videoData.value.width,
            height: videoData.value.height,
            format: videoData.value.format || "mp4"
          };
        }
        const paramsArticle = {
          user_id: userStore.userInfo.uid,
          content: content.value.trim(),
          cate_id: selectedCategory.value,
          cate_name: ((_a = categoryList.value[cateIndex.value]) == null ? void 0 : _a.cate_name) || "",
          address: ((_b = locationInfo.value) == null ? void 0 : _b.address) || "",
          district: ((_c = locationInfo.value) == null ? void 0 : _c.district) || "",
          user_nickName: userStore.userInfo.nickName,
          user_avatarUrl: userStore.userInfo.avatarUrl,
          user_mobile: userStore.userInfo.mobile,
          state: 1
        };
        if (uploadedImages.length > 0) {
          paramsArticle.mediaType = "image";
          paramsArticle.images = uploadedImages;
        }
        if (uploadedVideo) {
          paramsArticle.mediaType = "video";
          paramsArticle.video = uploadedVideo;
        }
        common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:1375", "发布数据:", paramsArticle);
        const res = await articleApi.addArticle(paramsArticle);
        handlePublishSuccess(res);
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:1382", "发布失败:", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: error.message || "发布失败",
          icon: "none"
        });
        isUploading.value = false;
        isPublishing.value = false;
      }
    };
    const handlePublishSuccess = (res) => {
      if (res.id) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "发布成功",
          icon: "success"
        });
        content.value = "";
        imageList.value = [];
        videoData.value = null;
        publishedArticleId.value = res.id;
        setTimeout(() => {
          common_vendor.index.$emit("articlePublished", publishedArticleId.value);
          const pages = getCurrentPages();
          common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:1417", "当前页面栈:", pages);
          if (pages.length > 1) {
            common_vendor.index.navigateBack({
              delta: 1,
              success: () => {
                common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:1425", "成功返回上一页");
                common_vendor.index.$emit("refreshIndexOnce", publishedArticleId.value);
              },
              fail: (err) => {
                common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:1430", "返回上一页失败:", err);
                navigateToIndex(publishedArticleId.value);
              }
            });
          } else {
            navigateToIndex(publishedArticleId.value);
          }
        }, 1500);
      } else {
        throw new Error(res.message || "发布失败");
      }
      isUploading.value = false;
      isPublishing.value = false;
    };
    const navigateToIndex = (articleId) => {
      common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:1450", "准备跳转到首页，文章ID:", articleId);
      common_vendor.index.switchTab({
        url: "/pages/index/index",
        success: () => {
          common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:1456", "成功跳转到首页");
          setTimeout(() => {
            common_vendor.index.$emit("refreshIndexOnce", articleId);
          }, 500);
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:1463", "跳转到首页失败:", err);
          common_vendor.index.reLaunch({
            url: "/pages/index/index",
            success: () => {
              common_vendor.index.__f__("log", "at subPages/qiniuyun/qiniuyun.vue:1468", "使用reLaunch成功跳转到首页");
              setTimeout(() => {
                common_vendor.index.$emit("refreshIndexOnce", articleId);
              }, 500);
            },
            fail: (relaunchErr) => {
              common_vendor.index.__f__("error", "at subPages/qiniuyun/qiniuyun.vue:1475", "所有导航方法都失败了:", relaunchErr);
              common_vendor.index.showToast({
                title: "跳转首页失败，请手动返回",
                icon: "none",
                duration: 3e3
              });
            }
          });
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: locationInfo.value
      }, locationInfo.value ? {
        b: common_vendor.p({
          type: "location",
          size: "14",
          color: "#007AFF"
        }),
        c: common_vendor.t(locationInfo.value.address)
      } : {}, {
        d: common_vendor.f(categoryList.value, (item, index, i0) => {
          return {
            a: item.cate_img,
            b: common_vendor.o(($event) => handleCategoryImageError(index), item._id),
            c: common_vendor.t(item.cate_name),
            d: item._id,
            e: selectedCategory.value === item._id ? 1 : "",
            f: common_vendor.o(($event) => selectCategory(index), item._id)
          };
        }),
        e: categoryList.value.length === 0
      }, categoryList.value.length === 0 ? {
        f: common_vendor.p({
          type: "spinner-cycle",
          size: "30",
          color: "#399bfe"
        })
      } : {}, {
        g: content.value,
        h: common_vendor.o(($event) => content.value = $event.detail.value),
        i: common_vendor.t(content.value.length),
        j: common_vendor.p({
          type: "image",
          size: "20",
          color: mediaType.value === "image" ? "#399bfe" : "#999"
        }),
        k: mediaType.value === "image" ? 1 : "",
        l: mediaType.value === "image" ? 1 : "",
        m: common_vendor.o(($event) => mediaType.value = "image"),
        n: common_vendor.p({
          type: "videocam",
          size: "20",
          color: mediaType.value === "video" ? "#399bfe" : "#999"
        }),
        o: mediaType.value === "video" ? 1 : "",
        p: mediaType.value === "video" ? 1 : "",
        q: common_vendor.o(($event) => mediaType.value = "video"),
        r: mediaType.value === "image" || imageList.value.length > 0 && mediaType.value === "video"
      }, mediaType.value === "image" || imageList.value.length > 0 && mediaType.value === "video" ? common_vendor.e({
        s: mediaType.value !== "image" && imageList.value.length > 0
      }, mediaType.value !== "image" && imageList.value.length > 0 ? {} : {}, {
        t: common_vendor.f(imageList.value, (item, index, i0) => {
          return common_vendor.e({
            a: formatImagePath(item.tempPath || item.thumbnailURL),
            b: common_vendor.o(($event) => handleImageError(index), index),
            c: item.progress < 100
          }, item.progress < 100 ? {
            d: common_vendor.t(item.progress),
            e: item.progress + "%"
          } : {}, {
            f: "2a38a99e-4-" + i0,
            g: common_vendor.o(($event) => removeFile(index), index),
            h: index
          });
        }),
        v: common_vendor.p({
          type: "close",
          size: "16",
          color: "#fff"
        }),
        w: imageList.value.length < 9 && mediaType.value === "image"
      }, imageList.value.length < 9 && mediaType.value === "image" ? {
        x: common_vendor.p({
          type: "plusempty",
          size: "30",
          color: "#999"
        }),
        y: common_vendor.o(chooseImage)
      } : {}, {
        z: mediaType.value === "image"
      }, mediaType.value === "image" ? {} : {}) : {}, {
        A: mediaType.value === "video" || hasVideo.value && mediaType.value === "image"
      }, mediaType.value === "video" || hasVideo.value && mediaType.value === "image" ? common_vendor.e({
        B: mediaType.value !== "video" && hasVideo.value
      }, mediaType.value !== "video" && hasVideo.value ? {} : {}, {
        C: hasVideo.value
      }, hasVideo.value ? common_vendor.e({
        D: videoData.value.poster || videoData.value.thumbnailURL,
        E: common_vendor.p({
          type: "videocam-filled",
          size: "30",
          color: "#fff"
        }),
        F: common_vendor.t(Math.floor(videoData.value.duration || 0)),
        G: common_vendor.t(((videoData.value.size || 0) / 1024 / 1024).toFixed(1)),
        H: common_vendor.t(videoData.value.format || "mp4"),
        I: videoData.value && videoData.value.progress < 100
      }, videoData.value && videoData.value.progress < 100 ? {
        J: common_vendor.t(videoData.value.progress),
        K: videoData.value.progress + "%"
      } : {}, {
        L: common_vendor.p({
          type: "close",
          size: "16",
          color: "#fff"
        }),
        M: common_vendor.o(removeVideo)
      }) : {}, {
        N: !hasVideo.value && mediaType.value === "video"
      }, !hasVideo.value && mediaType.value === "video" ? {
        O: common_vendor.p({
          type: "videocam-filled",
          size: "40",
          color: "#999"
        }),
        P: common_vendor.o(chooseVideo)
      } : {}, {
        Q: mediaType.value === "video" && !hasVideo.value
      }, mediaType.value === "video" && !hasVideo.value ? {} : {}) : {}, {
        R: common_vendor.o(publishContent),
        S: common_vendor.gei(_ctx, "")
      });
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/subPages/qiniuyun/qiniuyun.js.map
