# SBTI 测试 H5

基于开源项目 `web3a8/SBTI-test` 重构的纯静态 H5 版本。

目标：

- 不依赖 Vue / React / 打包框架
- 直接部署到 GitHub Pages
- 方便绑定自定义域名
- 题库、人格库、评分逻辑可独立维护

## 目录结构

```text
.
├── assets/images/         # 结果图片资源
├── scripts/
│   ├── data/
│   │   ├── meta.js        # 维度信息、特殊题、维度顺序
│   │   ├── questions.js   # 常规题库
│   │   └── types.js       # 人格库、结果图、维度解释
│   ├── modules/
│   │   └── scoring.js     # 评分与匹配逻辑
│   └── main.js            # 页面渲染与交互
├── styles/main.css
└── index.html
```

## 本地预览

推荐直接起一个静态服务，不要双击 `index.html`。

```bash
python3 -m http.server 4173
```

然后访问：

`http://localhost:4173`

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库并推送当前目录内容
2. 在仓库设置里打开 `Pages`
3. Source 选择当前分支，例如 `main`
4. Folder 选择 `/ (root)`
5. 等待 Pages 构建完成

## 绑定自定义域名

如果你已经有域名，建议优先使用 `www.你的域名` 作为正式入口。

GitHub Pages 常见做法：

1. 在仓库根目录新建 `CNAME`
2. 文件内容只写你的域名，例如：

```text
sbti.zhangweiguo.com
```

3. 去域名 DNS 服务商配置解析
4. 在 GitHub Pages 设置页确认自定义域名生效
5. 开启 HTTPS

## 后续修改入口

- 改题目：`scripts/data/questions.js`
- 改特殊题：`scripts/data/meta.js`
- 改人格结果文案：`scripts/data/types.js`
- 改评分逻辑：`scripts/modules/scoring.js`
- 改页面样式：`styles/main.css`

## 说明

当前版本保留了上游项目的题库逻辑、特殊题触发逻辑和结果映射方式，并将原本集中在单个 HTML 文件里的内容拆成了更易维护的静态模块。
