// 添加数据缓存
const cache = new Map()

// 配置常量
const DOMAIN = "https://aly22.jingle350.cn"
const DEFAULT_IMAGE = "default.png" // 修正了拼写错误 (defalut → default)

// 构建七牛云URL助手函数
function buildQiniuUrl(path, params = null) {
	const url = `${DOMAIN}/${path}`
	return params ? `${url}?${params}` : url
}

// 新增方法：自动根据区域创建分类
async function createCategoryFromDistrict(district) {
	// 如果区域名称为空，不创建分类
	if (!district || district === '未知区域') {
		return null;
	}
	
	// 初始化数据库
	const db = uniCloud.database();
	const $ = db.command.aggregate;
	
	try {
		// 如果district包含区或市，去掉这些后缀
		let cleanDistrict = district.replace(/(区|市|县|镇|乡)$/, '');
		
		// 如果清理后名称太短，使用原始名称
		if (cleanDistrict.length < 2) {
			cleanDistrict = district;
		}
		
		// 查询是否已存在同名分类 - 精确匹配cleanDistrict
		const exactMatchCategory = await db.collection('cateList')
			.where({
				cate_name: cleanDistrict
			})
			.limit(1)
			.get();
		
		// 如果存在精确匹配的分类，直接返回
		if (exactMatchCategory.data && exactMatchCategory.data.length > 0) {
			console.log(`找到精确匹配的区域分类:`, exactMatchCategory.data[0]);
			return exactMatchCategory.data[0];
		}
		
		// 查询是否已存在包含区域名称的分类（模糊匹配，用于处理"朝阳"和"朝阳区"这类情况）
		const fuzzyMatchCategory = await db.collection('cateList')
			.where({
				cate_name: new RegExp(`^${cleanDistrict}(区|市|县|镇|乡)?$`)
			})
			.limit(1)
			.get();
		
		// 如果存在模糊匹配的分类，直接返回
		if (fuzzyMatchCategory.data && fuzzyMatchCategory.data.length > 0) {
			console.log(`找到模糊匹配的区域分类:`, fuzzyMatchCategory.data[0]);
			return fuzzyMatchCategory.data[0];
		}
		
		// 生成该区域的图标URL
		const iconURL = await generateLocationCategoryIcon(cleanDistrict);
		
		// 构建新分类数据
		const newCategory = {
			cate_name: cleanDistrict, // 使用清理后的区域名称
			cate_img: iconURL || '/static/images/default.png', // 使用确保存在的默认图片
			sort: 100, // 给一个较高的排序权重
			is_visible: true,
			create_time: new Date(),
			update_time: new Date(),
			// 添加额外位置相关字段
			is_location_based: true,
			location_district: district // 保存原始区域名称
		};
		
		// 再次检查同名分类，防止并发创建
		const doubleCheckCategory = await db.collection('cateList')
			.where({
				cate_name: cleanDistrict
			})
			.limit(1)
			.get();
		
		if (doubleCheckCategory.data && doubleCheckCategory.data.length > 0) {
			console.log(`并发检测：已存在同名分类:`, doubleCheckCategory.data[0]);
			return doubleCheckCategory.data[0];
		}
		
		// 插入新分类
		const result = await db.collection('cateList').add(newCategory);
		
		if (result.id) {
			// 查询刚创建的分类详情
			const newCategoryInfo = await db.collection('cateList').doc(result.id).get();
			console.log(`成功创建区域分类:`, newCategoryInfo.data[0]);
			return newCategoryInfo.data[0];
		} else {
			throw new Error('创建分类失败');
		}
	} catch (error) {
		console.error('创建区域分类失败:', error);
		return null;
	}
}

// 生成位置分类图标
async function generateLocationCategoryIcon(districtName) {
	try {
		// 根据分类名称生成背景色
		const getColorFromName = (name) => {
			// 简单哈希算法生成颜色
			let hash = 0;
			for (let i = 0; i < name.length; i++) {
				hash = name.charCodeAt(i) + ((hash << 5) - hash);
			}
			
			// 生成柔和的背景色 - 使用HSL颜色模型
			const h = Math.abs(hash) % 360; // 色相
			const s = 40 + (Math.abs(hash) % 30); // 饱和度40-70%
			const l = 75 + (Math.abs(hash) % 15); // 亮度75-90%
			
			// 转换HSL为RGB，因为七牛云图片处理需要RGB值
			const hslToRgb = (h, s, l) => {
				s /= 100;
				l /= 100;
				
				const k = n => (n + h / 30) % 12;
				const a = s * Math.min(l, 1 - l);
				const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
				
				const r = Math.round(255 * f(0));
				const g = Math.round(255 * f(8));
				const b = Math.round(255 * f(4));
				
				return { r, g, b };
			};
			
			const rgb = hslToRgb(h, s, l);
			return `${rgb.r},${rgb.g},${rgb.b}`;
		};
		
		// 创建图标的基本信息
		const iconSize = 200; // 图标大小
		const backgroundColor = getColorFromName(districtName);
		
		// 生成时间戳，确保每次生成的URL不会被缓存
		const timestamp = Date.now();
		
		// 获取七牛云域名
		const domain = "https://aly22.jingle350.cn";
		
		// 使用七牛云图片处理接口直接生成图标
		// 使用default.png作为基础图像，它确保存在于七牛云上
		return `${domain}/default.png?imageMogr2/size-limit/${iconSize}x${iconSize}/background/rgb:${backgroundColor}/gravity/center/crop/${iconSize}x${iconSize}/format/.png`;
		
	} catch (error) {
		console.error('生成位置分类图标失败:', error);
		// 返回一个默认图标
		return `https://aly22.jingle350.cn/default.png`;
	}
}

