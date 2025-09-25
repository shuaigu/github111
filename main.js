import App from './App'
import uviewPlus from '@/uni_modules/uview-plus'
import { createPinia } from 'pinia'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue( {
	...App
} )
app.$mount( )
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import { mount$u } from '@/uni_modules/uview-plus'

// 自定义持久化插件函数
const createPersistedState = (options = {}) => {
	const storage = {
		getItem: (key) => uni.getStorageSync(key),
		setItem: (key, value) => uni.setStorageSync(key, value)
	}
	
	return ({ store }) => {
		// 判断当前store是否需要持久化
		if (!options.stores || options.stores.includes(store.$id)) {
			const storageKey = `${options.prefix || 'pinia'}-${store.$id}`;
			
			// 从存储中恢复状态
			const persisted = storage.getItem(storageKey);
			if (persisted) {
				store.$patch(JSON.parse(persisted));
			}
			
			// 监听变更并保存
			store.$subscribe((_, state) => {
				storage.setItem(storageKey, JSON.stringify(state));
			});
		}
	}
}

export function createApp( ) {
	const app = createSSRApp( App )
	const pinia = createPinia( )
	
	// 使用自定义持久化插件，可指定哪些store需要持久化
	pinia.use(createPersistedState({
		// 可选：指定哪些store需要持久化
		stores: ['userInfo', 'cart', 'settings'], // 示例，根据实际需求修改
		// 可选：存储前缀
		prefix: 'wx2-'
	}));
	
	app.use( pinia )

	// 安装 uviewPlus
	app.use( uviewPlus )
	
	// 挂载uview-plus
	mount$u()
	
	return {
		app,
		pinia
	}
}
// #endif