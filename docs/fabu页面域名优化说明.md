# fabu.vue 域名显示优化说明

## 优化内容

### 1. 域名配置引入
- 引入了 `@/utils/domainConfig.js` 中的域名修复函数
- 包括 `fixImageUrl`、`getDefaultImage`、`getCurrentDomain` 函数

### 2. 图片上传优化
- 在图片上传成功后，使用 `fixImageUrl()` 处理所有图片URL
- 确保 `fileURL`、`compressedURL`、`thumbnailURL` 都使用正确的域名

### 3. 图片显示优化
- 所有图片显示位置都使用 `fixImageUrl()` 函数：
  - 分类图标显示
  - 上传的图片缩略图显示
  - 图片预览功能
  - 自定义图标预览

### 4. 编辑模式优化
- 在加载已有文章数据时，对所有图片URL进行域名修复
- 确保编辑状态下的图片也显示正确

### 5. 分类图标优化
- 在保存自定义图标时使用域名修复
- 默认分类图标路径使用配置化的默认图片路径

## 主要修改点

1. **导入域名配置**：
   ```javascript
   import { fixImageUrl, getDefaultImage, getCurrentDomain } from '@/utils/domainConfig.js'
   ```

2. **图片URL处理**：
   ```javascript
   // 上传成功后
   imageList.value[newIndex].fileURL = fixImageUrl(uploadOptions.fileURL);
   
   // 模板中
   <image :src="fixImageUrl(image.thumbnailURL)" />
   ```

3. **图片显示优化**：
   ```javascript
   // 模板中
   <image :src="fixImageUrl(image.thumbnailURL)" />
   ```

## 优化效果

1. **统一域名管理**：所有图片都使用正确的域名 `https://aly22.jingle0350.cn`
2. **自动域名修复**：自动修复错误的域名配置
3. **兼容性增强**：处理各种图片URL格式和错误情况
4. **维护性提升**：集中化的域名配置便于后续维护

## 注意事项

- 所有新上传的图片会自动使用正确的域名
- 历史图片在加载时会被自动修复
- 域名修复函数会移除压缩参数，使用原始图片
- 本地静态资源路径不会被修改

## 相关文件

- `/utils/domainConfig.js` - 域名配置管理
- `/pages/fabu/fabu.vue` - 发布页面（本文件）