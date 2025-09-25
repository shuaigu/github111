<template>
	<view class="container">
		<view class="settings-panel" v-if="showSettings">
			<view class="settings-header">
				<text class="settings-title">抽奖设置</text>
				<button class="close-btn" @click="showSettings = false">关闭</button>
			</view>
			
			<view class="prize-settings">
				<view class="section-title">奖品设置</view>
				<view class="prize-item" v-for="(prize, index) in prizes" :key="index" v-if="prize && prize.type !== 'center'">
					<input class="prize-name" v-model="prize.name" placeholder="奖品名称" />
					<picker v-if="prize.type !== 'center' && prizeTypeIndex[index] !== undefined" 
						:value="prizeTypeIndex[index]" 
						:range="prizeTypes" 
						range-key="name" 
						@change="(e) => changePrizeType(index, e)"
					>
						<view class="picker">
							类型: {{prizeTypeIndex[index] >= 0 ? prizeTypes[prizeTypeIndex[index]].name : ''}}
						</view>
					</picker>
				</view>
			</view>
			
			<view class="probability-settings">
				<view class="section-title">概率设置（总和需为100%）</view>
				<view class="prob-item">
					<text>谢谢参与概率(%):</text>
					<input class="prob-input" type="number" :value="(probability.empty * 100).toFixed(1)" @input="(e) => updateProbability('empty', parseFloat(e.detail.value)/100)" />
				</view>
				<view class="prob-item">
					<text>小额奖品概率(%):</text>
					<input class="prob-input" type="number" :value="(probability.small * 100).toFixed(1)" @input="(e) => updateProbability('small', parseFloat(e.detail.value)/100)" />
				</view>
				<view class="prob-item">
					<text>中额奖品概率(%):</text>
					<input class="prob-input" type="number" :value="(probability.medium * 100).toFixed(1)" @input="(e) => updateProbability('medium', parseFloat(e.detail.value)/100)" />
				</view>
				<view class="prob-item">
					<text>大额奖品概率(%):</text>
					<input class="prob-input" type="number" :value="(probability.large * 100).toFixed(1)" @input="(e) => updateProbability('large', parseFloat(e.detail.value)/100)" />
				</view>
				
				<text class="total-prob" :class="{'error': !isProbabilityValid}">
					总概率: {{getTotalProbability()}}% {{isProbabilityValid ? '' : '(需调整为100%)'}}
				</text>
			</view>
			
			<button class="save-btn" @click="saveSettings">保存设置</button>
		</view>
		
		<!-- 手动指定奖品面板 -->
		<view class="manual-panel" v-if="showManualInput">
			<view class="settings-header">
				<text class="settings-title">指定奖品</text>
				<button class="close-btn" @click="showManualInput = false">关闭</button>
			</view>
			
			<view class="section-title">选择奖品</view>
			<view class="prize-select">
				<picker v-if="prizes.length > 0"
					:value="selectedPrizeIndex" 
					:range="prizeSelectOptions" 
					@change="(e) => selectedPrizeIndex = parseInt(e.detail.value)"
				>
					<view class="picker-full">
						选择奖品: {{prizeSelectOptions[selectedPrizeIndex]}}
					</view>
				</picker>
			</view>
			
			<view class="custom-prize">
				<view class="section-title">或自定义奖品</view>
				<input class="manual-input" v-model="customPrize" placeholder="请输入自定义奖品名称" />
			</view>
			
			<button class="confirm-btn" @click="confirmManualPrize">确认</button>
		</view>
		
		<view class="action-btns" v-if="!showSettings && !showManualInput && !isRunning">
			<button class="settings-btn" @click="showSettings = true">设置</button>
			<button class="manual-btn" @click="showManualInput = true">指定奖品</button>
			<text class="mode-text">当前模式: {{isManualMode ? '手动指定' : '随机抽奖'}}</text>
		</view>
		
		<view class="lottery-container" v-if="!showSettings && !showManualInput">
			<view class="lottery-grid">
				<view 
					v-for="(prize, index) in prizes" 
					:key="index" 
					:class="['lottery-item', {'active': currentIndex === index}, {'center': prize && prize.type === 'center'}]"
					@click="startLottery(prize, index)"
				>
					<text>{{prize ? prize.name : ''}}</text>
				</view>
			</view>
		</view>
		
		<view class="result" v-if="lotteryResult && !showSettings && !showManualInput">
			<text class="result-text">{{lotteryResult.message}}</text>
			<button class="again-btn" @click="resetLottery">再来一次</button>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';

