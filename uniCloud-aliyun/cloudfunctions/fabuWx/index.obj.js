// 添加数据缓存
const cache = new Map()

// 配置常量
const DOMAIN = "https://aly22.jingle0350.cn"
const DEFAULT_IMAGE = "default.png" // 修正了拼写错误 (defalut → default)

// 水印配置
const WATERMARK_COLORS = {
	// 橙色 - 酒旅圈圈品牌色（RGB: 255,102,0）
	orange: 'I0ZGNjYwMA==', //rgba(255, 102, 0, 0.33)
	// 白色
	white: 'I0ZGRkZGRg==', //rgba(255, 255, 255, 0.34)
	// 黑色
	black: 'IzAwMDAwMA==', // #000000
	// 红色
	red: 'I0ZGMDAwMA==', // #FF0000
	// 蓝色
	blue: 'IzAwNjZGRg==', // #0066FF
	// 半透明黑色
	transBlack: 'IzAwMDAwMDgw', // #00000080
	// 半透明白色
	transWhite: 'I0ZGRkZGRjgw' // #FFFFFF80
}

// 当前使用的水印颜色
const CURRENT_WATERMARK_COLOR = WATERMARK_COLORS.white;
// 水印透明度（0-100）
const WATERMARK_OPACITY = 85;

