const dbJQL = uniCloud.databaseForJQL( )

module.exports = {
	_before: function( ) { // 通用预处理器

	},
	/**
	 * addOrder 创建订单
	 * @param {string} param 订单信息
	 * @returns {object} 返回值-- 订单id
	 */
	async addOrder( param ) {
		// 参数校验，如无参数则不需要
		if ( !param ) {
			return {
				errCode: 'PARAM_IS_NULL',
				errMsg: '参数不能为空'
			}
		}

		// 业务逻辑
		const orderRes = await dbJQL.collection( 'order' ).add( param )
		// 添加成功
		if ( !orderRes.id ) {
			return {
				errCode: 1,
				errMsg: '新建订单失败'
			}
		}

		return orderRes
	},

	/**
	 * updateOrderStauts 更新订单状态
	 * @param {string} order_id 订单当前订单id
	 * @returns {object} 返回值-- 订单id
	 */

	async updateOrderStauts( order_id ) {
		console.log( order_id )
		return await dbJQL.collection( 'order' )
			.where( `out_trade_no == '${order_id}' ` )
			.update( { status: 1 } )
	},
	
	/**
	 * updateOrderArticle 更新订单状态
	 * @param {string} order_id 订单当前订单id
	 * @returns {object} 返回值-- 订单id
	 */
	
	async updateOrderArticle( order_id,article_id ) {
		console.log( order_id,article_id,'后端返回')
		return await dbJQL.collection( 'order' )
			.where( `out_trade_no == '${order_id}' ` )
			.update( {article_id: article_id} )
	},
	
	/**
	 * getOrderOne 获取订单
	 * @param {string} user_id 当前用户id
	 * @returns {object} 返回值-- 订单对象信息
	 */
	
	async getOrderOne( user_id ) {
		return await dbJQL.collection( 'order' ).where({vip_id:user_id,status:1}).get()
	}
}