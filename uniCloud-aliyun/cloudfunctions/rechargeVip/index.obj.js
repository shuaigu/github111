const dbJQL = uniCloud.databaseForJQL( )
module.exports = {
	_before: function( ) { // 通用预处理器

	},
	/**
	 * getRechargeList 获取所有的充值列表
	 * @returns {object} 返回值--列表
	 */
	async getRechargeList( ) {
		return await dbJQL.collection( 'vipRechargePro' ).get( )
	}
}