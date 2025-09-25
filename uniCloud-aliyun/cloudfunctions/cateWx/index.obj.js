const dbJQL = uniCloud.databaseForJQL()
const db = uniCloud.database()
const dbCmd = db.command

// 验证并处理图片路径
function validateImagePath(imgPath) {
	console.log('验证图片路径:', imgPath);
	
	// 如果没有提供图片路径，使用默认图片
	if (!imgPath) {
		console.log('未提供图片路径，使用默认图片');
		return '/static/images/defalut.png';
	}
	
	// 如果是临时文件路径，使用默认图片
	if (typeof imgPath === 'string' && (imgPath.startsWith('http://tmp/') || imgPath.startsWith('wxfile://'))) {
		console.warn('临时文件路径无法保存，使用默认图片:', imgPath);
		return '/static/images/defalut.png';
	}
	
	// 如果是云存储路径或有效的URL，直接使用
	if (typeof imgPath === 'string' && (
		imgPath.startsWith('cloud://') || 
		imgPath.startsWith('http://') || 
		imgPath.startsWith('https://')
	)) {
		console.log('使用云存储或URL路径:', imgPath);
		return imgPath;
	}
	
	// 如果是本地静态资源路径，确保格式正确
	if (typeof imgPath === 'string' && imgPath.startsWith('/static/')) {
		console.log('使用本地静态资源路径:', imgPath);
		return imgPath;
	}
	
	// 其他情况，使用默认图片
	console.warn('无效的图片路径，使用默认图片:', imgPath);
	return '/static/images/defalut.png';
}

// 获取当前时间戳
function getCurrentTimestamp() {
    return Date.now();
}

