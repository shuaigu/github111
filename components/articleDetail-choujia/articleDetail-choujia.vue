<template>
	<view class="lottery-container">
		<view class="lottery-header">
			<text class="lottery-title">评论区抽大奖</text>
			<view class="lottery-subtitle">
				<text class="participants-count">
					<text class="count-number">{{commenterCount}}</text>
					<text>人已参与</text>
					<text v-if="commenterCount < 9" class="remaining-slots">，还剩{{9 - commenterCount}}个名额</text>
				</text>
			</view>
		</view>
		
		<!-- 用户列表抽奖 -->
		<view class="user-grid">
			<view 
				v-for="(user, index) in displayUsers" 
				:key="index"
				:class="['user-cell', {'active': currentIndex === index, 'winner': winnerIndex === index && showResult}]"
			>
				<view class="user-content">
					<image 
						v-if="user.avatarUrl" 
						class="user-avatar" 
						:src="user.avatarUrl" 
						mode="aspectFill"
					></image>
					<view v-else class="empty-avatar clickable" @click="handleCommentClick(index)">
						<text>点击参与</text>
						<text class="add-icon">+</text>
					</view>
					<text class="user-nickname" v-if="user.nickName">{{user.nickName}}</text>
					<text class="user-nickname" v-else-if="user._id">{{getUserDisplayName(user)}}</text>
					<text class="user-nickname" v-else>等待参与</text>
					<text class="user-probability">{{userProbability}}%</text>
				</view>
			</view>
		</view>
		
		<!-- 抽奖按钮 -->
		<view class="lottery-btn" @click="handleLotteryBtn" :class="{'rotating': isRotating}">
			<text class="btn-text">{{getBtnText()}}</text>
		</view>
		
		<!-- 中奖弹窗 - 修改为默认显示 -->
		<view v-if="showResult && winner" class="result-popup">
			<view class="result-content">
				<view class="result-header">抽奖结果</view>
				
				<!-- 显示中奖用户 -->
				<view v-if="winner" class="lucky-users">
					<view class="lucky-users-title">恭喜幸运用户:</view>
					<view class="prize-time">{{ currentTime }}</view>
					<view class="lucky-user-item">
						<image class="lucky-user-avatar" :src="winner.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
						<view class="lucky-user-info">
							<view class="name-time-container">
								<text class="lucky-user-name">{{getUserDisplayName(winner)}}</text>
								<text class="time" v-if="winner.create_time">{{formatTime(winner.create_time)}}</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 显示概率信息 -->
				<view class="probability-info">
					<view class="probability-title">本次抽奖概率分布</view>
					<view class="probability-note">所有参与者概率相等: {{userProbability}}%</view>
				</view>
				
				<button class="result-btn" @click="closeResult">确定</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';

// 定义props接收评论者列表
const props = defineProps({
	commenters: {
		type: Array,
		default: () => []
	},
	articleId: {
		type: String,
		default: ''
	}
});

// 是否显示概率
const showProbability = ref(true);

// 定义事件
const emit = defineEmits(['lottery-result', 'show-comment', 'position-updated']);

// 参与抽奖的用户列表
const participantsList = reactive([]);

// 创建一个9宫格位置映射
const gridPositions = reactive(Array(9).fill(null));

// 位置数据加载状态
const isPositionsLoading = ref(false);

// 位置数据保存状态
const isSavingPositions = ref(false);

// 抽奖历史记录相关
// const lotteryHistory = ref([]);
// const isHistoryLoading = ref(false);
// const currentHistoryPage = ref(1);
// const totalHistoryPages = ref(1);
// const historyPageSize = 5;
// const lotteryHistoryVisible = ref(false);

// 显示在9宫格中的用户
const displayUsers = computed(() => {
	// 创建结果数组
	const result = [];
	
	// 填充9个位置
	for (let i = 0; i < 9; i++) {
		// 检查该位置是否已经有用户
		if (gridPositions[i]) {
			// 如果有用户，使用该用户数据
			result.push(gridPositions[i]);
		} else {
			// 如果没有用户，使用空对象
			result.push({});
		}
	}
	
	return result;
});

// 计算每个用户的中奖概率
const userProbability = computed(() => {
	if (participantsList.length === 0) return 0;
	// 所有用户概率相等，概率为 100/参与人数
	const probability = (100 / participantsList.length).toFixed(2);
	return probability;
});

// 当前高亮索引
const currentIndex = ref(-1);

// 中奖者索引
const winnerIndex = ref(-1);

// 显示结果弹窗
const showResult = ref(false);

// 抽奖状态
const isRotating = ref(false);

// 获取中奖用户
const winner = ref(null);

// 概率分布信息
const probabilityInfo = ref([]);

// 计算评论者数量 - 显示实际参与抽奖的人数（最多9人）
const commenterCount = computed(() => {
	// 遍历gridPositions，统计有头像的格子
	let count = 0;
	for (let i = 0; i < 9; i++) {
		if (gridPositions[i] && (gridPositions[i].avatarUrl || gridPositions[i]._id)) {
			count++;
		}
	}
	return count;
});