// 状态变量
const showSettings = ref(false);
const showManualInput = ref(false);
const isManualMode = ref(false);
const prizes = ref([]);
const sequence = ref([]);
const currentIndex = ref(-1);
const isRunning = ref(false);
const timer = ref(null);
const speed = ref(100);
const times = ref(0);
const cycle = ref(50);
const targetIndex = ref(0);
const lotteryResult = ref(null);
const isLoading = ref(true);
const prizeResult = ref(null);

// 手动指定奖品相关
const selectedPrizeIndex = ref(0);
const customPrize = ref('');
const manualTargetIndex = ref(-1);

// 奖品类型设置
const prizeTypes = [
	{ id: 'empty', name: '谢谢参与' },
	{ id: 'small', name: '小额奖品' },
	{ id: 'medium', name: '中额奖品' },
	{ id: 'large', name: '大额奖品' }
];

// 对应prizes的类型索引
const prizeTypeIndex = reactive({});

// 中奖概率设置
const probability = reactive({
	empty: 0.4,   // 谢谢参与概率: 40%（原60%）
	small: 0.35,  // 小额奖品概率: 35%（原25%）
	medium: 0.15, // 中额奖品概率: 15%（原10%）
	large: 0.1    // 大额奖品概率: 10%（原5%）
});

// 计算picker选择器的奖品选项
const prizeSelectOptions = computed(() => {
	if (!prizes.value || prizes.value.length === 0) return [];
	return prizes.value
		.filter(prize => prize && prize.type !== 'center')
		.map(prize => prize.name);
});

// 计算属性
const isProbabilityValid = computed(() => {
	return Math.abs(getTotalProbability() - 100) < 0.1;
});

// 从云函数获取初始数据
const initData = async () => {
	try {
		isLoading.value = true;
		
		// 调用云函数获取奖品列表和概率设置
		const res = await uniCloud.callFunction({
			name: 'choujiangWx',
			data: {
				method: 'getPrizes'
			}
		});
		
		if (res && res.result && res.result.success) {
			// 设置奖品和序列
			prizes.value = res.result.prizes || [];
			sequence.value = res.result.sequence || [];
			
			// 设置概率
			if (res.result.probabilityConfig) {
				Object.assign(probability, res.result.probabilityConfig);
			}
			
			// 初始化奖品类型索引
			initPrizeTypeIndex();
		} else {
			uni.showToast({
				title: (res && res.result) ? res.result.message || '获取奖品数据失败' : '获取奖品数据失败',
				icon: 'none'
			});
		}
	} catch (e) {
		uni.showToast({
			title: '获取奖品数据失败',
			icon: 'none'
		});
		console.error(e);
	} finally {
		isLoading.value = false;
	}
};

// 初始化奖品类型索引
const initPrizeTypeIndex = () => {
	prizes.value.forEach((prize, index) => {
		if (!prize) return;
		
		if (prize.type === 'center') {
			prizeTypeIndex[index] = -1;
		} else {
			// 根据prizeType设置类型索引
			const type = prize.prizeType || (prize.type === 'empty' ? 'empty' : 'small');
			
			// 找到对应的类型索引
			const typeIdx = prizeTypes.findIndex(item => item.id === type);
			prizeTypeIndex[index] = typeIdx >= 0 ? typeIdx : 0;
		}
	});
};

// 计算总概率
const getTotalProbability = () => {
	const total = probability.empty + probability.small + probability.medium + probability.large;
	return (total * 100).toFixed(1);
};

// 更新概率设置
const updateProbability = (type, value) => {
	probability[type] = value;
};

// 改变奖品类型
const changePrizeType = (index, event) => {
	const typeIndex = event.detail.value;
	prizeTypeIndex[index] = typeIndex;
	
	if (!prizes.value[index]) return;
	
	const typeId = prizeTypes[typeIndex].id;
	
	// 更新奖品类型
	if (typeId === 'empty') {
		prizes.value[index].type = 'empty';
	} else {
		prizes.value[index].type = 'reward';
	}
	
	// 更新奖品的prizeType
	prizes.value[index].prizeType = typeId;
};

