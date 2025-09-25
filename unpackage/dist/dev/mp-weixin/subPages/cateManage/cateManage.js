"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_manage_popup2 = common_vendor.resolveComponent("manage-popup");
  const _easycom_floatButton2 = common_vendor.resolveComponent("floatButton");
  (_easycom_uni_icons2 + _easycom_manage_popup2 + _easycom_floatButton2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_manage_popup = () => "../../components/manage-popup/manage-popup.js";
const _easycom_floatButton = () => "../../components/floatButton/floatButton.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_manage_popup + _easycom_floatButton)();
}
const _sfc_main = {
  __name: "cateManage",
  setup(__props) {
    const cateApi = common_vendor.tr.importObject("cateWx", { customUI: true });
    common_vendor.tr.importObject("qiniuyunCloud", { customUI: true });
    const cateList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const dataLoaded = common_vendor.ref(false);
    const scrollTop = common_vendor.ref(0);
    const oldScrollTop = common_vendor.ref(0);
    const scrollViewId = common_vendor.ref("cateScrollView");
    const batchOperationLoading = common_vendor.ref(false);
    const cateListGet = async () => {
      if (loading.value)
        return;
      loading.value = true;
      try {
        const res = await cateApi.get(null, true);
        if (res && res.data && Array.isArray(res.data)) {
          cateList.value = res.data.filter((item) => item && typeof item === "object");
        } else {
          cateList.value = [];
          common_vendor.index.__f__("warn", "at subPages/cateManage/cateManage.vue:38", "获取到的分类数据不是有效的数组");
        }
        dataLoaded.value = true;
        common_vendor.nextTick$1(() => {
          if (oldScrollTop.value > 0) {
            scrollToPosition(oldScrollTop.value);
          } else {
            scrollToTop();
          }
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:53", "获取分类列表失败:", error);
        cateList.value = [];
        common_vendor.index.showToast({
          title: "获取分类失败",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const scrollToTop = () => {
      scrollTop.value = 0;
      oldScrollTop.value = 0;
    };
    const scrollToPosition = (position) => {
      scrollTop.value = position;
    };
    const handleScroll = (e) => {
      oldScrollTop.value = e.detail.scrollTop;
    };
    common_vendor.onShow(() => {
      if (!dataLoaded.value) {
        cateListGet();
      }
    });
    common_vendor.onMounted(() => {
      cateListGet();
      try {
        const info = common_vendor.index.getWindowInfo();
        screenInfo.value = {
          windowWidth: info.windowWidth,
          windowHeight: info.windowHeight,
          rpxRatio: 750 / info.windowWidth
        };
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:99", "获取设备信息失败:", error);
        try {
          const systemInfo = common_vendor.index.getSystemInfoSync();
          screenInfo.value = {
            windowWidth: systemInfo.windowWidth,
            windowHeight: systemInfo.windowHeight,
            rpxRatio: 750 / systemInfo.windowWidth
          };
        } catch (e) {
          common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:109", "获取系统信息失败:", e);
        }
      }
    });
    const showPopup = common_vendor.ref(false);
    const isEdit = common_vendor.ref(false);
    const editValue = common_vendor.ref("");
    const currentId = common_vendor.ref("");
    const cateImage = common_vendor.ref("");
    const imageUploading = common_vendor.ref(false);
    const uploadProgress = common_vendor.ref(0);
    const isVisible = common_vendor.ref(true);
    const isDragMode = common_vendor.ref(false);
    const dragIndex = common_vendor.ref(-1);
    const touchStartY = common_vendor.ref(0);
    const moveY = common_vendor.ref(0);
    const startY = common_vendor.ref(0);
    const initialItemY = common_vendor.ref(0);
    const isSliding = common_vendor.ref(false);
    const dragItemHeight = common_vendor.ref(90);
    const screenInfo = common_vendor.ref({
      windowWidth: 375,
      windowHeight: 667,
      rpxRatio: 2
      // 初始默认值，将在挂载时更新
    });
    const showOrdinalMode = common_vendor.ref(false);
    const editingOrdinal = common_vendor.ref(false);
    const ordinalValues = common_vendor.ref({});
    const previewSortedList = common_vendor.computed(() => {
      if (!showOrdinalMode.value || !cateList.value || cateList.value.length === 0)
        return [];
      const itemsWithIndex = cateList.value.map((item, index) => {
        return {
          ...item,
          originalIndex: index,
          sortValue: ordinalValues.value[item._id] !== void 0 ? Number(ordinalValues.value[item._id]) : item.sort_order !== void 0 ? Number(item.sort_order) : 0
        };
      });
      return [...itemsWithIndex].sort((a, b) => {
        return b.sortValue - a.sortValue;
      });
    });
    const adjustOrdinalValue = (id, amount) => {
      if (!ordinalValues.value[id]) {
        ordinalValues.value[id] = 0;
      }
      let currentValue = Number(ordinalValues.value[id]) || 0;
      currentValue += amount;
      currentValue = Math.max(0, currentValue);
      ordinalValues.value[id] = currentValue;
    };
    const debouncedUpdateOrdinal = (id, value) => {
      if (ordinalUpdateTimers[id]) {
        clearTimeout(ordinalUpdateTimers[id]);
      }
      ordinalUpdateTimers[id] = setTimeout(() => {
        updateOrdinalValue(id, value);
      }, 200);
    };
    const ordinalUpdateTimers = {};
    const sortedCateList = common_vendor.computed(() => {
      if (!cateList.value || cateList.value.length === 0)
        return [];
      return [...cateList.value].sort((a, b) => {
        const aSort = a.sort_order !== void 0 ? Number(a.sort_order) : 0;
        const bSort = b.sort_order !== void 0 ? Number(b.sort_order) : 0;
        return bSort - aSort;
      });
    });
    const toggleOrdinalMode = () => {
      showOrdinalMode.value = !showOrdinalMode.value;
      if (showOrdinalMode.value) {
        ordinalValues.value = {};
        sortedCateList.value.forEach((item, index) => {
          const sortValue = item.sort_order !== void 0 ? item.sort_order : sortedCateList.value.length - index;
          ordinalValues.value[item._id] = sortValue;
        });
        editingOrdinal.value = false;
        common_vendor.index.showToast({
          title: "进入序号排序模式",
          icon: "none",
          duration: 2e3
        });
      } else {
        Object.keys(ordinalUpdateTimers).forEach((key) => {
          clearTimeout(ordinalUpdateTimers[key]);
        });
      }
    };
    const saveOrdinalSort = async () => {
      try {
        common_vendor.index.showLoading({
          title: "保存中...",
          mask: true
        });
        const updatePromises = Object.entries(ordinalValues.value).map(([id, value]) => {
          return cateApi.updateSort(id, Number(value));
        });
        await Promise.all(updatePromises);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "排序已保存",
          icon: "success"
        });
        await cateListGet();
        showOrdinalMode.value = false;
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:293", "保存排序失败:", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "保存排序失败",
          icon: "none"
        });
      }
    };
    const cancelOrdinalSort = () => {
      showOrdinalMode.value = false;
      editingOrdinal.value = false;
      common_vendor.index.showToast({
        title: "已取消序号排序",
        icon: "none"
      });
    };
    const updateOrdinalValue = (id, value) => {
      let numValue = Number(value);
      if (isNaN(numValue)) {
        numValue = 0;
      }
      ordinalValues.value[id] = numValue;
    };
    const dragStart = (index, e) => {
      if (!cateList.value || cateList.value.length === 0 || !isDragMode.value)
        return;
      const touch = e.touches && e.touches[0];
      if (!touch)
        return;
      const item = cateList.value[index];
      if (!item)
        return;
      if (dragIndex.value !== -1 && dragIndex.value !== index) {
        dragEnd();
      }
      dragIndex.value = index;
      startY.value = touch.pageY;
      touchStartY.value = touch.pageY;
      initialItemY.value = index * dragItemHeight.value;
      isSliding.value = true;
      setTimeout(() => {
        try {
          if (common_vendor.index.vibrateShort) {
            common_vendor.index.vibrateShort({
              success: () => {
              },
              fail: () => {
              }
            });
          }
        } catch (error) {
        }
      }, 50);
    };
    const dragMove = (e) => {
      if (dragIndex.value === -1 || !isSliding.value || !cateList.value || cateList.value.length === 0 || !isDragMode.value)
        return;
      const touch = e.touches && e.touches[0];
      if (!touch)
        return;
      const pageY = touch.pageY;
      moveY.value = pageY;
      const moveDistance = pageY - startY.value;
      if (Math.abs(moveDistance) < 5)
        return;
      const itemHeight = dragItemHeight.value;
      const pxItemHeight = itemHeight / screenInfo.value.rpxRatio;
      common_vendor.index.nextTick(() => {
        const query = common_vendor.index.createSelectorQuery();
        query.select(".drag-list").boundingClientRect((data) => {
          if (!data)
            return;
          const relativeY = pageY - data.top;
          let targetIndex = Math.floor(relativeY / pxItemHeight);
          targetIndex = Math.max(0, Math.min(cateList.value.length - 1, targetIndex));
          if (targetIndex !== dragIndex.value) {
            const dragItem = cateList.value[dragIndex.value];
            if (!dragItem)
              return;
            const newList = [...cateList.value];
            newList.splice(dragIndex.value, 1);
            newList.splice(targetIndex, 0, dragItem);
            cateList.value = newList;
            dragIndex.value = targetIndex;
            try {
              if (common_vendor.index.vibrateShort) {
                common_vendor.index.vibrateShort({
                  success: () => {
                  },
                  fail: () => {
                  }
                });
              }
            } catch (error) {
            }
            startY.value = pageY;
          }
        }).exec();
      });
    };
    const dragEnd = async () => {
      if (isSliding.value && dragIndex.value >= 0) {
        try {
          if (common_vendor.index.vibrateShort) {
            common_vendor.index.vibrateShort({
              success: () => {
              },
              fail: () => {
              }
            });
          }
        } catch (error) {
        }
        common_vendor.index.showLoading({
          title: "保存中...",
          mask: false
        });
        setTimeout(async () => {
          try {
            const updatePromises = cateList.value.map((item, index) => {
              const sortValue = cateList.value.length - index;
              return cateApi.updateSort(item._id, sortValue);
            });
            await Promise.all(updatePromises);
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: "排序已自动保存",
              icon: "success",
              duration: 1500
            });
          } catch (error) {
            common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:486", "自动保存排序失败:", error);
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: "保存排序失败，请重试",
              icon: "none"
            });
          }
        }, 200);
      }
      dragIndex.value = -1;
      isSliding.value = false;
    };
    const handleAddCate = () => {
      common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:506", 1);
      isEdit.value = false;
      cateImage.value = "";
      editValue.value = "";
      isVisible.value = true;
      showPopup.value = true;
    };
    const edit = async (id) => {
      var _a, _b, _c;
      if (!id) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:519", "编辑分类失败：无效的ID");
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
        return;
      }
      try {
        isEdit.value = true;
        currentId.value = id;
        const res = await cateApi.get(id);
        if (res && res.data && res.data[0]) {
          common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:533", res, "单个获取");
          editValue.value = ((_a = res.data[0]) == null ? void 0 : _a.cate_name) || "";
          cateImage.value = ((_b = res.data[0]) == null ? void 0 : _b.cate_img) || "";
          isVisible.value = ((_c = res.data[0]) == null ? void 0 : _c.is_visible) !== false;
          showPopup.value = true;
        } else {
          throw new Error("获取分类详情失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:542", "获取分类信息失败:", error);
        common_vendor.index.showToast({
          title: "获取分类信息失败",
          icon: "none"
        });
        isEdit.value = false;
        currentId.value = "";
      }
    };
    const del = async (id) => {
      if (!id) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:556", "删除分类失败：无效的ID");
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "确认删除",
        content: "是否确认删除该分类？删除后无法恢复",
        confirmText: "删除",
        confirmColor: "#ff0000",
        cancelText: "取消",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({
                title: "删除中...",
                mask: true
              });
              const result = await cateApi.del(id);
              common_vendor.index.hideLoading();
              if (result && result.deleted === 1) {
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success"
                });
                await cateListGet();
              } else {
                throw new Error("删除失败");
              }
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:595", "删除失败:", error);
              common_vendor.index.showToast({
                title: "删除失败: " + (error.message || "未知错误"),
                icon: "none"
              });
            }
          }
        }
      });
    };
    const chooseImage = async () => {
      try {
        const res = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"]
        });
        if (res.tempFilePaths && res.tempFilePaths.length > 0) {
          const tempPath = res.tempFilePaths[0];
          await uploadImage(tempPath);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:623", "选择图片失败:", e);
        if (e.errMsg !== "chooseImage:fail cancel") {
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "none"
          });
        }
      }
    };
    const uploadImage = async (filePath) => {
      try {
        imageUploading.value = true;
        uploadProgress.value = 0;
        const fileInfo = await new Promise((resolve, reject) => {
          common_vendor.index.getFileInfo({
            filePath,
            success: (res) => resolve(res),
            fail: (err) => reject(err)
          });
        });
        let finalFilePath = filePath;
        if (fileInfo.size > 1024 * 1024) {
          finalFilePath = await new Promise((resolve, reject) => {
            common_vendor.index.compressImage({
              src: filePath,
              quality: 80,
              success: (res) => resolve(res.tempFilePath),
              fail: (err) => reject(err)
            });
          });
        }
        const fileExt = finalFilePath.substring(finalFilePath.lastIndexOf(".") + 1).toLowerCase();
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const cloudPath = `cate_icons/${timestamp}_${randomStr}.${fileExt}`;
        const result = await common_vendor.tr.uploadFile({
          filePath: finalFilePath,
          cloudPath,
          onUploadProgress: (progressEvent) => {
            uploadProgress.value = Math.round(progressEvent.loaded / progressEvent.total * 100);
          }
        });
        common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:678", "上传结果:", result);
        if (result.fileID) {
          const tempUrl = await common_vendor.tr.getTempFileURL({
            fileList: [result.fileID]
          });
          common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:686", "临时链接:", tempUrl);
          if (tempUrl.fileList && tempUrl.fileList[0] && tempUrl.fileList[0].tempFileURL) {
            cateImage.value = result.fileID;
            common_vendor.index.showToast({
              title: "图片上传成功",
              icon: "success"
            });
          } else {
            throw new Error("获取临时链接失败");
          }
        } else {
          throw new Error("上传失败");
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:703", "上传图片错误:", e);
        common_vendor.index.showToast({
          title: "图片上传失败: " + (e.message || "未知错误"),
          icon: "none"
        });
      } finally {
        imageUploading.value = false;
      }
    };
    const handleConfirm = async (data) => {
      if (imageUploading.value) {
        common_vendor.index.showToast({
          title: "图片正在上传中，请稍候",
          icon: "none"
        });
        return;
      }
      if (typeof data === "string") {
        data = {
          cate_name: data,
          cate_img: cateImage.value,
          is_visible: isVisible.value
        };
      } else if (!data.cate_img && cateImage.value) {
        data.cate_img = cateImage.value;
      }
      if (isEdit.value) {
        common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:738", "编辑", data);
        const upRes = await cateApi.update(currentId.value, data);
        common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:740", upRes);
        if (upRes.updated === 1) {
          common_vendor.index.showToast({
            title: "更新成功",
            icon: "none"
          });
          cateListGet();
        }
      } else {
        common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:750", "添加", data);
        const res = await cateApi.add(data);
        if (res.id) {
          common_vendor.index.showToast({
            title: "添加成功",
            icon: "none"
          });
          cateListGet();
        }
      }
      currentId.value = "";
      cateImage.value = "";
    };
    const handleCanner = () => {
      showPopup.value = false;
    };
    const toggleVisibility = async (id, currentVisibility) => {
      if (!id) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:773", "切换可见性失败：无效的ID");
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
        return;
      }
      const newVisibility = !currentVisibility;
      try {
        const upRes = await cateApi.update(id, {
          is_visible: newVisibility
        });
        if (upRes && upRes.updated === 1) {
          common_vendor.index.showToast({
            title: newVisibility ? "已启用显示" : "已隐藏分类",
            icon: "none"
          });
          cateListGet();
        } else {
          throw new Error("切换可见性更新失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:800", "切换可见性失败:", error);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      }
    };
    const toggleDragMode = () => {
      if (isDragMode.value) {
        isDragMode.value = false;
        common_vendor.index.showToast({
          title: "已退出排序模式",
          icon: "none"
        });
      } else {
        isDragMode.value = true;
        common_vendor.index.showToast({
          title: "上下滑动排序分类，拖动后自动保存",
          icon: "none",
          duration: 2500
        });
      }
    };
    const formatImageUrl = (imageUrl) => {
      if (!imageUrl || imageUrl === "undefined" || imageUrl === "null") {
        return "/static/images/default.png";
      }
      if (imageUrl.startsWith("cloud://") || imageUrl.startsWith("/static/") || imageUrl.startsWith("http")) {
        return imageUrl;
      }
      if (imageUrl.startsWith("/")) {
        return imageUrl;
      }
      return "/static/images/default.png";
    };
    const handleImageError = (item, e) => {
      if (!item)
        return;
      common_vendor.index.__f__("warn", "at subPages/cateManage/cateManage.vue:893", "图片加载失败:", e);
      item.cate_img = "/static/images/default.png";
    };
    const hideAllCategories = async () => {
      if (batchOperationLoading.value)
        return;
      if (!cateList.value || cateList.value.length === 0) {
        common_vendor.index.showToast({
          title: "没有可隐藏的分类",
          icon: "none"
        });
        return;
      }
      const visibleCategories = cateList.value.filter((item) => item && item.is_visible !== false);
      if (visibleCategories.length === 0) {
        common_vendor.index.showToast({
          title: "所有分类已经是隐藏状态",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "确认隐藏",
        content: `是否隐藏所有分类？将有 ${visibleCategories.length} 个分类被隐藏，隐藏后分类将不会在前台显示。`,
        confirmText: "隐藏全部",
        confirmColor: "#399bfe",
        cancelText: "取消",
        success: async (res) => {
          if (res.confirm) {
            try {
              batchOperationLoading.value = true;
              common_vendor.index.showLoading({
                title: "处理中...",
                mask: true
              });
              const BATCH_SIZE = 10;
              let successCount = 0;
              const totalCount = visibleCategories.length;
              for (let i = 0; i < totalCount; i += BATCH_SIZE) {
                const batch = visibleCategories.slice(i, i + BATCH_SIZE);
                common_vendor.index.showLoading({
                  title: `处理中 ${i + 1}-${Math.min(i + BATCH_SIZE, totalCount)}/${totalCount}...`,
                  mask: true
                });
                const batchPromises = batch.map(
                  (item) => cateApi.update(item._id, { is_visible: false }).then(() => successCount++).catch((error) => {
                    common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:958", `更新分类 ${item._id} 失败:`, error);
                    return null;
                  })
                );
                await Promise.all(batchPromises);
              }
              common_vendor.index.hideLoading();
              if (successCount === totalCount) {
                common_vendor.index.showToast({
                  title: `已隐藏全部 ${successCount} 个分类`,
                  icon: "success",
                  duration: 2e3
                });
              } else {
                common_vendor.index.showModal({
                  title: "操作结果",
                  content: `成功隐藏 ${successCount}/${totalCount} 个分类，部分操作可能失败，请刷新后检查。`,
                  showCancel: false,
                  confirmText: "确定"
                });
              }
              await cateListGet();
            } catch (error) {
              common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:990", "批量隐藏分类失败:", error);
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "操作失败，请重试",
                icon: "none"
              });
            } finally {
              batchOperationLoading.value = false;
            }
          }
        }
      });
    };
    const showAllCategories = async () => {
      if (batchOperationLoading.value)
        return;
      if (!cateList.value || cateList.value.length === 0) {
        common_vendor.index.showToast({
          title: "没有可显示的分类",
          icon: "none"
        });
        return;
      }
      const hiddenCategories = cateList.value.filter((item) => item && item.is_visible === false);
      if (hiddenCategories.length === 0) {
        common_vendor.index.showToast({
          title: "所有分类已经是显示状态",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "确认显示",
        content: `是否显示所有分类？将有 ${hiddenCategories.length} 个分类被显示，显示后分类将会在前台可见。`,
        confirmText: "显示全部",
        confirmColor: "#399bfe",
        cancelText: "取消",
        success: async (res) => {
          if (res.confirm) {
            try {
              batchOperationLoading.value = true;
              common_vendor.index.showLoading({
                title: "处理中...",
                mask: true
              });
              const BATCH_SIZE = 10;
              let successCount = 0;
              const totalCount = hiddenCategories.length;
              for (let i = 0; i < totalCount; i += BATCH_SIZE) {
                const batch = hiddenCategories.slice(i, i + BATCH_SIZE);
                common_vendor.index.showLoading({
                  title: `处理中 ${i + 1}-${Math.min(i + BATCH_SIZE, totalCount)}/${totalCount}...`,
                  mask: true
                });
                const batchPromises = batch.map(
                  (item) => cateApi.update(item._id, { is_visible: true }).then(() => successCount++).catch((error) => {
                    common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:1064", `更新分类 ${item._id} 失败:`, error);
                    return null;
                  })
                );
                await Promise.all(batchPromises);
              }
              common_vendor.index.hideLoading();
              if (successCount === totalCount) {
                common_vendor.index.showToast({
                  title: `已显示全部 ${successCount} 个分类`,
                  icon: "success",
                  duration: 2e3
                });
              } else {
                common_vendor.index.showModal({
                  title: "操作结果",
                  content: `成功显示 ${successCount}/${totalCount} 个分类，部分操作可能失败，请刷新后检查。`,
                  showCancel: false,
                  confirmText: "确定"
                });
              }
              await cateListGet();
            } catch (error) {
              common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:1096", "批量显示分类失败:", error);
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "操作失败，请重试",
                icon: "none"
              });
            } finally {
              batchOperationLoading.value = false;
            }
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: showOrdinalMode.value ? 1 : "",
        b: common_vendor.o(toggleOrdinalMode),
        c: common_vendor.t(isDragMode.value ? "退出排序" : "滑动排序"),
        d: isDragMode.value ? 1 : "",
        e: common_vendor.o(toggleDragMode),
        f: !loading.value && cateList.value.length > 0 && !isDragMode.value && !showOrdinalMode.value
      }, !loading.value && cateList.value.length > 0 && !isDragMode.value && !showOrdinalMode.value ? {
        g: common_vendor.p({
          type: "eye-filled",
          size: "18",
          color: "#399bfe"
        }),
        h: common_vendor.o(showAllCategories),
        i: common_vendor.p({
          type: "eye-slash-filled",
          size: "18",
          color: "#666"
        }),
        j: common_vendor.o(hideAllCategories)
      } : {}, {
        k: loading.value
      }, loading.value ? {
        l: common_vendor.p({
          type: "spinner-cycle",
          size: "30",
          color: "#399bfe"
        })
      } : cateList.value.length === 0 ? {
        n: common_vendor.p({
          type: "info",
          size: "50",
          color: "#999"
        })
      } : common_vendor.e({
        o: showOrdinalMode.value
      }, showOrdinalMode.value ? common_vendor.e({
        p: common_vendor.o(cancelOrdinalSort),
        q: common_vendor.o(saveOrdinalSort),
        r: previewSortedList.value.length > 0
      }, previewSortedList.value.length > 0 ? {} : {}, {
        s: common_vendor.f(previewSortedList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: formatImageUrl(item && item.cate_img),
            b: common_vendor.o((e) => handleImageError(item, e), item._id),
            c: common_vendor.o(() => {
            }, item._id),
            d: common_vendor.t(item ? item.cate_name : ""),
            e: item && !item.is_visible
          }, item && !item.is_visible ? {} : item ? {} : {}, {
            f: item,
            g: !item.is_visible ? 1 : "",
            h: "1eceedb2-4-" + i0,
            i: common_vendor.o(($event) => adjustOrdinalValue(item._id, -1), item._id),
            j: ordinalValues.value[item._id],
            k: common_vendor.o((e) => debouncedUpdateOrdinal(item._id, e.detail.value), item._id),
            l: "1eceedb2-5-" + i0,
            m: common_vendor.o(($event) => adjustOrdinalValue(item._id, 1), item._id),
            n: item._id
          });
        }),
        t: common_vendor.p({
          type: "minus",
          size: "20",
          color: "#666"
        }),
        v: common_vendor.p({
          type: "plus",
          size: "20",
          color: "#399bfe"
        })
      }) : !isDragMode.value ? {
        x: common_vendor.f(sortedCateList.value, (item, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.sort_order || sortedCateList.value.length - index),
            b: formatImageUrl(item && item.cate_img),
            c: common_vendor.o((e) => handleImageError(item, e), item._id),
            d: common_vendor.o(() => {
            }, item._id),
            e: common_vendor.t(item ? item.cate_name : ""),
            f: item && !item.is_visible
          }, item && !item.is_visible ? {} : item ? {} : {}, {
            g: item,
            h: !item.is_visible ? 1 : "",
            i: item && item.is_visible !== false,
            j: common_vendor.o(() => toggleVisibility(item._id, item && item.is_visible !== false), item._id),
            k: common_vendor.o(($event) => edit(item._id), item._id),
            l: "1eceedb2-6-" + i0,
            m: common_vendor.o(($event) => del(item._id), item._id),
            n: "1eceedb2-7-" + i0,
            o: item._id
          });
        }),
        y: common_vendor.p({
          color: "#399bfe",
          type: "compose",
          size: "22"
        }),
        z: common_vendor.p({
          color: "#e65c00",
          ["custom-prefix"]: "iconfont",
          type: "icon-shanchu1",
          size: "20"
        })
      } : {
        A: common_vendor.f(cateList.value, (item, index, i0) => {
          return common_vendor.e({
            a: formatImageUrl(item && item.cate_img),
            b: common_vendor.o((e) => handleImageError(item, e), item && item._id ? item._id : index),
            c: common_vendor.o(() => {
            }, item && item._id ? item._id : index),
            d: common_vendor.t(item ? item.cate_name : ""),
            e: item && !item.is_visible
          }, item && !item.is_visible ? {} : item ? {} : {}, {
            f: item,
            g: item && !item.is_visible ? 1 : "",
            h: "1eceedb2-8-" + i0,
            i: dragIndex.value === index ? 1 : "",
            j: item && item._id ? item._id : index,
            k: index * dragItemHeight.value,
            l: dragIndex.value === index ? 10 : 1,
            m: dragIndex.value === index ? "none" : "transform 0.3s ease, background-color 0.2s ease",
            n: dragIndex.value === index ? "scale(1.02)" : "scale(1)",
            o: dragIndex.value === index ? false : true,
            p: common_vendor.o((e) => dragStart(index, e), item && item._id ? item._id : index),
            q: common_vendor.o(dragMove, item && item._id ? item._id : index),
            r: common_vendor.o(dragEnd, item && item._id ? item._id : index),
            s: common_vendor.o(dragEnd, item && item._id ? item._id : index),
            t: dragIndex.value === index ? 1 : ""
          });
        }),
        B: common_vendor.p({
          type: "bars",
          size: "22",
          color: "#999"
        }),
        C: dragItemHeight.value + "rpx",
        D: cateList.value.length * dragItemHeight.value + "rpx"
      }, {
        w: !isDragMode.value,
        E: isDragMode.value ? 1 : "",
        F: showOrdinalMode.value ? 1 : "",
        G: scrollTop.value,
        H: common_vendor.o(handleScroll),
        I: scrollViewId.value
      }), {
        m: cateList.value.length === 0,
        J: common_vendor.o(chooseImage),
        K: common_vendor.o(handleConfirm),
        L: common_vendor.o(handleCanner),
        M: common_vendor.p({
          show: showPopup.value,
          title: isEdit.value ? "编辑分类" : "添加分类",
          ["edit-value"]: editValue.value,
          ["image-url"]: cateImage.value,
          ["image-uploading"]: imageUploading.value,
          ["upload-progress"]: uploadProgress.value,
          ["is-visible"]: isVisible.value
        }),
        N: common_vendor.o(handleAddCate),
        O: common_vendor.p({
          icon: "plus",
          size: 100,
          position: {
            bottom: "120rpx",
            right: "40rpx"
          }
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1eceedb2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/subPages/cateManage/cateManage.js.map