// 添加当前时间
const currentTime = ref('');

// 添加记录点击位置的变量
let currentClickPosition = -1;

// 添加加载标志位
const hasLoaded = ref(false);

// 修改监听评论者列表变化
watch(() => props.commenters, (newVal) => {
	if (newVal && newVal.length > 0) {
		// 当评论者列表变化时，重置抽奖
		showResult.value = false;
		winner.value = null;
		winnerIndex.value = -1;
		
		// 更新参与列表
		updateParticipantsList();
	}
}, { deep: true });

let timer = null;
let times = 0;

// 添加用户昵称或手机号的计算属性
const getUserDisplayName = (user) => {
	if (!user) return '';
	return user.nickName || user.mobile || '匿名用户';
};

// 从云端加载用户位置数据
const loadGridPositionsFromCloud = async () => {
	// 如果已经加载过，避免重复加载
	if (hasLoaded.value) {
		console.log('已经加载过位置数据，跳过重复加载');
		return true;
	}
	
	// 如果没有文章ID，则跳过
	if (!props.articleId) {
		console.warn('没有文章ID，无法加载位置数据');
		return false;
	}
	
	try {
		isPositionsLoading.value = true;
		
		// 调用云函数获取位置数据
		const choujiangWx = uniCloud.importObject('choujiangWx');
		const result = await choujiangWx.getGridPositions(props.articleId);
		
		if (result.success && result.gridPositions) {
			console.log('从云端加载的位置数据:', result.gridPositions);
			
			// 清空当前网格位置
			for (let i = 0; i < 9; i++) {
				gridPositions[i] = null;
			}
			
			// 填充加载的位置数据
			result.gridPositions.forEach((userData, index) => {
				if (userData && index < 9) {
					gridPositions[index] = userData;
				}
			});
			
			// 设置加载标志为已加载
			hasLoaded.value = true;
			return true;
		} else {
			console.log('没有找到保存的位置数据或加载失败');
			return false;
		}
	} catch (error) {
		console.error('加载位置数据失败:', error);
		return false;
	} finally {
		isPositionsLoading.value = false;
	}
};

// 保存网格位置数据到云端
const saveGridPositionsToCloud = async () => {
	// 如果没有文章ID，则跳过
	if (!props.articleId) {
		console.warn('没有文章ID，无法保存位置数据');
		return false;
	}
	
	try {
		// 避免频繁保存
		if (isSavingPositions.value) {
			return false;
		}
		
		isSavingPositions.value = true;
		
		// 准备位置数据
		const positionsToSave = [...gridPositions];
		
		// 调用云函数保存位置数据
		const choujiangWx = uniCloud.importObject('choujiangWx');
		const result = await choujiangWx.saveGridPositions({
			articleId: props.articleId,
			positions: positionsToSave
		});
		
		if (result.success) {
			console.log('位置数据保存成功');
			return true;
		} else {
			console.warn('位置数据保存失败:', result.message);
			return false;
		}
	} catch (error) {
		console.error('保存位置数据失败:', error);
		return false;
	} finally {
		isSavingPositions.value = false;
	}
};

// 更新用户展示数据
const updateParticipantsList = async () => {
	try {
		// 清空现有列表
		participantsList.length = 0;
		
		// 首先，收集所有评论者
		const availableCommenters = [...props.commenters].slice(0, 9);
		
		// 更新参与者列表
		availableCommenters.forEach(commenter => {
			participantsList.push(commenter);
		});
		
		// 尝试从云端加载位置数据
		const cloudPositionsLoaded = await loadGridPositionsFromCloud();
		
		// 如果没有从云端加载成功，则进行本地更新
		if (!cloudPositionsLoaded) {
			// 记录已占用的位置
			const occupiedPositions = new Set();
			const existingPositions = new Map();
			
			// 检查当前gridPositions中已有的用户，保留他们的位置
			for (let i = 0; i < 9; i++) {
				if (gridPositions[i] && gridPositions[i]._id) {
					// 记录该位置已被占用
					occupiedPositions.add(i);
					// 记录该用户已有位置
					existingPositions.set(gridPositions[i]._id, i);
				}
			}
			
			// 对于参与列表中的每个用户，检查他们是否已经有位置
			participantsList.forEach(user => {
				if (user._id && existingPositions.has(user._id)) {
					// 如果用户已经有固定位置，保持不变
					const position = existingPositions.get(user._id);
					gridPositions[position] = user;
					// 标记该位置已占用
					occupiedPositions.add(position);
				}
			});
			
			// 为未分配位置的用户寻找空位置
			let nextFreePosition = 0;
			participantsList.forEach(user => {
				// 如果用户没有被分配位置
				if (user._id && !existingPositions.has(user._id)) {
					// 寻找下一个空闲位置
					while (nextFreePosition < 9 && occupiedPositions.has(nextFreePosition)) {
						nextFreePosition++;
					}
					
					// 如果找到空闲位置，分配给用户
					if (nextFreePosition < 9) {
						gridPositions[nextFreePosition] = user;
						occupiedPositions.add(nextFreePosition);
						nextFreePosition++;
					}
				}
			});
			
			// 位置变化后，保存到云端
			saveGridPositionsToCloud();
		}
	} catch (error) {
		console.error('更新用户展示失败:', error);
		uni.showToast({
			title: '初始化失败，请重试',
			icon: 'none'
		});
	}
};

