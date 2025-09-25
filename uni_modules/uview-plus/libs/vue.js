/**
 * 增强版的defineMixin，适应各种调用方式
 * 1. 如果传入的是对象，直接返回
 * 2. 如果传入的是函数调用结果，也可以正常处理
 * 这样可以兼容所有组件
 */
export function defineMixin(options) {
  // 如果已经是对象（可能是其他defineMixin的结果），直接返回
  if (options && typeof options === 'object') {
    return options
  }
  
  // 如果是falsy值，返回空对象
  if (!options) {
    console.warn('defineMixin received invalid options')
    return {}
  }
  
  // 如果是其他类型，尝试转换为对象
  try {
    return Object(options)
  } catch (e) {
    console.error('defineMixin error:', e)
    return {}
  }
}
