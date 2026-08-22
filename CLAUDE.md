# CLAUDE.md

本文件为 AI 助手提供项目上下文。修改项目时请先阅读本文件。

## 项目概述

`sunlight-website` 是一个基于 Hugo 的静态博客网站，内容以中文为主，部署在 Cloudflare Workers/Pages 上。

- Git 仓库：https://github.com/wsepr/sunlight-website.git（分支 `master`）
- 内容管理后台：Sveltia CMS（`static/admin`），通过 GitHub 仓库 `wsepr/sunlight-website` 提交内容

## 技术栈

| 组件 | 说明 |
| --- | --- |
| Hugo | 静态站点生成器，版本由 `build.sh` 固定为 0.165.0 |
| 主题 | `hugo-blog-awesome`（git 子模块，来自 hugo-sid/hugo-blog-awesome） |
| 部署 | Cloudflare Workers（`wrangler.jsonc` + `build.sh`） |
| 内容管理 | Sveltia CMS（`static/admin/config.yml`） |

## 常用命令

```bash
# 本地开发预览（包含草稿）
hugo server -D

# 生产构建（输出到 public/）
hugo build --gc --minify

# 初始化/更新主题子模块
git submodule update --init --recursive

# 云端构建（Cloudflare 环境，安装工具链后执行构建）
./build.sh
```

## 项目结构

```
sunlight/
├── archetypes/default.md   # 新文章模板（默认 draft: true）
├── content/posts/          # 博客文章（Markdown + front matter）
├── static/admin/           # Sveltia CMS 配置
├── themes/hugo-blog-awesome/  # 主题子模块（勿直接修改，改动会被子模块覆盖）
├── hugo.yaml               # 站点基础配置
├── build.sh                # Cloudflare 构建脚本
├── wrangler.jsonc          # Cloudflare 部署配置
├── .gitmodules             # 主题子模块声明
└── public/                 # 构建产物（已 gitignore）
```

## 约定与注意事项

- **文章格式**：位于 `content/posts/`，使用 front matter（`title`、`date`、`tags`、`description` 等）。新文章由 `archetypes/default.md` 生成，默认 `draft: true`，发布前需移除。
- **主题定制**：项目自身的 `layouts/`、`assets/`、`data/`、`i18n/` 目录当前为空，全部渲染逻辑来自主题子模块。如需覆盖主题，应在项目根目录的 `layouts/` 下按 Hugo 覆盖规则添加同名模板，而不是修改 `themes/` 内的文件。
- **站点配置**：`hugo.yaml` 仍为默认值（`baseURL: https://example.org/`、`title: My New Hugo Project`、`locale: en-us`），尚未按站点实际信息定制，改动时需注意。
- **构建环境**：`build.sh` 在 Cloudflare 环境中动态安装 Dart Sass / Hugo / Node.js；根目录无 `go.mod` 与 `package.json`，因此 Go 与 Node 相关步骤不会执行。
- **构建产物**：`public/` 为构建输出目录，已被 `.gitignore` 忽略，不要提交。
- **提交规范**：现有提交使用 Conventional Commits 风格（如 `chore:`、`docs:`、`build:`），并混用中文描述。
