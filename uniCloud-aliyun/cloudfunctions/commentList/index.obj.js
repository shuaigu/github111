'use strict';
const db = uniCloud.database()
const dbJQL = uniCloud.databaseForJQL()
const dbCmd = db.command
const commentListCollection = db.collection('commentList')

module.exports = {
	// 添加数据库连接检查方法
	async _checkDbConnection() {
		try {
			// 尝试执行一个简单的数据库查询来验证连接
			await db.collection('commentList').limit(1).get()
			return true
		} catch (err) {
			console.error('数据库连接检查失败:', err)
			return false
		}
	},

	_before: function() {
		const methodName = this.getMethodName()
		const clientInfo = this.getClientInfo()
		
		console.log('云函数调用信息:', {
			methodName,
			hasUserInfo: !!clientInfo.userInfo,
			clientInfo: clientInfo
		})
		
		// 只有添加和删除评论需要登录验证
		if (['addComment', 'delComment'].includes(methodName)) {
			if (!clientInfo.userInfo) {
				// 返回更友好的错误信息
				return {
					code: 401,
					message: '请先登录'
				}
			}
		}
	},

	// 获取评论列表 - 不需要登录
	async getCommentList(articleId) {
		if (!articleId) {
			return {
				code: -1,
				message: '文章ID不能为空'
			}
		}

		try {
			const result = await commentListCollection
				.where({
					article_id: articleId
				})
				.orderBy('create_time', 'desc')
				.get()

			return {
				code: 0,
				data: result.data,
				message: '获取成功'
			}
		} catch (err) {
			console.error('获取评论列表失败:', err)
			return {
				code: -1,
				message: '获取评论列表失败'
			}
		}
	},

	// 添加评论 - 需要登录
	async addComment(commentData) {
		const { article_id, user_id, content, nickName, avatarUrl, images } = commentData;

		// 检查必要参数
		if (!article_id || !user_id || (!content && (!images || images.length === 0)) || !nickName) {
			return {
				code: -1,
				message: '参数不完整'
			};
		}

		try {
			// 插入评论数据
			const res = await db.collection('commentList').add({
				article_id,
				user_id,
				content: content || '',
				images: images || [], // 更新为图片URL数组
				nickName,
				avatarUrl: avatarUrl || '',
				create_time: Date.now()
			});

			return {
				code: 0,
				message: '评论成功',
				data: res
			};
		} catch (err) {
			console.error('添加评论失败:', err);
			return {
				code: -1,
				message: '评论失败：' + err.message
			};
		}
	},

	// 删除评论
	async delComment(commentId) {
		if (!commentId) {
			return {
				code: -1,
				message: '评论ID不能为空'
			}
		}

		const { userInfo } = this.ctx.auth
		if (!userInfo || !userInfo.uid) {
			throw new Error('未登录')
		}

		try {
			const comment = await commentListCollection.doc(commentId).get()
			
			if (!comment.data.length) {
				return {
					code: -1,
					message: '评论不存在'
				}
			}

			// 检查权限(评论作者或管理员可删除)
			if (comment.data[0].user_id !== userInfo.uid && 
				!userInfo.role.includes('admin')) {
				throw new Error('没有删除权限')
			}

			// 删除评论
			await commentListCollection.doc(commentId).remove()
			
			// 更新文章评论数
			await db.collection('articleList').doc(comment.data[0].article_id).update({
				comment_count: dbCmd.inc(-1)
			})

			return {
				code: 0,
				message: '删除成功',
				deleted: true
			}
		} catch (err) {
			console.error('删除评论失败:', err)
			return {
				code: -1,
				message: '删除失败'
			}
		}
	},

	// 修改点赞功能
	async likeComment(params) {
		try {
			const { comment_id, user_id } = params
			
			// 验证用户身份匹配
			const clientInfo = this.getClientInfo()
			if (clientInfo.userInfo.uid !== user_id) {
				return {
					code: 1,
					msg: '用户身份验证失败'
				}
			}

			// 获取评论信息
			const comment = await db.collection('commentList')
				.doc(comment_id)
				.get()
				
			if (!comment.data || comment.data.length === 0) {
				return {
					code: 1,
					msg: '评论不存在'
				}
			}

			const commentData = comment.data[0]
			const likedBy = commentData.liked_by || []
			const isLiked = likedBy.some(like => like.user_id === user_id)

			// 更新点赞状态
			const updateResult = await db.collection('commentList')
				.doc(comment_id)
				.update(isLiked ? {
					like_count: dbCmd.inc(-1),
					liked_by: dbCmd.pull({
						user_id: user_id
					})
				} : {
					like_count: dbCmd.inc(1),
					liked_by: dbCmd.push({
						user_id: user_id,
						create_time: Date.now()
					})
				})

			if (updateResult.updated === 1) {
				// 获取更新后的数据
				const updatedComment = await db.collection('commentList')
					.doc(comment_id)
					.get()

				return {
					code: 0,
					msg: isLiked ? '已取消点赞' : '点赞成功',
					data: {
						isLiked: !isLiked,
						like_count: updatedComment.data[0].like_count
					}
				}
			} else {
				throw new Error('更新失败')
			}
		} catch (err) {
			console.error('点赞操作失败:', {
				error: err,
				message: err.message,
				stack: err.stack,
				params
			})
			return {
				code: 1,
				msg: '操作失败，请稍后重试'
			}
		}
	}
}