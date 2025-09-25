const config = require( './config.js' )
const { decryptPhoneNumber } = require( './decryptPhoneNumber.js' )
const { createToken } = require( './createToken.js' )
const generateRandomName = require( './generateRandomName' )

const dbJQL = uniCloud.databaseForJQL( )

module.exports = {
	_before: function( ) { // 通用预处理器

	},
	/**
	 * loginByPhoneWx 微信手机号登录
	 * @param {string} param1 参数1描述
	 * @returns {object} 返回值描述
	 */
	async loginByPhoneWx( params ) {
		const { code, encryptedData, iv } = params
		// 构造请求参数
		const sessionParams = {
			app_id: config.app_id_wx,
			app_secret: config.app_secret_wx,
			js_code: code
		}
		console.log( sessionParams.app_id, '微信id' )
		// 1. 获取微信登录信息
		const res = await uniCloud.request( {
			url: `https://api.weixin.qq.com/sns/jscode2session?appid=${sessionParams.app_id}&secret=${sessionParams.app_secret}&js_code=${sessionParams.js_code}&grant_type=authorization_code`,
			method: "POST",
		} )

		const { openid, session_key } = res.data

		// console.log( open_id, session_key, '后端' )
		if ( !openid || !session_key ) {
			throw new Error( '获取用户信息失败' )
		}
		// 2. 解密手机号
		const phoneData = decryptPhoneNumber(
			session_key,
			encryptedData,
			iv
		)

		if ( !phoneData || !phoneData.phoneNumber ) {
			throw new Error( '手机号解密失败' )
		}

		const userRecord = await dbJQL.collection( "user" ).where( {
			mobile: phoneData.phoneNumber
		} ).limit( 1 ).get( )

		let userId
		let userRes
		if ( userRecord.data.length === 0 ) {
			// 生成随机名称
			const randomName = generateRandomName( )
			// 创建新用户
			const token = createToken( openid, session_key )
			const addRes = await dbJQL.collection( "user" ).add( {
				openid_wx: openid,
				session_key: session_key,
				mobile: phoneData.phoneNumber,
				role: [ 'user' ],
				token,
				nickName: randomName
			} )
			console.log( addRes, '微信新用户返回' )
			userId = addRes.id
			userRes = await dbJQL.collection( "user" ).doc( userId ).get( )

		} else {
			userId = userRecord.data[ 0 ]._id
			await dbJQL.collection( "user" ).doc( userId ).update( { openid_wx: openid } )
			// 获取老用户信息
			userRes = await dbJQL.collection( "user" ).doc( userId ).get( )

		}

		// 返回
		return {
			code: 0,
			message: '登录成功',
			data: {
				_id: userRes.data[ 0 ]._id,
				openid_wx: userRes.data[ 0 ].openid_wx,
				token: userRes.data[ 0 ].token,
				mobile: userRes.data[ 0 ].mobile,
				nickName: userRes.data[ 0 ].nickName,
				avatarUrl: userRes.data[ 0 ].avatarUrl,
				role: userRes.data[ 0 ].role
			}
		}
	},
	
	/**
	 * 更新用户资料
	 * @param {Object} params 包含uid、avatarUrl和nickName
	 * @returns {Object} 返回操作结果
	 */
	async updateUserProfile(params) {
		const { uid, nickName, avatarUrl } = params
		
		if (!uid) {
			return {
				code: -1,
				message: '用户ID不能为空'
			}
		}
		
		try {
			// 构建更新数据
			const updateData = {}
			if (nickName) updateData.nickName = nickName
			if (avatarUrl) updateData.avatarUrl = avatarUrl
			
			// 如果没有任何更新字段，返回错误
			if (Object.keys(updateData).length === 0) {
				return {
					code: -1,
					message: '没有指定要更新的字段'
				}
			}
			
			// 更新用户资料
			await dbJQL.collection("user").doc(uid).update(updateData)
			
			return {
				code: 0,
				message: '更新成功'
			}
		} catch (error) {
			console.error('更新用户资料失败:', error)
			return {
				code: -1,
				message: '更新用户资料失败: ' + error.message
			}
		}
	},
	
	/**
	 * 根据用户ID数组获取用户信息
	 * @param {Array} userIds 用户ID数组
	 * @returns {Object} 返回用户信息结果
	 */
	async getUsersByIds(userIds) {
		if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
			return {
				code: -1,
				message: '用户ID数组不能为空',
				data: []
			}
		}
		
		try {
			// 使用数据库命令查询多个ID
			const db = uniCloud.database()
			const userCollection = db.collection('user')
			const userResult = await userCollection.where({
				_id: db.command.in(userIds)
			}).field({
				_id: true,
				mobile: true,
				nickName: true,
				avatarUrl: true
			}).get()
			
			if (userResult && userResult.data) {
				return {
					code: 0,
					message: '获取用户信息成功',
					data: userResult.data
				}
			} else {
				return {
					code: -1,
					message: '未找到用户信息',
					data: []
				}
			}
		} catch (error) {
			console.error('获取用户信息失败:', error)
			return {
				code: -1,
				message: '获取用户信息失败: ' + error.message,
				data: []
			}
		}
	},
	
	/**
	 * 获取单个用户信息
	 * @param {String} userId 用户ID
	 * @returns {Object} 返回用户信息
	 */
	async getUserInfo(userId) {
		if (!userId) {
			return {
				code: -1,
				message: '用户ID不能为空'
			}
		}
		
		try {
			const userResult = await dbJQL.collection("user").doc(userId).field({
				_id: true,
				mobile: true,
				nickName: true,
				avatarUrl: true,
				role: true
			}).get()
			
			if (userResult && userResult.data && userResult.data.length > 0) {
				return {
					code: 0,
					message: '获取用户信息成功',
					data: userResult.data[0]
				}
			} else {
				return {
					code: -1,
					message: '未找到用户信息'
				}
			}
		} catch (error) {
			console.error('获取用户信息失败:', error)
			return {
				code: -1,
				message: '获取用户信息失败: ' + error.message
			}
		}
	}
}