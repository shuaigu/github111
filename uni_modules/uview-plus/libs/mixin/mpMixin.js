import { defineMixin } from '../vue'

// 修复defineMixin调用问题
export const mpMixin = {
    // #ifdef MP-WEIXIN
    // 将自定义节点设置成虚拟的，更加接近Vue组件的表现，能更好的使用flex属性
    options: {
        virtualHost: true
    }
    // #endif
}

export default mpMixin

