// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

module.exports = {
	_before: function () { // 通用预处理器

	},
	/**
	 * 获取导航信息
	 * @returns {object} 返回导航链接
	 */
	async getNavInfo() {
		try {
			// 从数据库获取导航信息
			const db = uniCloud.database();
			const navCollection = db.collection('navigation_settings');
			const result = await navCollection.limit(1).get();
			
			// 如果有数据，返回第一条；否则返回默认值
			if (result.data && result.data.length > 0) {
				return { 
					code: 0, 
					data: result.data[0], 
					message: '成功' 
				}
			} else {
				// 默认值
				return { 
					code: 0, 
					data: {
						title: '发布帖子',
						url: 'https://wx6.jingle0350.cn/1-1-JqLayout-Page_ID_1.html',
						isVisible: true
					}, 
					message: '成功' 
				}
			}
		} catch (error) {
			return { code: -1, data: null, message: '获取导航信息失败：' + error.message }
		}
	},
	
	/**
	 * 更新导航信息
	 * @param {object} params - 导航参数
	 * @param {string} params.title - 导航标题
	 * @param {string} params.url - 导航链接
	 * @param {boolean} params.isVisible - 是否显示导航
	 * @returns {object} 更新结果
	 */
	async updateNavInfo(params) {
		try {
			// 参数验证
			if (!params) {
				return { code: -1, message: '参数不能为空' }
			}
			
			const { title, url, isVisible } = params;
			
			// 准备更新的数据
			const updateData = {};
			if (title !== undefined) updateData.title = title;
			if (url !== undefined) updateData.url = url;
			if (isVisible !== undefined) updateData.isVisible = isVisible;
			
			// 更新数据库
			const db = uniCloud.database();
			const navCollection = db.collection('navigation_settings');
			
			// 先查询是否有记录
			const result = await navCollection.limit(1).get();
			
			if (result.data && result.data.length > 0) {
				// 有记录，更新
				await navCollection.doc(result.data[0]._id).update(updateData);
			} else {
				// 无记录，创建
				await navCollection.add({
					title: title || '发布帖子',
					url: url || 'https://wx6.jingle0350.cn/1-1-JqLayout-Page_ID_1.html',
					isVisible: isVisible !== undefined ? isVisible : true,
					create_time: Date.now()
				});
			}
			
			return { code: 0, message: '更新成功' }
		} catch (error) {
			return { code: -1, message: '更新导航信息失败：' + error.message }
		}
	}
}
