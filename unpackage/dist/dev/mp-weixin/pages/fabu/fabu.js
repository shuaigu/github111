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
const __default__ = {
  name: "Fabu"
};
const _sfc_main = /* @__PURE__ */ Object.assign(__default__, {
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    const articleApi = common_vendor.tr.importObject("articleWx", { customUI: true });
    const extStorageCo = common_vendor.tr.importObject("fabuWx", { customUI: true });
    common_vendor.ref(null);
    const categoryList = common_vendor.ref([]);
    const cateIndex = common_vendor.ref(0);
    const imageList = common_vendor.ref([]);
    common_vendor.ref(0);
    const locationInfo = common_vendor.ref(null);
    const content = common_vendor.ref("");
    const selectedCategory = common_vendor.ref(null);
    const videoInfo = common_vendor.ref(null);
    const textareaFocus = common_vendor.ref(false);
    common_vendor.ref(null);
    const payAmount = common_vendor.ref(0);
    const videoLink = common_vendor.ref("");
    const inputHeight = common_vendor.ref(170);
    const selectionStart = common_vendor.ref(0);
    const selectionEnd = common_vendor.ref(0);
    common_vendor.ref(null);
    const isInSelectionMode = common_vendor.ref(false);
    const showImagePreview = common_vendor.ref(false);
    const currentPreviewImage = common_vendor.ref("");
    const previewImageIndex = common_vendor.ref(0);
    common_vendor.ref(false);
    common_vendor.ref({
      currentDomain: "",
      imageCount: 0,
      fixedCount: 0
    });
    const preciseLocationInfo = common_vendor.ref({
      latitude: null,
      longitude: null,
      accuracy: null,
      altitude: null,
      speed: null,
      timestamp: null,
      province: "",
      city: "",
      district: "",
      street: "",
      streetNumber: "",
      poiName: ""
    });
    common_vendor.computed(() => {
      return selectionEnd.value - selectionStart.value;
    });
    const iconCustomizing = common_vendor.ref(false);
    const textOffsetX = common_vendor.ref(0);
    const textOffsetY = common_vendor.ref(0);
    const textSize = common_vendor.ref(100);
    const previewImageUrl = common_vendor.ref("");
    let currentEditingCategory = null;
    common_vendor.ref([
      "欢迎咨询",
      "全新产品",
      "限时优惠",
      "诚信交易",
      "支持自提"
    ]);
    const showEmojiPanel = common_vendor.ref(false);
    const emojiGroups = common_vendor.ref([
      {
        name: "常用",
        emojis: ["😊", "👍", "❤️", "👋", "🙏", "🔥", "💯", "👏", "🎉", "✨", "🌹", "💪", "🤝"]
      },
      {
        name: "表情",
        emojis: ["😀", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍"]
      },
      {
        name: "手势",
        emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤙", "🤛", "🤜", "👊", "✊", "🤝", "👏"]
      }
    ]);
    const currentEmojiGroupIndex = common_vendor.ref(0);
    const getLocaAndCate = async () => {
      try {
        common_vendor.index.showLoading({
          title: "加载中...",
          mask: false
        });
        let locationRes = await common_vendor.index.getLocation({
          type: "gcj02",
          highAccuracyExpireTime: 1e4,
          // 10秒超时
          isHighAccuracy: true,
          // 启用高精度定位
          altitude: true
          // 获取高度信息
        }).catch((err) => {
          common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:148", "获取位置失败:", err);
          return { longitude: 116.397428, latitude: 39.90923 };
        });
        preciseLocationInfo.value = {
          latitude: locationRes.latitude,
          longitude: locationRes.longitude,
          accuracy: locationRes.accuracy || 0,
          altitude: locationRes.altitude || 0,
          speed: locationRes.speed || 0,
          timestamp: Date.now(),
          province: "",
          city: "",
          district: "",
          street: "",
          streetNumber: "",
          poiName: ""
        };
        const res = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`);
        common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:171", "获取分类和地址信息成功:", res);
        locationInfo.value = {
          address: res.address || "未知地址",
          district: res.district || "未知区域"
        };
        if (res.address && res.address !== "未知地址") {
          parseDetailedAddress(res.address, res.district);
        }
        if (res.district && res.district !== "未知区域") {
          try {
            const categoryResult = await extStorageCo.processCategoryFromDistrict(res.district);
            common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:189", "区域分类处理结果:", categoryResult);
            if (categoryResult.code === 0 && categoryResult.data) {
              const updatedCateRes = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`);
              if (updatedCateRes.cateList && updatedCateRes.cateList.length > 0) {
                res.cateList = updatedCateRes.cateList;
              }
            }
          } catch (categoryError) {
            common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:200", "处理区域分类失败:", categoryError);
          }
        }
        if (res.cateList && res.cateList.length > 0) {
          const locationBasedCategories = res.cateList.filter(
            (cate) => cate.is_location_based && cate.location_district === res.district
          );
          if (locationBasedCategories.length > 0) {
            categoryList.value = locationBasedCategories.map((cate) => {
              return {
                ...cate,
                icon: cate.cate_img || getDefaultCategoryIcon(cate.cate_name)
              };
            });
            selectedCategory.value = categoryList.value[0]._id;
            cateIndex.value = 0;
            const firstCategory = categoryList.value[0];
            if (!firstCategory.cate_img || firstCategory.cate_img.includes("default")) {
              try {
                common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:229", "为位置分类自动生成图标:", firstCategory.cate_name);
                const iconResult = await generateCategoryIcon(firstCategory.cate_name, firstCategory._id);
                if (iconResult && iconResult.iconURL) {
                  firstCategory.icon = iconResult.iconURL;
                  categoryList.value[0].icon = iconResult.iconURL;
                  categoryList.value[0].cate_img = iconResult.iconURL;
                }
              } catch (iconError) {
                common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:239", "自动生成位置分类图标失败:", iconError);
              }
            }
          } else {
            try {
              if (res.district && res.district !== "未知区域") {
                const createResult = await extStorageCo.createLocationCategory({
                  district: res.district,
                  address: res.address
                });
                if (createResult && createResult.categoryId) {
                  const newCategory = {
                    _id: createResult.categoryId,
                    cate_name: res.district,
                    is_location_based: true,
                    location_district: res.district,
                    icon: getDefaultCategoryIcon(res.district)
                  };
                  categoryList.value = [newCategory];
                  selectedCategory.value = newCategory._id;
                  cateIndex.value = 0;
                  handleGenerateIcon(newCategory);
                } else {
                  setDefaultCategory();
                }
              } else {
                setDefaultCategory();
              }
            } catch (e) {
              common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:277", "创建位置分类失败:", e);
              setDefaultCategory();
            }
          }
        } else {
          common_vendor.index.__f__("warn", "at pages/fabu/fabu.vue:282", "未获取到分类列表或分类列表为空");
          setDefaultCategory();
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:286", "获取位置和分类失败:", error);
        common_vendor.index.showToast({
          title: "获取分类失败，请重试",
          icon: "none",
          duration: 2e3
        });
        locationInfo.value = {
          address: "未知地址",
          district: "未知区域"
        };
        setDefaultCategory();
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const setDefaultCategory = () => {
      categoryList.value = [{
        _id: "default",
        cate_name: "默认分类",
        icon: "/static/images/category/default.png"
      }];
      selectedCategory.value = "default";
      cateIndex.value = 0;
    };
    const parseDetailedAddress = (address, district) => {
      try {
        const addressParts = {
          province: "",
          city: "",
          district: district || "",
          street: "",
          streetNumber: "",
          poiName: ""
        };
        const provinceMatch = address.match(/(中国)?(.+?省|中国.+?自治区|中国.+?市)/);
        if (provinceMatch) {
          addressParts.province = provinceMatch[2] || provinceMatch[1];
        }
        const cityMatch = address.match(/(省|市|自治区)(.+?市)/);
        if (cityMatch) {
          addressParts.city = cityMatch[2];
        }
        const streetMatch = address.match(/(区|县)(.+?)(街道|镇|乡)/);
        if (streetMatch) {
          addressParts.street = streetMatch[2] + streetMatch[3];
        }
        const poiMatch = address.match(/(街道|镇|乡)(.+)/);
        if (poiMatch) {
          addressParts.poiName = poiMatch[2].trim();
        }
        preciseLocationInfo.value = {
          ...preciseLocationInfo.value,
          ...addressParts
        };
        common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:358", "解析的详细地址信息:", addressParts);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:360", "解析地址信息失败:", error);
      }
    };
    const getSimplifiedAddress = (address) => {
      if (!address || address === "未知地址") {
        return "";
      }
      let simplified = address;
      simplified = simplified.replace(/^.*?省/, "");
      simplified = simplified.replace(/^.*?市/, "");
      simplified = simplified.replace(/^.*?自治区/, "");
      if (simplified.length > 20) {
        const breakPoints = ["县", "区", "镇", "街道", "乡"];
        for (const breakPoint of breakPoints) {
          const index = simplified.indexOf(breakPoint);
          if (index !== -1 && index < 15) {
            simplified = simplified.substring(0, index + breakPoint.length);
            break;
          }
        }
        if (simplified.length > 20) {
          simplified = simplified.substring(0, 18) + "...";
        }
      }
      return simplified;
    };
    const getDefaultCategoryIcon = (cateName) => {
      const iconMap = {
        "宠物用品": "/static/images/category/pet.png",
        "水杯餐具": "/static/images/category/tableware.png",
        "日用百货": "/static/images/category/daily.png",
        "清洁工具": "/static/images/category/cleaning.png",
        "收纳整理": "/static/images/category/storage.png",
        "文具教具": "/static/images/category/stationery.png",
        "畜牧农资": "/static/images/category/agriculture.png",
        "纸品湿巾": "/static/images/category/tissue.png",
        "个人护理": "/static/images/category/personal.png",
        "厨房烹饪": "/static/images/category/kitchen.png",
        "节庆礼品": "/static/images/category/gift.png",
        "图书乐器": "/static/images/category/book.png",
        "家庭清洁": "/static/images/category/home.png",
        "花卉园艺": "/static/images/category/garden.png",
        "锅具水壶": "/static/images/category/pot.png"
      };
      return iconMap[cateName] || utils_domainConfig.getDefaultImage("default");
    };
    const chooseAndUploadImage = async () => {
      try {
        const chooseRes = await common_vendor.index.chooseImage({
          count: 9,
          // 保留此参数但不再做前置检查
          sizeType: ["original"],
          // 只使用原图
          sourceType: ["album", "camera"],
          mediaType: ["image"]
          // 只选择图片，隐藏视频
        });
        const uploadPromises = chooseRes.tempFilePaths.map(async (filePath, index) => {
          const newIndex = imageList.value.length;
          imageList.value.push({
            fileURL: "",
            thumbnailURL: filePath,
            progress: 0
          });
          try {
            const imageInfo = await common_vendor.index.getImageInfo({
              src: filePath
            }).catch((err) => {
              common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:472", "获取图片尺寸信息失败:", err);
              return { width: 0, height: 0 };
            });
            const uploadOptions = await extStorageCo.getUploadFileOptions({
              cloudPath: `images/${userStore.userInfo.uid}/${Date.now()}-${newIndex}.jpg`,
              fileType: "image",
              isOriginal: true,
              userNickName: userStore.userInfo.nickName,
              imageWidth: imageInfo.width,
              // 传递图片宽度
              imageHeight: imageInfo.height
              // 传递图片高度
            });
            let fallbackTimer = null;
            let fallbackActive = true;
            fallbackTimer = setTimeout(function setupFallback() {
              var _a;
              if (!fallbackActive)
                return;
              const currentProgress = ((_a = imageList.value[newIndex]) == null ? void 0 : _a.progress) || 0;
              if (currentProgress >= 98) {
                fallbackActive = false;
                return;
              }
              let nextProgress;
              if (currentProgress < 30) {
                nextProgress = currentProgress + 5;
              } else if (currentProgress < 70) {
                nextProgress = currentProgress + 3;
              } else if (currentProgress < 90) {
                nextProgress = currentProgress + 1;
              } else {
                nextProgress = currentProgress + 0.5;
              }
              imageList.value[newIndex].progress = Math.min(98, nextProgress);
              fallbackTimer = setTimeout(setupFallback, 800);
            }, 500);
            return new Promise((resolve, reject) => {
              const uploadTask = common_vendor.index.uploadFile({
                ...uploadOptions.uploadFileOptions,
                filePath,
                success: () => {
                  fallbackActive = false;
                  clearTimeout(fallbackTimer);
                  imageList.value[newIndex].progress = 100;
                  imageList.value[newIndex].fileURL = utils_domainConfig.fixImageUrl(uploadOptions.fileURL);
                  imageList.value[newIndex].compressedURL = utils_domainConfig.fixImageUrl(uploadOptions.compressedURL);
                  imageList.value[newIndex].thumbnailURL = utils_domainConfig.fixImageUrl(uploadOptions.thumbnailURL);
                  resolve(true);
                },
                fail: (err) => {
                  fallbackActive = false;
                  clearTimeout(fallbackTimer);
                  common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:542", "上传失败", err);
                  imageList.value.splice(newIndex, 1);
                  reject(err);
                }
              });
              try {
                uploadTask.onProgressUpdate((res) => {
                  if (res && typeof res.progress === "number") {
                    fallbackActive = false;
                    clearTimeout(fallbackTimer);
                    const actualProgress = Math.min(99, res.progress);
                    imageList.value[newIndex].progress = actualProgress;
                  }
                });
              } catch (progressErr) {
                common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:562", "进度更新回调不可用，使用备用进度显示", progressErr);
              }
            });
          } catch (err) {
            imageList.value.splice(newIndex, 1);
            common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:569", "上传图片错误:", err);
            return Promise.reject(err);
          }
        });
        await Promise.all(uploadPromises);
      } catch (err) {
        common_vendor.index.showToast({
          title: "上传失败",
          icon: "none"
        });
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:582", "图片上传过程错误:", err);
      }
    };
    const deleteImage = (index) => {
      imageList.value.splice(index, 1);
    };
    const handleVideoLinkInput = (e) => {
      const currentLink = videoLink.value.trim();
      if (!currentLink) {
        videoInfo.value = null;
        return;
      }
      const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/;
      if (!urlPattern.test(currentLink)) {
        return;
      }
      videoInfo.value = currentLink;
      common_vendor.index.vibrateShort && common_vendor.index.vibrateShort({ type: "light" });
    };
    const deleteVideo = () => {
      videoInfo.value = null;
    };
    const isEditMode = common_vendor.ref(false);
    const editArticleId = common_vendor.ref("");
    common_vendor.onLoad((options) => {
      common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:653", "页面加载参数:", options);
      if (options.mode === "edit" && options.article_id) {
        isEditMode.value = true;
        editArticleId.value = options.article_id;
        getLocaAndCate().then(() => {
          loadArticleData();
        }).catch((err) => {
          common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:662", "获取分类失败:", err);
          common_vendor.index.showToast({
            title: "获取分类失败",
            icon: "none"
          });
        });
      } else {
        getLocaAndCate().catch((err) => {
          common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:671", "获取分类失败:", err);
          common_vendor.index.showToast({
            title: "获取分类失败",
            icon: "none"
          });
        });
      }
    });
    const loadArticleData = async () => {
      try {
        common_vendor.index.showLoading({
          title: "加载中...",
          mask: true
        });
        const res = await articleApi.getArticleDetal(editArticleId.value);
        if (!res || !res.articleRes || !res.articleRes.data || !res.articleRes.data[0]) {
          throw new Error("获取文章数据失败");
        }
        const articleData = res.articleRes.data[0];
        content.value = articleData.content || "";
        if (articleData.cate_id) {
          selectedCategory.value = articleData.cate_id;
          const categoryIndex = categoryList.value.findIndex((cate) => cate._id === articleData.cate_id);
          if (categoryIndex !== -1) {
            cateIndex.value = categoryIndex;
          }
        }
        if (articleData.images && articleData.images.length > 0) {
          imageList.value = articleData.images.map((img) => ({
            fileURL: utils_domainConfig.fixImageUrl(img.url || img),
            thumbnailURL: utils_domainConfig.fixImageUrl(img.thumbnailURL || img.compressedURL || img.url || img),
            compressedURL: utils_domainConfig.fixImageUrl(img.compressedURL || img.url || img),
            progress: 100
          }));
        }
        if (articleData.videoURL) {
          videoInfo.value = articleData.videoURL;
        }
        locationInfo.value = {
          address: articleData.address || "未知地址",
          district: articleData.district || "未知区域"
        };
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:730", "加载文章数据失败:", err);
        common_vendor.index.showToast({
          title: "加载文章数据失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const submitForm = async () => {
      if (!content.value.trim()) {
        common_vendor.index.showToast({
          title: "请输入内容",
          icon: "none"
        });
        return;
      }
      if (!selectedCategory.value) {
        common_vendor.index.showToast({
          title: "请选择分类",
          icon: "none"
        });
        if (!categoryList.value.length || categoryList.value[0]._id === "default") {
          common_vendor.index.showModal({
            title: "提示",
            content: "未能获取到分类信息，是否重新获取？",
            success: (res) => {
              if (res.confirm) {
                retryGetCategories();
              }
            }
          });
        }
        return;
      }
      if (!locationInfo.value || !locationInfo.value.address) {
        common_vendor.index.showToast({
          title: "未能获取位置信息",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({
        title: isEditMode.value ? "更新中..." : "发布中...",
        mask: false
      });
      try {
        const uploadedImages = imageList.value.filter((img) => img.fileURL && img.progress === 100).map((img) => ({
          url: utils_domainConfig.fixImageUrl(img.fileURL),
          compressedURL: utils_domainConfig.fixImageUrl(img.compressedURL),
          thumbnailURL: utils_domainConfig.fixImageUrl(img.thumbnailURL)
        }));
        const videoURL = videoInfo.value || null;
        const selectedCategoryInfo = categoryList.value.find((cate) => cate._id === selectedCategory.value) || null;
        const isLocationBasedCategory = selectedCategoryInfo && selectedCategoryInfo.is_location_based === true;
        const params = {
          user_id: userStore.userInfo.uid,
          content: content.value.trim(),
          images: uploadedImages,
          videoURL,
          cate_id: selectedCategory.value,
          address: locationInfo.value.address || "未知地址",
          district: locationInfo.value.district || "未知区域",
          user_nickName: userStore.userInfo.nickName,
          user_avatarUrl: userStore.userInfo.avatarUrl,
          user_mobile: userStore.userInfo.mobile,
          pay_amount: payAmount.value || 0,
          is_location_based_category: isLocationBasedCategory,
          category_info: selectedCategoryInfo ? {
            name: selectedCategoryInfo.cate_name,
            is_location_based: selectedCategoryInfo.is_location_based || false,
            location_district: selectedCategoryInfo.location_district || null,
            icon: selectedCategoryInfo.icon || null,
            cate_img: selectedCategoryInfo.cate_img || selectedCategoryInfo.icon || null
          } : null
        };
        let res;
        if (isEditMode.value) {
          res = await articleApi.updateArticle(editArticleId.value, params);
        } else {
          res = await articleApi.addArticle(params);
        }
        if (res.id || res.code === 0) {
          common_vendor.index.showToast({
            title: isEditMode.value ? "更新成功" : "发布成功",
            icon: "success",
            duration: 1500,
            success: () => {
              setTimeout(() => {
                common_vendor.index.navigateBack({
                  delta: 1,
                  success: () => {
                    common_vendor.index.$emit("globalRefresh", {
                      timestamp: Date.now(),
                      pages: ["index", "userArticleList", "articleDetail"]
                    });
                    common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:846", "触发全局刷新事件");
                  }
                });
              }, 1500);
            }
          });
        } else {
          throw new Error(res.message || (isEditMode.value ? "更新失败" : "发布失败"));
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:856", isEditMode.value ? "更新失败:" : "发布失败:", err);
        common_vendor.index.showToast({
          title: err.message || (isEditMode.value ? "更新失败，请重试" : "发布失败，请重试"),
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const selectCategory = (index) => {
      cateIndex.value = index;
      selectedCategory.value = categoryList.value[index]._id;
      common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:877", "选择分类:", categoryList.value[index].cate_name);
    };
    const handleGenerateIcon = async (category) => {
      try {
        common_vendor.index.showLoading({
          title: "生成图标中...",
          mask: false
        });
        const tempResult = await generateTempCategoryIcon(category.cate_name);
        if (tempResult && tempResult.tempFilePath) {
          currentEditingCategory = category;
          previewImageUrl.value = tempResult.tempFilePath;
          await saveCustomIcon();
        } else {
          throw new Error("生成临时图标失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:925", "生成图标失败:", error);
        common_vendor.index.showToast({
          title: "生成图标失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const generateTempCategoryIcon = async (categoryName) => {
      try {
        common_vendor.index.showLoading({
          title: "生成预览中...",
          mask: false
        });
        const getColorFromName = (name) => {
          let hash = 0;
          for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
          }
          const h = Math.abs(hash) % 360;
          const s = 40 + Math.abs(hash) % 30;
          const l = 75 + Math.abs(hash) % 15;
          const foregroundColor = l > 65 ? "#333333" : "#FFFFFF";
          return {
            background: `hsl(${h}, ${s}%, ${l}%)`,
            foreground: foregroundColor
          };
        };
        const colors = getColorFromName(categoryName);
        const canvasSize = 200;
        const iconSize = canvasSize;
        const canvas = common_vendor.index.createOffscreenCanvas({
          type: "2d",
          width: iconSize,
          height: iconSize
        });
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, iconSize, iconSize);
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, iconSize - 4, iconSize - 4);
        const firstChar = categoryName.charAt(0);
        ctx.fillStyle = colors.foreground;
        const fontSize = iconSize / 2 * (textSize.value / 100);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const textX = iconSize / 2 + textOffsetX.value * iconSize / 100;
        const textY = iconSize / 2 + textOffsetY.value * iconSize / 100;
        ctx.fillText(firstChar, textX, textY);
        const tempFilePath = await new Promise((resolve, reject) => {
          const buffer = canvas.toDataURL("image/png");
          const fs = common_vendor.index.getFileSystemManager();
          const tempFilePath2 = `${common_vendor.index.env.USER_DATA_PATH}/temp_category_icon_${Date.now()}.png`;
          const base64Data = buffer.replace(/^data:image\/\w+;base64,/, "");
          fs.writeFile({
            filePath: tempFilePath2,
            data: base64Data,
            encoding: "base64",
            success: () => resolve(tempFilePath2),
            fail: (err) => reject(new Error(`保存临时文件失败: ${JSON.stringify(err)}`))
          });
        });
        common_vendor.index.hideLoading();
        return {
          tempFilePath,
          colors
        };
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:1031", "生成临时图标失败:", error);
        return null;
      }
    };
    const retryGetCategories = () => {
      common_vendor.index.showToast({
        title: "正在重新获取分类...",
        icon: "loading",
        duration: 2e3
      });
      setTimeout(() => {
        getLocaAndCate();
      }, 1e3);
    };
    common_vendor.onMounted(() => {
      common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:1050", "组件已挂载");
      isInSelectionMode.value = false;
      if (!isEditMode.value) {
        getLocaAndCate().catch((err) => {
          common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:1056", "onMounted获取分类失败:", err);
          common_vendor.index.showModal({
            title: "提示",
            content: "获取分类失败，是否重试？",
            success: (res) => {
              if (res.confirm) {
                retryGetCategories();
              }
            }
          });
        });
      }
    });
    const createNewCategoryIcon = () => {
      if (categoryList.value.length === 0) {
        common_vendor.index.showToast({
          title: "没有可用分类",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      if (categoryList.value[cateIndex.value]) {
        handleGenerateIcon(categoryList.value[cateIndex.value]);
      } else {
        common_vendor.index.showToast({
          title: "请先选择一个分类",
          icon: "none",
          duration: 2e3
        });
      }
    };
    const handleTextareaFocus = () => {
      textareaFocus.value = true;
      adjustScrollPosition();
    };
    const handleLineChange = (e) => {
      const lineCount = e.detail.lineCount || 1;
      const minHeight = 170;
      const lineHeight = 40;
      const maxHeight = 800;
      let idealHeight = Math.max(minHeight, lineCount * lineHeight + 40);
      idealHeight = Math.min(idealHeight, maxHeight);
      if (Math.abs(inputHeight.value - idealHeight) > 10) {
        inputHeight.value = idealHeight;
        clearTimeout(window.scrollAdjustTimer);
        window.scrollAdjustTimer = setTimeout(() => {
          adjustScrollPosition();
        }, 100);
      }
    };
    const updateIconPreview = async () => {
      if (!currentEditingCategory)
        return;
      try {
        const tempResult = await generateTempCategoryIcon(currentEditingCategory.cate_name);
        if (tempResult && tempResult.tempFilePath) {
          previewImageUrl.value = tempResult.tempFilePath;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:1179", "更新预览失败:", error);
      }
    };
    const saveCustomIcon = async () => {
      if (!currentEditingCategory || !previewImageUrl.value) {
        common_vendor.index.showToast({
          title: "没有可保存的图标",
          icon: "none"
        });
        return;
      }
      try {
        common_vendor.index.showLoading({
          title: "保存中...",
          mask: false
        });
        const uploadResult = await extStorageCo.getUploadFileOptions({
          cloudPath: `categories/${currentEditingCategory._id || Date.now()}.png`,
          fileType: "image",
          isOriginal: true
        });
        const uploadRes = await common_vendor.index.uploadFile({
          ...uploadResult.uploadFileOptions,
          filePath: previewImageUrl.value,
          name: "file"
        });
        if (uploadRes.statusCode !== 200) {
          throw new Error(`上传失败: ${uploadRes.statusCode}`);
        }
        const iconURL = utils_domainConfig.fixImageUrl(uploadResult.fileURL);
        const thumbnailURL = utils_domainConfig.fixImageUrl(uploadResult.thumbnailURL);
        if (currentEditingCategory._id) {
          try {
            const updateResult = await extStorageCo.updateCategoryIcon({
              categoryId: currentEditingCategory._id,
              iconURL,
              thumbnailURL
            }).catch((err) => {
              common_vendor.index.__f__("warn", "at pages/fabu/fabu.vue:1230", "云函数updateCategoryIcon可能未部署或不可用:", err);
              return { updated: false, error: err.message };
            });
            if (updateResult && updateResult.updated) {
              common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:1236", "更新分类图标结果:", updateResult);
              currentEditingCategory.icon = utils_domainConfig.fixImageUrl(iconURL);
              currentEditingCategory.cate_img = utils_domainConfig.fixImageUrl(iconURL);
              currentEditingCategory.cate_img_thumbnail = utils_domainConfig.fixImageUrl(thumbnailURL);
              iconCustomizing.value = false;
              common_vendor.index.showToast({
                title: "图标保存成功",
                icon: "success"
              });
            } else {
              common_vendor.index.__f__("warn", "at pages/fabu/fabu.vue:1252", "更新分类图标未成功，但图标已生成:", { iconURL, thumbnailURL });
              currentEditingCategory.icon = utils_domainConfig.fixImageUrl(iconURL);
              currentEditingCategory.cate_img = utils_domainConfig.fixImageUrl(iconURL);
              currentEditingCategory.cate_img_thumbnail = utils_domainConfig.fixImageUrl(thumbnailURL);
              iconCustomizing.value = false;
              common_vendor.index.showToast({
                title: "图标已生成",
                icon: "success"
              });
            }
          } catch (updateError) {
            common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:1269", "更新分类图标数据库记录失败:", updateError);
            currentEditingCategory.icon = utils_domainConfig.fixImageUrl(iconURL);
            currentEditingCategory.cate_img = utils_domainConfig.fixImageUrl(iconURL);
            currentEditingCategory.cate_img_thumbnail = utils_domainConfig.fixImageUrl(thumbnailURL);
            iconCustomizing.value = false;
            common_vendor.index.showToast({
              title: "图标已生成，但未更新数据库",
              icon: "none"
            });
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:1286", "保存图标失败:", error);
        common_vendor.index.showToast({
          title: "保存图标失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const cancelCustomize = () => {
      iconCustomizing.value = false;
      currentEditingCategory = null;
      previewImageUrl.value = "";
    };
    const adjustScrollPosition = () => {
      common_vendor.nextTick$1(() => {
        try {
          const systemInfo = common_vendor.index.getSystemInfoSync();
          const windowHeight = systemInfo.windowHeight;
          const keyboardHeight = systemInfo.windowHeight * 0.4;
          common_vendor.index.createSelectorQuery().select(".content-area").boundingClientRect((rect) => {
            if (!rect)
              return;
            const inputBottom = rect.top + rect.height;
            const idealPosition = inputBottom - (windowHeight - keyboardHeight) + 100 * (systemInfo.windowWidth / 750);
            if (idealPosition > 0) {
              let currentScrollTop = 0;
              const pages = getCurrentPages();
              const currentPage = pages[pages.length - 1];
              if (currentPage && currentPage.$page) {
                currentScrollTop = currentPage.$page.scrollTop || 0;
              }
              const newScrollTop = currentScrollTop + idealPosition;
              common_vendor.index.pageScrollTo({
                scrollTop: newScrollTop,
                duration: 200,
                // 减少动画时间提高响应速度
                success: () => {
                  common_vendor.nextTick$1(() => {
                    const finalAdjustment = 50;
                    if (idealPosition > windowHeight / 3) {
                      common_vendor.index.pageScrollTo({
                        scrollTop: newScrollTop + finalAdjustment,
                        duration: 100
                      });
                    }
                  });
                }
              });
            }
          }).exec();
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:1361", "调整滚动位置失败:", err);
        }
      });
    };
    const insertTextAtCursor = (textToInsert) => {
      if (!content.value)
        content.value = "";
      const before = content.value.substring(0, selectionStart.value);
      const after = content.value.substring(selectionEnd.value);
      content.value = before + textToInsert + after;
      const newPosition = selectionStart.value + textToInsert.length;
      common_vendor.nextTick$1(() => {
        selectionStart.value = newPosition;
        selectionEnd.value = newPosition;
        textareaFocus.value = true;
        handleLineChange({ detail: { lineCount: content.value.split("\n").length } });
      });
    };
    const handleSelectionChange = (e) => {
      if (e.detail) {
        selectionStart.value = e.detail.selectionStart || 0;
        selectionEnd.value = e.detail.selectionEnd || 0;
        if (selectionStart.value !== selectionEnd.value)
          ;
      }
    };
    const insertEmoji = (emoji) => {
      insertTextAtCursor(emoji);
    };
    const selectEmojiGroup = (index) => {
      currentEmojiGroupIndex.value = index;
    };
    const enhanceTextareaSelection = (e) => {
      try {
        adjustScrollPosition();
        const shouldShowKeyboard = e && e.type === "click";
        if (shouldShowKeyboard) {
          textareaFocus.value = true;
        }
        if (e && (e.type === "touchstart" || e.type === "click")) {
          common_vendor.index.createSelectorQuery().select(".content-input").boundingClientRect((data) => {
            if (data) {
              textAreaRect.value = {
                left: data.left,
                top: data.top,
                width: data.width,
                height: data.height
              };
            }
          }).exec();
        }
      } catch (err) {
        common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:1491", "增强文本选择失败", err);
      }
    };
    const enablePreciseSelection = (e) => {
      e.preventDefault && e.preventDefault();
      common_vendor.index.showActionSheet({
        itemList: ["全选", "复制", "粘贴", "清空"],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              selectionStart.value = 0;
              selectionEnd.value = content.value.length;
              textareaFocus.value = true;
              common_vendor.index.showToast({
                title: "已全选",
                icon: "none",
                duration: 1e3
              });
              break;
            case 1:
              if (selectionStart.value !== selectionEnd.value) {
                const selectedText = content.value.substring(selectionStart.value, selectionEnd.value);
                common_vendor.index.setClipboardData({
                  data: selectedText,
                  success: () => {
                    common_vendor.index.showToast({
                      title: "已复制",
                      icon: "success",
                      duration: 1e3
                    });
                  }
                });
              } else if (content.value) {
                common_vendor.index.setClipboardData({
                  data: content.value,
                  success: () => {
                    common_vendor.index.showToast({
                      title: "已复制全部内容",
                      icon: "success",
                      duration: 1e3
                    });
                  }
                });
              } else {
                common_vendor.index.showToast({
                  title: "无内容可复制",
                  icon: "none",
                  duration: 1e3
                });
              }
              break;
            case 2:
              common_vendor.index.getClipboardData({
                success: (res2) => {
                  if (res2.data) {
                    insertTextAtCursor(res2.data);
                    common_vendor.index.showToast({
                      title: "已粘贴",
                      icon: "success",
                      duration: 1e3
                    });
                  } else {
                    common_vendor.index.showToast({
                      title: "剪贴板为空",
                      icon: "none",
                      duration: 1e3
                    });
                  }
                }
              });
              break;
            case 3:
              common_vendor.index.showModal({
                title: "提示",
                content: "确定要清空全部内容吗？",
                success: (res2) => {
                  if (res2.confirm) {
                    content.value = "";
                    setTimeout(() => {
                      textareaFocus.value = true;
                    }, 100);
                  }
                }
              });
              break;
          }
        }
      });
    };
    const textAreaRect = common_vendor.ref({ left: 0, top: 0, width: 0, height: 0 });
    const previewImage = (index) => {
      if (!imageList.value[index])
        return;
      const images = imageList.value.map((img) => utils_domainConfig.fixImageUrl(img.thumbnailURL));
      previewImageIndex.value = index;
      common_vendor.index.previewImage({
        current: index,
        urls: images,
        indicator: "number",
        loop: true,
        success: () => {
          common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:1744", "图片预览成功");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:1747", "图片预览失败", err);
          showImagePreview.value = true;
          currentPreviewImage.value = utils_domainConfig.fixImageUrl(images[index]);
        }
      });
    };
    const closeImagePreview = () => {
      showImagePreview.value = false;
      currentPreviewImage.value = "";
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: locationInfo.value && locationInfo.value.address
      }, locationInfo.value && locationInfo.value.address ? {
        b: common_vendor.t(getSimplifiedAddress(locationInfo.value.address))
      } : {}, {}, {
        h: categoryList.value.length > 0 && categoryList.value[cateIndex.value] && !categoryList.value[cateIndex.value].cate_img_thumbnail
      }, categoryList.value.length > 0 && categoryList.value[cateIndex.value] && !categoryList.value[cateIndex.value].cate_img_thumbnail ? {
        i: common_vendor.p({
          type: "plus",
          size: "30",
          color: "#2196F3"
        }),
        j: common_vendor.o(createNewCategoryIcon)
      } : {}, {
        k: common_vendor.f(categoryList.value, (item, index, i0) => {
          return common_vendor.e({
            a: common_vendor.unref(utils_domainConfig.fixImageUrl)(item.icon),
            b: index === cateIndex.value
          }, index === cateIndex.value ? {
            c: "0b7d0eba-2-" + i0,
            d: common_vendor.p({
              type: "checkmarkempty",
              size: "16",
              color: "#fff"
            })
          } : {}, {
            e: item.is_location_based
          }, item.is_location_based ? {} : {}, {
            f: common_vendor.t(item.cate_name),
            g: index,
            h: index === cateIndex.value ? 1 : "",
            i: item.is_location_based ? 1 : "",
            j: common_vendor.o(($event) => selectCategory(index), index)
          });
        }),
        l: categoryList.value.length === 0 || categoryList.value[0]._id === "default"
      }, categoryList.value.length === 0 || categoryList.value[0]._id === "default" ? {
        m: common_vendor.p({
          type: "refresh",
          size: "16",
          color: "#ff6600"
        }),
        n: common_vendor.o(retryGetCategories)
      } : {}, {
        o: textareaFocus.value,
        p: common_vendor.o(($event) => textareaFocus.value = false),
        q: common_vendor.o(handleTextareaFocus),
        r: selectionStart.value,
        s: selectionEnd.value,
        t: common_vendor.o(() => {
        }),
        v: common_vendor.o(handleLineChange),
        w: common_vendor.o([($event) => content.value = $event.detail.value, handleLineChange]),
        x: common_vendor.o(handleSelectionChange),
        y: common_vendor.o(enablePreciseSelection),
        z: common_vendor.o(enhanceTextareaSelection),
        A: common_vendor.o(enhanceTextareaSelection),
        B: content.value,
        C: common_vendor.t(content.value.length),
        D: common_vendor.p({
          type: "more-filled",
          size: "16",
          color: "#666"
        }),
        E: common_vendor.o(enablePreciseSelection),
        F: inputHeight.value + "rpx",
        G: common_vendor.f(imageList.value, (image, index, i0) => {
          return common_vendor.e({
            a: common_vendor.unref(utils_domainConfig.fixImageUrl)(image.thumbnailURL),
            b: common_vendor.o(($event) => previewImage(index), index),
            c: "0b7d0eba-5-" + i0,
            d: common_vendor.o(($event) => deleteImage(index), index),
            e: image.progress < 100
          }, image.progress < 100 ? {
            f: common_vendor.t(image.progress.toFixed(0)),
            g: image.progress + "%"
          } : {}, {
            h: index
          });
        }),
        H: common_vendor.p({
          type: "close",
          size: "20",
          color: "#fff"
        }),
        I: common_vendor.p({
          type: "plusempty",
          size: "30",
          color: "#999"
        }),
        J: common_vendor.o(chooseAndUploadImage),
        K: videoInfo.value
      }, videoInfo.value ? {
        L: common_vendor.t(videoInfo.value),
        M: common_vendor.p({
          type: "close",
          size: "20",
          color: "#fff"
        }),
        N: common_vendor.o(deleteVideo)
      } : {
        O: common_vendor.o([($event) => videoLink.value = $event.detail.value, handleVideoLinkInput]),
        P: videoLink.value
      }, {
        Q: common_vendor.t(isEditMode.value ? "更新" : "发布"),
        R: common_vendor.o(submitForm),
        S: iconCustomizing.value
      }, iconCustomizing.value ? {
        T: common_vendor.p({
          type: "close",
          size: "20",
          color: "#666"
        }),
        U: common_vendor.o(cancelCustomize),
        V: common_vendor.unref(utils_domainConfig.fixImageUrl)(previewImageUrl.value),
        W: textOffsetX.value + 50,
        X: common_vendor.o((e) => {
          textOffsetX.value = e.detail.value - 50;
          updateIconPreview();
        }),
        Y: textOffsetY.value + 50,
        Z: common_vendor.o((e) => {
          textOffsetY.value = e.detail.value - 50;
          updateIconPreview();
        }),
        aa: textSize.value,
        ab: common_vendor.o((e) => {
          textSize.value = e.detail.value;
          updateIconPreview();
        }),
        ac: common_vendor.o(cancelCustomize),
        ad: common_vendor.o(saveCustomIcon)
      } : {}, {
        ae: showEmojiPanel.value
      }, showEmojiPanel.value ? {
        af: common_vendor.p({
          type: "close",
          size: "20",
          color: "#666"
        }),
        ag: common_vendor.o(($event) => showEmojiPanel.value = false),
        ah: common_vendor.f(emojiGroups.value, (group, index, i0) => {
          return {
            a: common_vendor.t(group.name),
            b: index,
            c: currentEmojiGroupIndex.value === index ? 1 : "",
            d: common_vendor.o(($event) => selectEmojiGroup(index), index)
          };
        }),
        ai: common_vendor.f(emojiGroups.value[currentEmojiGroupIndex.value].emojis, (emoji, k0, i0) => {
          return {
            a: common_vendor.t(emoji),
            b: emoji,
            c: common_vendor.o(($event) => insertEmoji(emoji), emoji)
          };
        })
      } : {}, {
        aj: showImagePreview.value
      }, showImagePreview.value ? {
        ak: common_vendor.unref(utils_domainConfig.fixImageUrl)(currentPreviewImage.value),
        al: common_vendor.p({
          type: "close",
          size: "24",
          color: "#fff"
        }),
        am: common_vendor.o(closeImagePreview),
        an: common_vendor.o(() => {
        }),
        ao: common_vendor.o(closeImagePreview)
      } : {}, {
        ap: common_vendor.gei(_ctx, "")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0b7d0eba"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/fabu/fabu.js.map