// 替换原有的初始化函数
const initParticipantsList = updateParticipantsList;

// 修改评论点击处理函数
const handleCommentClick = (index) => {
	console.log('触发点击参与事件，位置索引:', index);
	
	// 如果正在抽奖中，不触发评论
	if (isRotating.value) {
		console.log('当前正在抽奖中，不能参与');
		uni.showToast({
			title: '抽奖进行中，请稍后',
			icon: 'none'
		});
		return;
	}
	
	// 如果已经显示结果，不触发评论
	if (showResult.value) {
		console.log('已显示抽奖结果，不能再参与');
		uni.showToast({
			title: '抽奖已完成',
			icon: 'none'
		});
		return;
	}
	
	// 检查该位置是否已有用户数据
	if (gridPositions[index] && gridPositions[index]._id) {
		console.log('该位置已有用户数据，无法修改');
		uni.showToast({
			title: '该位置已被占用',
			icon: 'none'
		});
		return;
	}
	
	// 记录当前点击的位置
	currentClickPosition = index;
	
	// 触发父组件的评论事件
	console.log('发送评论事件到父组件，位置:', index);
	emit('show-comment', { position: index });
};

// 添加更新特定位置的方法
const updatePosition = async (position, userData) => {
	if (position >= 0 && position < 9) {
		// 先保存当前gridPositions的状态
		const currentGridState = [...gridPositions];
		
		// 更新指定位置
		gridPositions[position] = userData;
		
		// 手动更新participantsList数组
		const existingUserIndex = participantsList.findIndex(user => 
			user._id === userData._id || 
			(user.user_id === userData.user_id && user.user_id)
		);
		
		if (existingUserIndex === -1) {
			// 如果不存在，添加到参与者列表
			participantsList.push(userData);
		} else {
			// 如果已存在，更新数据
			participantsList[existingUserIndex] = userData;
		}
		
		// 为了保持响应性，重新赋值
		for (let i = 0; i < 9; i++) {
			if (gridPositions[i] !== currentGridState[i]) {
				// 如果该位置有变化，触发更新
				gridPositions[i] = gridPositions[i]; 
			}
		}
		
		// 保存变更到云端
		await saveGridPositionsToCloud();
		
		// 触发emit事件通知父组件已更新评论区位置
		emit('position-updated', {
			position: position,
			userData: userData
		});
	}
};

// 将当前方法暴露给父组件
defineExpose({
	updatePosition,
	getPositionById,
	clearPosition
});

// 获取评论ID对应的位置索引
function getPositionById(commentId) {
	if (!commentId) return -1;
	
	// 遍历gridPositions查找包含该ID的位置
	for (let i = 0; i < 9; i++) {
		if (gridPositions[i] && gridPositions[i]._id === commentId) {
			return i;
		}
	}
	
	// 未找到返回-1
	return -1;
}

// 清除指定位置的数据
async function clearPosition(position) {
	if (position >= 0 && position < 9) {
		// 先保存当前gridPositions的状态
		const currentGridState = [...gridPositions];
		
		// 清空指定位置
		gridPositions[position] = {};
		
		// 为了保持响应性，重新赋值
		for (let i = 0; i < 9; i++) {
			if (gridPositions[i] !== currentGridState[i]) {
				// 如果该位置有变化，触发更新
				gridPositions[i] = gridPositions[i]; 
			}
		}
		
		// 更新参与者列表，移除不在九宫格中的用户
		refreshParticipantsList();
		
		// 保存变更到云端
		await saveGridPositionsToCloud();
		
		return true;
	}
	
	return false;
}

// 刷新参与者列表
function refreshParticipantsList() {
	// 清空参与者列表
	participantsList.length = 0;
	
	// 重新从九宫格中收集有效的参与者
	for (let i = 0; i < 9; i++) {
		if (gridPositions[i] && gridPositions[i]._id) {
			// 检查用户是否已在列表中
			const existingUserIndex = participantsList.findIndex(user => 
				user._id === gridPositions[i]._id
			);
			
			if (existingUserIndex === -1) {
				// 如果不存在，添加到参与者列表
				participantsList.push(gridPositions[i]);
			}
		}
	}
}

