// 格式化时间
const formatTime = ( timestamp ) => {
	const now = Date.now( )
	const diff = now - timestamp

	// 小于1分钟
	if ( diff < 60000 ) {
		return '刚刚'
	}
	// 小于1小时
	if ( diff < 3600000 ) {
		return Math.floor( diff / 60000 ) + '分钟前'
	}
	// 小于24小时
	if ( diff < 86400000 ) {
		return Math.floor( diff / 3600000 ) + '小时前'
	}
	// 小于30天
	if ( diff < 2592000000 ) {
		return Math.floor( diff / 86400000 ) + '天前'
	}
	// 其他情况显示具体日期
	const date = new Date( timestamp )
	return `${date.getMonth() + 1}月${date.getDate()}日`
}

export default formatTime