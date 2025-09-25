<template>
	<view class="share-component">
		<!-- 分享按钮 -->
		<view class="share-btn" @click="openSharePanel">
			<uni-icons type="redo" size="20" color="#666"></uni-icons>
			<text class="share-text">分享</text>
		</view>
		
		<!-- 用于生成海报的隐藏canvas -->
		<canvas canvas-id="share-poster-canvas" id="share-poster-canvas" style="position: absolute; left: -9999px; width: 750px; height: 1000px;"></canvas>
		
		<!-- 分享面板 -->
		<uni-popup ref="sharePopup" type="bottom" @change="popupChange">
			<view class="share-panel">
				<view class="share-panel-header">
					<text class="share-panel-title">分享到</text>
					<view class="share-panel-close" @click="closeSharePanel">
						<uni-icons type="closeempty" size="20" color="#999"></uni-icons>
					</view>
				</view>
				
				<!-- 商品分享卡片预览 -->
				<view class="product-card-preview" v-if="useProductCard && shareType === 'product'">
					<view class="product-card">
						<image class="product-image" :src="processedShareData.imageUrl" mode="aspectFill"></image>
						<view class="product-info">
							<view class="product-title">{{processedShareData.title}}</view>
							<view class="product-price-container">
								<text class="price-symbol">¥</text>
								<text class="product-price">{{processedShareData.price}}</text>
								<view class="product-coupon" v-if="processedShareData.coupon">
									{{processedShareData.coupon}}
								</view>
							</view>
							<view class="product-meta" v-if="shareType === 'product'">
								<text class="product-brand">{{processBrandName()}}</text>
							</view>
						</view>
					</view>
					<view class="preview-tip">预览效果，实际分享效果会根据平台有所不同</view>
				</view>
				
				<!-- 分享按钮 -->
				<view class="share-buttons">
					<view class="share-btn-large wechat" @click="handleShare('wechat')">
						<view class="btn-icon">
							<uni-icons type="weixin" size="28" color="#fff"></uni-icons>
						</view>
						<text class="btn-text">微信好友</text>
					</view>
					<view class="share-btn-large poster" @click="handleShare('poster')">
						<view class="btn-icon">
							<uni-icons type="image" size="28" color="#fff"></uni-icons>
						</view>
						<text class="btn-text">生成海报</text>
					</view>
				</view>
				
				<view class="share-panel-footer">
					<button class="share-cancel-btn" @click="closeSharePanel">取消</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		name: "fenxiang-zujian",
		props: {
			// 分享标题
			title: {
				type: String,
				default: ''
			},
			// 分享摘要/内容
			summary: {
				type: String,
				default: ''
			},
			// 分享图片
			imageUrl: {
				type: String,
				default: ''
			},
			// 分享链接
			href: {
				type: String,
				default: ''
			},
			// 分享的ID
			shareId: {
				type: String,
				default: ''
			},
			// 分享类型 - article, product, etc.
			shareType: {
				type: String,
				default: 'article'
			},
			// 商品价格
			price: {
				type: [String, Number],
				default: ''
			},
			// 商品优惠券信息
			coupon: {
				type: String,
				default: ''
			},
			// 是否使用商品卡片形式
			useProductCard: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				showPanel: false, // 是否显示分享面板
				shareData: {}, // 分享数据
				// 检测APP环境使用的工具
				appEnv: {
					// 是否为微信环境
					isWeixin: false,
					// 是否为APP环境
					isApp: false,
					// 是否为H5环境
					isH5: false,
					// 是否为微信小程序环境
					isMpWeixin: false
				}
			};
		},
		computed: {
			// 处理分享数据
			processedShareData() {
				return {
					title: this.title || '分享内容',
					summary: this.summary || '来自小程序的分享',
					imageUrl: this.imageUrl || '', // 保留图片URL，但在分享时可以选择不使用
					href: this.href || '',
					path: this.shareType === 'product' 
						? `/pages/product/detail?id=${this.shareId}` 
						: `/pages/article/articleDetail?article_id=${this.shareId}`,
					price: this.price || '',
					coupon: this.coupon || ''
				};
			}
		},
		mounted() {
			// 初始化检测环境
			this.detectEnvironment();
		},
		methods: {
			// 检测当前运行环境
			detectEnvironment() {
				// #ifdef H5
				this.appEnv.isH5 = true;
				// 检测H5下是否为微信浏览器
				const ua = navigator.userAgent.toLowerCase();
				this.appEnv.isWeixin = ua.indexOf('micromessenger') !== -1;
				// #endif
				
				// #ifdef APP-PLUS
				this.appEnv.isApp = true;
				// #endif
				
				// #ifdef MP-WEIXIN
				this.appEnv.isMpWeixin = true;
				// #endif
				
				console.log('当前环境:', this.appEnv);
			},
			
			// 打开分享面板
			openSharePanel() {
				// 使用uni-popup打开面板
				this.$refs.sharePopup.open();
				// 记录分享点击事件
				this.recordShareEvent('click');
			},
			
			// 关闭分享面板
			closeSharePanel() {
				// 使用uni-popup关闭面板
				this.$refs.sharePopup.close();
			},
			
			// 监听弹出层状态变化
			popupChange(e) {
				this.showPanel = e.show;
			},
			
			// 处理分享
			handleShare(platform) {
				// 记录分享事件
				this.recordShareEvent('share', platform);
				
				// 根据平台处理不同的分享方式
				switch (platform) {
					case 'wechat':
						this.shareToWechat();
						break;
					case 'poster':
						this.generateSharePoster();
						break;
					default:
						break;
				}
				
				// 关闭分享面板
				this.closeSharePanel();
			},
			
			// 记录分享事件
			recordShareEvent(action, platform = '') {
				try {
					// 记录分享事件到控制台
					console.log('分享事件:', {
						action,
						platform,
						shareId: this.shareId,
						shareType: this.shareType,
						timestamp: new Date().getTime()
					});
					
					// 使用本地存储记录分享历史（替代云函数）
					this.saveShareHistoryLocally(action, platform);
				} catch (error) {
					// 忽略错误，不影响分享功能
					console.warn('记录分享事件本地错误:', error);
				}
			},
			
			// 本地保存分享历史记录（替代云函数）
			saveShareHistoryLocally(action, platform) {
				try {
					// 获取现有历史
					uni.getStorage({
						key: 'shareHistory',
						success: (res) => {
							let history = res.data || [];
							// 添加新记录
							history.push({
								action,
								platform,
								share_id: this.shareId,
								share_type: this.shareType,
								create_time: new Date().getTime()
							});
							// 限制历史记录数量，最多保存20条
							if (history.length > 20) {
								history = history.slice(history.length - 20);
							}
							// 保存回本地存储
							uni.setStorage({
								key: 'shareHistory',
								data: history
							});
						},
						fail: () => {
							// 如果没有历史记录，创建新数组
							const history = [{
								action,
								platform,
								share_id: this.shareId,
								share_type: this.shareType,
								create_time: new Date().getTime()
							}];
							uni.setStorage({
								key: 'shareHistory',
								data: history
							});
						}
					});
				} catch (err) {
					console.log('本地保存分享记录失败', err);
				}
			},
			
			// 分享到微信
			shareToWechat() {
				// 微信小程序环境
				// #ifdef MP-WEIXIN
				// 如果是文章类型，使用特定的分享处理
				if (this.shareType === 'article') {
					this.shareArticleToWechat();
				} else {
					this.shareMpWechat();
				}
				// #endif
				
				// APP环境
				// #ifdef APP-PLUS
				this.shareAppToWechat('WXSceneSession');
				// #endif
				
				// H5环境下的微信浏览器
				// #ifdef H5
				if (this.appEnv.isWeixin) {
					this.shareH5Wechat();
				} else {
					// 非微信H5环境下退化为提示
					uni.showToast({
						title: '请在微信中打开',
						icon: 'none'
					});
				}
				// #endif
			},
			
			// 微信小程序的分享
			shareMpWechat() {
				// #ifdef MP-WEIXIN
				try {
					// 获取分享数据
					let shareData = this.processedShareData;
					
					// 如果是商品分享，使用卡片形式
					if (this.useProductCard && this.shareType === 'product') {
						shareData = this.createProductCard();
					}
					
					// 更新到页面的分享信息
					uni.$emit('setShareInfo', shareData);
					
					// 使用微信小程序原生接口直接触发分享
					if (wx.shareAppMessage) {
						// 直接调用分享API (微信开发者工具新版本支持)
						wx.shareAppMessage({
							title: shareData.title,
							imageUrl: shareData.imageUrl,
							path: shareData.path,
							success: () => {
								console.log('直接分享成功');
								uni.showToast({
									title: '分享成功',
									icon: 'success'
								});
								// 触发分享成功事件
								this.$emit('share-success', 'wechat');
							},
							fail: (err) => {
								console.error('直接分享失败', err);
								// 尝试备选分享方案
								this.useShareButton();
							}
						});
					} else if (wx.showShareMenu) {
						// 更新版本的微信小程序API
						wx.showShareMenu({
							withShareTicket: true,
							menus: ['shareAppMessage', 'shareTimeline'],
							success: () => {
								// 通知父页面更新分享信息
								uni.$emit('setShareInfo', shareData);
								// 显示分享引导
								uni.showModal({
									title: '分享提示',
									content: '点击右上角"..."按钮，选择"分享"即可',
									showCancel: false
								});
							}
						});
					} else {
						// 使用Button组件模拟分享
						this.useShareButton();
					}
				} catch (error) {
					console.error('分享失败', error);
					// 基础的备选方案
					uni.showToast({
						title: '请点击右上角转发',
						icon: 'none'
					});
				}
				// #endif
				
				// 非微信小程序环境
				// #ifndef MP-WEIXIN
				uni.showToast({
					title: '仅支持微信小程序环境',
					icon: 'none'
				});
				// #endif
			},
			
			// APP环境下分享到微信
			shareAppToWechat(scene) {
				// 获取分享服务
				uni.getProvider({
					service: 'share',
					success: (res) => {
						if (res.provider.includes('weixin')) {
							uni.share({
								provider: 'weixin',
								scene: scene, // WXSceneSession（聊天）或WXSceneTimeline（朋友圈）
								type: 0, // 图文
								title: this.processedShareData.title,
								summary: this.processedShareData.summary,
								imageUrl: this.processedShareData.imageUrl,
								href: this.processedShareData.href || this.processedShareData.path,
								success: (res) => {
									console.log('分享成功', res);
									uni.showToast({
										title: '分享成功',
										icon: 'success'
									});
								},
								fail: (err) => {
									console.error('分享失败', err);
									if (err.errMsg && err.errMsg.includes('user cancel')) {
										uni.showToast({
											title: '分享已取消',
											icon: 'none'
										});
									} else {
										uni.showToast({
											title: '分享失败',
											icon: 'none'
										});
									}
								}
							});
						} else {
							uni.showToast({
								title: '不支持微信分享',
								icon: 'none'
							});
						}
					},
					fail: () => {
						uni.showToast({
							title: '获取分享服务失败',
							icon: 'none'
						});
					}
				});
			},
			
			// H5环境下的微信分享
			shareH5Wechat() {
				// 直接调用微信JSSDK分享API，而不是提示点击右上角
				if (window.wx) {
					window.wx.ready(() => {
						// 分享给朋友
						window.wx.updateAppMessageShareData({
							title: this.processedShareData.title,
							desc: this.processedShareData.summary,
							link: this.processedShareData.href || location.href,
							imgUrl: this.processedShareData.imageUrl,
							success: () => {
								console.log('设置分享信息成功');
								// 主动唤起分享面板
								if (window.wx.showShareActionSheet) {
									window.wx.showShareActionSheet();
								} else {
									uni.showToast({
										title: '已准备分享信息',
										icon: 'success'
									});
								}
							}
						});
					});
				} else {
					uni.showToast({
						title: '请先引入微信JS-SDK',
						icon: 'none'
					});
				}
			},
			
			// 创建小程序商品卡片
			createProductCard() {
				// #ifdef MP-WEIXIN
				return {
					title: this.processedShareData.title,
					imageUrl: this.processedShareData.imageUrl,
					path: this.processedShareData.path,
					miniprogramType: 0, // 正式版
					// 卡片信息
					productInfo: {
						productId: this.shareId,
						productName: this.processedShareData.title,
						productPrice: this.processedShareData.price,
						productCoupon: this.processedShareData.coupon,
						productImage: this.processedShareData.imageUrl
					}
				};
				// #endif
				
				// 非微信小程序环境
				return {
					title: this.processedShareData.title,
					desc: this.processedShareData.summary,
					link: this.processedShareData.href || location.href,
					imgUrl: this.processedShareData.imageUrl
				};
			},
			
			// 生成分享小程序码
			generateMiniProgramCode() {
				// #ifdef MP-WEIXIN
				return new Promise((resolve) => {
					// 直接返回默认二维码图片
					resolve(this.getDefaultQRImage());
				});
				// #endif
				
				// 非微信小程序环境
				return Promise.resolve(this.getDefaultQRImage());
			},
			
			// 使用wx.getWXACode生成简单小程序码（不依赖云函数）
			generateSimpleMiniProgramCode() {
				// 简化为直接返回默认图片
				return Promise.resolve(this.getDefaultQRImage());
			},
			
			// 获取默认小程序码图片（新增）
			getDefaultQRImage() {
				// 返回静态二维码图片
				return 'https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/success.png';
			},
			
			// 生成分享海报
			generateSharePoster() {
				uni.showLoading({
					title: '生成海报中...'
				});
				
				// #ifdef MP-WEIXIN
				// 创建海报绘制canvas
				const query = wx.createSelectorQuery();
				query.select('#share-poster-canvas')
					.fields({ node: true, size: true })
					.exec((res) => {
						if (!res[0] || !res[0].node) {
							// 如果没有找到canvas节点，创建一个离屏canvas
							const canvas = wx.createOffscreenCanvas({ type: '2d', width: 750, height: 1000 });
							this.drawPosterCanvas(canvas).then(path => {
								this.savePosterToAlbum(path);
							}).catch(() => {
								uni.hideLoading();
								uni.showToast({
									title: '生成海报失败',
									icon: 'none'
								});
							});
						} else {
							// 使用已有canvas
							const canvas = res[0].node;
							const ctx = canvas.getContext('2d');
							canvas.width = 750;
							canvas.height = 1000;
							
							this.drawPosterCanvas(canvas).then(path => {
								this.savePosterToAlbum(path);
							}).catch(() => {
								uni.hideLoading();
								uni.showToast({
									title: '生成海报失败',
									icon: 'none'
								});
							});
						}
					});
				// #endif
				
				// 非微信小程序环境
				// #ifndef MP-WEIXIN
				setTimeout(() => {
					uni.hideLoading();
					uni.showToast({
						title: '仅支持微信小程序环境',
						icon: 'none'
					});
				}, 1000);
				// #endif
			},
			
			// 绘制海报Canvas
			drawPosterCanvas(canvas) {
				return new Promise((resolve, reject) => {
					// #ifdef MP-WEIXIN
					const ctx = canvas.getContext('2d');
					ctx.fillStyle = '#ffffff';
					ctx.fillRect(0, 0, 750, 1000);
					
					// 获取数据
					const title = this.processedShareData.title || '精彩内容';
					const summary = this.processedShareData.summary || '';
					const imageUrl = this.processedShareData.imageUrl || '';
					
					// 绘制样式取决于分享类型
					if (this.shareType === 'article') {
						// 文章海报样式
						// 绘制标题
						ctx.fillStyle = '#333333';
						ctx.font = 'bold 36px sans-serif';
						
						// 标题文字换行处理
						const titleLines = this.wrapText(ctx, title, 650, 36);
						titleLines.forEach((line, index) => {
							ctx.fillText(line, 50, 80 + index * 50);
						});
						
						// 计算标题后的位置
						const titleHeight = titleLines.length * 50 + 30;
						
						// 加载并绘制文章封面图片
						const img = canvas.createImage();
						img.onload = () => {
							// 绘制封面图片
							ctx.drawImage(img, 50, titleHeight, 650, 400);
							
							// 绘制摘要
							ctx.fillStyle = '#666666';
							ctx.font = '28px sans-serif';
							
							// 摘要文字换行处理
							const summaryLines = this.wrapText(ctx, summary.slice(0, 100), 650, 28);
							summaryLines.forEach((line, index) => {
								ctx.fillText(line, 50, titleHeight + 430 + index * 40);
							});
							
							// 底部信息区域
							const footerY = titleHeight + 430 + summaryLines.length * 40 + 50;
							
							// 绘制底部横线
							ctx.fillStyle = '#eeeeee';
							ctx.fillRect(50, footerY, 650, 2);
							
							// 绘制小程序名称和logo
							ctx.fillStyle = '#333333';
							ctx.font = 'bold 30px sans-serif';
							ctx.fillText('扫码查看全文', 50, footerY + 60);
							
							// 直接加载静态二维码图片
							const qrImg = canvas.createImage();
							qrImg.onload = () => {
								// 绘制小程序码
								ctx.drawImage(qrImg, 500, footerY + 30, 200, 200);
								
								// 导出图片
								canvas.toTempFilePath({
									x: 0,
									y: 0,
									width: 750,
									height: 1000,
									destWidth: 750,
									destHeight: 1000,
									success: (res) => {
										resolve(res.tempFilePath);
									},
									fail: (err) => {
										console.error('导出海报图片失败', err);
										reject(err);
									}
								});
							};
							qrImg.onerror = () => {
								console.error('加载二维码图片失败，不使用二维码');
								// 即使没有二维码，也要继续生成海报
								canvas.toTempFilePath({
									x: 0,
									y: 0,
									width: 750,
									height: 1000,
									destWidth: 750,
									destHeight: 1000,
									success: (res) => {
										resolve(res.tempFilePath);
									},
									fail: (err) => {
										console.error('导出海报图片失败', err);
										reject(err);
									}
								});
							};
							// 使用静态二维码图片
							qrImg.src = this.getDefaultQRImage();
						};
						img.onerror = () => {
							console.error('加载封面图片失败');
							// 继续生成没有图片的海报
							// 绘制无图片提示区域
							ctx.fillStyle = '#f5f5f5';
							ctx.fillRect(50, titleHeight, 650, 400);
							ctx.fillStyle = '#999999';
							ctx.font = '30px sans-serif';
							ctx.fillText('暂无封面图片', 300, titleHeight + 200);
							
							// 继续生成海报
							const footerY = titleHeight + 430 + 40 + 50;
							ctx.fillStyle = '#eeeeee';
							ctx.fillRect(50, footerY, 650, 2);
							ctx.fillStyle = '#333333';
							ctx.font = 'bold 30px sans-serif';
							ctx.fillText('扫码查看全文', 50, footerY + 60);
							
							// 直接加载静态二维码图片
							const qrImg = canvas.createImage();
							qrImg.onload = () => {
								ctx.drawImage(qrImg, 500, footerY + 30, 200, 200);
								canvas.toTempFilePath({
									x: 0,
									y: 0,
									width: 750,
									height: 1000,
									destWidth: 750,
									destHeight: 1000,
									success: (res) => {
										resolve(res.tempFilePath);
									},
									fail: (err) => {
										console.error('导出海报图片失败', err);
										reject(err);
									}
								});
							};
							qrImg.onerror = () => {
								canvas.toTempFilePath({
									x: 0,
									y: 0,
									width: 750,
									height: 1000,
									destWidth: 750,
									destHeight: 1000,
									success: (res) => {
										resolve(res.tempFilePath);
									},
									fail: (err) => {
										console.error('导出海报图片失败', err);
										reject(err);
									}
								});
							};
							qrImg.src = this.getDefaultQRImage();
						};
						img.src = imageUrl;
					} else {
						// 商品海报逻辑（简化）
						// ... 原有商品海报代码逻辑保持不变 ...
						this.drawProductPoster(canvas, ctx).then(resolve).catch(reject);
					}
					// #endif
					
					// 非微信小程序环境
					// #ifndef MP-WEIXIN
					reject(new Error('仅支持微信小程序环境'));
					// #endif
				});
			},
			
			// 添加商品海报绘制方法（拆分原有商品海报逻辑）
			drawProductPoster(canvas, ctx) {
				return new Promise((resolve, reject) => {
					// 绘制标题
					ctx.fillStyle = '#333333';
					ctx.font = 'bold 32px sans-serif';
					ctx.fillText(this.processedShareData.title.slice(0, 20), 50, 80);
					
					// 如果标题超过20个字符，需要第二行
					if (this.processedShareData.title.length > 20) {
						ctx.fillText(this.processedShareData.title.slice(20, 40) + '...', 50, 120);
					}
					
					// 加载并绘制商品图片
					const img = canvas.createImage();
					img.onload = () => {
						// 绘制商品图片
						ctx.drawImage(img, 50, 150, 650, 500);
						
						// 绘制价格区域背景
						ctx.fillStyle = '#ffffff';
						ctx.fillRect(50, 670, 650, 100);
						
						// 绘制价格
						ctx.fillStyle = '#ff0000';
						ctx.font = 'bold 48px sans-serif';
						ctx.fillText('¥' + this.processedShareData.price, 70, 730);
						
						// 绘制优惠券
						if (this.processedShareData.coupon) {
							ctx.fillStyle = '#ff0000';
							ctx.fillRect(300, 690, 120, 50);
							ctx.fillStyle = '#ffffff';
							ctx.font = '24px sans-serif';
							ctx.fillText(this.processedShareData.coupon, 320, 725);
						}
						
						// 直接加载静态二维码图片
						const qrImg = canvas.createImage();
						qrImg.onload = () => {
							ctx.drawImage(qrImg, 500, 800, 150, 150);
							
							// 绘制提示文字
							ctx.fillStyle = '#666666';
							ctx.font = '24px sans-serif';
							ctx.fillText('长按识别小程序码', 70, 850);
							ctx.fillText('查看商品详情', 70, 890);
							
							// 导出图片
							canvas.toTempFilePath({
								x: 0,
								y: 0,
								width: 750,
								height: 1000,
								destWidth: 750,
								destHeight: 1000,
								success: (res) => {
									resolve(res.tempFilePath);
								},
								fail: (err) => {
									console.error('导出海报图片失败', err);
									reject(err);
								}
							});
						};
						qrImg.onerror = () => {
							// 即使没有二维码，也导出海报
							canvas.toTempFilePath({
								x: 0,
								y: 0,
								width: 750,
								height: 1000,
								destWidth: 750,
								destHeight: 1000,
								success: (res) => {
									resolve(res.tempFilePath);
								},
								fail: (err) => {
									console.error('导出海报图片失败', err);
									reject(err);
								}
							});
						};
						qrImg.src = this.getDefaultQRImage();
					};
					img.onerror = reject;
					img.src = this.processedShareData.imageUrl;
				});
			},
			
			// 添加文字换行处理函数
			wrapText(ctx, text, maxWidth, fontSize) {
				const lines = [];
				if (!text) return lines;
				
				let line = '';
				let testLine = '';
				const words = text.split('');
				
				for (let n = 0; n < words.length; n++) {
					testLine += words[n];
					const metrics = ctx.measureText(testLine);
					const testWidth = metrics.width;
					
					if (testWidth > maxWidth && n > 0) {
						lines.push(line);
						line = words[n];
						testLine = words[n];
					} else {
						line = testLine;
					}
				}
				
				lines.push(line);
				
				// 限制最多显示3行
				if (lines.length > 3) {
					lines[2] = lines[2] + '...';
					return lines.slice(0, 3);
				}
				
				return lines;
			},
			
			// 保存海报到相册
			savePosterToAlbum(path) {
				// #ifdef MP-WEIXIN
				wx.saveImageToPhotosAlbum({
					filePath: path,
					success: () => {
						uni.hideLoading();
						uni.showToast({
							title: '海报已保存到相册',
							icon: 'success'
						});
					},
					fail: (err) => {
						uni.hideLoading();
						if (err.errMsg && err.errMsg.includes('auth')) {
							uni.showToast({
								title: '保存失败，请授权相册权限',
								icon: 'none'
							});
						} else {
							uni.showToast({
								title: '保存海报失败',
								icon: 'none'
							});
						}
					}
				});
				// #endif
			},
			
			// 处理品牌名称
			processBrandName() {
				// 从标题中提取品牌名称，或使用默认值
				const title = this.processedShareData.title || '';
				// 尝试从标题中提取品牌名，这里假设品牌名在标题开头并以空格分隔
				const match = title.match(/^([\w\u4e00-\u9fa5]+)/);
				return match ? match[1] : '品牌商品';
			},
			
			// 添加文章分享专用处理方法
			shareArticleToWechat() {
				// #ifdef MP-WEIXIN
				try {
					// 准备分享数据（不包含图片URL，使用页面截图）
					const shareData = {
						title: this.processedShareData.title,
						path: this.processedShareData.path
						// 不包含imageUrl，让小程序自动截取页面作为分享封面
					};
					
					// 更新父组件分享信息（确保在页面的onShareAppMessage回调中可以使用）
					uni.$emit('setShareInfo', shareData);
					
					// 使用微信小程序原生接口直接触发分享
					if (wx.shareAppMessage) {
						// 直接调用分享API (微信开发者工具新版本支持)
						wx.shareAppMessage({
							title: shareData.title,
							path: shareData.path,
							// 不设置imageUrl，使用页面截图
							success: () => {
								console.log('直接分享成功（使用页面截图）');
								uni.showToast({
									title: '分享成功',
									icon: 'success'
								});
								// 触发分享成功事件
								this.$emit('share-success', 'wechat');
							},
							fail: (err) => {
								console.error('直接分享失败', err);
								// 尝试备选分享方案
								this.useShareButton();
							}
						});
					} else if (wx.showShareMenu) {
						// 更新版本的微信小程序API
						wx.showShareMenu({
							withShareTicket: true,
							menus: ['shareAppMessage', 'shareTimeline'],
							success: () => {
								// 通知父页面更新分享信息
								uni.$emit('setShareInfo', shareData);
								// 显示分享引导
								uni.showModal({
									title: '分享提示',
									content: '点击右上角"..."按钮，选择"分享"即可',
									showCancel: false
								});
							}
						});
					} else {
						// 使用Button组件模拟分享
						this.useShareButton();
					}
				} catch (error) {
					console.error('文章分享失败，尝试使用备选方案', error);
					// 使用备选方案
					this.useShareButton();
				}
				// #endif
			},
			
			// 使用分享按钮组件进行分享
			useShareButton() {
				// #ifdef MP-WEIXIN
				try {
					// 更新到页面的分享信息
					uni.$emit('setShareInfo', this.processedShareData);
					
					// 使用wx原生API触发分享
					wx.showShareMenu({
						withShareTicket: true,
						menus: ['shareAppMessage'],
						success: () => {
							// 提示用户分享操作
							uni.showModal({
								title: '分享提示',
								content: '点击"确定"后可直接转发给好友',
								showCancel: false,
								success: () => {
									// 使用模拟API
									if (typeof wx.showSharePanel === 'function') {
										wx.showSharePanel({
											success: () => {
												console.log('显示分享面板成功');
											},
											fail: () => {
												// 退化到普通提示
												this.showShareToast();
											}
										});
									} else if (typeof wx.showShareImageMenu === 'function') {
										wx.showShareImageMenu({
											success: () => {
												console.log('显示分享菜单成功');
											},
											fail: () => {
												// 退化到普通提示
												this.showShareToast();
											}
										});
									} else {
										// 没有更直接的方法，退化到提示
										this.showShareToast();
									}
								}
							});
						},
						fail: () => {
							this.showShareToast();
						}
					});
				} catch (e) {
					console.error('分享按钮创建失败', e);
					// 显示提示
					this.showShareToast();
				}
				// #endif
			},
			
			// 显示分享提示
			showShareToast() {
				// 显示分享菜单
				wx.showShareMenu({
					withShareTicket: true,
					menus: ['shareAppMessage', 'shareTimeline'],
					success: () => {
						uni.showToast({
							title: '请点击右上角分享',
							icon: 'none',
							duration: 2000
						});
					}
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
.share-component {
	.share-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 10rpx 20rpx;
		
		.share-text {
			margin-left: 6rpx;
			font-size: 28rpx;
			color: #666;
		}
	}
	
	.share-panel {
		background-color: #fff;
		border-radius: 20rpx 20rpx 0 0;
		padding: 30rpx;
		
		.share-panel-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 30rpx;
			
			.share-panel-title {
				font-size: 32rpx;
				font-weight: 500;
				color: #333;
			}
			
			.share-panel-close {
				padding: 10rpx;
			}
		}
		
		// 商品分享卡片预览
		.product-card-preview {
			margin-bottom: 30rpx;
			background-color: #f8f8f8;
			border-radius: 12rpx;
			padding: 20rpx;
			
			.product-card {
				display: flex;
				align-items: center;
				margin-bottom: 15rpx;
				background-color: #fff;
				border-radius: 12rpx;
				padding: 15rpx;
				box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
				
				.product-image {
					width: 140rpx;
					height: 140rpx;
					border-radius: 10rpx;
					margin-right: 20rpx;
				}
				
				.product-info {
					flex: 1;
					
					.product-title {
						font-size: 28rpx;
						font-weight: 500;
						color: #333;
						margin-bottom: 12rpx;
						line-height: 1.4;
						display: -webkit-box;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 2;
						overflow: hidden;
					}
					
					.product-price-container {
						display: flex;
						align-items: center;
						
						.price-symbol {
							font-size: 24rpx;
							color: #ff0000;
							margin-right: 2rpx;
							font-weight: bold;
						}
						
						.product-price {
							font-size: 32rpx;
							font-weight: bold;
							color: #ff0000;
							margin-right: 15rpx;
						}
						
						.product-coupon {
							font-size: 22rpx;
							color: #fff;
							padding: 2rpx 8rpx;
							background-color: #ff0000;
							border-radius: 6rpx;
						}
					}
					
					.product-meta {
						margin-top: 10rpx;
						font-size: 24rpx;
						color: #999;
					}
				}
			}
			
			.preview-tip {
				font-size: 22rpx;
				color: #999;
				text-align: center;
			}
		}
		
		.share-buttons {
			display: flex;
			justify-content: space-between;
			margin: 30rpx 20rpx;
			
			.share-btn-large {
				width: 45%;
				height: 180rpx;
				border-radius: 12rpx;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				
				.btn-icon {
					width: 80rpx;
					height: 80rpx;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-bottom: 20rpx;
				}
				
				.btn-text {
					font-size: 28rpx;
					color: #fff;
					font-weight: 500;
				}
				
				&.wechat {
					background-color: #07C160;
				}
				
				&.poster {
					background-color: #FF5A5F;
				}
			}
		}
		
		.share-panel-footer {
			margin-top: 20rpx;
			
			.share-cancel-btn {
				background-color: #f5f5f5;
				color: #333;
				font-size: 30rpx;
				height: 80rpx;
				line-height: 80rpx;
				border-radius: 40rpx;
				border: none;
			}
		}
	}
}
</style>