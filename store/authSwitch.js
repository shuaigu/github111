import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useAuthSwitchStore = defineStore( 'auth', ( ) => {
	const authSwitch = ref( false )
	
	// 初始化时从本地存储加载状态
	try {
		const savedState = uni.getStorageSync('auth-state')
		if (savedState !== '') {
			authSwitch.value = JSON.parse(savedState)
			console.log('从存储加载权限状态:', authSwitch.value)
		}
	} catch (e) {
		console.error('加载权限状态失败:', e)
	}
	
	// 监听状态变化并保存到本地存储
	watch(authSwitch, (newValue) => {
		try {
			uni.setStorageSync('auth-state', JSON.stringify(newValue))
			console.log('权限状态已保存到存储:', newValue)
		} catch (e) {
			console.error('保存权限状态失败:', e)
		}
	})

	const setAuthValue = ( v ) => {
		authSwitch.value = v
	}

	const setAuth = ( ) => {
		authSwitch.value = !authSwitch.value
	}

	return {
		authSwitch,
		setAuthValue,
		setAuth
	}
}, {
	persist: {
		// 使用 uni storage 代替 localStorage
		storage: {
			getItem( key ) {
				return uni.getStorageSync( key )
			},
			setItem( key, value ) {
				uni.setStorageSync( key, value )
			}
		}
	}
} )