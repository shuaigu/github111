/**
 * 域名配置管理
 * 集中管理所有图片域名相关配置，方便统一修改和维护
 */

// 域名配置对象
const domainConfig = {
	// 错误域名到正确域名的映射表
	// 当需要修复旧域名时，在这里添加映射关系即可
	domainMap: {
		'jingle350.cn': 'jingle0350.cn',           // 修复域名错误
		'aly2.jingle0350.cn': 'aly22.jingle0350.cn'  // 修复子域名错误
	},
	
	// 当前使用的正确域名（主域名）
	// 如果需要换域名，只需要修改这个值
	correctDomain: 'aly22.jingle0350.cn',
	
	// 默认图片路径配置
	defaultImages: {
		'default': '/static/images/default.png',      // 默认图片
		'avatar': '/static/images/default-avatar.png', // 默认头像
		'video': '/static/images/default.png'         // 默认视频缩略图
	},
	
	// 图片质量参数配置（七牛云）
	imageParams: {
		thumbnail: '?imageMogr2/thumbnail/300x300',   // 缩略图参数
		compress: '?imageMogr2/quality/80',           // 压缩参数
		webp: '?imageMogr2/format/webp'               // webp格式参数
	}
}

/**
 * 修复图片URL中的域名问题并移除压缩参数
 * @param {string} url - 原始图片URL
 * @returns {string} - 修复后的URL（不包含压缩参数）
 */
export function fixImageUrl(url) {
	if (!url || typeof url !== 'string') {
		console.warn('无效的图片URL:', url)
		return domainConfig.defaultImages.default
	}
	
	// 如果是本地路径，直接返回
	if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
		return url
	}
	
	// 记录原始URL用于调试
	const originalUrl = url
	let correctedUrl = url
	
	// 遍历域名映射表，进行批量替换
	Object.entries(domainConfig.domainMap).forEach(([oldDomain, newDomain]) => {
		if (correctedUrl.includes(oldDomain) && !correctedUrl.includes(newDomain)) {
			correctedUrl = correctedUrl.replace(oldDomain, newDomain)
			console.log(`图片URL域名修复: ${oldDomain} -> ${newDomain}`)
		}
	})
	
	// 移除所有压缩参数（imageMogr2）和水印参数（watermark）
	// 这些参数可能导致长URL和400错误
	if (correctedUrl.includes('?')) {
		// 提取基础URL，去除所有参数
		correctedUrl = correctedUrl.split('?')[0]
		console.log('已移除图片压缩参数，使用原始图片')
	}
	
	// 输出最终使用的URL（仅在有修复时）
	if (originalUrl !== correctedUrl) {
		console.log('图片URL已处理:', originalUrl, '->', correctedUrl)
	}
	
	return correctedUrl
}

/**
 * 获取默认图片路径
 * @param {string} type - 图片类型 (default|avatar|video)
 * @returns {string} - 默认图片路径
 */
export function getDefaultImage(type = 'default') {
	return domainConfig.defaultImages[type] || domainConfig.defaultImages.default
}

/**
 * 检查URL是否需要修复
 * @param {string} url - 图片URL
 * @returns {boolean} - 是否需要修复
 */
export function needsDomainFix(url) {
	if (!url || typeof url !== 'string') return false
	
	return Object.keys(domainConfig.domainMap).some(oldDomain => 
		url.includes(oldDomain) && !url.includes(domainConfig.domainMap[oldDomain])
	)
}

/**
 * 获取当前正确的域名
 * @returns {string} - 当前正确域名
 */
export function getCurrentDomain() {
	return domainConfig.correctDomain
}

/**
 * 添加图片参数（如压缩、格式转换等）
 * 注意：已禁用图片压缩功能，该函数直接返回原始URL
 * @param {string} url - 图片URL
 * @param {string} paramType - 参数类型 (thumbnail|compress|webp)
 * @returns {string} - 原始URL（不添加任何参数）
 */
export function addImageParams(url, paramType) {
	// 已禁用图片压缩功能，直接返回原始URL
	console.log('图片压缩功能已禁用，返回原始URL:', url)
	return url
}

// 导出配置对象（供需要直接访问配置的场景使用）
export default domainConfig