// 开始抽奖
const startLottery = async () => {
	// 检查是否正在抽奖中
	if (isRotating.value) {
		return stopLottery(); // 如果正在抽奖，则停止抽奖
	}
	
	// 检查是否有评论者参与
	if (props.commenters.length === 0) {
		uni.showToast({
			title: '暂无评论者参与',
			icon: 'none'
		});
		return;
	}
	
	// 设置抽奖状态
	isRotating.value = true;
	currentIndex.value = -1;
	winnerIndex.value = -1;
	winner.value = null;
	showResult.value = false;
	
	try {
		// 获取系统信息
		let platformInfo = {};
		let sceneValue = '';
		
		try {
			if (uni.getAppBaseInfo) {
				const appInfo = uni.getAppBaseInfo();
				platformInfo = {
					platform: appInfo.platform,
					osName: appInfo.osName,
					appVersion: appInfo.appVersion
				};
			} else {
				const sysInfo = uni.getSystemInfoSync();
				platformInfo = {
					platform: sysInfo.platform,
					osName: sysInfo.osName || sysInfo.system
				};
			}
			
			const launchOptions = uni.getLaunchOptionsSync ? uni.getLaunchOptionsSync() : {};
			sceneValue = launchOptions.scene || '';
		} catch (e) {
			console.error('获取系统信息失败', e);
		}
		
		// 添加标记，表明这是抽奖操作，不需要更新浏览量
		const userInfo = {
			platformInfo,
			scene: sceneValue,
			time: Date.now(),
			isLotteryAction: true, // 添加标记，表明这是抽奖操作
			equalProbability: true // 标记使用相同概率
		};
		
		// 调用云函数执行抽奖
		const choujiangWx = uniCloud.importObject('choujiangWx');
		const lotteryResult = await choujiangWx.doLottery({
			commenters: participantsList,
			userId: uni.getStorageSync('userId') || '',
			userInfo,
			articleId: props.articleId // 传递文章ID，用于保存抽奖结果
		});
		
		if (!lotteryResult.success) {
			throw new Error(lotteryResult.message || '抽奖失败');
		}
		
		// 获取抽奖结果，但暂不显示最终结果
		// 保存中奖者信息，但在手动停止前不显示
		winner.value = lotteryResult.winner;
		// 计算在9宫格中的索引位置
		winnerIndex.value = lotteryResult.winnerIndex < 9 ? lotteryResult.winnerIndex : lotteryResult.winnerIndex % 9;
		probabilityInfo.value = lotteryResult.probabilityInfo || [];
		
		// 开始动画循环
		startRotation();
		
	} catch (error) {
		console.error('抽奖执行失败:', error);
		uni.showToast({
			title: '抽奖失败，请重试',
			icon: 'none'
		});
		isRotating.value = false;
	}
};

// 停止抽奖并显示结果
const stopLottery = () => {
	if (!isRotating.value) return;
	
	// 停止动画
	if (timer) {
		clearTimeout(timer);
		timer = null;
	}
	
	// 立即停止旋转并直接设置到中奖位置
	isRotating.value = false;
	
	// 立即将当前位置设置为中奖位置，不要任何延迟
	currentIndex.value = winnerIndex.value;
	
	// 设置当前时间
	const now = new Date();
	const year = now.getFullYear();
	const month = (now.getMonth() + 1).toString().padStart(2, '0');
	const day = now.getDate().toString().padStart(2, '0');
	const hours = now.getHours().toString().padStart(2, '0');
	const minutes = now.getMinutes().toString().padStart(2, '0');
	currentTime.value = `${year}年${month}月${day}日 ${hours}:${minutes}`;
	
	// 立即显示抽奖结果，不使用延迟
	showResult.value = true;
	if (winner.value) {
		handleLotteryResult(winner.value);
	}
};

// 获取按钮文本
const getBtnText = () => {
	if (!isRotating.value) {
		return '开始抽奖';
	} else {
		return '停止抽奖';
	}
};

// 处理抽奖按钮点击
const handleLotteryBtn = () => {
	startLottery();
};

// 开始旋转动画
const startRotation = () => {
	if (timer) clearTimeout(timer);
	
	// 使用平均120毫秒的轮播速度
	let rotationSpeed = 120; // 基准速度
	let currentPosition = currentIndex.value;
	let rotationDuration = 0; // 记录旋转持续时间
	const startTime = Date.now();
	
	// 轮播速度小幅度浮动范围
	const minSpeed = 100; // 最快速度
	const maxSpeed = 140; // 最慢速度
	
	// 旋转动画函数 - 优化动态速度调整
	const runAnimation = () => {
		if (!isRotating.value) return;
		
		// 清除之前的定时器
		if (timer) clearTimeout(timer);
		
		// 计算已旋转时间
		rotationDuration = Date.now() - startTime;
		
		// 计算当前应用的轮播速度 - 围绕平均值120毫秒小幅度波动
		// 使用余弦函数产生平滑的速度变化
		const phase = rotationDuration / 2000; // 约2秒一个变化周期
		const speedVariation = (Math.cos(phase) + 1) / 2; // 值域为0-1
		rotationSpeed = minSpeed + speedVariation * (maxSpeed - minSpeed);
		
		// 递增位置，如果到末尾则重置
		currentPosition = (currentPosition + 1) % 9;
		currentIndex.value = currentPosition;
		
		// 继续滚动
		timer = setTimeout(runAnimation, Math.floor(rotationSpeed));
	};
	
	// 开始动画
	runAnimation();
};

