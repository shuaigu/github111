// 生成随机字母
function getRandomLetter( ) {
	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	return letters[ Math.floor( Math.random( ) * letters.length ) ];
}

// 生成随机数字
function getRandomNumber( ) {
	return Math.floor( Math.random( ) * 10 ); // 0-9
}

// 生成随机字符串
function generateRandomName( ) {
	let randomName = '匿名';

	// 生成4个随机字母
	for ( let i = 0; i < 4; i++ ) {
		randomName += getRandomLetter( );
	}

	// 生成2个随机数字
	for ( let i = 0; i < 2; i++ ) {
		randomName += getRandomNumber( );
	}

	return randomName;
}

// 导出函数
module.exports = generateRandomName;