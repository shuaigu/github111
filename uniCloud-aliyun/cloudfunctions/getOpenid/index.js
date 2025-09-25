'use strict';

const appId = 'wxf7ee79349bd957b8'; // 你的小程序appid
const appSecret = '725f689abdc2c51a36330a813c1b7215'; // 需要填写你的小程序appSecret

exports.main = async (event, context) => {
  const { code } = event;
  
  try {
    const res = await uniCloud.httpclient.request(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`,
      {
        dataType: 'json'
      }
    );
    
    console.log('微信返回结果：', res.data);
    
    if (res.data.errcode) {
      return {
        code: 500,
        msg: res.data.errmsg
      };
    }
    
    return {
      code: 200,
      openid: res.data.openid
    };
  } catch (err) {
    console.error('获取openid错误：', err);
    return {
      code: 500,
      msg: err.message
    };
  }
}; 