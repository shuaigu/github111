const db = uniCloud.database( )
const feedbackCollection = db.collection( 'feedback' )

module.exports = {
	_before: function( ) { // 通用预处理器

	},

	/**
	 * 添加反馈
	 * @param {object} params
	 * @returns {object}
	 */
	async add( params ) {
		// 参数验证
		if ( !params.type || !params.content || !params.user_id ) {
			throw new Error( '参数不完整' )
		}

		if ( params.content.length < 10 ) {
			throw new Error( '反馈内容至少10个字' )
		}

		// 处理图片数据
		const images = params.images || [ ]
		if ( images.length > 3 ) {
			throw new Error( '最多上传3张图片' )
		}

		try {
			// 构建反馈数据
			const feedbackData = {
				type: params.type,
				content: params.content,
				contact: params.contact || '',
				images: images,
				user_id: params.user_id,
				create_time: Date.now( ),
				status: 0
			}

			// 添加反馈
			await feedbackCollection.add( feedbackData )

			return {
				success: true,
				message: '提交成功'
			}
		} catch ( err ) {
			throw new Error( '提交失败：' + err.message )
		}
	},

	/**
	 * 获取反馈列表
	 * @param {object} params
	 * @returns {object}
	 */
	async getList( params = {} ) {
		const {
			status
		} = params

		try {
			let query = feedbackCollection
				.orderBy( 'create_time', 'desc' )

			// 根据状态筛选
			if ( typeof status !== 'undefined' ) {
				query = query.where( {
					status: status
				} )
			}

			const { data } = await query
				.get( )

			return {
				success: true,
				data
			}
		} catch ( err ) {
			throw new Error( '获取反馈列表失败：' + err.message )
		}
	},

	/**
	 * 删除反馈
	 * @param {string} id - 反馈ID
	 * @returns {object}
	 */
	async remove( id ) {
		if ( !id ) {
			throw new Error( '反馈ID不能为空' )
		}

		try {
			await feedbackCollection.doc( id ).remove( )
			return {
				success: true,
				message: '删除成功'
			}
		} catch ( err ) {
			throw new Error( '删除失败：' + err.message )
		}
	}
}