// 关闭结果弹窗
const closeResult = () => {
	showResult.value = false;
	// 重置抽奖状态，准备重新抽奖
	isRotating.value = false;
	currentIndex.value = -1;
};

// 格式化时间
const formatTime = (timestamp) => {
	if (!timestamp) return '';
	
	const now = Date.now();
	const diff = now - timestamp;
	
	// 小于1分钟
	if (diff < 60000) {
		return '刚刚';
	}
	// 小于1小时
	if (diff < 3600000) {
		return Math.floor(diff / 60000) + '分钟前';
	}
	// 小于24小时
	if (diff < 86400000) {
		return Math.floor(diff / 3600000) + '小时前';
	}
	// 小于30天
	if (diff < 2592000000) {
		return Math.floor(diff / 86400000) + '天前';
	}
	// 其他情况显示具体日期
	const date = new Date(timestamp);
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return `${month}月${day}日`;
};

// 对于父组件中的事件处理函数
const handleLotteryResult = async (result) => {
	// 修复 result.includes is not a function 错误
	// 不再使用 result.includes 进行判断
	if (result && typeof result === 'object') {
		// 当 result 是对象时的处理方式
		if (result.nickName) {
			try {
				// 添加标记，表明这是抽奖结果事件，不需要更新浏览量
				const resultWithMark = {
					...result,
					isLotteryResult: true
				};
				
				// 将中奖用户信息保存到数据库
				// 准备保存的数据
				const lotteryData = {
					article_id: props.articleId,
					winner_id: result._id || result.user_id || '',
					winner_name: result.nickName || '匿名用户',
					winner_avatar: result.avatarUrl || '',
					winner_mobile: result.mobile || '',
					winner_content: result.content || '',
					winner_index: winnerIndex.value,
					draw_time: Date.now(),
					participant_count: participantsList.length || 0
				};
				
				// 调用云函数保存抽奖结果
				const choujiangWx = uniCloud.importObject('choujiangWx');
				const saveResult = await choujiangWx.saveLotteryResult(lotteryData);
				
				if (saveResult && saveResult.success) {
					console.log('抽奖结果保存成功:', saveResult);
					
					// 确保结果显示正常
					showResult.value = true;
					isRotating.value = false;
					
					// 如果有中奖者信息
					emit('lottery-result', resultWithMark);
				} else {
					console.error('抽奖结果保存失败:', saveResult?.message || '未知错误');
					throw new Error(saveResult?.message || '抽奖结果保存失败');
				}
			} catch (error) {
				console.error('保存抽奖结果出错:', error);
				// 即使保存失败，仍然显示结果，但给出提示
				uni.showToast({
					title: '抽奖完成，但结果保存失败',
					icon: 'none',
					duration: 2000
				});
				
				// 确保界面状态正确
				showResult.value = true;
				isRotating.value = false;
				
				// 尝试通知父组件
				emit('lottery-result', result);
			}
		} else {
			// 没有昵称的情况
			console.error('抽奖结果缺少用户信息:', result);
			isRotating.value = false;
			uni.showToast({
				title: '抽奖结果异常',
				icon: 'none'
			});
		}
	} else {
		// 非对象类型的结果处理
		console.error('抽奖结果无效:', result);
		isRotating.value = false;
		uni.showToast({
			title: '抽奖结果无效',
			icon: 'none'
		});
	}
};

// 格式化概率显示
const formatProbability = (probability) => {
	if (!probability) return '';
	
	// 如果是带百分号的字符串，先转换为数值
	let value = probability;
	if (typeof probability === 'string') {
		value = parseFloat(probability);
		if (isNaN(value)) return probability;
	}
	
	// 显示为百分比，保留两位小数
	if (value < 1) {
		return (value * 100).toFixed(2) + '%';
	} else {
		return value.toFixed(2) + '%';
	}
};

// 计算概率条的宽度
const calculateWidth = (probability) => {
	let value = probability;
	if (typeof probability === 'string') {
		// 如果是字符串，先提取数值
		const match = probability.match(/(\d+(\.\d+)?)/);
		if (match) {
			value = parseFloat(match[1]);
		} else {
			return 15; // 默认最小宽度
		}
	}
	
	// 确保宽度在合理范围内
	// 最小15%，最大95%
	return Math.min(Math.max(value * 3, 15), 95);
};

