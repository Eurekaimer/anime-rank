# Anime Rank

一个用于制作季度新番“从夯到拉”榜单的可视化工具。条目与封面数据从 Bangumi 官方 API 自动获取，完成拖拽排序后，可以直接导出适合博客或社交媒体使用的高清 PNG 长图。

## 功能

- 自动读取指定年份与季度的 TV、剧场版与 WEB 动画并去重
- 保留日本制作的 WEB 动画，并排除国产、国漫、国创与动态漫画
- 五档固定排名：`夯 → 顶级 → 人上人 → NPC → 拉完了`
- 整行吸附式拖拽，靠近档位即可触发并高亮边框
- 待定区根据容器宽度自动计算列数，始终保持两行并动态分页
- 待定区支持综合推荐、热度、评分、开播日期或名称排序，不影响已完成的五档排名
- 综合推荐以评分为主（75%）并结合对数热度（25%）；评分优先采用轻度贝叶斯校正
- 可选择从 2000 年至下一年的季度数据
- 根据 Bangumi 标签排除国产、国漫、国创与动态漫画条目
- 番剧名称搜索与可编辑榜单标题
- 暖白简约界面与响应式布局
- 中央弹窗预览，支持 2× 分辨率 PNG、JPG 与 WebP 导出
- 导出图片只包含五个正式档位，不包含待定区
- 导出前通过离屏副本重新排版并裁切，不保留待定区产生的空白
- 支持填写并在本地保存署名 ID；导出图附带署名、项目仓库和个人网站
- 按季度自动保存至浏览器 `localStorage`
- 每张卡片可直接跳转至对应的 Bangumi 条目
- 合并到 `main` 后通过 GitHub Actions 自动部署至 GitHub Pages

## 数据设计

主数据来自 Bangumi 的公开接口：

```text
GET https://api.bgm.tv/v0/subjects
```

应用请求 `cat=1`（TV）、`cat=3`（剧场版）与 `cat=5`（WEB），通过 Bangumi 标签排除中国制作条目，再用 `year` 与季度首月筛选并按条目 ID 去重。《超时空辉夜姬》与《赛博朋克：边缘行者》等容易受发行形式影响的作品另设标题白名单。应用不依赖第三方番剧数据库，也不需要登录信息。

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
- CSS Grid / responsive layout / color-mix

## 代码结构

```text
src/
├── components/            # 卡片、档位、控制栏与导出弹窗
├── hooks/                 # 响应式待定区列数
├── utils/                 # 排序算法与离屏导出
├── api.ts                 # Bangumi 数据获取和标准化
├── constants.ts           # 档位、季度与存储配置
├── types.ts               # 共享领域类型
└── App.tsx                # 页面状态与模块编排
```

排序结果、档位统计和卡片索引均作为派生数据缓存。拖拽时通过 `Map` 和 `Set` 定位卡片与目标档位，避免反复扫描整个番剧列表；导出逻辑与页面渲染完全分离，便于继续增加模板或图片尺寸。

## 数据与版权

条目信息与封面来自 [Bangumi](https://bangumi.tv/)。本项目只用于生成个人主观榜单，不托管动画、种子或字幕资源。
