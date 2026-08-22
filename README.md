# Sunwave 外贸官网（sunlight-website）

基于 Hugo + Tailwind CSS v4 的 B2B 小家电外贸公司官网，部署于 Cloudflare Pages，内容通过 Sveltia CMS 管理。

- 演示站点数据（公司名 Sunwave、产品、证书等）均为占位内容，可在 CMS 中替换
- 主题色：深蓝 `#0F2B46` / 金色 `#C9A227`，字体 Manrope + Inter（自托管）

## 页面结构

| 路由 | 说明 |
| --- | --- |
| `/` | 首页：Hero、数据统计、核心优势、分类预览、热门产品、公司摘要、证书、客户评价、CTA |
| `/about/` | 关于我们：简介、发展历程、企业文化、工厂画廊、合作伙伴 |
| `/products/` | 产品中心：搜索 / 分类筛选 / 排序 |
| `/products/<分类>/` | 产品分类页（如 `/products/kitchen-appliances/`） |
| `/products/<产品>/` | 产品详情：画廊、规格表、包装运输、相关推荐、询盘表单 |
| `/certifications/` | 资质证书 |
| `/contact/` | 联系我们：联系信息、询盘表单、Google 地图、FAQ |
| `/admin/` | Sveltia CMS 后台 |

## 本地开发

环境要求：Hugo extended 0.165+、Node.js 20+（含 npm）。

```bash
# 1. 初始化主题子模块（首次克隆后执行）
git submodule update --init --recursive

# 2. 安装前端依赖（Tailwind CSS v4 经 PostCSS 编译）
npm install

# 3. 本地预览（含草稿）
hugo server -D

# 4. 生产构建（输出到 public/）
hugo build --gc --minify
```

> Windows 下若构建报 `Cannot find module '../lightningcss.win32-x64-msvc.node'`，
> 执行 `npm install lightningcss-win32-x64-msvc --no-save`（npm 偶发跳过平台可选依赖）。

## 部署到 Cloudflare Pages

仓库已含 `build.sh` 与 `wrangler.jsonc`，Cloudflare 构建配置：

- 构建命令：`./build.sh`（自动安装 Hugo 0.165 / Node 24 并执行 `npm ci` + `hugo build --gc --minify`）
- 输出目录：`public`

`hugo.yaml` 中的 `security.node.permissions.allowAddons: [postcss]` 用于允许
Hugo 0.161+ 在 Node 权限模型下加载 lightningcss 等原生模块，请勿删除。

## Sveltia CMS 内容管理

访问 `https://<你的域名>/admin/`，使用 GitHub 账号（`wsepr/sunlight-website` 仓库授权）登录。

后台包含 7 个内容集合：

| 集合 | 用途 |
| --- | --- |
| **Site Settings** | 公司名称、Logo、联系方式、社媒链接、首页统计数据、CTA、表单接收配置 |
| **Home Page** | 首页 Hero、优势卡片、公司摘要、客户评价 |
| **About Page** | 公司简介、发展历程、企业文化、工厂画廊、合作伙伴 |
| **Product Categories** | 产品分类（新增后自动出现在导航筛选、页脚、首页） |
| **Products** | 产品（图片存于产品页面同级目录，支持多图、规格表、包装信息、MOQ） |
| **Products Page** | 产品中心页标题与介绍 |
| **Certifications** | 证书列表（图片 / PDF / 有效期） |
| **Contact Page** | 联系页介绍与 FAQ |

### 常见操作

- **修改公司信息 / 联系方式 / 社媒链接**：CMS → Site Settings，保存后自动提交到 Git 并触发部署
- **添加产品**：CMS → Products → New Product；填写型号、分类、图片、规格等，保存即发布（勾选 Draft 可暂不发布）
- **添加产品分类**：CMS → Product Categories → New Product Category，然后在产品中选择该分类
- **配置询盘表单接收方式**：Site Settings → Form Endpoint URL（如 Formspree）；留空则回退为 mailto 方式
- **配置在线客服**：Site Settings → Chat Widget Script URL（如 Tawk.to 嵌入地址）

### 询盘车说明

产品卡片和详情页的 "Add to Inquiry" 会将产品加入询盘车（存于浏览器 localStorage），
用户在任意询盘表单提交时，询盘车内容会自动附在邮件/表单正文中。

## 目录结构

```
├── assets/css/main.css      # Tailwind v4 样式（设计令牌 + 组件类）
├── assets/js/main.js        # 交互：导航、滚动动画、询盘车、表单、灯箱、筛选
├── content/                 # 全部内容（CMS 管理的数据源）
├── data/settings.yaml       # 公司信息（对应 CMS 的 Site Settings）
├── layouts/                 # 全部模板（覆盖主题，站内自有代码）
├── static/admin/            # Sveltia CMS（config.yml + index.html）
├── static/fonts/            # 自托管字体（woff2）
├── themes/hugo-blog-awesome # 主题子模块（当前未被布局引用，保留备用）
└── hugo.yaml                # 站点配置
```

## 技术要点

- **图片**：Hugo image processing 自动生成 WebP 响应式 srcset；图片存于各页面 bundle 内
- **SEO**：每页独立 title/description/OG；全站 Organization、页面级 BreadcrumbList、产品页 Product JSON-LD 结构化数据
- **动效**：IntersectionObserver 滚动淡入、数字滚动、卡片悬停；完整支持 `prefers-reduced-motion`
- **多语言预留**：`hugo.yaml` 的 `languages` 结构与 `i18n/en.yaml` 已就绪，新增语言只需扩展