// 初始化
onMounted(async () => {
	// 检查gridPositions是否需要初始化
	let hasContent = false;
	for (let i = 0; i < 9; i++) {
		if (gridPositions[i] !== null) {
			hasContent = true;
			break;
		}
	}
	
	// 如果完全为空，初始化为null
	if (!hasContent) {
		for (let i = 0; i < 9; i++) {
			gridPositions[i] = null;
		}
	}
	
	// 尝试从云端加载位置数据
	const loaded = await loadGridPositionsFromCloud();
	
	// 如果从云端加载失败，则使用本地更新
	if (!loaded) {
		// 更新参与列表
		initParticipantsList();
	}
	
	return () => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	};
});
</script>

<style lang="scss">
.lottery-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 30rpx 20rpx 40rpx;
	background-color: #FF5500;
	position: relative;
	border-radius: 20rpx;
	min-height: auto;
	height: auto;
	overflow: hidden;
	transition: height 0.3s ease;
	box-sizing: border-box;
	width: 100%;
}

.lottery-header {
	width: 100%;
	text-align: center;
	margin-bottom: 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.lottery-title {
	font-size: 48rpx;
	font-weight: bold;
	color: #FFFFFF;
	text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
	margin-bottom: 15rpx;
	line-height: 1.2;
}

.lottery-subtitle {
	background-color: #FFFFFF;
	border-radius: 30rpx;
	padding: 8rpx 25rpx;
	display: inline-block;
	margin-bottom: 15rpx;
	box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
	position: relative;
	overflow: hidden;
	
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: -20rpx;
		width: 40rpx;
		height: 100%;
		background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,213,0,0.3), rgba(255,255,255,0));
		animation: shine 2s infinite;
	}
}

@keyframes shine {
	0% {
		left: -60rpx;
	}
	100% {
		left: 100%;
	}
}

.participants-count {
	font-size: 24rpx;
	color: #FF5500;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-wrap: wrap;
}

.count-number {
	font-size: 32rpx;
	color: #FF3300;
	font-weight: bold;
	margin: 0 4rpx;
}

.remaining-slots {
	font-size: 22rpx;
	color: #FF7700;
	font-weight: normal;
}

// 用户展示网格
.user-grid {
	width: 100%;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	display: grid;
	grid-template-columns: repeat(3, 1fr); // 3x3网格
	grid-template-rows: repeat(3, 1fr);
	gap: 4rpx; // 增加间隙使分隔线更明显
	position: relative;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
	aspect-ratio: 1 / 1; // 保持正方形比例
	margin: 0 auto;
	overflow: hidden;
	background-color: #EEEEEE; // 设置网格背景色为灰色，让分隔线更明显
}

.user-cell {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 10rpx;
	transition: all 0.3s ease;
	background-color: #FFFFFF; // 改为白色背景，与灰色网格形成对比
	overflow: hidden;
	aspect-ratio: 1 / 1;
	box-shadow: 0 0 2rpx rgba(0, 0, 0, 0.1); // 添加轻微阴影增强立体感
	
	&.active {
		transform: scale(0.98);
		background-color: #FFD700;
		box-shadow: inset 0 0 10rpx rgba(255, 215, 0, 0.6);
		z-index: 5;
	}
	
	&.winner {
		background-color: #FFD700;
		
		.user-name {
			color: #FF5500;
			font-weight: bold;
		}
	}
}

.user-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	height: 100%;
	justify-content: center;
}

.user-avatar {
	width: 90rpx;
	height: 90rpx;
	border-radius: 5%;
	margin-bottom: 10rpx;
	background-color: #f5f5f5;
	border: 2rpx solid #E0E0E0;
}

.empty-avatar {
	width: 100%;
	height: 100%;
	border-radius: 0;
	margin: 0;
	background-color: #FAFAFA;
	border: none;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	position: relative;
	overflow: hidden;
	transition: all 0.3s;
}

.empty-avatar:active {
	background-color: #f0f0f0;
}

.empty-avatar text {
	font-size: 28rpx;
	color: #3399FF;
	text-align: center;
	line-height: 1.2;
	font-weight: 500;
	padding: 6rpx 12rpx;
	background-color: #f0f8ff;
	border-radius: 4rpx;
}

.user-name {
	font-size: 22rpx;
	color: #333333;
	text-align: center;
	width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.user-probability {
	font-size: 18rpx;
	color: #FF5500;
	margin-top: 8rpx;
	text-align: center;
	padding: 2rpx 6rpx;
	border-radius: 10rpx;
	display: block;
	width: 90%;
}

.user-nickname {
	font-size: 18rpx;
	color: #999;
	text-align: center;
	border-radius: 10rpx;
	display: block;
	width: 90%;
}

.lottery-btn {
	margin-top: 40rpx;
	margin-bottom: 20rpx;
	background-color: #FFD700;
	color: #FF5500;
	padding: 16rpx 80rpx;
	border-radius: 40rpx;
	font-size: 32rpx;
	font-weight: bold;
	box-shadow: 0 6rpx 15rpx rgba(255, 215, 0, 0.5);
	transition: all 0.3s ease;
	
	&:active {
		transform: scale(0.98);
	}
	
	&.rotating {
		animation: pulse 1s infinite alternate;
	}
}

@keyframes pulse {
	from {
		transform: scale(1);
		opacity: 1;
	}
	to {
		transform: scale(1.05);
		opacity: 0.9;
	}
}

.btn-text {
	text-align: center;
	display: block;
}

.result-popup {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
}

.result-content {
	width: 85%;
	max-width: 580rpx;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 40rpx 30rpx;
	text-align: center;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.3);
	box-sizing: border-box;
}

