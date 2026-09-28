# DDL Atlas CN

把 [ccfddl/ccf-deadlines](https://github.com/ccfddl/ccf-deadlines) 的公开会议数据呈现为年度投稿甘特图，支持年份、CCF A/B/C 等级、研究领域与关键词筛选。

## 自动同步机制

数据同步完全自动化，无需手动干预：

- GitHub Actions 定时任务**每小时检查一次**上游 CCFDDL 仓库是否有新提交；
- 上游数据有变化时才重新生成 `conferences.json` 并构建部署，未变化则直接跳过（节省 Pages 部署额度）；
- `work/build_conference_data.rb` 会同时生成 `data-meta.json`（记录上游提交 SHA、时间与生成时间），页面上展示真实的数据更新时间；
- 同步后由 `ddl-atlas-bot` 把最新数据提交回 `main`（commit message 带 `[skip ci]`，不会触发重复部署），同时保证仓库持续有活动，避免 GitHub 因 60 天无活动暂停定时任务；
- 年份窗口随当前日期自动滚动（当前年起 4 年），"今天"线、年份筛选与排序基线均为动态计算，无需每年改代码。

## 手动更新数据（可选）

```bash
git -C work/ccf-deadlines pull
ruby work/build_conference_data.rb
```

## 发布到 GitHub Pages

将本项目推送到 GitHub 仓库的 `main` 分支，在仓库 **Settings → Pages → Build and deployment** 中将 Source 设为 **GitHub Actions**。之后每次推送都会自动构建和发布；也可以在 **Actions → Deploy DDL Atlas to GitHub Pages → Run workflow** 手动触发一次同步。

本地构建 GitHub Pages 静态版：

```bash
pnpm run build:github
```

数据由 CCFDDL 社区维护，仅供参考；所有日期应以会议官网为准。
