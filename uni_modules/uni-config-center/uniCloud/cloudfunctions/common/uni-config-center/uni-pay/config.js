const fs = require( 'fs' );
const path = require( 'path' )
module.exports = {
	"notifyUrl": {
		"mp-323df75e-12a9-41d8-b2c1-e6fbfee24b0d": "https://fc-mp-323df75e-12a9-41d8-b2c1-e6fbfee24b0d.next.bspapp.com/uni-pay-co",
	},
	"notifyKey": "6FB2bD73b7B53918728417C50762E6D45FB2CD73C7B53918728417C50762E6D4",
	"wxpay": {
		"enable": true, // 是否启用微信支付
		// 微信 - 小程序支付
		"mp": {
			"appId": "wxf7ee79349bd957b8", // 小程序的appid
			"secret": "725f689abdc2c51a36330a813c1b7215", // 小程序的secret
			"mchId": "1545803671", // 商户id
			"key": "lishuai4323811lishuai4323811lish", // v2的api key
			"pfx": fs.readFileSync( __dirname + '/wxpay/apiclient_cert.p12' ), // v2需要用到的证书
			"version": 2, // 启用支付的版本 2代表v2版本 3 代表v3版本
		},
	},
}