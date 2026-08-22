# 计划：删除官网购物车（Inquiry Cart）功能

## 概述

官网仅需展示产品，删除基于 localStorage 的"询价购物车"功能（添加到询价、抽屉式购物车、角标计数等），**保留**所有询价表单（联系页表单、产品页表单、WhatsApp 联系按钮）。

## 现状分析

购物车功能由以下部分组成：

| 位置 | 内容 |
| --- | --- |
| `layouts/partials/header.html` L18-25、L48-50 | 桌面端购物车图标按钮（含角标）、移动端菜单"询价车"按钮 |
| `layouts/partials/floating.html` L3、L12-16、L19-73 | 隐藏 bag 图标模板、FAB 购物车按钮、整个询价抽屉（含表单） |
| `layouts/partials/product-card.html` L7-8、L27-38 | `$thumb` 缩略图变量（仅供 data-img 使用）、"加入询价"按钮 |
| `layouts/products/single.html` L10-11、L90-100 | `$thumb` 变量、"加入询价"按钮 |
| `assets/js/main.js` L104-113、L115-238、L264/276-277/280-291、L437 | Toast 组件（仅购物车使用）、整个购物车逻辑（localStorage 读写、抽屉渲染、角标更新）、表单提交中的购物车数据附加、Esc 关闭抽屉 |
| `i18n/en.yaml` | `nav.inquiry_cart`、`cart:*`（12 个键）、`product.add_to_inquiry`、`product.added`、`form.about_products` |
| `assets/css/main.css` L472-477、L479-488、L500-506、L578-580 | `.fab-cart`、`.drawer*`、`.toast*`、`.fab-cart svg` 样式 |

关键事实（已验证）：
- Toast 组件唯一调用方是 `addToCart`，购物车删除后成为死代码，一并删除。
- `form.about_products` 仅在抽屉表单隐藏域中使用，随抽屉删除。
- `product.inquiry_now` 本就未被任何模板引用（既有死键，与购物车无关，不动）。
- `.field-label` / `.field-input` / `.hp-field` 等样式同时被 `inquiry-form.html` 使用，必须保留。
- `icon.html` 中的 `bag` 图标定义为通用图标库，删除引用后保留定义无害。

## 修改方案

### 1. `layouts/partials/header.html`
- 删除 L18-25：桌面端购物车图标按钮（`open-cart`、`cart-count-wrap`、`cart-count` 角标）。
- 删除 L48-50：移动端菜单中的"询价车"按钮。
- 保留：Get a Quote 按钮（指向联系页表单）、语言、汉堡菜单。

### 2. `layouts/partials/floating.html`
- 删除 L3：`<span id="iconBag">` 隐藏模板（仅用于空购物车占位图）。
- 删除 L12-16：`fabCart` FAB 按钮。
- 删除 L19-73：整个询价抽屉（`drawerBackdrop` + `inquiryDrawer` aside，含抽屉内表单和 `cartClear`）。
- 删除 L83-84：`#toast` 容器（唯一调用方是购物车）。
- 保留：返回顶部按钮、WhatsApp FAB、Lightbox、可选在线客服脚本。

### 3. `layouts/partials/product-card.html`
- 删除 L7-8：`$thumb` 变量（仅作 `data-img` 使用）。
- 删除 L27-38："加入询价"按钮（`add-inquiry`）。
- L39 的"发送询价"链接已有 `flex-1`，成为唯一按钮后自动占满整行，无需额外改动。

### 4. `layouts/products/single.html`
- 删除 L10-11：`$thumb` 变量。
- 删除 L90-100："加入询价"按钮。
- 保留 L101-104：`flex flex-col gap-3 sm:flex-row` 布局中剩下的"发送询价"（`flex-1`）与 WhatsApp 图标按钮，布局自适应无需调整。

### 5. `assets/js/main.js`
- 删除 L104-113：Toast 段（`toast`、`toastTimer`、`showToast`）。
- 删除 L115-238：整个"Inquiry cart"段——`CART_KEY`、`loadCart`/`saveCart`、`cart`、`badges`/`fabCart`/`fabCartBadge`、`renderBadge`、drawer 相关引用与事件（`cartClear`、`setDrawerOpen`、`.open-cart`、`drawerClose`、`drawerBackdrop`）、`renderDrawer`、`addToCart`、`.add-inquiry` 监听、末尾的 `renderBadge()` 调用。
- Forms 段简化：
  - `buildBody(form, extraLines)` → `buildBody(form)`，删除 `extraLines` 分支。
  - `handleForm` 中删除 `cartLines` 定义、fetch body 中的 `cart:` 字段、两个分支（endpoint / mailto）里的 `cart = []; saveCart(cart); renderBadge();` 三行。
- L437 Escape 处理：删除 `setDrawerOpen(false);` 一行（保留关闭 Lightbox 和菜单）。

### 6. `i18n/en.yaml`
- 删除 `nav.inquiry_cart`（L12）。
- 删除整个 `cart:` 块（L65-76，共 12 个键）。
- 删除 `product.add_to_inquiry`（L36）、`product.added`（L55）。
- 删除 `form.about_products`（L93）。
- 保留 `product.send_inquiry`、`product.inquiry_now`、`form.*` 其余键。

### 7. `assets/css/main.css`
- 删除 L472-477：`.fab-cart` 与 `.fab-cart .fab-badge`。
- 删除 L479-488：`.drawer-backdrop`、`.drawer`、`.drawer.open`（含"Inquiry drawer"注释行）。
- 删除 L500-506：`.toast` 与 `.toast.hidden`（含"Toast"注释行）。
- 删除 L578-580：`.fab-cart svg`。
- 保留 `.fab-stack`、`.fab`、`.fab-wa`、`.fab-top`、Lightbox 等其余样式。

## 假设与决策

1. **询价表单不属于购物车**：联系页表单、产品页 `#inquiry-form`、WhatsApp 按钮全部保留，这是"官网展示产品 + 直接询价"的核心链路。
2. **Toast 一并删除**：其唯一调用方是 `addToCart`，保留即为死代码。
3. **遗留 localStorage 数据**：老访客浏览器中的 `sw_inquiry_cart` 键成为孤儿数据，无害，不做清理逻辑。
4. **不做向后兼容**：直接删除全部相关代码，不留注释或占位。

## 验证步骤

1. 运行 `hugo server -D`，确认构建无模板/JS 错误。
2. 全局 Grep 确认无残留：`add-inquiry|open-cart|cart-count|fabCart|CART_KEY|inquiryDrawer|drawerBackdrop|drawerItems|cartClear|iconBag|showToast|cart\.` 在 `layouts/`、`assets/`、`i18n/` 中零命中。
3. 手动检查页面：
   - 首页 / 产品列表页：产品卡片只剩"发送询价"按钮，无"加入询价"。
   - 产品详情页：操作区只剩"发送询价"+ WhatsApp，点击可滚动到表单并正常提交。
   - 页头：无购物车图标；移动端菜单无"询价车"按钮。
   - 右下角：只剩 WhatsApp FAB 与返回顶部按钮，点击无抽屉弹出。
   - 联系页表单正常提交（mailto 或 endpoint）。
4. Esc 键仍能关闭 Lightbox 与移动端菜单。
