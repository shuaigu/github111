// 未登录跳转
import { useUserInfoStore } from '@/store/user.js'

export const testLogin = () => {
	// 从pinia获取用户信息
	const userStore = useUserInfoStore();
	
	console.log('检查登录状态 - store中的用户信息:', userStore.userInfo);
	
	// 首先检查store中是否已登录
	if (userStore.userInfo && userStore.userInfo.uid) {
		console.log('用户已在store中登录，UID:', userStore.userInfo.uid);
		return true; // 已登录
	}
	
	// 如果store中没有，再检查本地存储
	const userInfo = uni.getStorageSync('userInfo');
	console.log('检查登录状态 - 本地存储中的用户信息:', userInfo);
	
	if (userInfo && userInfo.uid) {
		// 如果本地存储有但store中没有，更新store
		console.log('从本地存储中找到用户信息，正在更新store');
		userStore.setUserInfo(userInfo);
		return true; // 已登录
	}
	
	// 未登录，弹出提示
	uni.showModal({
		title: '提示',
		content: '请登录后继续',
		confirmColor: '#399bfe',
		confirmText: '去登录',
		success: (res) => {
			if (res.confirm) {
				// 获取当前页面路径和参数
				const pages = getCurrentPages();
				const currentPage = pages[pages.length - 1];
				const currentRoute = currentPage.route;
				const currentOptions = currentPage.options || {};
				
				// 构建完整的当前页面URL（包含参数）
				let redirectUrl = '/' + currentRoute;
				const queryParams = [];
				
				for (const key in currentOptions) {
					if (currentOptions.hasOwnProperty(key)) {
						queryParams.push(`${key}=${encodeURIComponent(currentOptions[key])}`);
					}
				}
				
				if (queryParams.length > 0) {
					redirectUrl += '?' + queryParams.join('&');
				}
				
				// 使用navigateTo而不是reLaunch，保留当前页面历史
				uni.navigateTo({
					url: `/pages/login/login?redirect=${encodeURIComponent(redirectUrl)}`
				});
			}
		}
	});
	
	return false; // 未登录
}