// 确认手动指定奖品
const confirmManualPrize = () => {
	isManualMode.value = true;
	
	// 如果有自定义奖品输入，优先使用自定义奖品
	if (customPrize.value) {
		// 查找可能的位置（非中心点）
		const validIndices = [0, 1, 2, 3, 5, 6, 7, 8]; // 除去中心点击按钮
		const randomIndex = Math.floor(Math.random() * validIndices.length);
		manualTargetIndex.value = sequence.value.findIndex(item => item === validIndices[randomIndex]);
		
		// 创建临时自定义奖品
		const tempPrize = {
			name: customPrize.value,
			type: 'reward',
			prizeType: 'custom'
		};
		prizeResult.value = {
			success: true,
			prize: tempPrize,
			selectedIndex: validIndices[randomIndex],
			targetPosition: manualTargetIndex.value
		};
	} else {
		// 使用选择的奖品
		const allPrizes = prizes.value.filter(prize => prize && prize.type !== 'center');
		if (allPrizes.length > 0 && selectedPrizeIndex.value < allPrizes.length) {
			const selectedPrize = allPrizes[selectedPrizeIndex.value];
			
			// 查找该奖品在原始数组中的索引
			const prizeIndex = prizes.value.findIndex(p => p && p.name === selectedPrize.name);
			if (prizeIndex >= 0) {
				manualTargetIndex.value = sequence.value.findIndex(item => item === prizeIndex);
				
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
	
	// 显示提示
	uni.showToast({
		title: '奖品已指定',
		icon: 'success'
	});
};

// 保存设置到云端
const saveSettings = async () => {
	if (!isProbabilityValid.value) {
		uni.showToast({
			title: '概率总和必须为100%',
			icon: 'none'
		});
		return;
	}
	
	try {
		// 调用云函数更新概率设置
		const res = await uniCloud.callFunction({
			name: 'choujiangWx',
			data: {
				method: 'updateProbability',
				data: {
					probability: probability
				}
			}
		});
		
		if (res && res.result && res.result.success) {
			showSettings.value = false;
			uni.showToast({
				title: '设置已保存',
				icon: 'success'
			});
		} else {
			uni.showToast({
				title: (res && res.result) ? res.result.message || '保存失败' : '保存失败',
				icon: 'none'
			});
		}
	} catch (e) {
		uni.showToast({
			title: '保存设置失败',
			icon: 'none'
		});
		console.error(e);
	}
};

// 开始抽奖
const startLottery = async (prize, index) => {
	// 如果不是中心按钮或者正在抽奖中，不执行操作
	if (!prize || prize.type !== 'center' || isRunning.value) {
		return;
	}
	
	// 重置抽奖结果
	lotteryResult.value = null;
	
	try {
		// 如果是手动模式，使用已选择的奖品
		if (isManualMode.value && prizeResult.value) {
			// 设置目标位置
			targetIndex.value = prizeResult.value.targetPosition >= 0 ? 
				prizeResult.value.targetPosition : 0;
				
			// 开始抽奖动画
			isRunning.value = true;
			times.value = 0;
			speed.value = 100;
			runLottery();
		}
		// 否则使用云函数随机抽奖
		else {
			isManualMode.value = false;
			// 调用云函数执行抽奖
			const res = await uniCloud.callFunction({
				name: 'choujiangWx',
				data: {
					method: 'doLottery',
					data: {
						userId: 'test-user' // 这里可以传入用户ID等信息
					}
				}
			});
			
			if (res && res.result && res.result.success) {
				// 设置目标位置
				targetIndex.value = res.result.targetPosition;
				
				// 开始抽奖动画
				isRunning.value = true;
				times.value = 0;
				speed.value = 100;
				runLottery();
				
				// 保存抽奖结果用于显示
				prizeResult.value = res.result;
			} else {
				uni.showToast({
					title: (res && res.result) ? res.result.message || '抽奖失败' : '抽奖失败',
					icon: 'none'
				});
			}
		}
	} catch (e) {
		uni.showToast({
			title: '抽奖失败，请重试',
			icon: 'none'
		});
		console.error(e);
	}
};

// 抽奖动画
const runLottery = () => {
	timer.value = setTimeout(() => {
		// 转动次数递增
		times.value++;
		
		// 计算当前位置
		let index = times.value % sequence.value.length;
		currentIndex.value = sequence.value[index];
		
		// 加速期
		if (times.value < cycle.value) {
			speed.value -= 10;
			if (speed.value < 40) {
				speed.value = 40;
			}
		} 
		// 减速期
		else if (times.value > cycle.value + 10 && ((index > targetIndex.value && targetIndex.value === 0) || index === targetIndex.value)) {
			speed.value += 110;
		} 
		// 慢速转动期
		else {
			speed.value += 20;
		}
		
		// 结束抽奖
		if (times.value > cycle.value + 10 && index === targetIndex.value) {
			clearTimeout(timer.value);
			isRunning.value = false;
			showResult();
		} else {
			runLottery();
		}
	}, speed.value);
};

// 显示抽奖结果
const showResult = () => {
	// 如果有抽奖结果，使用它
	if (prizeResult.value && prizeResult.value.prize) {
		const prize = prizeResult.value.prize;
		let message = '';
		
		if (prize.type === 'empty') {
			message = '很遗憾，谢谢参与！';
		} else {
			message = `恭喜您获得${prize.name}！`;
		}
		
		lotteryResult.value = {
			prize,
			message
		};
	} else {
		// 兜底方案，使用当前显示的奖品
		const prize = prizes.value[currentIndex.value];
		if (!prize) return;
		
		let message = '';
		
		if (prize.type === 'empty') {
			message = '很遗憾，谢谢参与！';
		} else {
			message = `恭喜您获得${prize.name}！`;
		}
		
		lotteryResult.value = {
			prize,
			message
		};
	}
};

// 重置抽奖
const resetLottery = () => {
	currentIndex.value = -1;
	lotteryResult.value = null;
	
	// 如果是一次性手动模式，重置为随机模式
	if (isManualMode.value) {
		isManualMode.value = false;
		prizeResult.value = null;
		customPrize.value = '';
	}
};

// 页面加载时初始化数据
onMounted(() => {
	initData();
});
</script>

<style>
.container {
	padding: 30rpx;
	position: relative;
}

.settings-panel, .manual-panel {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	background-color: #fff;
	z-index: 10;
	padding: 30rpx;
	box-sizing: border-box;
}

.settings-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.settings-title {
	font-size: 36rpx;
	font-weight: bold;
}

.close-btn {
	padding: 0 20rpx;
	height: 60rpx;
	line-height: 60rpx;
	font-size: 28rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	margin: 20rpx 0;
	border-left: 6rpx solid #ff6600;
	padding-left: 20rpx;
}

.prize-item {
	display: flex;
	align-items: center;
	padding: 15rpx 0;
	border-bottom: 1px solid #f0f0f0;
}

.prize-name {
	flex: 1;
	border: 1px solid #eee;
	padding: 10rpx;
	margin-right: 20rpx;
}

.picker {
	width: 200rpx;
	padding: 10rpx;
	border: 1px solid #eee;
	text-align: center;
}

.picker-full {
	width: 100%;
	padding: 20rpx;
	border: 1px solid #eee;
	text-align: center;
	margin: 20rpx 0;
}

.prize-select {
	margin: 20rpx 0;
}

.manual-input {
	width: 100%;
	height: 80rpx;
	border: 1px solid #eee;
	padding: 0 20rpx;
	margin: 20rpx 0;
	box-sizing: border-box;
}

.confirm-btn, .save-btn {
	margin-top: 40rpx;
	background-color: #ff6600;
	color: #fff;
}

.action-btns {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 20rpx;
}

.settings-btn, .manual-btn {
	width: 300rpx;
	margin-bottom: 20rpx;
	background-color: #f0f0f0;
	font-size: 28rpx;
}

.manual-btn {
	background-color: #ffcc00;
	color: #fff;
}

.mode-text {
	font-size: 28rpx;
	color: #666;
	margin-top: 10rpx;
}

.prob-item {
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.prob-input {
	width: 150rpx;
	height: 60rpx;
	border: 1px solid #eee;
	padding: 0 10rpx;
	text-align: center;
}

.total-prob {
	display: block;
	margin: 30rpx 0;
	text-align: center;
	font-weight: bold;
}

.total-prob.error {
	color: #ff0000;
}

.lottery-container {
	width: 100%;
	height: 600rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-top: 80rpx;
}

.lottery-grid {
	width: 600rpx;
	height: 600rpx;
	display: flex;
	flex-wrap: wrap;
	position: relative;
}

.lottery-item {
	width: 200rpx;
	height: 200rpx;
	box-sizing: border-box;
	border: 1px solid #ccc;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: #f9f9f9;
}

.lottery-item.active {
	background-color: #ffcc00;
	color: #fff;
}

.lottery-item.center {
	background-color: #ff6600;
	color: #fff;
}

.result {
	margin-top: 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.result-text {
	font-size: 36rpx;
	margin-bottom: 20rpx;
}

.again-btn {
	width: 300rpx;
	background-color: #ff6600;
	color: #fff;
}

.custom-prize {
	margin-top: 40rpx;
}
</style>
