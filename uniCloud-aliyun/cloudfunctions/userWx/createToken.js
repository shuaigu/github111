const crypto = require( 'crypto' )
// 创建token函数
function createToken( openid, session_key ) {
	const timestamp = Date.now( )
	const str = `${openid}-${session_key}-${timestamp}`
	return crypto.createHash( 'md5' ).update( str ).digest( 'hex' )
}

module.exports = { createToken }