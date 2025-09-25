// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createCanvas, loadImage, registerFont } = require('canvas');

module.exports = {
	_before: function () { // 通用预处理器

	},
	
	/**
	 * 生成封面图片
	 * @param {Object} templateData 封面图片模板数据
	 * @param {String} savePath 保存路径
	 */
	async generateImage(templateData, savePath) {
		try {
			// 获取模板数据
			const { width = 750, height = 600, background = '#000000', userInfo, articleImages } = templateData;
			
			// 创建Canvas
			const canvas = createCanvas(width, height);
			const ctx = canvas.getContext('2d');
			
			// 绘制背景
			ctx.fillStyle = background;
			ctx.fillRect(0, 0, width, height);
			
			// 设置字体
			ctx.font = 'bold 40px sans-serif';
			ctx.fillStyle = '#FFFFFF';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';
			
			// 绘制用户昵称
			const avatarSize = 120;
			const avatarX = 170;
			const avatarY = 140;
			
			// 绘制昵称
			const nickName = userInfo.nickName || '用户';
			ctx.fillText(nickName, avatarX + 100, avatarY);
			
			// 处理头像
			try {
				if (userInfo.avatarUrl) {
					// 加载头像图片
					const avatarImage = await loadImage(userInfo.avatarUrl);
					
					// 创建圆形裁剪路径
					ctx.save();
					ctx.beginPath();
					ctx.arc(avatarX, avatarY, avatarSize/2, 0, Math.PI * 2, false);
					ctx.clip();
					
					// 绘制头像
					ctx.drawImage(avatarImage, avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
					ctx.restore();
				} else {
					// 绘制默认头像
					ctx.fillStyle = '#D3D3D3';
					ctx.beginPath();
					ctx.arc(avatarX, avatarY, avatarSize/2, 0, Math.PI * 2);
					ctx.fill();
					
					// 头像文字
					ctx.fillStyle = '#FF0000';
					ctx.font = '40px sans-serif';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText('头像', avatarX, avatarY);
					
					// 恢复样式
					ctx.fillStyle = '#FFFFFF';
					ctx.textAlign = 'left';
				}
			} catch (avatarErr) {
				console.error('处理头像出错:', avatarErr);
				// 绘制默认头像
				ctx.fillStyle = '#D3D3D3';
				ctx.beginPath();
				ctx.arc(avatarX, avatarY, avatarSize/2, 0, Math.PI * 2);
				ctx.fill();
				
				// 头像文字
				ctx.fillStyle = '#FF0000';
				ctx.font = '40px sans-serif';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText('头像', avatarX, avatarY);
				
				// 恢复样式
				ctx.fillStyle = '#FFFFFF';
				ctx.textAlign = 'left';
			}
			
			// 绘制文章图片
			const imgSize = 180;
			const gap = 20;
			const startY = 320;
			
			if (articleImages && articleImages.length > 0) {
				// 有文章图片时
				const imagesToDraw = articleImages.slice(0, 3); // 最多绘制3张图片
				
				try {
					// 为每个图片位置绘制默认占位
					for (let i = 0; i < imagesToDraw.length; i++) {
						const imgX = 80 + i * (imgSize + gap);
						
						// 绘制灰色方块背景
						ctx.fillStyle = '#D3D3D3';
						ctx.fillRect(imgX, startY, imgSize, imgSize);
						
						// 绘制"图片"文字
						ctx.fillStyle = '#FF0000';
						ctx.font = '40px sans-serif';
						ctx.textAlign = 'center';
						ctx.textBaseline = 'middle';
						ctx.fillText('图片', imgX + imgSize/2, startY + imgSize/2);
					}
					
					// 加载并绘制实际图片
					for (let i = 0; i < imagesToDraw.length; i++) {
						const imgX = 80 + i * (imgSize + gap);
						try {
							const image = await loadImage(imagesToDraw[i]);
							ctx.drawImage(image, imgX, startY, imgSize, imgSize);
							
							// 添加边框
							ctx.strokeStyle = '#FFFFFF';
							ctx.lineWidth = 2;
							ctx.strokeRect(imgX, startY, imgSize, imgSize);
						} catch (imgErr) {
							console.error(`加载图片${i+1}出错:`, imgErr);
							// 已经绘制了默认占位，不再处理
						}
					}
				} catch (imgErr) {
					console.error('绘制文章图片出错:', imgErr);
				}
			} else {
				// 没有文章图片时，绘制默认占位符
				for (let i = 0; i < 3; i++) {
					const imgX = 80 + i * (imgSize + gap);
					
					// 绘制灰色方块背景
					ctx.fillStyle = '#D3D3D3';
					ctx.fillRect(imgX, startY, imgSize, imgSize);
					
					// 绘制"图片"文字
					ctx.fillStyle = '#FF0000';
					ctx.font = '40px sans-serif';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText('图片', imgX + imgSize/2, startY + imgSize/2);
				}
			}
			
			// 添加水印
			ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
			ctx.font = '22px sans-serif';
			ctx.textAlign = 'right';
			ctx.fillText('遥望潜力股', width - 30, height - 30);
			
			// 将Canvas转换为图片Buffer
			const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
			
			// 保存到临时文件
			const tmpFilePath = path.join(os.tmpdir(), `cover_${Date.now()}.jpg`);
			fs.writeFileSync(tmpFilePath, buffer);
			
			// 上传到云存储
			const uploadResult = await uniCloud.uploadFile({
				filePath: tmpFilePath,
				cloudPath: savePath
			});
			
			// 删除临时文件
			fs.unlinkSync(tmpFilePath);
			
			// 返回文件ID
			return {
				fileID: uploadResult.fileID
			};
			
		} catch (err) {
			console.error('生成图片失败:', err);
			throw new Error('生成图片失败: ' + err.message);
		}
	}
} 