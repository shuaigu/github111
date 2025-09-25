const db = uniCloud.database( )

module.exports = {
	_before: function( ) { // 通用预处理器

	},
	/**
	 * get方法描述
	 * @returns {object} 返回值描述
	 */
	async get( ) {
		return await db.collection( "sendOn" ).get( )
	},

	/**
	 * update 方法描述
	 * @param {boolean} state 总开关状态
	 * @param {boolean} publishButton 发布按钮状态
	 * @param {boolean} floatButton 悬浮按钮状态
	 * @param {boolean} avatarClick 头像点击状态
	 * @param {boolean} commentVisibility 评论功能显示状态
	 * @param {boolean} lotteryVisibility 抽奖模块显示状态
	 * @returns {object} 返回更新后的状态
	 */
	async update( state, publishButton, floatButton, avatarClick, commentVisibility, lotteryVisibility ) {
		// 构建更新对象
		const updateData = { state: state };
		
		// 如果提供了按钮状态，则一并更新
		if (publishButton !== undefined) {
			updateData.publishButton = publishButton;
		}
		
		if (floatButton !== undefined) {
			updateData.floatButton = floatButton;
		}
		
		if (avatarClick !== undefined) {
			updateData.avatarClick = avatarClick;
		}
		
		if (commentVisibility !== undefined) {
			updateData.commentVisibility = commentVisibility;
		}
		
		if (lotteryVisibility !== undefined) {
			updateData.lotteryVisibility = lotteryVisibility;
		}
		
		// 更新数据库
		await db.collection("sendOn").update(updateData);
		
		// 返回更新后的状态
		return {
			state: state,
			publishButton: publishButton,
			floatButton: floatButton,
			avatarClick: avatarClick,
			commentVisibility: commentVisibility,
			lotteryVisibility: lotteryVisibility
		};
	}
}