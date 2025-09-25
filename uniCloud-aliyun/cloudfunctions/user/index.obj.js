const db = uniCloud.database( )
const dbJQL = uniCloud.databaseForJQL( )
const dbCmd = db.command

module.exports = {
	_before: function( ) {},

	/**
	 * 获取用户列表
	 * @param {number} page - 页码
	 * @param {number} pageSize - 每页数量
	 * @returns {object}
	 */
	async getUserList( page = 1, pageSize = 10 ) {
		try {
			console.log( '开始获取用户列表, 参数:', { page, pageSize } )

			// 先检查集合是否存在
			const collection = db.collection( 'uni-id-users' )

			// 先做一个简单查询测试
			const testQuery = await collection.limit( 1 ).get( )
			console.log( '测试查询结果:', testQuery )

			// 获取总数
			const countResult = await collection.count( )
			console.log( '总数查询结果:', countResult )

			// 获取分页数据
			const { data } = await collection
				.field( {
					_id: true,
					username: true,
					nickname: true,
					mobile: true,
					email: true,
					register_date: true,
					last_login_date: true
				} )
				.orderBy( 'register_date', 'desc' )
				.skip( ( page - 1 ) * pageSize )
				.limit( pageSize )
				.get( )

			console.log( '查询到的数据:', data )

			// 如果没有数据，尝试插入一条测试数据
			if ( !data.length ) {
				console.log( '没有查询到数据，尝试插入测试数据' )
				const testUser = {
					username: 'test_user',
					nickname: '测试用户',
					register_date: Date.now( ),
					last_login_date: Date.now( )
				}

				try {
					const insertResult = await collection.add( testUser )
					console.log( '插入测试数据结果:', insertResult )
					// 重新查询
					const newData = await collection
						.field( {
							_id: true,
							username: true,
							nickname: true,
							mobile: true,
							email: true,
							register_date: true,
							last_login_date: true
						} )
						.get( )
					console.log( '插入后重新查询结果:', newData )
					return {
						code: 0,
						msg: 'success',
						data: {
							list: newData.data,
							total: 1,
							page,
							pageSize
						}
					}
				} catch ( insertErr ) {
					console.error( '插入测试数据失败:', insertErr )
				}
			}

			return {
				code: 0,
				msg: 'success',
				data: {
					list: data,
					total: countResult.total,
					page,
					pageSize
				}
			}
		} catch ( err ) {
			console.error( '获取用户列表失败:', err )
			return {
				code: -1,
				msg: '获取用户列表失败：' + err.message
			}
		}
	},

	// 查询用户列表
	async queryUsers( params ) {
		const { mobile, nickName, page = 1, pageSize = 10 } = params;
		const db = uniCloud.database( );
		const userCollection = db.collection( 'user' );

		// 构建查询条件
		const where = {};
		if ( mobile ) {
			where.mobile = new RegExp( mobile );
		}
		if ( nickName ) {
			where.nickName = new RegExp( nickName );
		}

		// 计算分页
		const skip = ( page - 1 ) * pageSize;

		// 查询数据
		const { data } = await userCollection
			.where( where )
			.skip( skip )
			.limit( pageSize )
			.orderBy( 'create_time', 'desc' )
			.get( );

		return {
			code: 0,
			message: '查询成功',
			data
		};
	},

	// 根据ID获取用户信息
	async getUserById( userId ) {
		const db = uniCloud.database( );
		const userCollection = db.collection( 'user' );

		const { data } = await userCollection.doc( userId ).get( );

		if ( data.length === 0 ) {
			return {
				code: 1,
				message: '用户不存在',
				data: null
			};
		}

		return {
			code: 0,
			message: '查询成功',
			data: data[ 0 ]
		};
	},

	// 更新用户状态
	async updateUserStatus( params ) {
		const { userId, status } = params;

		if ( ![ 0, 1, 2 ].includes( status ) ) {
			return {
				code: 1,
				message: '状态值无效'
			};
		}

		const db = uniCloud.database( );
		const userCollection = db.collection( 'user' );

		// 更新状态
		await userCollection.doc( userId ).update( {
			status,
			status_desc: status === 0 ? '正常' : status === 1 ? '禁用' : '封禁',
			update_time: new Date( )
		} );

		return {
			code: 0,
			message: '更新成功'
		};
	},

	// 更新用户角色
	async updateUserRole( params ) {
		const { userId, action, role } = params;

		if ( !userId || !action || !role ) {
			return {
				code: 1,
				message: '参数不完整'
			};
		}

		if ( action !== 'add' && action !== 'remove' ) {
			return {
				code: 1,
				message: '操作类型无效'
			};
		}

		const db = uniCloud.database( );
		const userCollection = db.collection( 'user' );

		try {
			// 先获取用户当前角色
			const { data } = await userCollection.doc( userId ).get( );

			if ( data.length === 0 ) {
				return {
					code: 1,
					message: '用户不存在'
				};
			}

			const user = data[ 0 ];
			let roles = user.role || [ ];

			if ( action === 'add' ) {
				// 添加角色
				if ( !roles.includes( role ) ) {
					roles.push( role );
				}
			} else {
				// 移除角色
				const index = roles.indexOf( role );
				if ( index !== -1 ) {
					roles.splice( index, 1 );
				}
			}

			// 更新用户角色
			await userCollection.doc( userId ).update( {
				role: roles,
				update_time: new Date( )
			} );

			return {
				code: 0,
				message: '角色更新成功',
				data: {
					role: roles
				}
			};
		} catch ( e ) {
			console.error( '更新用户角色失败:', e );
			return {
				code: 1,
				message: '更新用户角色失败: ' + e.message
			};
		}
	},

	// 根据手机号获取用户信息
	async getUserByMobile( mobile ) {
		if ( !mobile ) {
			return {
				code: 1,
				message: '手机号不能为空',
				data: null
			};
		}

		try {
			const db = uniCloud.database( );
			const userCollection = db.collection( 'user' );

			// 查询指定手机号的用户
			const { data } = await userCollection.where( {
				mobile: mobile
			} ).limit( 1 ).get( );

			if ( data.length === 0 ) {
				return {
					code: 1,
					message: '用户不存在',
					data: {
						avatarUrl: '',
						nickName: '未知用户'
					}
				};
			}

			// 检查用户是否有VIP角色
			const isVip = data[ 0 ].role && data[ 0 ].role.includes( 'vip' );

			return {
				code: 0,
				message: '查询成功',
				data: {
					avatarUrl: data[ 0 ].avatarUrl || '',
					nickName: data[ 0 ].nickName || '未命名用户',
					mobile: data[ 0 ].mobile,
					role: data[ 0 ].role || [ 'user' ],
					isVip: isVip // 添加isVip字段
				}
			};
		} catch ( err ) {
			console.error( '根据手机号获取用户信息失败:', err );
			return {
				code: -1,
				message: '查询失败: ' + err.message,
				data: {
					avatarUrl: '',
					nickName: '未知用户'
				}
			};
		}
	},

	// 创建新用户
	async createUser( params ) {
		const { mobile, nickName, avatarUrl, isVip } = params;

		if ( !mobile ) {
			return {
				code: 1,
				message: '手机号不能为空'
			};
		}

		try {
			const db = uniCloud.database( );
			const userCollection = db.collection( 'user' );

			// 检查手机号是否已存在
			const { data } = await userCollection.where( {
				mobile: mobile
			} ).get( );

			if ( data.length > 0 ) {
				// 如果用户已存在，检查是否需要更新VIP状态
				if ( isVip === true && ( !data[ 0 ].role || !data[ 0 ].role.includes( 'vip' ) ) ) {
					// 添加VIP角色
					const roles = data[ 0 ].role || [ 'user' ];
					if ( !roles.includes( 'vip' ) ) {
						roles.push( 'vip' );
					}

					await userCollection.doc( data[ 0 ]._id ).update( {
						role: roles,
						update_time: new Date( )
					} );

					// 返回更新后的用户信息
					return {
						code: 1,
						message: '用户已存在，已更新为VIP',
						data: {
							...data[ 0 ],
							role: roles,
							isVip: true
						}
					};
				}

				return {
					code: 1,
					message: '该手机号已注册',
					data: {
						...data[ 0 ],
						isVip: data[ 0 ].role && data[ 0 ].role.includes( 'vip' )
					}
				};
			}

			// 设置用户角色
			const roles = [ 'user' ];
			if ( isVip === true ) {
				roles.push( 'vip' );
			}

			// 创建新用户
			const newUser = {
				mobile,
				nickName: nickName || '新用户',
				avatarUrl: avatarUrl || '',
				status: 0,
				status_desc: '正常',
				role: roles,
				create_time: new Date( ),
				update_time: new Date( )
			};

			const result = await userCollection.add( newUser );

			return {
				code: 0,
				message: '创建成功',
				data: {
					...newUser,
					_id: result.id,
					isVip: roles.includes( 'vip' )
				}
			};
		} catch ( err ) {
			console.error( '创建用户失败:', err );
			return {
				code: -1,
				message: '创建用户失败: ' + err.message
			};
		}
	},

	// 在用户注册或创建用户的方法中添加以下逻辑
	async register( params ) {
		// ... 现有代码 ...

		// 确保用户至少有 user 角色
		if ( !params.role ) {
			params.role = [ 'user' ];
		} else if ( !params.role.includes( 'user' ) ) {
			params.role.push( 'user' );
		}

		// ... 继续处理注册逻辑 ...
	},

	/**
	 * getUserVip  获取vip用户
	 */

	async getUserVip( ) {
		return await dbJQL.collection( 'user' )
			.where( { role: dbCmd.in( [ 'vip' ] ) } )
			.get( )
	}
}