.result-header {
	font-size: 40rpx;
	font-weight: bold;
	margin-bottom: 30rpx;
	color: #FF3300;
	text-shadow: 0 1rpx 2rpx rgba(255, 51, 0, 0.2);
}

.lucky-users {
	margin-bottom: 30rpx;
	padding: 20rpx;
	background-color: #FFF4E8;
	border-radius: 15rpx;
	border: 2rpx dashed #FF5500;
}

.lucky-users-title {
	font-size: 32rpx;
	color: #FF3300;
	margin-bottom: 10rpx;
	font-weight: bold;
	text-align: center;
}

.prize-time {
	font-size: 24rpx;
	color: #999;
	margin: 10rpx 0 20rpx;
	text-align: center;
}

.lucky-user-item {
	display: flex;
	align-items: flex-start;
	padding: 24rpx;
	margin-bottom: 20rpx;
	background: linear-gradient(to right, #FFF9F0, #FFFFFF);
	border-radius: 16rpx;
	box-shadow: 0 6rpx 12rpx rgba(255, 85, 0, 0.08);
	text-align: left;
	overflow: hidden;
	border-left: 6rpx solid #FFD700;
	transition: all 0.3s ease;
	position: relative;
	
	&:hover, &:active {
		transform: translateY(-2rpx);
		box-shadow: 0 8rpx 16rpx rgba(255, 85, 0, 0.12);
	}
	
	&::after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 40rpx;
		height: 40rpx;
		background: linear-gradient(135deg, transparent 50%, #FFD700 50%);
		border-radius: 0 0 0 16rpx;
	}
	
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: -150%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		transform: skewX(-25deg);
		transition: all 0.75s;
	}
	
	&:hover::before {
		left: 150%;
	}
}

.lucky-user-avatar {
	width: 90rpx;
	height: 90rpx;
	margin-right: 20rpx;
	background-color: #EEEEEE;
	flex-shrink: 0;
	border: 3rpx solid #FFD700;
	border-radius: 12rpx;
	box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
	transition: transform 0.3s ease;
	
	&:hover {
		transform: scale(1.05);
	}
}

.lucky-user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	justify-content: center;
}

.name-time-container {
	display: flex;
	align-items: center;
	margin-bottom: 8rpx;
}

.lucky-user-name {
	font-size: 32rpx;
	color: #FF5500;
	font-weight: bold;
	text-shadow: 0 1rpx 2rpx rgba(255, 85, 0, 0.1);
	position: relative;
	display: inline-block;
	overflow: hidden;
	max-width: 90%;
	white-space: nowrap;
	text-overflow: ellipsis;
	
	&::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 0;
		height: 2rpx;
		background-color: #FF5500;
		transition: width 0.3s ease;
	}
	
	.lucky-user-item:hover &::after {
		width: 100%;
	}
}

.time {
	font-size: 22rpx;
	color: #999;
	margin-left: 10rpx;
	vertical-align: baseline;
}

.content-wrapper {
	line-height: 1.5;
	display: block;
	
	.content {
		font-size: 28rpx;
		color: #666666;
	}
}

.probability-info {
	margin-top: 20rpx;
	padding: 20rpx;
	background-color: #FFF9F0;
	border-radius: 15rpx;
	border: 2rpx dashed #FFAA33;
	
	.probability-title {
		font-size: 28rpx;
		color: #FF6600;
		margin-bottom: 10rpx;
		font-weight: bold;
		text-align: center;
	}
	
	.probability-note {
		font-size: 24rpx;
		color: #FF6600;
		text-align: center;
		margin-bottom: 15rpx;
		font-weight: bold;
	}
}

.result-btn {
	background-color: #FF3300;
	color: #FFFFFF;
	padding: 15rpx 0;
	border-radius: 40rpx;
	font-size: 32rpx;
	border: none;
	width: 80%;
	margin: 0 auto;
	margin-top: 20rpx;
}

// 删除响应式部分因为我们已经固定了3x3布局
@media screen and (max-width: 320px) {
	.user-avatar {
		width: 70rpx;
		height: 70rpx;
	}
	
	.user-name {
		font-size: 18rpx;
	}
}

