// 生成商户订单号
export const out_trade_no = () => {
    return '20160203' + Math.random().toString().substr(2, 10)
}