const createCloudPath = (fileType, fileExt) => {
	const date = new Date()
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const timestamp = Date.now()
	const randomStr = Math.random().toString(36).slice(2, 10)
	
	// 构建新的文件路径: 2025年/图片或视频/年月日/时间戳_随机字符.扩展名
	const mediaType = fileType === 'image' ? 'tupian' : 'shipin'
	return `${year}/${mediaType}/${year}${month}${day}/${timestamp}_${randomStr}.${fileExt}`
}

// 添加 URL 安全的 Base64 编码函数
function urlsafeBase64Encode(str) {
	return btoa(str)
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

// 创建用户昵称的水印参数 - 简化为直接使用七牛云推荐格式
const createUserWatermarkParams = (fontSize) => {
	// 使用预定义文本-精选商城(已Base64编码)
	// 七牛云文档固定格式示例，确保兼容性
	return 'watermark/2/text/57K-6L-H5Z-O5biC/font/5a6L5L2T/fontsize/' + fontSize + '/fill/IzMzMzMz/dissolve/50/gravity/SouthEast/dx/20/dy/20';
};

// 根据图片形状自动调整水印大小
const getWatermarkByImageShape = (width, height) => {
    // 计算宽高比
    const ratio = width / height;
    
    // 正方形或近似正方形图片(比例在0.9-1.1之间)
    if (ratio >= 0.9 && ratio <= 1.1) {
        return createUserWatermarkParams('10'); // 正方形用更小的水印(10号字)
    } 
    // 横图
    else if (ratio > 1.1) {
        return createUserWatermarkParams('14'); // 横图用中等大小的水印(14号字)
    } 
    // 竖图
    else {
        return createUserWatermarkParams('16'); // 竖图可以用相对大一些的水印(16号字)
    }
};

// 为不同尺寸图片定制水印大小 - 降低字体大小
const watermarkLarge = createUserWatermarkParams('20');     // 原图水印字体大小降低到20
const watermarkMedium = createUserWatermarkParams('16');    // 中等压缩图水印字体大小降低到16
const watermarkSmall = createUserWatermarkParams('10');     // 缩略图水印字体大小降低到10

// 设置七牛云图片处理参数 - 完全移除水印
const imageOps = [
	// 原图处理 - 不再添加水印
	`imageMogr2/auto-orient/format/webp`,
	// 压缩图 - 用于文章显示，不再添加水印
	`imageMogr2/auto-orient/thumbnail/!1080x1920r/format/webp/quality/80`,
	// 缩略图 - 用于列表显示，不再添加水印
	`imageMogr2/auto-orient/thumbnail/!300x300r/format/webp/quality/70`
].join('|');

// 添加视频文件类型检查
const allowedVideoTypes = ['mp4', 'mov', 'm4v']

// 视频处理参数 - 用于持久化处理，移除水印
const videoOps = [
	// 转码任务 - 提高视频质量
	'avthumb/mp4' +
	'/s/1920x1080' +    
	'/vb/4096k' +       
	'/ab/192k' +        
	'/ar/44100' +       
	'/acodec/aac' +     
	'/vcodec/libx264' + 
	'/crf/23',          
	// 封面图任务 - 提高质量，不再添加水印
	`vframe/jpg/offset/0/w/1920/h/!1080/rotate/auto/format/jpg/q/85` 
].join('|');

// 添加实时转码参数配置 - 提高视频质量
const videoTranscodeParams = [
	'avthumb',
	'mp4',
	's/1920x1080',      // 提高分辨率到1080p
	'vb/4096k',         // 提高视频码率到4Mbps
	'ab/192k',          // 提高音频码率
	'ar/44100',         // 音频采样率
	'acodec/aac',       // 音频编码
	'vcodec/libx264',   // 视频编码
	'crf/23'            // 控制视频质量
].join('/');

module.exports = {
	getUploadFileOptions(data = {}) {
		let { 
			cloudPath, // 前端传过来的文件路径
			fileType = 'image',  // 默认为图片类型
			isOriginal = false, // 是否保持原始文件
			imageWidth, // 新增参数：图片宽度
			imageHeight // 新增参数：图片高度
		} = data;
		
		// 获取文件扩展名
		const fileExt = cloudPath.split('.').pop().toLowerCase()
		
		// 根据文件类型进行安全检查
		if (fileType === 'image') {
			const allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp']
			if (!allowedImageTypes.includes(fileExt)) {
				throw new Error('不支持的图片类型')
			}
		} else if (fileType === 'video') {
			if (!allowedVideoTypes.includes(fileExt)) {
				throw new Error('不支持的视频类型')
			}
		} else {
			throw new Error('不支持的文件类型')
		}
		
		// 使用修改后的路径生成方法，传入文件类型和扩展名
		const cloudPathNew = createCloudPath(fileType, fileExt)
		
		// 获取 extStorageManager 对象实例
		const extStorageManager = uniCloud.getExtStorageManager({
			provider: "qiniu",
			domain: "https://aly22.jingle350.cn",
		});
		
		// 根据文件类型选择处理参数
		let persistentOps;
		
		if (fileType === 'image' && imageWidth && imageHeight) {
			// 根据图片形状获取合适的水印参数
			const watermark = getWatermarkByImageShape(imageWidth, imageHeight);
			
			// 构建带水印的图片处理参数
			persistentOps = [
				`imageMogr2/auto-orient/format/webp|${watermark}`,
				`imageMogr2/auto-orient/thumbnail/!1080x1920r/format/webp/quality/80|${watermark}`,
				`imageMogr2/auto-orient/thumbnail/!300x300r/format/webp/quality/70|${watermark}`
			].join('|');
		} else {
			// 使用默认处理参数
			persistentOps = fileType === 'image' ? imageOps : videoOps;
		}
		
		// 调用 extStorageManager.getUploadFileOptions
		let uploadFileOptionsRes = extStorageManager.getUploadFileOptions({
			cloudPath: cloudPathNew,
			allowUpdate: false,
			persistentOps: persistentOps,
			metadata: {
				fileType: fileType,
				uploadTime: Date.now(),
				// 移除userNickName参数，不再使用
			}
		});
		
		const domain = "https://aly22.jingle350.cn";
		const fileURL = `${domain}/${cloudPathNew}`;
		
		// 根据文件类型返回不同的URL
		if (fileType === 'image') {
			return {
				...uploadFileOptionsRes,
				fileURL,
				compressedURL: `${fileURL}?imageMogr2/thumbnail/!1080x1920r/format/webp/quality/80`,
				thumbnailURL: `${fileURL}?imageMogr2/thumbnail/!300x300r/format/webp/quality/70`,
				cloudPath: cloudPathNew // 添加 cloudPath
			};
		} else if (fileType === 'video') {
			// 生成转码后的文件名
			const transcodedKey = cloudPathNew.replace(/\.mp4$/, '_trans.mp4');
			
			// 构建七牛云实时转码 URL
			const encodedOps = urlsafeBase64Encode(videoTranscodeParams);
			const transcodeURL = `${fileURL}?${encodedOps}`;
			
			// 构建封面图 URL，保持宽高比，不添加水印
			const thumbnailURL = `${fileURL}?vframe/jpg/offset/0/w/1920/h/!1080/rotate/auto/format/jpg/q/85`;
			
			// 添加额外的视频处理参数 - 去掉末尾的图片处理部分
			const processedVideoURL = `${fileURL}?avthumb/mp4/s/1920x1080/vb/4096k/ab/192k/ar/44100/acodec/aac/vcodec/libx264/crf/23`;
			
			return {
				...uploadFileOptionsRes,
				fileURL,
				compressedURL: processedVideoURL,
				thumbnailURL: thumbnailURL,
				cloudPath: cloudPathNew,
				video: {
					url: fileURL,
					cloudPath: cloudPathNew,
					compressed: processedVideoURL,
					thumbnail: thumbnailURL
				}
			};
		}
	},

	// 优化缓存方法
	async method(param) {
		const cacheKey = JSON.stringify(param)
		const cachedResult = cache.get(cacheKey)
		
		if (cachedResult) {
			// 检查缓存是否过期(30分钟)
			if (Date.now() - cachedResult.timestamp < 1800000) {
				return cachedResult.data
			}
			cache.delete(cacheKey)
		}
		
		const result = await // ... 原有处理逻辑
		
		cache.set(cacheKey, {
			data: result,
			timestamp: Date.now()
		})
		return result
	},
	
	// 新增API方法：处理区域和分类
	async processCategoryFromDistrict(district) {
		try {
			// 创建或获取分类
			const category = await createCategoryFromDistrict(district);
			return {
				code: 0,
				data: category,
				message: category ? '成功处理区域分类' : '无法从区域创建分类'
			};
		} catch (error) {
			console.error('处理区域分类失败:', error);
			return {
				code: -1,
				message: '处理区域分类失败',
				error: error.message
			};
		}
	},
	
	async getArticleList() {
		const db = uniCloud.database()
		const domain = "https://aly22.jingle350.cn"
		
		try {
			const result = await db.collection('articles').orderBy('createTime', 'desc').get()
			
			// 处理每篇文章的图片和视频URL
			const processedData = result.data.map(article => {
				// 处理图片URL
				if (!article.images || !Array.isArray(article.images)) {
					article.images = []
				}
				
				const imageUrls = article.images.map(image => {
					if (!image || !image.cloudPath) return null
					
					const fileURL = `${domain}/${image.cloudPath}`
					return {
						original: fileURL,
						compressed: `${fileURL}?imageMogr2/thumbnail/!1080x1920r/format/webp/quality/80`,
						thumbnail: `${fileURL}?imageMogr2/thumbnail/!300x300r/format/webp/quality/70`
					}
				}).filter(url => url !== null)
				
				// 处理视频URL
				let videoUrls = null
				if (article.video && article.video.cloudPath) {
					const videoFileURL = `${domain}/${article.video.cloudPath}`
					videoUrls = {
						original: videoFileURL,
						compressed: `${videoFileURL}?avthumb/mp4/s/1280x720/vb/1024k`,
						thumbnail: `${videoFileURL}?vframe/jpg/offset/0`,
						duration: article.video.duration || 0
					}
				}
				
				return {
					...article,
					imageUrls,
					videoUrls
				}
			})
			
			return {
				code: 0,
				data: processedData
			}
		} catch (e) {
			console.error('获取文章列表失败:', e)
			return {
				code: -1,
				message: '获取文章列表失败',
				error: e.message
			}
		}
	},

	async deleteArticle(id) {
		if (!id) {
			return {
				code: -1,
				message: '文章ID不能为空'
			}
		}

		const db = uniCloud.database()
		
		try {
			// 1. 先获取文章信息，用于删除相关的媒体文件
			const article = await db.collection('articles').doc(id).get()
			
			if (!article.data || article.data.length === 0) {
				return {
					code: -1,
					message: '文章不存在'
				}
			}

			const articleData = article.data[0]
			const extStorageManager = uniCloud.getExtStorageManager({
				provider: "qiniu",
				domain: "https://aly22.jingle350.cn",
			})

			// 2. 删除文章关联的图片
			if (articleData.images && Array.isArray(articleData.images)) {
				for (const image of articleData.images) {
					if (image && image.cloudPath) {
						await extStorageManager.deleteFile({
							fileList: [image.cloudPath]
						})
					}
				}
			}

			// 3. 删除文章关联的视频
			if (articleData.video && articleData.video.cloudPath) {
				await extStorageManager.deleteFile({
					fileList: [articleData.video.cloudPath]
				})
			}

			// 4. 删除文章数据库记录
			await db.collection('articles').doc(id).remove()

			return {
				code: 0,
				message: '删除成功'
			}
		} catch (e) {
			console.error('删除文章失败:', e)
			return {
				code: -1,
				message: '删除文章失败',
				error: e.message
			}
		}
	},

	// 添加更新分类图标的方法
	async updateCategoryIcon(params) {
		try {
			// 解构参数
			const { categoryId, iconURL, thumbnailURL } = params;
			
			// 参数验证
			if (!categoryId) {
				return {
					code: -1,
					message: '分类ID不能为空',
					updated: false
				};
			}
			
			if (!iconURL) {
				return {
					code: -1,
					message: '图标URL不能为空',
					updated: false
				};
			}
			
			// 初始化数据库连接
			const db = uniCloud.database();
			
			// 尝试更新分类记录
			const updateResult = await db.collection('cateList')
				.doc(categoryId)
				.update({
					cate_img: iconURL,
					cate_img_thumbnail: thumbnailURL || iconURL,
					update_time: new Date()
				});
			
			console.log('分类图标更新结果:', updateResult);
			
			// 检查更新结果
			if (updateResult.updated) {
				return {
					code: 0,
					message: '分类图标更新成功',
					updated: true,
					data: {
						categoryId,
						iconURL,
						thumbnailURL
					}
				};
			} else {
				return {
					code: -1,
					message: '分类不存在或未更新',
					updated: false
				};
			}
		} catch (error) {
			console.error('更新分类图标失败:', error);
			return {
				code: -1,
				message: '更新分类图标失败: ' + error.message,
				updated: false,
				error: error.message
			};
		}
	}
}
