// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const db = uniCloud.database();

module.exports = {
	_before: function () { // 通用预处理器

	},
	
	/**
	 * 提供生成封面所需的数据并直接生成封面
	 * @param {string} userId 用户ID
	 * @returns {object} 返回生成的封面图片URL
	 */
	async generateCover(userId) {
		try {
			// 参数校验
			if (!userId) {
				return {
					errCode: 'PARAM_IS_NULL',
					errMsg: '用户ID不能为空',
					success: false
				}
			}
			
			// 从数据库获取用户信息
			const userInfo = await module.exports.getUserInfo(userId);
			if (userInfo.errCode) return userInfo;
			
			// 获取用户最新文章的图片
			const articleImages = await module.exports.getLatestArticleImages(userId);
			
			// 在云端生成封面图片
			const coverImageUrl = await module.exports.createCoverImage(userInfo, articleImages, userId);
			
			// 返回封面图片URL
			return {
				errCode: 0,
				errMsg: '封面生成成功',
				success: true,
				coverImageUrl: coverImageUrl
			}
		} catch (err) {
			console.error('生成封面出错:', err);
			return {
				errCode: 'GENERATE_COVER_ERROR',
				errMsg: '生成封面出错: ' + err.message,
				success: false
			}
		}
	},
	
	/**
	 * 在云端创建封面图片
	 * @param {object} userInfo 用户信息
	 * @param {array} articleImages 文章图片
	 * @param {string} userId 用户ID
	 * @returns {string} 封面图片URL
	 */
	createCoverImage: async function(userInfo, articleImages, userId) {
		try {
			// 使用云存储API创建图片
			// 注意：直接在云端创建图片需要使用uniCloud提供的图片处理服务
			// 以下代码需要根据uniCloud图片处理服务的具体实现来调整
			
			// 创建唯一的图片文件名
			const fileName = `cover_${userInfo._id}_${Date.now()}.jpg`;
			const filePath = `covers/${fileName}`;
			
			// 使用云存储上传临时图片标记（实际使用中需替换为真实图片数据）
			// 这里简单地合成封面图片的描述，实际应用需要使用真实的图片处理服务
			const templateData = {
				background: '#000000',
				width: 750,
				height: 600,
				userInfo: {
					nickName: userInfo.nickName || '用户',
					avatarUrl: userInfo.avatarUrl || ''
				},
				articleImages: articleImages || []
			};
			
			// 调用uniCloud提供的图片处理服务（这需要根据实际可用的服务调整）
			// 此处为示例，实际开发需要使用云厂商提供的图片处理服务
			const imageService = uniCloud.importObject('imageService'); // 假设有这样一个服务
			const result = await imageService.generateImage(templateData, filePath);
			
			if (result && result.fileID) {
				// 获取图片的临时访问链接
				const tempFileURL = await uniCloud.getTempFileURL({
					fileList: [result.fileID]
				});
				
				if (tempFileURL && tempFileURL.fileList && tempFileURL.fileList[0]) {
					return tempFileURL.fileList[0].tempFileURL;
				}
			}
			
			// 如果没有成功生成封面，返回获取的用户数据供前端使用
			console.log('未能在云端生成封面图片，将返回数据供前端处理');
			return await module.exports.getCoverData(userId);
			
		} catch (err) {
			console.error('创建封面图片出错:', err);
			// 出错时也返回数据供前端处理
			return await module.exports.getCoverData(userId);
		}
	},
	
	/**
	 * 提供生成封面所需的数据
	 * @param {string} userId 用户ID
	 * @returns {object} 返回生成封面所需的数据
	 */
	async getCoverData(userId) {
		try {
			// 参数校验
			if (!userId) {
				return {
					errCode: 'PARAM_IS_NULL',
					errMsg: '用户ID不能为空',
					success: false
				}
			}
			
			// 从数据库获取用户信息 - 直接调用函数而不是用this
			const userInfo = await module.exports.getUserInfo(userId);
			if (userInfo.errCode) return userInfo;
			
			// 获取用户最新文章的图片 - 直接调用函数而不是用this
			const articleImages = await module.exports.getLatestArticleImages(userId);
			
			// 返回前端需要的数据
			return {
				errCode: 0,
				errMsg: '获取数据成功',
				success: true,
				data: {
					userInfo: {
						nickName: userInfo.nickName || '用户',
						avatarUrl: userInfo.avatarUrl || '',
					},
					articleImages: articleImages || []
				}
			}
		} catch (err) {
			console.error('获取封面数据出错:', err);
			return {
				errCode: 'GET_COVER_DATA_ERROR',
				errMsg: '获取封面数据出错: ' + err.message,
				success: false
			}
		}
	},
	
	/**
	 * 从数据库获取用户信息
	 * @param {string} userId 用户ID
	 * @returns {object} 用户信息
	 */
	getUserInfo: async function(userId) {
		try {
			const userInfo = await db.collection('user').doc(userId).get();
			
			if (userInfo && userInfo.data && userInfo.data.length > 0) {
				return userInfo.data[0];
			} else {
				return {
					errCode: 'USER_NOT_FOUND',
					errMsg: '未找到用户信息'
				}
			}
		} catch (err) {
			console.error('获取用户信息失败:', err);
			return {
				errCode: 'GET_USER_INFO_ERROR',
				errMsg: '获取用户信息失败: ' + err.message
			}
		}
	},
	
	/**
	 * 获取用户最新文章的图片
	 * @param {string} userId 用户ID
	 * @returns {array} 图片URL数组
	 */
	getLatestArticleImages: async function(userId) {
		try {
			// 查询用户最新文章
			const articleRes = await db.collection('article')
				.where({
					user_id: userId
				})
				.orderBy('create_time', 'desc')
				.limit(1)
				.get();
			
			if (!articleRes.data || articleRes.data.length === 0) {
				return [];
			}
			
			const article = articleRes.data[0];
			const imageUrls = [];
			
			// 处理新版图片结构 (images 数组)
			if (article.images && article.images.length > 0) {
				article.images.forEach(img => {
					// 优先使用缩略图
					if (img.thumbnailURL) {
						imageUrls.push(img.thumbnailURL);
					}
					// 其次使用压缩图
					else if (img.compressedURL) {
						imageUrls.push(img.compressedURL);
					}
					// 再次使用原图
					else if (img.url) {
						imageUrls.push(img.url);
					}
					// 如果是字符串直接使用
					else if (typeof img === 'string') {
						imageUrls.push(img);
					}
				});
			}
			
			// 处理旧版图片结构 (imgArr 数组)
			if (article.imgArr && article.imgArr.length > 0) {
				article.imgArr.forEach(img => {
					imageUrls.push(img);
				});
			}
			
			// 尝试使用封面图
			if (article.coverImage && imageUrls.length === 0) {
				imageUrls.push(article.coverImage);
			}
			
			// 最多返回3张图片
			return imageUrls.slice(0, 3);
		} catch (err) {
			console.error('获取文章图片失败:', err);
			return [];
		}
	}
}
