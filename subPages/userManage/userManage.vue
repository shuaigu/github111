<script setup>
import { ref, onMounted } from 'vue'

const userApi = uniCloud.importObject('user', { customUI: true })
const userList = ref([])
const loading = ref(false)
const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0
})

// 获取用户列表
const getUserList = async () => {
    try {
        loading.value = true
        console.log('开始请求用户列表')
        const result = await userApi.getUserList(pagination.value.page, pagination.value.pageSize)
        console.log('获取用户列表结果：', result)
        
        if (result.code === 0) {
            if (pagination.value.page === 1) {
                userList.value = result.data.list
            } else {
                userList.value = [...userList.value, ...result.data.list]
            }
            pagination.value.total = result.data.total
        } else {
            uni.showToast({
                title: result.msg,
                icon: 'none'
            })
        }
    } catch (e) {
        console.error('获取用户列表错误：', e)
        uni.showToast({
            title: e.message || '获取数据失败',
            icon: 'none'
        })
    } finally {
        loading.value = false
        uni.stopPullDownRefresh()
    }
}

// 下拉刷新
const onPullDownRefresh = () => {
    pagination.value.page = 1
    getUserList()
}

// 格式化日期
const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 加载更多
const loadMore = () => {
    if (loading.value) return
    if (userList.value.length >= pagination.value.total) return
    pagination.value.page++
    getUserList()
}

onMounted(() => {
    getUserList()
})
</script>

<template>
    <view class="user-manage">
        <view class="content">
            <view class="user-list">
                <view v-if="userList.length === 0" class="empty">
                    <text v-if="loading">加载中...</text>
                    <text v-else>暂无用户数据</text>
                </view>
                <view v-else v-for="user in userList" :key="user._id" class="user-item">
                    <view class="user-info">
                        <view class="info-row">
                            <text class="label">用户名：</text>
                            <text class="value">{{ user.username || '-' }}</text>
                        </view>
                        <view class="info-row">
                            <text class="label">昵称：</text>
                            <text class="value">{{ user.nickname || '-' }}</text>
                        </view>
                        <view class="info-row">
                            <text class="label">手机：</text>
                            <text class="value">{{ user.mobile || '-' }}</text>
                        </view>
                        <view class="info-row">
                            <text class="label">邮箱：</text>
                            <text class="value">{{ user.email || '-' }}</text>
                        </view>
                        <view class="info-row">
                            <text class="label">注册时间：</text>
                            <text class="value">{{ formatDate(user.register_date) }}</text>
                        </view>
                        <view class="info-row">
                            <text class="label">最后登录：</text>
                            <text class="value">{{ formatDate(user.last_login_date) }}</text>
                        </view>
                    </view>
                </view>
            </view>
            
            <uni-load-more :status="loading ? 'loading' : userList.length >= pagination.total ? 'noMore' : 'more'"
                @clickLoadMore="loadMore" />
        </view>
    </view>
</template>

<style lang="scss" scoped>
.user-manage {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 20rpx;

    .content {
        .user-list {
            .empty {
                text-align: center;
                padding: 40rpx;
                color: #999;
                background-color: #fff;
                border-radius: 12rpx;
            }

            .user-item {
                background-color: #fff;
                border-radius: 12rpx;
                padding: 20rpx;
                margin-bottom: 20rpx;

                .user-info {
                    .info-row {
                        display: flex;
                        margin-bottom: 10rpx;

                        .label {
                            color: #666;
                            width: 160rpx;
                            font-size: 28rpx;
                        }

                        .value {
                            flex: 1;
                            color: #333;
                            font-size: 28rpx;
                        }
                    }
                }
            }
        }
    }
}
</style> 