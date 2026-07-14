# Anime Rank

一个用于制作季度新番“从夯到拉”榜单的可视化工具。番剧数据从 Bangumi 官方 API 自动获取，完成拖拽排序后，可以直接导出适合博客或社交媒体使用的高清 PNG 长图。

## 功能

- 自动读取指定年份与季度的 TV / WEB 新番并去重
- 五档固定排名：`夯 → 顶级 → 人上人 → NPC → 拉完了`
- 鼠标与触屏拖拽，支持同档重新排序
- 番剧名称搜索与可编辑榜单标题
- 卡片 3D 倾斜、动态辉光、磨砂边缘与响应式布局
- 2× 分辨率 PNG 导出
- 按季度自动保存至浏览器 `localStorage`
- 每张卡片可跳转至 Bangumi 条目数据对应的 Mikan 标题搜索
- 合并到 `main` 后通过 GitHub Actions 自动部署至 GitHub Pages

## 数据设计

主数据来自 Bangumi 的公开接口：

```text
GET https://api.bgm.tv/v0/subjects
```

应用分别请求 `cat=1`（TV）和 `cat=5`（WEB），用 `year` 与季度首月筛选后按条目 ID 去重。Mikan 目前作为资源检索入口，不承担结构化番剧数据库职责，也不需要登录信息。

所有排名结果只保存在当前浏览器中，不会上传用户数据，也不需要 API Token。

## 本地运行

需要 Node.js 20 或更高版本：

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

## 部署

仓库已经包含 `.github/workflows/deploy.yml`。在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中将 Source 设为 **GitHub Actions**。之后每次推送到 `main` 都会自动更新站点：

<https://eurekaimer.github.io/anime-rank/>

## 技术栈

- React 19 + TypeScript
- Vite
- dnd-kit
- html-to-image
- CSS 3D transforms / backdrop-filter / color-mix

## 数据与版权

条目信息与封面来自 [Bangumi](https://bangumi.tv/)；资源搜索入口指向 [Mikan Project](https://mikanani.me/)。本项目只用于生成个人主观榜单，不托管动画、种子或字幕资源。
