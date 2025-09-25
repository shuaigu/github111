"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "subChoujiang",
  setup(__props) {
    const showSettings = common_vendor.ref(false);
    const showManualInput = common_vendor.ref(false);
    const isManualMode = common_vendor.ref(false);
    const prizes = common_vendor.ref([]);
    const sequence = common_vendor.ref([]);
    const currentIndex = common_vendor.ref(-1);
    const isRunning = common_vendor.ref(false);
    const timer = common_vendor.ref(null);
    const speed = common_vendor.ref(100);
    const times = common_vendor.ref(0);
    const cycle = common_vendor.ref(50);
    const targetIndex = common_vendor.ref(0);
    const lotteryResult = common_vendor.ref(null);
    const isLoading = common_vendor.ref(true);
    const prizeResult = common_vendor.ref(null);
    const selectedPrizeIndex = common_vendor.ref(0);
    const customPrize = common_vendor.ref("");
    const manualTargetIndex = common_vendor.ref(-1);
    const prizeTypes = [
      { id: "empty", name: "谢谢参与" },
      { id: "small", name: "小额奖品" },
      { id: "medium", name: "中额奖品" },
      { id: "large", name: "大额奖品" }
    ];
    const prizeTypeIndex = common_vendor.reactive({});
    const probability = common_vendor.reactive({
      empty: 0.4,
      // 谢谢参与概率: 40%（原60%）
      small: 0.35,
      // 小额奖品概率: 35%（原25%）
      medium: 0.15,
      // 中额奖品概率: 15%（原10%）
      large: 0.1
      // 大额奖品概率: 10%（原5%）
    });
    const prizeSelectOptions = common_vendor.computed(() => {
      if (!prizes.value || prizes.value.length === 0)
        return [];
      return prizes.value.filter((prize) => prize && prize.type !== "center").map((prize) => prize.name);
    });
    const isProbabilityValid = common_vendor.computed(() => {
      return Math.abs(getTotalProbability() - 100) < 0.1;
    });
    const initData = async () => {
      try {
        isLoading.value = true;
        const res = await common_vendor.tr.callFunction({
          name: "choujiangWx",
          data: {
            method: "getPrizes"
          }
        });
        if (res && res.result && res.result.success) {
          prizes.value = res.result.prizes || [];
          sequence.value = res.result.sequence || [];
          if (res.result.probabilityConfig) {
            Object.assign(probability, res.result.probabilityConfig);
          }
          initPrizeTypeIndex();
        } else {
          common_vendor.index.showToast({
            title: res && res.result ? res.result.message || "获取奖品数据失败" : "获取奖品数据失败",
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.showToast({
          title: "获取奖品数据失败",
          icon: "none"
        });
        common_vendor.index.__f__("error", "at subPages/subChoujiang/subChoujiang.vue:200", e);
      } finally {
        isLoading.value = false;
      }
    };
    const initPrizeTypeIndex = () => {
      prizes.value.forEach((prize, index) => {
        if (!prize)
          return;
        if (prize.type === "center") {
          prizeTypeIndex[index] = -1;
        } else {
          const type = prize.prizeType || (prize.type === "empty" ? "empty" : "small");
          const typeIdx = prizeTypes.findIndex((item) => item.id === type);
          prizeTypeIndex[index] = typeIdx >= 0 ? typeIdx : 0;
        }
      });
    };
    const getTotalProbability = () => {
      const total = probability.empty + probability.small + probability.medium + probability.large;
      return (total * 100).toFixed(1);
    };
    const updateProbability = (type, value) => {
      probability[type] = value;
    };
    const changePrizeType = (index, event) => {
      const typeIndex = event.detail.value;
      prizeTypeIndex[index] = typeIndex;
      if (!prizes.value[index])
        return;
      const typeId = prizeTypes[typeIndex].id;
      if (typeId === "empty") {
        prizes.value[index].type = "empty";
      } else {
        prizes.value[index].type = "reward";
      }
      prizes.value[index].prizeType = typeId;
    };
    const confirmManualPrize = () => {
      isManualMode.value = true;
      if (customPrize.value) {
        const validIndices = [0, 1, 2, 3, 5, 6, 7, 8];
        const randomIndex = Math.floor(Math.random() * validIndices.length);
        manualTargetIndex.value = sequence.value.findIndex((item) => item === validIndices[randomIndex]);
        const tempPrize = {
          name: customPrize.value,
          type: "reward",
          prizeType: "custom"
        };
        prizeResult.value = {
          success: true,
          prize: tempPrize,
          selectedIndex: validIndices[randomIndex],
          targetPosition: manualTargetIndex.value
        };
      } else {
        const allPrizes = prizes.value.filter((prize) => prize && prize.type !== "center");
        if (allPrizes.length > 0 && selectedPrizeIndex.value < allPrizes.length) {
          const selectedPrize = allPrizes[selectedPrizeIndex.value];
          const prizeIndex = prizes.value.findIndex((p) => p && p.name === selectedPrize.name);
          if (prizeIndex >= 0) {
            manualTargetIndex.value = sequence.value.findIndex((item) => item === prizeIndex);
            prizeResult.value = {
              success: true,
              prize: selectedPrize,
              selectedIndex: prizeIndex,
              targetPosition: manualTargetIndex.value
            };
          }
        }
      }
      showManualInput.value = false;
      common_vendor.index.showToast({
        title: "奖品已指定",
        icon: "success"
      });
    };
    const saveSettings = async () => {
      if (!isProbabilityValid.value) {
        common_vendor.index.showToast({
          title: "概率总和必须为100%",
          icon: "none"
        });
        return;
      }
      try {
        const res = await common_vendor.tr.callFunction({
          name: "choujiangWx",
          data: {
            method: "updateProbability",
            data: {
              probability
            }
          }
        });
        if (res && res.result && res.result.success) {
          showSettings.value = false;
          common_vendor.index.showToast({
            title: "设置已保存",
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({
            title: res && res.result ? res.result.message || "保存失败" : "保存失败",
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.showToast({
          title: "保存设置失败",
          icon: "none"
        });
        common_vendor.index.__f__("error", "at subPages/subChoujiang/subChoujiang.vue:347", e);
      }
    };
    const startLottery = async (prize, index) => {
      if (!prize || prize.type !== "center" || isRunning.value) {
        return;
      }
      lotteryResult.value = null;
      try {
        if (isManualMode.value && prizeResult.value) {
          targetIndex.value = prizeResult.value.targetPosition >= 0 ? prizeResult.value.targetPosition : 0;
          isRunning.value = true;
          times.value = 0;
          speed.value = 100;
          runLottery();
        } else {
          isManualMode.value = false;
          const res = await common_vendor.tr.callFunction({
            name: "choujiangWx",
            data: {
              method: "doLottery",
              data: {
                userId: "test-user"
                // 这里可以传入用户ID等信息
              }
            }
          });
          if (res && res.result && res.result.success) {
            targetIndex.value = res.result.targetPosition;
            isRunning.value = true;
            times.value = 0;
            speed.value = 100;
            runLottery();
            prizeResult.value = res.result;
          } else {
            common_vendor.index.showToast({
              title: res && res.result ? res.result.message || "抽奖失败" : "抽奖失败",
              icon: "none"
            });
          }
        }
      } catch (e) {
        common_vendor.index.showToast({
          title: "抽奖失败，请重试",
          icon: "none"
        });
        common_vendor.index.__f__("error", "at subPages/subChoujiang/subChoujiang.vue:412", e);
      }
    };
    const runLottery = () => {
      timer.value = setTimeout(() => {
        times.value++;
        let index = times.value % sequence.value.length;
        currentIndex.value = sequence.value[index];
        if (times.value < cycle.value) {
          speed.value -= 10;
          if (speed.value < 40) {
            speed.value = 40;
          }
        } else if (times.value > cycle.value + 10 && (index > targetIndex.value && targetIndex.value === 0 || index === targetIndex.value)) {
          speed.value += 110;
        } else {
          speed.value += 20;
        }
        if (times.value > cycle.value + 10 && index === targetIndex.value) {
          clearTimeout(timer.value);
          isRunning.value = false;
          showResult();
        } else {
          runLottery();
        }
      }, speed.value);
    };
    const showResult = () => {
      if (prizeResult.value && prizeResult.value.prize) {
        const prize = prizeResult.value.prize;
        let message = "";
        if (prize.type === "empty") {
          message = "很遗憾，谢谢参与！";
        } else {
          message = `恭喜您获得${prize.name}！`;
        }
        lotteryResult.value = {
          prize,
          message
        };
      } else {
        const prize = prizes.value[currentIndex.value];
        if (!prize)
          return;
        let message = "";
        if (prize.type === "empty") {
          message = "很遗憾，谢谢参与！";
        } else {
          message = `恭喜您获得${prize.name}！`;
        }
        lotteryResult.value = {
          prize,
          message
        };
      }
    };
    const resetLottery = () => {
      currentIndex.value = -1;
      lotteryResult.value = null;
      if (isManualMode.value) {
        isManualMode.value = false;
        prizeResult.value = null;
        customPrize.value = "";
      }
    };
    common_vendor.onMounted(() => {
      initData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: showSettings.value
      }, showSettings.value ? common_vendor.e({
        b: common_vendor.o(($event) => showSettings.value = false),
        c: _ctx.prize && _ctx.prize.type !== "center"
      }, _ctx.prize && _ctx.prize.type !== "center" ? {
        d: common_vendor.f(prizes.value, (prize, index, i0) => {
          return common_vendor.e({
            a: prize.name,
            b: common_vendor.o(($event) => prize.name = $event.detail.value, index),
            c: prize.type !== "center" && prizeTypeIndex[index] !== void 0
          }, prize.type !== "center" && prizeTypeIndex[index] !== void 0 ? {
            d: common_vendor.t(prizeTypeIndex[index] >= 0 ? prizeTypes[prizeTypeIndex[index]].name : ""),
            e: prizeTypeIndex[index],
            f: prizeTypes,
            g: common_vendor.o((e) => changePrizeType(index, e), index)
          } : {}, {
            h: index
          });
        })
      } : {}, {
        e: (probability.empty * 100).toFixed(1),
        f: common_vendor.o((e) => updateProbability("empty", parseFloat(e.detail.value) / 100)),
        g: (probability.small * 100).toFixed(1),
        h: common_vendor.o((e) => updateProbability("small", parseFloat(e.detail.value) / 100)),
        i: (probability.medium * 100).toFixed(1),
        j: common_vendor.o((e) => updateProbability("medium", parseFloat(e.detail.value) / 100)),
        k: (probability.large * 100).toFixed(1),
        l: common_vendor.o((e) => updateProbability("large", parseFloat(e.detail.value) / 100)),
        m: common_vendor.t(getTotalProbability()),
        n: common_vendor.t(isProbabilityValid.value ? "" : "(需调整为100%)"),
        o: !isProbabilityValid.value ? 1 : "",
        p: common_vendor.o(saveSettings)
      }) : {}, {
        q: showManualInput.value
      }, showManualInput.value ? common_vendor.e({
        r: common_vendor.o(($event) => showManualInput.value = false),
        s: prizes.value.length > 0
      }, prizes.value.length > 0 ? {
        t: common_vendor.t(prizeSelectOptions.value[selectedPrizeIndex.value]),
        v: selectedPrizeIndex.value,
        w: prizeSelectOptions.value,
        x: common_vendor.o((e) => selectedPrizeIndex.value = parseInt(e.detail.value))
      } : {}, {
        y: customPrize.value,
        z: common_vendor.o(($event) => customPrize.value = $event.detail.value),
        A: common_vendor.o(confirmManualPrize)
      }) : {}, {
        B: !showSettings.value && !showManualInput.value && !isRunning.value
      }, !showSettings.value && !showManualInput.value && !isRunning.value ? {
        C: common_vendor.o(($event) => showSettings.value = true),
        D: common_vendor.o(($event) => showManualInput.value = true),
        E: common_vendor.t(isManualMode.value ? "手动指定" : "随机抽奖")
      } : {}, {
        F: !showSettings.value && !showManualInput.value
      }, !showSettings.value && !showManualInput.value ? {
        G: common_vendor.f(prizes.value, (prize, index, i0) => {
          return {
            a: common_vendor.t(prize ? prize.name : ""),
            b: index,
            c: common_vendor.n({
              "active": currentIndex.value === index
            }),
            d: common_vendor.n({
              "center": prize && prize.type === "center"
            }),
            e: common_vendor.o(($event) => startLottery(prize), index)
          };
        })
      } : {}, {
        H: lotteryResult.value && !showSettings.value && !showManualInput.value
      }, lotteryResult.value && !showSettings.value && !showManualInput.value ? {
        I: common_vendor.t(lotteryResult.value.message),
        J: common_vendor.o(resetLottery)
      } : {}, {
        K: common_vendor.gei(_ctx, "")
      });
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/subPages/subChoujiang/subChoujiang.js.map