// 水印图片配置
const WATERMARK_IMAGE = `${DOMAIN}/logo.png`; // 完整的水印图片URL
const USE_IMAGE_WATERMARK = true; // 控制是否使用图片水印

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
		const domain = "https://aly22.jingle0350.cn";
		
		// 使用七牛云图片处理接口直接生成图标
		// 使用default.png作为基础图像，它确保存在于七牛云上
		return `${domain}/default.png?imageMogr2/size-limit/${iconSize}x${iconSize}/background/rgb:${backgroundColor}/gravity/center/crop/${iconSize}x${iconSize}/format/.png`;
		
	} catch (error) {
		console.error('生成位置分类图标失败:', error);
		// 返回一个默认图标
		return `https://aly22.jingle0350.cn/default.png`;
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

// 修复 URL 安全的 Base64 编码函数 - 改进七牛云兼容性
function urlsafeBase64Encode(str) {
	// 确保输入是字符串
	if (typeof str !== 'string') {
		str = String(str || '');
	}
	
	try {
		// 七牛云要求Base64编码必须是UTF-8编码后的字符串
		// 直接使用七牛云推荐的编码方式
		const utf8Str = unescape(encodeURIComponent(str));
		
		// 执行Base64编码
		let base64 = btoa(utf8Str);
		
		// 替换特殊字符，使其URL安全
		base64 = base64
			.replace(/\+/g, '-')
			.replace(/\//g, '_');
			
		// 在七牛云URL中使用Base64时不需要去掉等号，保留它们
		return base64;
	} catch (error) {
		console.error('Base64编码错误:', error);
		// 返回已编码的默认文本 "精选商城"
		return '57K-6L-H5Z-O5biC';
	}
}

// 设置七牛云图片处理参数
// 添加水印文字
const watermarkText = urlsafeBase64Encode("酒旅圈圈");

// 根据图片形状生成水印参数
function getWatermarkParams(imageWidth, imageHeight, isThumb = false) {
	// 判断是使用图片水印还是文字水印
	if (USE_IMAGE_WATERMARK) {
		return getImageWatermarkParams(imageWidth, imageHeight, isThumb);
	} else {
		return getTextWatermarkParams(imageWidth, imageHeight, isThumb);
	}
}

// 图片水印参数生成
function getImageWatermarkParams(imageWidth, imageHeight, isThumb = false) {
	// 默认水印参数
	let wmScale = 0.2; // 水印大小相对于原图的比例
	let dx = 20;
	let dy = 20;
	
	// 如果是缩略图，使用更小的水印
	if (isThumb) {
		wmScale = 0.15;
		dx = 10;
		dy = 10;
		return `watermark/1/image/${urlsafeBase64Encode(WATERMARK_IMAGE)}/dissolve/${WATERMARK_OPACITY}/gravity/NorthEast/dx/${dx}/dy/${dy}/ws/${wmScale}`;
	}
	
	// 如果提供了宽高信息，根据图片形状调整水印大小
	if (imageWidth && imageHeight) {
		// 计算宽高比
		const ratio = imageWidth / imageHeight;
		
		// 根据图片形状调整水印大小和位置
		if (ratio < 0.8) {
			// 竖图 - 使用较小的水印
			wmScale = 0.18;
			dx = 15;
			dy = 15;
		} else if (ratio > 1.2) {
			// 横图 - 使用较大的水印
			wmScale = 0.22;
			dx = 25;
			dy = 25;
		} else {
			// 正方形 - 减小水印尺寸，但确保足够可见
			wmScale = 0.08; // 调整为0.08，介于原来的0.05和太大的0.1之间
			dx = 8;        // 调整为8px
			dy = 8;        // 调整为8px
		}
		
		// 如果图片很小，进一步减小水印但确保有最小可见大小
		const minDimension = Math.min(imageWidth, imageHeight);
		if (minDimension < 800) {
			wmScale = Math.max(0.06, wmScale * (minDimension / 1000)); // 确保水印不会小于0.06
			dx = Math.max(5, dx * (minDimension / 1000));
			dy = Math.max(5, dy * (minDimension / 1000));
		}
	}
	
	return `watermark/1/image/${urlsafeBase64Encode(WATERMARK_IMAGE)}/dissolve/${WATERMARK_OPACITY}/gravity/NorthEast/dx/${Math.round(dx)}/dy/${Math.round(dy)}/ws/${wmScale.toFixed(2)}`;
}

// 文字水印参数生成（保留原功能）
function getTextWatermarkParams(imageWidth, imageHeight, isThumb = false) {
	// 默认水印参数
	let fontSize = 500;
	let dx = 20;
	let dy = 20;
	
	// 如果是缩略图，使用更小的水印
	if (isThumb) {
		fontSize = 260;
		dx = 10;
		dy = 10;
		return `watermark/2/text/${watermarkText}/font/5a6L5L2T/fontsize/${fontSize}/fill/${CURRENT_WATERMARK_COLOR}/dissolve/${WATERMARK_OPACITY}/gravity/NorthEast/dx/${dx}/dy/${dy}`;
	}
	
	// 如果提供了宽高信息，根据图片形状调整水印大小
	if (imageWidth && imageHeight) {
		// 计算宽高比
		const ratio = imageWidth / imageHeight;
		
		// 根据图片形状调整水印大小
		if (ratio < 0.8) {
			// 竖图 - 使用较小的水印
			fontSize = 400;
			dx = 15;
			dy = 15;
		} else if (ratio > 1.2) {
			// 横图 - 使用较大的水印
			fontSize = 600;
			dx = 25;
			dy = 25;
		} else {
			// 正方形 - 使用默认大小
			fontSize = 500;
			dx = 20;
			dy = 20;
		}
		
		// 如果图片很小，进一步减小水印
		const minDimension = Math.min(imageWidth, imageHeight);
		if (minDimension < 800) {
			fontSize = Math.max(200, fontSize * (minDimension / 1000));
			dx = Math.max(10, dx * (minDimension / 1000));
			dy = Math.max(10, dy * (minDimension / 1000));
		}
	}
	
	return `watermark/2/text/${watermarkText}/font/5a6L5L2T/fontsize/${Math.round(fontSize)}/fill/${CURRENT_WATERMARK_COLOR}/dissolve/${WATERMARK_OPACITY}/gravity/NorthEast/dx/${Math.round(dx)}/dy/${Math.round(dy)}`;
}

// 基本图片处理参数（不含水印）
const baseImageOps = [
	// 原图处理
	`imageMogr2/auto-orient/format/webp`,
	// 压缩图 - 用于文章显示
	`imageMogr2/auto-orient/thumbnail/!1080x1920r/format/webp/quality/80`,
	// 缩略图 - 用于列表显示
	`imageMogr2/auto-orient/thumbnail/!300x300r/format/webp/quality/70`
];

// 默认的水印参数
const defaultWatermarkParams = USE_IMAGE_WATERMARK 
	? `watermark/1/image/${urlsafeBase64Encode(WATERMARK_IMAGE)}/dissolve/${WATERMARK_OPACITY}/gravity/NorthEast/dx/8/dy/8/ws/0.08` // 更新默认值以匹配正方形设置
	: `watermark/2/text/${watermarkText}/font/5a6L5L2T/fontsize/500/fill/${CURRENT_WATERMARK_COLOR}/dissolve/${WATERMARK_OPACITY}/gravity/NorthEast/dx/20/dy/20`;

const defaultThumbWatermarkParams = USE_IMAGE_WATERMARK
	? `watermark/1/image/${urlsafeBase64Encode(WATERMARK_IMAGE)}/dissolve/${WATERMARK_OPACITY}/gravity/NorthEast/dx/8/dy/8/ws/0.08` // 更新默认值以匹配正方形设置
	: `watermark/2/text/${watermarkText}/font/5a6L5L2T/fontsize/260/fill/${CURRENT_WATERMARK_COLOR}/dissolve/${WATERMARK_OPACITY}/gravity/NorthEast/dx/10/dy/10`;

// 默认图片处理参数（当无法获取图片尺寸时使用）
const imageOps = [
	`${baseImageOps[0]}|${defaultWatermarkParams}`,
	`${baseImageOps[1]}|${defaultWatermarkParams}`,
	`${baseImageOps[2]}|${defaultThumbWatermarkParams}`
].join('|');

// 添加视频文件类型检查
const allowedVideoTypes = ['mp4', 'mov', 'm4v']

module.exports = {
	getUploadFileOptions(data = {}) {
		let { 
			cloudPath, // 前端传过来的文件路径
			fileType = 'image',  // 默认为图片类型
			isOriginal = false, // 是否保持原始文件
			imageWidth, // 图片宽度
			imageHeight // 图片高度
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
			domain: "https://aly22.jingle0350.cn",
		});
		
		// 根据文件类型选择处理参数
		let persistentOps;
		
		// 根据图片尺寸生成自适应水印参数
		let adaptiveWatermarkParams = defaultWatermarkParams;
		let adaptiveThumbWatermarkParams = defaultThumbWatermarkParams;
		
		if (fileType === 'image' && imageWidth && imageHeight) {
			// 根据图片形状动态生成水印参数
			adaptiveWatermarkParams = getWatermarkParams(imageWidth, imageHeight, false);
			adaptiveThumbWatermarkParams = getWatermarkParams(imageWidth, imageHeight, true);
			
			// 重新生成带有自适应水印的图片处理参数
			persistentOps = [
				`${baseImageOps[0]}|${adaptiveWatermarkParams}`,
				`${baseImageOps[1]}|${adaptiveWatermarkParams}`,
				`${baseImageOps[2]}|${adaptiveThumbWatermarkParams}`
			].join('|');
		} else if (fileType === 'image') {
			// 使用默认水印参数
			persistentOps = imageOps;
		} else {
			// 视频不进行处理
			persistentOps = '';
		}
		
		// 调用 extStorageManager.getUploadFileOptions
		let uploadFileOptionsRes = extStorageManager.getUploadFileOptions({
			cloudPath: cloudPathNew,
			allowUpdate: false,
			persistentOps: persistentOps,
			metadata: {
				fileType: fileType,
				uploadTime: Date.now()
			}
		});
		
		const domain = "https://aly22.jingle0350.cn";
		const fileURL = `${domain}/${cloudPathNew}`;
		
		// 根据文件类型返回不同的URL
		if (fileType === 'image') {
			// 添加水印到URL，使用自适应水印参数
			return {
				...uploadFileOptionsRes,
				fileURL,
				compressedURL: `${fileURL}?${baseImageOps[1]}|${adaptiveWatermarkParams}`,
				thumbnailURL: `${fileURL}?${baseImageOps[2]}|${adaptiveThumbWatermarkParams}`,
				cloudPath: cloudPathNew // 添加 cloudPath
			};
		} else if (fileType === 'video') {
			// 只返回原始视频URL和简单的封面图URL
			const thumbnailURL = `${fileURL}?vframe/jpg/offset/0/w/640/h/360/rotate/auto`;
			
			return {
				...uploadFileOptionsRes,
				fileURL,
				thumbnailURL: thumbnailURL,
				cloudPath: cloudPathNew,
				video: {
					url: fileURL,
					cloudPath: cloudPathNew,
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
		const domain = "https://aly22.jingle0350.cn"
		
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
					// 已禁用图片压缩，直接使用原图
					return {
						original: fileURL,
						compressed: fileURL,  // 不再压缩，使用原图
						thumbnail: fileURL   // 不再压缩，使用原图
					}
				}).filter(url => url !== null)
				
				// 处理视频URL
				let videoUrls = null
				if (article.video && article.video.cloudPath) {
					const videoFileURL = `${domain}/${article.video.cloudPath}`
					videoUrls = {
						original: videoFileURL,
						thumbnail: `${videoFileURL}?vframe/jpg/offset/0/w/640/h/360`,
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
				domain: "https://aly22.jingle0350.cn",
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
