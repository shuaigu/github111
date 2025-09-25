"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "articleDetail-choujia",
  props: {
    commenters: {
      type: Array,
      default: () => []
    },
    articleId: {
      type: String,
      default: ""
    }
  },
  emits: ["lottery-result", "show-comment", "position-updated"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    common_vendor.ref(true);
    const emit = __emit;
    const participantsList = common_vendor.reactive([]);
    const gridPositions = common_vendor.reactive(Array(9).fill(null));
    const isPositionsLoading = common_vendor.ref(false);
    const isSavingPositions = common_vendor.ref(false);
    const displayUsers = common_vendor.computed(() => {
      const result = [];
      for (let i = 0; i < 9; i++) {
        if (gridPositions[i]) {
          result.push(gridPositions[i]);
        } else {
          result.push({});
        }
      }
      return result;
    });
    const userProbability = common_vendor.computed(() => {
      if (participantsList.length === 0)
        return 0;
      const probability = (100 / participantsList.length).toFixed(2);
      return probability;
    });
    const currentIndex = common_vendor.ref(-1);
    const winnerIndex = common_vendor.ref(-1);
    const showResult = common_vendor.ref(false);
    const isRotating = common_vendor.ref(false);
    const winner = common_vendor.ref(null);
    const probabilityInfo = common_vendor.ref([]);
    const commenterCount = common_vendor.computed(() => {
      let count = 0;
      for (let i = 0; i < 9; i++) {
        if (gridPositions[i] && (gridPositions[i].avatarUrl || gridPositions[i]._id)) {
          count++;
        }
      }
      return count;
    });
    const currentTime = common_vendor.ref("");
    const hasLoaded = common_vendor.ref(false);
    common_vendor.watch(() => props.commenters, (newVal) => {
      if (newVal && newVal.length > 0) {
        showResult.value = false;
        winner.value = null;
        winnerIndex.value = -1;
        updateParticipantsList();
      }
    }, { deep: true });
    let timer = null;
    const getUserDisplayName = (user) => {
      if (!user)
        return "";
      return user.nickName || user.mobile || "匿名用户";
    };
    const loadGridPositionsFromCloud = async () => {
      if (hasLoaded.value) {
        common_vendor.index.__f__("log", "at components/articleDetail-choujia/articleDetail-choujia.vue:211", "已经加载过位置数据，跳过重复加载");
        return true;
      }
      if (!props.articleId) {
        common_vendor.index.__f__("warn", "at components/articleDetail-choujia/articleDetail-choujia.vue:217", "没有文章ID，无法加载位置数据");
        return false;
      }
      try {
        isPositionsLoading.value = true;
        const choujiangWx = common_vendor.tr.importObject("choujiangWx");
        const result = await choujiangWx.getGridPositions(props.articleId);
        if (result.success && result.gridPositions) {
          common_vendor.index.__f__("log", "at components/articleDetail-choujia/articleDetail-choujia.vue:229", "从云端加载的位置数据:", result.gridPositions);
          for (let i = 0; i < 9; i++) {
            gridPositions[i] = null;
          }
          result.gridPositions.forEach((userData, index) => {
            if (userData && index < 9) {
              gridPositions[index] = userData;
            }
          });
          hasLoaded.value = true;
          return true;
        } else {
          common_vendor.index.__f__("log", "at components/articleDetail-choujia/articleDetail-choujia.vue:247", "没有找到保存的位置数据或加载失败");
          return false;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at components/articleDetail-choujia/articleDetail-choujia.vue:251", "加载位置数据失败:", error);
        return false;
      } finally {
        isPositionsLoading.value = false;
      }
    };
    const saveGridPositionsToCloud = async () => {
      if (!props.articleId) {
        common_vendor.index.__f__("warn", "at components/articleDetail-choujia/articleDetail-choujia.vue:262", "没有文章ID，无法保存位置数据");
        return false;
      }
      try {
        if (isSavingPositions.value) {
          return false;
        }
        isSavingPositions.value = true;
        const positionsToSave = [...gridPositions];
        const choujiangWx = common_vendor.tr.importObject("choujiangWx");
        const result = await choujiangWx.saveGridPositions({
          articleId: props.articleId,
          positions: positionsToSave
        });
        if (result.success) {
          common_vendor.index.__f__("log", "at components/articleDetail-choujia/articleDetail-choujia.vue:285", "位置数据保存成功");
          return true;
        } else {
          common_vendor.index.__f__("warn", "at components/articleDetail-choujia/articleDetail-choujia.vue:288", "位置数据保存失败:", result.message);
          return false;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at components/articleDetail-choujia/articleDetail-choujia.vue:292", "保存位置数据失败:", error);
        return false;
      } finally {
        isSavingPositions.value = false;
      }
    };
    const updateParticipantsList = async () => {
      try {
        participantsList.length = 0;
        const availableCommenters = [...props.commenters].slice(0, 9);
        availableCommenters.forEach((commenter) => {
          participantsList.push(commenter);
        });
        const cloudPositionsLoaded = await loadGridPositionsFromCloud();
        if (!cloudPositionsLoaded) {
          const occupiedPositions = /* @__PURE__ */ new Set();
          const existingPositions = /* @__PURE__ */ new Map();
          for (let i = 0; i < 9; i++) {
            if (gridPositions[i] && gridPositions[i]._id) {
              occupiedPositions.add(i);
              existingPositions.set(gridPositions[i]._id, i);
            }
          }
          participantsList.forEach((user) => {
            if (user._id && existingPositions.has(user._id)) {
              const position = existingPositions.get(user._id);
              gridPositions[position] = user;
              occupiedPositions.add(position);
            }
          });
          let nextFreePosition = 0;
          participantsList.forEach((user) => {
            if (user._id && !existingPositions.has(user._id)) {
              while (nextFreePosition < 9 && occupiedPositions.has(nextFreePosition)) {
                nextFreePosition++;
              }
              if (nextFreePosition < 9) {
                gridPositions[nextFreePosition] = user;
                occupiedPositions.add(nextFreePosition);
                nextFreePosition++;
              }
            }
          });
          saveGridPositionsToCloud();
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at components/articleDetail-choujia/articleDetail-choujia.vue:366", "更新用户展示失败:", error);
        common_vendor.index.showToast({
          title: "初始化失败，请重试",
          icon: "none"
        });
      }
    };
    const initParticipantsList = updateParticipantsList;
    const handleCommentClick = (index) => {
      common_vendor.index.__f__("log", "at components/articleDetail-choujia/articleDetail-choujia.vue:379", "触发点击参与事件，位置索引:", index);
      if (isRotating.value) {
        common_vendor.index.__f__("log", "at components/articleDetail-choujia/articleDetail-choujia.vue:383", "当前正在抽奖中，不能参与");
        common_vendor.index.showToast({
          title: "抽奖进行中，请稍后",
          icon: "none"
        });
        return;
      }
      if (showResult.value) {
        common_vendor.index.__f__("log", "at components/articleDetail-choujia/articleDetail-choujia.vue:393", "已显示抽奖结果，不能再参与");
        common_vendor.index.showToast({
          title: "抽奖已完成",
          icon: "none"
        });
        return;
      }
      if (gridPositions[index] && gridPositions[index]._id) {
        common_vendor.index.__f__("log", "at components/articleDetail-choujia/articleDetail-choujia.vue:403", "该位置已有用户数据，无法修改");
        common_vendor.index.showToast({
          title: "该位置已被占用",
          icon: "none"
        });
        return;
      }
      common_vendor.index.__f__("log", "at components/articleDetail-choujia/articleDetail-choujia.vue:415", "发送评论事件到父组件，位置:", index);
      emit("show-comment", { position: index });
    };
    const updatePosition = async (position, userData) => {
      if (position >= 0 && position < 9) {
        const currentGridState = [...gridPositions];
        gridPositions[position] = userData;
        const existingUserIndex = participantsList.findIndex(
          (user) => user._id === userData._id || user.user_id === userData.user_id && user.user_id
        );
        if (existingUserIndex === -1) {
          participantsList.push(userData);
        } else {
          participantsList[existingUserIndex] = userData;
        }
        for (let i = 0; i < 9; i++) {
          if (gridPositions[i] !== currentGridState[i]) {
            gridPositions[i] = gridPositions[i];
          }
        }
        await saveGridPositionsToCloud();
        emit("position-updated", {
          position,
          userData
        });
      }
    };
    __expose({
      updatePosition,
      getPositionById,
      clearPosition
    });
    function getPositionById(commentId) {
      if (!commentId)
        return -1;
      for (let i = 0; i < 9; i++) {
        if (gridPositions[i] && gridPositions[i]._id === commentId) {
          return i;
        }
      }
      return -1;
    }
    async function clearPosition(position) {
      if (position >= 0 && position < 9) {
        const currentGridState = [...gridPositions];
        gridPositions[position] = {};
        for (let i = 0; i < 9; i++) {
          if (gridPositions[i] !== currentGridState[i]) {
            gridPositions[i] = gridPositions[i];
          }
        }
        refreshParticipantsList();
        await saveGridPositionsToCloud();
        return true;
      }
      return false;
    }
    function refreshParticipantsList() {
      participantsList.length = 0;
      for (let i = 0; i < 9; i++) {
        if (gridPositions[i] && gridPositions[i]._id) {
          const existingUserIndex = participantsList.findIndex(
            (user) => user._id === gridPositions[i]._id
          );
          if (existingUserIndex === -1) {
            participantsList.push(gridPositions[i]);
          }
        }
      }
    }
    const startLottery = async () => {
      if (isRotating.value) {
        return stopLottery();
      }
      if (props.commenters.length === 0) {
        common_vendor.index.showToast({
          title: "暂无评论者参与",
          icon: "none"
        });
        return;
      }
      isRotating.value = true;
      currentIndex.value = -1;
      winnerIndex.value = -1;
      winner.value = null;
      showResult.value = false;
      try {
        let platformInfo = {};
        let sceneValue = "";
        try {
          if (common_vendor.index.getAppBaseInfo) {
            const appInfo = common_vendor.index.getAppBaseInfo();
            platformInfo = {
              platform: appInfo.platform,
              osName: appInfo.osName,
              appVersion: appInfo.appVersion
            };
          } else {
            const sysInfo = common_vendor.index.getSystemInfoSync();
            platformInfo = {
              platform: sysInfo.platform,
              osName: sysInfo.osName || sysInfo.system
            };
          }
          const launchOptions = common_vendor.index.getLaunchOptionsSync ? common_vendor.index.getLaunchOptionsSync() : {};
          sceneValue = launchOptions.scene || "";
        } catch (e) {
          common_vendor.index.__f__("error", "at components/articleDetail-choujia/articleDetail-choujia.vue:580", "获取系统信息失败", e);
        }
        const userInfo = {
          platformInfo,
          scene: sceneValue,
          time: Date.now(),
          isLotteryAction: true,
          // 添加标记，表明这是抽奖操作
          equalProbability: true
          // 标记使用相同概率
        };
        const choujiangWx = common_vendor.tr.importObject("choujiangWx");
        const lotteryResult = await choujiangWx.doLottery({
          commenters: participantsList,
          userId: common_vendor.index.getStorageSync("userId") || "",
          userInfo,
          articleId: props.articleId
          // 传递文章ID，用于保存抽奖结果
        });
        if (!lotteryResult.success) {
          throw new Error(lotteryResult.message || "抽奖失败");
        }
        winner.value = lotteryResult.winner;
        winnerIndex.value = lotteryResult.winnerIndex < 9 ? lotteryResult.winnerIndex : lotteryResult.winnerIndex % 9;
        probabilityInfo.value = lotteryResult.probabilityInfo || [];
        startRotation();
      } catch (error) {
        common_vendor.index.__f__("error", "at components/articleDetail-choujia/articleDetail-choujia.vue:616", "抽奖执行失败:", error);
        common_vendor.index.showToast({
          title: "抽奖失败，请重试",
          icon: "none"
        });
        isRotating.value = false;
      }
    };
    const stopLottery = () => {
      if (!isRotating.value)
        return;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      isRotating.value = false;
      currentIndex.value = winnerIndex.value;
      const now = /* @__PURE__ */ new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const day = now.getDate().toString().padStart(2, "0");
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      currentTime.value = `${year}年${month}月${day}日 ${hours}:${minutes}`;
      showResult.value = true;
      if (winner.value) {
        handleLotteryResult(winner.value);
      }
    };
    const getBtnText = () => {
      if (!isRotating.value) {
        return "开始抽奖";
      } else {
        return "停止抽奖";
      }
    };
    const handleLotteryBtn = () => {
      startLottery();
    };
    const startRotation = () => {
      if (timer)
        clearTimeout(timer);
      let rotationSpeed = 120;
      let currentPosition = currentIndex.value;
      let rotationDuration = 0;
      const startTime = Date.now();
      const minSpeed = 100;
      const maxSpeed = 140;
      const runAnimation = () => {
        if (!isRotating.value)
          return;
        if (timer)
          clearTimeout(timer);
        rotationDuration = Date.now() - startTime;
        const phase = rotationDuration / 2e3;
        const speedVariation = (Math.cos(phase) + 1) / 2;
        rotationSpeed = minSpeed + speedVariation * (maxSpeed - minSpeed);
        currentPosition = (currentPosition + 1) % 9;
        currentIndex.value = currentPosition;
        timer = setTimeout(runAnimation, Math.floor(rotationSpeed));
      };
      runAnimation();
    };
    const closeResult = () => {
      showResult.value = false;
      isRotating.value = false;
      currentIndex.value = -1;
    };
    const formatTime = (timestamp) => {
      if (!timestamp)
        return "";
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
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日`;
    };
    const handleLotteryResult = async (result) => {
      if (result && typeof result === "object") {
        if (result.nickName) {
          try {
            const resultWithMark = {
              ...result,
              isLotteryResult: true
            };
            const lotteryData = {
              article_id: props.articleId,
              winner_id: result._id || result.user_id || "",
              winner_name: result.nickName || "匿名用户",
              winner_avatar: result.avatarUrl || "",
              winner_mobile: result.mobile || "",
              winner_content: result.content || "",
              winner_index: winnerIndex.value,
              draw_time: Date.now(),
              participant_count: participantsList.length || 0
            };
            const choujiangWx = common_vendor.tr.importObject("choujiangWx");
            const saveResult = await choujiangWx.saveLotteryResult(lotteryData);
            if (saveResult && saveResult.success) {
              common_vendor.index.__f__("log", "at components/articleDetail-choujia/articleDetail-choujia.vue:784", "抽奖结果保存成功:", saveResult);
              showResult.value = true;
              isRotating.value = false;
              emit("lottery-result", resultWithMark);
            } else {
              common_vendor.index.__f__("error", "at components/articleDetail-choujia/articleDetail-choujia.vue:793", "抽奖结果保存失败:", (saveResult == null ? void 0 : saveResult.message) || "未知错误");
              throw new Error((saveResult == null ? void 0 : saveResult.message) || "抽奖结果保存失败");
            }
          } catch (error) {
            common_vendor.index.__f__("error", "at components/articleDetail-choujia/articleDetail-choujia.vue:797", "保存抽奖结果出错:", error);
            common_vendor.index.showToast({
              title: "抽奖完成，但结果保存失败",
              icon: "none",
              duration: 2e3
            });
            showResult.value = true;
            isRotating.value = false;
            emit("lottery-result", result);
          }
        } else {
          common_vendor.index.__f__("error", "at components/articleDetail-choujia/articleDetail-choujia.vue:814", "抽奖结果缺少用户信息:", result);
          isRotating.value = false;
          common_vendor.index.showToast({
            title: "抽奖结果异常",
            icon: "none"
          });
        }
      } else {
        common_vendor.index.__f__("error", "at components/articleDetail-choujia/articleDetail-choujia.vue:823", "抽奖结果无效:", result);
        isRotating.value = false;
        common_vendor.index.showToast({
          title: "抽奖结果无效",
          icon: "none"
        });
      }
    };
    common_vendor.onMounted(async () => {
      let hasContent = false;
      for (let i = 0; i < 9; i++) {
        if (gridPositions[i] !== null) {
          hasContent = true;
          break;
        }
      }
      if (!hasContent) {
        for (let i = 0; i < 9; i++) {
          gridPositions[i] = null;
        }
      }
      const loaded = await loadGridPositionsFromCloud();
      if (!loaded) {
        initParticipantsList();
      }
      return () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(commenterCount.value),
        b: commenterCount.value < 9
      }, commenterCount.value < 9 ? {
        c: common_vendor.t(9 - commenterCount.value)
      } : {}, {
        d: common_vendor.f(displayUsers.value, (user, index, i0) => {
          return common_vendor.e({
            a: user.avatarUrl
          }, user.avatarUrl ? {
            b: user.avatarUrl
          } : {
            c: common_vendor.o(($event) => handleCommentClick(index), index)
          }, {
            d: user.nickName
          }, user.nickName ? {
            e: common_vendor.t(user.nickName)
          } : user._id ? {
            g: common_vendor.t(getUserDisplayName(user))
          } : {}, {
            f: user._id,
            h: index,
            i: common_vendor.n({
              "active": currentIndex.value === index,
              "winner": winnerIndex.value === index && showResult.value
            })
          });
        }),
        e: common_vendor.t(userProbability.value),
        f: common_vendor.t(getBtnText()),
        g: common_vendor.o(handleLotteryBtn),
        h: isRotating.value ? 1 : "",
        i: showResult.value && winner.value
      }, showResult.value && winner.value ? common_vendor.e({
        j: winner.value
      }, winner.value ? common_vendor.e({
        k: common_vendor.t(currentTime.value),
        l: winner.value.avatarUrl || "/static/images/default-avatar.png",
        m: common_vendor.t(getUserDisplayName(winner.value)),
        n: winner.value.create_time
      }, winner.value.create_time ? {
        o: common_vendor.t(formatTime(winner.value.create_time))
      } : {}) : {}, {
        p: common_vendor.t(userProbability.value),
        q: common_vendor.o(closeResult)
      }) : {}, {
        r: common_vendor.gei(_ctx, "")
      });
    };
  }
};
wx.createComponent(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/articleDetail-choujia/articleDetail-choujia.js.map