module.exports = {
	_before: function( ) { // 通用预处理器

	},
	/**
	 * get  获取分类
	 * @param {string} id 分类id
	 * @param {boolean} showAll 是否显示全部分类，包括未启用的
	 * @returns {object} 返回值 分类
	 */
	async get( id, showAll = false ) {
		try {
			if ( id ) {
				// 获取单个分类
				const res = await dbJQL.collection( "cateList" ).doc( id ).get( )
				return res
			} else {
				// 获取所有分类
				let query = dbJQL.collection( "cateList" )
				
				// 如果不是显示全部，则只查询可见的分类
				if (!showAll) {
					// 添加is_visible条件，当is_visible为true或未设置时显示
					query = query.where({
						$or: [
							{ is_visible: true },
							{ is_visible: dbCmd.exists(false) }
						]
					})
				}
				
				// 按排序字段降序排列
				const res = await query.orderBy("sort desc, create_time desc").get()
				return res
			}
		} catch (err) {
			console.error('获取分类失败:', err)
			return {
				code: -1,
				msg: '获取分类失败',
				err
			}
		}
	},
	
	/**
	 * getAllForAdmin 管理界面获取所有分类，包括不可见的
	 * @returns {object} 返回值 所有分类
	 */
	async getAllForAdmin() {
		try {
			// 获取所有分类，包括不可见的
			const res = await dbJQL.collection("cateList").orderBy("sort desc, create_time desc").get()
			return res
		} catch (err) {
			console.error('获取所有分类失败:', err)
			return {
				code: -1,
				msg: '获取所有分类失败',
				err
			}
		}
	},
	/**
	 * add  添加分类
	 * @param {object|string} cateData 分类数据或分类名称
	 * @param {string} cate_img 分类图片
	 * @param {number} sort 排序权重
	 * @returns {object} 返回值 0 成功
	 */
	async add( cateData, cate_img, sort = 0 ) {
		try {
			let cate_name, is_visible = true;
			
			// 处理传入的参数，兼容旧版本
			if (typeof cateData === 'string') {
				cate_name = cateData;
			} else if (typeof cateData === 'object') {
				cate_name = cateData.cate_name;
				cate_img = cateData.cate_img !== undefined ? cateData.cate_img : cate_img;
				sort = cateData.sort !== undefined ? cateData.sort : sort;
				is_visible = cateData.is_visible !== undefined ? cateData.is_visible : true;
			}
			
			// 检查分类名称是否已存在
			const existCheck = await dbJQL.collection("cateList").where({
				cate_name: cate_name
			}).get();
			
			if (existCheck.data && existCheck.data.length > 0) {
				return {
					code: -1,
					msg: '分类名称已存在'
				}
			}
			
			// 确保图片路径有效
			const imgPath = validateImagePath(cate_img);
			
			// 获取当前时间戳
			const now = getCurrentTimestamp();
			
			// 添加分类
			const res = await dbJQL.collection( "cateList" ).add({ 
				cate_name: cate_name,
				cate_img: imgPath,
				sort: parseInt(sort) || 0,
				is_visible: is_visible,
				create_time: now,
				update_time: now
			})
			
			return res
		} catch (err) {
			console.error('添加分类失败:', err)
			return {
				code: -1,
				msg: '添加分类失败',
				err
			}
		}
	},
	/**
	 * update  修改分类
	 * @param {string} id 分类id
	 * @param {object|string} cateData 分类数据或分类名称
	 * @param {string} cate_img 分类图片
	 * @param {number} sort 排序权重
	 * @returns {object} 返回值 0 成功
	 */
	async update( id, cateData, cate_img, sort ) {
		console.log('更新分类参数:', { id, cateData, cate_img, sort });
		
		if (!id) {
			return {
				errCode: 1,
				errMsg: '当前分类不存在'
			}
		}
		
		try {
			// 获取当前分类信息
			const cateInfo = await dbJQL.collection("cateList").doc(id).get();
			console.log('获取当前分类信息:', cateInfo);
			
			if (!cateInfo.data) {
				return {
					errCode: 1,
					errMsg: '当前分类不存在'
				}
			}
			
			// 准备更新数据
			const updateData = { 
				update_time: getCurrentTimestamp()
			};
			
			// 处理传入的参数，兼容旧版本
			if (typeof cateData === 'string') {
				// 如果传入的是字符串，则视为分类名称
				updateData.cate_name = cateData;
				
				// 检查分类名称是否已存在（排除当前ID）
				if (cateData) {
					const existCheck = await dbJQL.collection("cateList").where({
						_id: {
							$ne: id
						},
						cate_name: cateData
					}).get();
					
					if (existCheck.data && existCheck.data.length > 0) {
						return {
							code: -1,
							msg: '分类名称已存在'
						}
					}
				} else {
					return {
						errCode: 1,
						errMsg: '分类名称不可以为空'
					}
				}
			} else if (typeof cateData === 'object') {
				// 如果传入的是对象，则处理对象中的各个字段
				
				// 处理分类名称
				if (cateData.cate_name !== undefined) {
					if (!cateData.cate_name) {
						return {
							errCode: 1,
							errMsg: '分类名称不可以为空'
						}
					}
					
					// 检查分类名称是否已存在（排除当前ID）
					const existCheck = await dbJQL.collection("cateList").where({
						_id: {
							$ne: id
						},
						cate_name: cateData.cate_name
					}).get();
					
					if (existCheck.data && existCheck.data.length > 0) {
						return {
							code: -1,
							msg: '分类名称已存在'
						}
					}
					
					updateData.cate_name = cateData.cate_name;
				}
				
				// 处理分类图片
				if (cateData.cate_img !== undefined) {
					cate_img = cateData.cate_img;
				}
				
				// 处理排序权重
				if (cateData.sort !== undefined) {
					sort = cateData.sort;
				}
				
				// 处理可见性
				if (cateData.is_visible !== undefined) {
					updateData.is_visible = cateData.is_visible;
				}
			}
			
			// 如果有图片，则更新图片
			if (cate_img !== undefined) {
				// 验证图片路径
				updateData.cate_img = validateImagePath(cate_img);
				
				// 如果原来有云存储图片，且新图片不同，则删除旧图片
				const oldImg = cateInfo.data.cate_img;
				if (oldImg && oldImg.startsWith('cloud://') && oldImg !== updateData.cate_img && updateData.cate_img.startsWith('cloud://')) {
					try {
						await uniCloud.deleteFile({
							fileList: [oldImg]
						});
						console.log('已删除旧的云存储图片:', oldImg);
					} catch (fileErr) {
						console.error('删除旧的云存储图片失败:', fileErr);
						// 继续执行更新操作
					}
				}
			}
			
			// 如果有排序值，则更新排序
			if (sort !== undefined) {
				updateData.sort = parseInt(sort) || 0;
			}
			
			console.log('更新数据:', updateData);
			
			// 执行更新操作
			const res = await dbJQL.collection("cateList").doc(id).update(updateData);
			console.log('更新结果:', res);
			return res;
		} catch (err) {
			console.error('更新分类失败:', err);
			return {
				errCode: 2,
				errMsg: '更新分类失败: ' + err.message
			};
		}
	},
	/**
	 * updateSort  更新分类排序
	 * @param {string} id 分类id
	 * @param {number} sort 排序权重
	 * @returns {object} 返回值 0 成功
	 */
	async updateSort(id, sort) {
		if (!id) {
			return {
				errCode: 1,
				errMsg: '分类ID不能为空'
			}
		}
		
		try {
			const res = await dbJQL.collection("cateList").doc(id).update({
				sort: parseInt(sort) || 0,
				update_time: getCurrentTimestamp()
			});
			return res;
		} catch (err) {
			console.error('更新分类排序失败:', err);
			return {
				errCode: 2,
				errMsg: '更新分类排序失败: ' + err.message
			};
		}
	},
	/**
	 * toggleVisibility  切换分类可见性
	 * @param {string} id 分类id
	 * @param {boolean} visible 是否可见
	 * @returns {object} 返回值 0 成功
	 */
	async toggleVisibility(id, visible) {
		if (!id) {
			return {
				errCode: 1,
				errMsg: '分类ID不能为空'
			}
		}
		
		try {
			// 先获取当前分类信息，确保更新时包含必填字段
			const cateInfo = await dbJQL.collection("cateList").doc(id).get();
			if (!cateInfo.data) {
				return {
					errCode: 1,
					errMsg: '当前分类不存在'
				}
			}
			
			// 执行更新操作，保留原始的cate_name字段
			const res = await dbJQL.collection("cateList").doc(id).update({
				cate_name: cateInfo.data.cate_name, // 保留原有的分类名称，确保满足必填字段要求
				is_visible: !!visible,
				update_time: getCurrentTimestamp()
			});
			return res;
		} catch (err) {
			console.error('切换分类可见性失败:', err);
			return {
				errCode: 2,
				errMsg: '切换分类可见性失败: ' + err.message
			};
		}
	},
	/**
	 * del  删除分类
	 * @param {string} id 分类id
	 * @returns {object} 返回值 0 成功
	 */
	async del( id ) {
		try {
			// 获取分类信息，检查是否有云存储图片需要删除
			const cateInfo = await dbJQL.collection("cateList").doc(id).get();
			
			// 执行删除操作
			const res = await dbJQL.collection( "cateList" ).doc( id ).remove( )
			
			// 如果删除成功且有云存储图片，则删除图片
			if (res.deleted === 1 && cateInfo.data && cateInfo.data.cate_img && cateInfo.data.cate_img.startsWith('cloud://')) {
				try {
					await uniCloud.deleteFile({
						fileList: [cateInfo.data.cate_img]
					});
					console.log('已删除云存储图片:', cateInfo.data.cate_img);
				} catch (fileErr) {
					console.error('删除云存储图片失败:', fileErr);
					// 继续返回删除成功
				}
			}
			
			return res
		} catch (err) {
			console.error('删除分类失败:', err)
			return {
				code: -1,
				msg: '删除分类失败',
				err
			}
		}
	}
}