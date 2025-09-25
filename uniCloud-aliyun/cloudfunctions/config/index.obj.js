// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

module.exports = {
	_before: function () { // 通用预处理器

	},
	/**
	 * 获取配置信息
	 * @param {string} key - 配置键名
	 * @returns {object} 返回配置信息
	 */
	async getConfig(key) {
		try {
			if (!key) {
				return {
					code: 1,
					message: '参数错误：缺少key'
				};
			}
			
			// 从数据库获取配置信息
			const db = uniCloud.database();
			const configCollection = db.collection('system_config');
			const result = await configCollection.where({ key }).limit(1).get();
			
			// 如果有数据，返回第一条；否则返回默认值
			if (result.data && result.data.length > 0) {
				return { 
					code: 0, 
					data: result.data[0].data, 
					message: '成功' 
				};
			} else {
				// 对于评论区显示配置，默认为显示
				if (key === 'commentDisplay') {
					return {
						code: 0,
						data: { isVisible: true },
						message: '成功（默认配置）'
					};
				}
				
				return {
					code: 0,
					data: null,
					message: '未找到配置'
				};
			}
		} catch (err) {
			console.error(`获取配置[${key}]失败:`, err);
			return {
				code: 1,
				message: '获取配置失败'
			};
		}
	},
	
	/**
	 * 更新配置信息
	 * @param {object} params - 参数对象
	 * @param {string} params.key - 配置键名
	 * @param {object} params.data - 配置数据
	 * @returns {object} 返回更新结果
	 */
	async updateConfig(params) {
		try {
			// 参数验证
			if (!params || !params.key || !params.data) {
				return {
					code: 1,
					message: '参数错误：缺少必要参数'
				};
			}
			
			const { key, data } = params;
			
			// 从数据库获取配置信息
			const db = uniCloud.database();
			const configCollection = db.collection('system_config');
			const result = await configCollection.where({ key }).limit(1).get();
			
			// 如果配置已存在，则更新；否则创建新配置
			if (result.data && result.data.length > 0) {
				await configCollection.doc(result.data[0]._id).update({
					data,
					update_time: Date.now()
				});
			} else {
				await configCollection.add({
					key,
					data,
					create_time: Date.now(),
					update_time: Date.now()
				});
			}
			
			return {
				code: 0,
				message: '更新成功'
			};
		} catch (err) {
			console.error(`更新配置[${params?.key}]失败:`, err);
			return {
				code: 1,
				message: '更新配置失败'
			};
		}
	}
} 