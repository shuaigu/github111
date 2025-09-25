import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserInfoStore = defineStore( 'userInfo', ( ) => {
	// 默认用户数据
	const defaultUserInfo = {
		uid: '', //本地平台ID
		nickName: "", //昵称
		avatarUrl: "/static/images/defalut.png", //头像地址
		mobile: "未填写", //手机号码
		isLogin: false, //登录状态
		role: [ ], //默认角色
	}

	// 初始化用户数据
	const userInfo = ref( {
		...defaultUserInfo
	} )

	// 设置用户数据
	const setUserInfo = ( obj = {} ) => {
		userInfo.value = obj
		// 确保设置isLogin状态
		if (obj && obj.uid) {
			userInfo.value.isLogin = true
		} else {
			userInfo.value.isLogin = false
		}
		// 将更新同步到本地存储
		uni.setStorageSync('userInfo', userInfo.value)
	}

	// 清空用户数据
	const cleanUserInfo = ( ) => {
		userInfo.value = {
			...defaultUserInfo // 恢复默认值
		}
		likeRecords.value = [ ] // 清空点赞记录
	}

	// 更新用户头像
	const updateUserAvatar = (avatarUrl) => {
		userInfo.value.avatarUrl = avatarUrl
		// 将更新同步到本地存储
		uni.setStorageSync('userInfo', userInfo.value)
	}
	
	// 更新用户昵称
	const updateUserNickName = (nickName) => {
		userInfo.value.nickName = nickName
		// 将更新同步到本地存储
		uni.setStorageSync('userInfo', userInfo.value)
	}

	// 存储点赞记录
	const likeRecords = ref( [ ] )

	// 设置点赞记录
	const setLikeRecords = ( records ) => {
		likeRecords.value = records
	}

	// 检查是否点赞过某篇文章
	const isLiked = ( article_id ) => {
		return likeRecords.value.some( ( record ) => record.article_id === article_id )
	}

	return {
		userInfo,
		setUserInfo,
		cleanUserInfo,
		updateUserAvatar,
		updateUserNickName,
		likeRecords,
		setLikeRecords,
		isLiked
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
		},
	}
} )