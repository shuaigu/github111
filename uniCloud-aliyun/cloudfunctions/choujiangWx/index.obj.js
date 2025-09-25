// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
module.exports = {
	_before: function () { // 通用预处理器
		// 初始化数据库连接
		this.db = uniCloud.database()
		this.dbCmd = this.db.command
		// 初始化用户网格位置集合
		this.gridPositionCollection = this.db.collection('lottery_grid_positions')
		// 初始化抽奖结果集合
		this.lotteryResultCollection = this.db.collection('lottery_results')
	},
	/**
	 * 获取抽奖用户列表
	 * @returns {object} 用户列表及相关配置
	 */
	getParticipants() {
		// 这里在实际应用中应当从数据库获取或通过前端传入
		// 本示例中返回空数组，实际用户列表将由前端传入
		return {
			success: true,
			participants: []
		};
	},
	
	/**
	 * 获取用户在九宫格中的位置信息
	 * @param {string} articleId 文章ID，用于标识特定的抽奖实例
	 * @returns {object} 九宫格位置数据
	 */
	async getGridPositions(articleId) {
		try {
			if (!articleId) {
				return {
					success: false,
					message: '缺少文章ID参数'
				};
			}
			
			// 查询该文章对应的九宫格位置数据
			const result = await this.gridPositionCollection.where({
				article_id: articleId
			}).limit(1).get();
			
			// 如果存在数据，返回positions数组，否则返回null
			if (result.data && result.data.length > 0) {
				return {
					success: true,
					gridPositions: result.data[0].positions || []
				};
			} else {
				return {
					success: true,
					gridPositions: null
				};
			}
		} catch (error) {
			console.error('获取九宫格位置数据失败:', error);
			return {
				success: false,
				message: '获取九宫格位置数据失败: ' + error.message
			};
		}
	},
	
	/**
	 * 保存用户在九宫格中的位置信息
	 * @param {object} params 参数对象
	 * @param {string} params.articleId 文章ID，用于标识特定的抽奖实例
	 * @param {Array} params.positions 九宫格位置数组，包含用户信息
	 * @returns {object} 保存结果
	 */
	async saveGridPositions(params = {}) {
		try {
			const { articleId, positions } = params;
			
			if (!articleId) {
				return {
					success: false,
					message: '缺少文章ID参数'
				};
			}
			
			if (!positions || !Array.isArray(positions)) {
				return {
					success: false,
					message: '位置数据格式不正确'
				};
			}
			
			// 处理位置数据，只保留必要的用户信息字段，减少存储空间
			const cleanedPositions = positions.map(pos => {
				if (!pos || typeof pos !== 'object') return null;
				
				// 只保留必要的字段
				return {
					_id: pos._id || null,
					user_id: pos.user_id || null,
					nickName: pos.nickName || null,
					avatarUrl: pos.avatarUrl || null,
					mobile: pos.mobile || null
				};
			});
			
			// 查询是否已存在该文章的位置数据
			const existingRecord = await this.gridPositionCollection.where({
				article_id: articleId
			}).limit(1).get();
			
			let result;
			
			// 如果存在则更新，否则创建新记录
			if (existingRecord.data && existingRecord.data.length > 0) {
				result = await this.gridPositionCollection.doc(existingRecord.data[0]._id).update({
					positions: cleanedPositions,
					update_time: Date.now()
				});
			} else {
				result = await this.gridPositionCollection.add({
					article_id: articleId,
					positions: cleanedPositions,
					create_time: Date.now(),
					update_time: Date.now()
				});
			}
			
			return {
				success: true,
				message: '保存成功'
			};
		} catch (error) {
			console.error('保存九宫格位置数据失败:', error);
			return {
				success: false,
				message: '保存九宫格位置数据失败: ' + error.message
			};
		}
	},
	
	/**
	 * 执行抽奖操作 - 按照评论顺序分配概率
	 * @param {object} params 抽奖参数，包含评论者列表和用户ID等
	 * @returns {object} 抽奖结果
	 */
	async doLottery(params = {}) {
		try {
			// 获取参与者列表
			const { commenters = [], userId = '', userInfo = {}, articleId = '' } = params;
			
			// 如果没有参与者，返回错误
			if (!commenters || commenters.length === 0) {
				return {
					success: false,
					message: '没有参与者'
				};
			}
			
			// 限制最多20个参与者
			const limitedCommenters = commenters.slice(0, 20);
			const participantCount = limitedCommenters.length;
			
			// 根据参与顺序分配中奖概率权重
			const weights = [];
			let totalWeight = 0;
			
			// 配置权重 - 按照排列顺序（每行5个）
			const USERS_PER_ROW = 5; // 每行显示5个用户
			
			for (let i = 0; i < participantCount; i++) {
				// 计算当前用户在第几行（从0开始）
				const row = Math.floor(i / USERS_PER_ROW);
				
				// 设置每行的权重
				let weight;
				switch (row) {
					case 0: // 第一行
						weight = 0.3;
						break;
					case 1: // 第二行
						weight = 0.5;
						break;
					case 2: // 第三行
						weight = 1.0; // 最高概率
						break;
					case 3: // 第四行
						weight = 0.7;
						break;
					default:
						weight = 0.5;
				}
				
				weights.push(weight);
				totalWeight += weight;
			}
			
			// 归一化权重为概率
			const probabilities = weights.map(w => w / totalWeight);
			
			// 计算累积概率
			const cumulativeProbabilities = [];
			let cumulative = 0;
			
			for (let i = 0; i < probabilities.length; i++) {
				cumulative += probabilities[i];
				cumulativeProbabilities.push(cumulative);
			}
			
			// 随机选择中奖者
			const randomValue = Math.random();
			let selectedIndex = 0;
			
			for (let i = 0; i < cumulativeProbabilities.length; i++) {
				if (randomValue <= cumulativeProbabilities[i]) {
					selectedIndex = i;
					break;
				}
			}
			
			// 获取中奖者信息
			const winner = limitedCommenters[selectedIndex];
			
			// 构建概率分布信息（用于显示）
			const probabilityInfo = probabilities.map((prob, index) => ({
				index,
				probability: (prob * 100).toFixed(2) + '%',
				nickName: limitedCommenters[index].nickName || '匿名用户',
				isWinner: index === selectedIndex
			}));
			
			// 在抽奖结束后，保存抽奖结果到数据库
			if (winner) {
				try {
					// 准备保存的结果数据
					const resultData = {
						article_id: articleId,
						winner_id: winner._id || winner.user_id,
						winner_name: winner.nickName || '匿名用户',
						winner_avatar: winner.avatarUrl || '',
						winner_mobile: winner.mobile || '',
						winner_content: winner.content || '',
						winner_index: selectedIndex,
						draw_time: Date.now(),
						operator_id: userId,
						participant_count: participantCount
					};
					
					// 保存抽奖结果
					await this.saveLotteryResult(resultData);
					
					// 将结果附加到返回数据
					return {
						success: true,
						winner,
						winnerIndex: selectedIndex,
						probabilityInfo,
						totalParticipants: participantCount
					};
				} catch (saveError) {
					console.error('保存抽奖结果失败:', saveError);
					// 即使保存失败也返回抽奖结果
					return {
						success: true,
						winner,
						winnerIndex: selectedIndex,
						probabilityInfo,
						saveError: '保存结果失败，但抽奖成功'
					};
				}
			}
			
			return {
				success: false,
				message: '抽奖失败，未找到中奖者'
			};
			
		} catch (error) {
			console.error('抽奖执行失败:', error);
			return {
				success: false,
				message: '抽奖执行失败: ' + error.message
			};
		}
	},
	
	/**
	 * 保存抽奖结果到数据库
	 * @param {object} resultData 抽奖结果数据
	 * @returns {object} 保存结果
	 */
	async saveLotteryResult(resultData) {
		try {
			if (!resultData) {
				throw new Error('结果数据不能为空');
			}
			
			// 添加到抽奖结果集合
			const result = await this.lotteryResultCollection.add({
				...resultData,
				create_time: Date.now()
			});
			
			return {
				success: true,
				id: result.id
			};
		} catch (error) {
			console.error('保存抽奖结果失败:', error);
			throw error;
		}
	},
	
	/**
	 * 获取文章的抽奖历史记录
	 * @param {string} articleId 文章ID
	 * @param {number} page 页码，从1开始
	 * @param {number} pageSize 每页记录数
	 * @returns {object} 抽奖历史记录
	 */
	async getLotteryHistory(articleId, page = 1, pageSize = 10) {
		try {
			if (!articleId) {
				return {
					success: false,
					message: '缺少文章ID参数'
				};
			}
			
			// 确保页码和每页数量合法
			const currentPage = Math.max(1, page);
			const limit = Math.min(50, Math.max(1, pageSize)); // 最多50条，最少1条
			const skip = (currentPage - 1) * limit;
			
			// 查询该文章的抽奖记录
			const countResult = await this.lotteryResultCollection.where({
				article_id: articleId
			}).count();
			
			const dataResult = await this.lotteryResultCollection
				.where({
					article_id: articleId
				})
				.orderBy('draw_time', 'desc') // 按抽奖时间降序排列
				.skip(skip)
				.limit(limit)
				.get();
			
			// 增强返回的数据，添加更易读的时间格式
			const enhancedData = (dataResult.data || []).map(record => {
				// 确保基础字段存在
				if (!record.winner_name) {
					record.winner_name = '匿名用户';
				}
				if (!record.winner_avatar) {
					record.winner_avatar = '/static/images/default-avatar.png';
				}
				if (!record.participant_count) {
					record.participant_count = 0;
				}
				
				// 添加格式化时间
				const drawDate = new Date(record.draw_time);
				record.formatted_time = drawDate.toLocaleString('zh-CN', {
					year: 'numeric',
					month: '2-digit', 
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				});
				
				return record;
			});
			
			return {
				success: true,
				total: countResult.total || 0,
				current_page: currentPage,
				page_size: limit,
				total_pages: Math.ceil((countResult.total || 0) / limit),
				data: enhancedData
			};
		} catch (error) {
			console.error('获取抽奖历史失败:', error);
			return {
				success: false,
				message: '获取抽奖历史失败: ' + error.message
			};
		}
	},
	
	/**
	 * 更新抽奖配置
	 * @param {object} data 包含抽奖配置的数据对象
	 * @returns {object} 更新结果
	 */
	updateLotteryConfig(data = {}) {
		try {
			const { weightExponent = 1.5 } = data;
			
			// 验证权重指数是否有效
			if (weightExponent < 0.5 || weightExponent > 3) {
				return {
					success: false,
					message: '权重指数必须在0.5到3之间'
				};
			}
			
			// 在实际应用中，这里应该将配置保存到数据库
			// 本例中仅返回成功结果
			
			return {
				success: true,
				message: '抽奖配置已更新'
			};
		} catch (error) {
			console.error('更新抽奖配置失败:', error);
			return {
				success: false,
				message: '更新抽奖配置失败'
			};
		}
	},
	
	/**
	 * 获取当前抽奖配置
	 * @returns {object} 当前的抽奖配置
	 */
	getLotteryConfig() {
		// 这里应该从数据库获取保存的配置
		// 本例中返回默认设置
		return {
			success: true,
			config: {
				weightExponent: 1.5,     // 权重指数 - 影响新旧评论的权重差异
				maxParticipants: 20      // 最大参与人数
			}
		};
	}
}
