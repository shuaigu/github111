const db = uniCloud.database( )
const dbJQL = uniCloud.databaseForJQL( )

module.exports = {
	_before: function( ) {
		// 可以在此添加通用的前置处理
	},

	/**
	 * 获取公司信息
	 * @returns {object}
	 */
	async getInfo( ) {
		try {
			const { data } = await dbJQL.collection( 'company' ).limit( 1 ).get( )
			return {
				success: true,
				data: data[ 0 ] || null
			}
		} catch ( err ) {
			throw new Error( '获取公司信息失败：' + err.message )
		}
	},

	/**
	 * 更新公司信息
	 * @param {object} params
	 * @returns {object}
	 */
	async updateInfo( params ) {
		// 参数验证
		if ( !params.name?.trim( ) ) {
			throw new Error( '公司名称不能为空' )
		}

		// 验证电话格式
		if ( params.phone && !/^1[3-9]\d{9}$/.test( params.phone ) ) {
			throw new Error( '请输入正确的手机号码' )
		}

		// 验证邮箱格式
		if ( params.email && !/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test( params.email ) ) {
			throw new Error( '请输入正确的邮箱地址' )
		}

		try {
			const { data } = await dbJQL.collection( 'company' ).limit( 1 ).get( )
			const companyData = {
				name: params.name.trim( ),
				slogan: params.slogan?.trim( ) || '',
				address: params.address?.trim( ) || '',
				phone: params.phone?.trim( ) || '',
				email: params.email?.trim( ) || '',
				workTime: params.workTime?.trim( ) || '',
				update_time: Date.now( )
			}

			let res
			if ( data.length > 0 ) {
				// 更新
				res = await dbJQL.collection( 'company' ).doc( data[ 0 ]._id ).update( companyData )
			} else {
				// 新增
				res = await dbJQL.collection( 'company' ).add( companyData )
			}

			return {
				success: true,
				message: '保存成功'
			}
		} catch ( err ) {
			throw new Error( '保存失败：' + err.message )
		}
	}
}