// 新增：中奖用户显示在抽奖按钮下方的样式
.lucky-users-section {
	width: 100%;
	margin-top: 30rpx;
	padding: 24rpx;
	background-color: #FFFFFF;
	border-radius: 16rpx;
	border: 2rpx solid rgba(255, 85, 0, 0.3);
	box-sizing: border-box;
	box-shadow: 0 6rpx 15rpx rgba(0, 0, 0, 0.1);
	animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.lucky-users-title {
	font-size: 32rpx;
	color: #FF5500;
	margin-bottom: 10rpx;
	font-weight: bold;
	text-align: center;
	position: relative;
	padding-bottom: 16rpx;
	
	&:after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 60rpx;
		height: 4rpx;
		background-color: #FF5500;
		border-radius: 2rpx;
	}
}

.prize-time {
	font-size: 24rpx;
	color: #999;
	margin: 10rpx 0 20rpx;
	text-align: center;
}

.lucky-user-item {
	display: flex;
	align-items: flex-start;
	padding: 24rpx;
	margin-bottom: 20rpx;
	background: linear-gradient(to right, #FFF9F0, #FFFFFF);
	border-radius: 16rpx;
	box-shadow: 0 6rpx 12rpx rgba(255, 85, 0, 0.08);
	text-align: left;
	overflow: hidden;
	border-left: 6rpx solid #FFD700;
	transition: all 0.3s ease;
	position: relative;
	
	&:hover, &:active {
		transform: translateY(-2rpx);
		box-shadow: 0 8rpx 16rpx rgba(255, 85, 0, 0.12);
	}
	
	&::after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 40rpx;
		height: 40rpx;
		background: linear-gradient(135deg, transparent 50%, #FFD700 50%);
		border-radius: 0 0 0 16rpx;
	}
}

.lucky-user-avatar {
	width: 90rpx;
	height: 90rpx;
	margin-right: 20rpx;
	background-color: #EEEEEE;
	flex-shrink: 0;
	border: 3rpx solid #FFD700;
	border-radius: 12rpx;
	box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
	transition: transform 0.3s ease;
	
	&:hover {
		transform: scale(1.05);
	}
}

.probability-info {
	margin-top: 24rpx;
	padding: 16rpx;
	background-color: #FFF9F0;
	border-radius: 12rpx;
	border: 1rpx solid #FFEECC;
}

// 历史记录部分样式
.lottery-history {
	width: 100%;
	margin-top: 30rpx;
	padding: 24rpx;
	background-color: #FFFFFF;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
}

.history-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
	padding-bottom: 16rpx;
	border-bottom: 1px solid #EEEEEE;
}

.history-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
}

.history-toggle {
	font-size: 26rpx;
	color: #666666;
	padding: 4rpx 10rpx;
	border-radius: 30rpx;
	background-color: #F5F5F5;
}

.history-content {
	max-height: 600rpx;
	overflow-y: auto;
}

.history-item {
	margin-bottom: 20rpx;
	padding: 16rpx;
	background-color: #F9F9F9;
	border-radius: 12rpx;
	border-left: 4rpx solid #FFD700;
}

.history-item-header {
	display: flex;
	justify-content: space-between;
	margin-bottom: 10rpx;
}

.history-time {
	font-size: 24rpx;
	color: #999999;
}

.history-participants {
	font-size: 24rpx;
	color: #FF6600;
}

.history-winner-info {
	display: flex;
	align-items: center;
}

.history-winner-avatar {
	width: 60rpx;
	height: 60rpx;
	border-radius: 6rpx;
	margin-right: 10rpx;
}

.history-winner-detail {
	flex: 1;
}

.history-winner-name {
	font-size: 26rpx;
	color: #333333;
	font-weight: 500;
}

.history-winner-comment {
	font-size: 24rpx;
	color: #666666;
	margin-top: 4rpx;
	display: block;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 500rpx;
}

.history-empty, .history-loading {
	text-align: center;
	padding: 40rpx 0;
	color: #999999;
	font-size: 28rpx;
}

.history-pagination {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-top: 20rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid #EEEEEE;
}

.pagination-prev, .pagination-next {
	padding: 8rpx 16rpx;
	background-color: #FFD700;
	color: #FF5500;
	border-radius: 6rpx;
	font-size: 24rpx;
	margin: 0 16rpx;
	
	&.disabled {
		background-color: #EEEEEE;
		color: #999999;
	}
}

.pagination-info {
	font-size: 24rpx;
	color: #666666;
}

.toggle-history-container {
	width: 100%;
	padding: 20rpx 0;
	display: flex;
	justify-content: center;
}

.toggle-history-btn {
	background-color: #FFFFFF;
	color: #399BFE;
	border: 1rpx solid #399BFE;
	font-size: 28rpx;
	border-radius: 30rpx;
	padding: 10rpx 30rpx;
	margin-top: 20rpx;
}

.history-footer {
	margin-top: 20rpx;
	text-align: center;
}
</style>
