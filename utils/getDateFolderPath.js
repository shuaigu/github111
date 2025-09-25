// 获取当前日期并生成文件夹路径
export const getDateFolderPath = () => {
	const date = new Date()
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0') // 月份从 0 开始，需要 +1
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}${month}${day}` // 去掉连字符，直接拼接数字
}