# Operations-panel

防火墙设备与云平台登录管理面板，集成华为云控制台（HCS）批量用户管理。

当前版本基于”React 前端 + Python API + SQLite”架构，支持登录鉴权、受控取密、密文存储、Chrome 自动填充插件以及 HCS 用户批量运维。

## 功能概览

### 设备管理（`/drives`）

- 增删改查防火墙/网络设备，字段包括名称、地址、账号、密码、分类
- 支持置顶常用设备
- 点击设备行直接在新标签页打开目标地址，并通过 Chrome 插件自动填充登录表单
- 支持分类筛选和关键字搜索
- 密码仅在点击打开时按单条接口取密，列表不暴露明文

### 云平台管理（`/cloud`）

- 管理华为云等平台的租户登录记录，包括租户名称、租户编码、平台账号、跳转密码、备注
- 支持置顶常用租户
- 统一登录入口配置：所有租户共享同一个云平台登录链接，可随时修改
- 一键打开平台并自动填充（通过 Chrome 插件传递上下文）
- 支持手动复制链接、不依赖插件的直接打开方式
- 密码存储同样采用加密+按需取密机制
- 备注自动关联内置的 70+ 账号中文标签（如”互联网榆林市档案馆”、”政务网数据库”等）

### 密码重置（`/password-reset`）— HCS 批量运维

这是整个面板中功能最密集的模块，对接华为云控制台 API：

- **HCS 连接配置**：配置管理员账号密码、Agency ID、项目名称、Region、控制台路径等参数
- **Cookie 自动刷新**：通过 Playwright 无头浏览器模拟登录华为云统一认证，自动抓取会话 Cookie 和 CFTK Token，加密存储于 SQLite
- **批量密码重置**：一键拉取所有租户（Domain）下的全部用户，逐个调用 HCS API 重置密码，后台多线程执行，前端实时展示进度条和操作日志
- **批量启用/禁用用户**：同上，批量调用 HCS API 切换用户启用/禁用状态
- **导出用户信息**：将所有租户的用户列表导出为 JSON，方便离线审计
- **单个用户操作**：按租户筛选用户，支持关键字搜索，可对单个用户执行密码重置或启停操作
- **任务状态追踪**：批量操作期间轮询任务进度，展示成功/失败计数和详细日志；已完成任务保留摘要，一小时后自动清理

### Chrome 自动填充插件

- 基于 Manifest V3 的 Chrome 扩展，位于 `html/Yulin_Ops_AutoFill/`
- 通过 `postMessage` 机制与管理面板通信：面板打开目标页面前向插件注入账号密码上下文，插件在目标页面自动填充表单
- 支持设备登录（设备页）和云平台登录（云平台页）两种填充模式
- 内置 **插件自测实验室**（`/plugin-lab`）：无需真实目标页面即可验证插件收发消息、填写字段的完整流程
- 侧边栏提供插件 ZIP 下载、使用说明、manifest 清单和自动填充脚本的在线查看

### 认证与安全

- 基于 Session + HMAC-SHA256 签名 Cookie 的登录鉴权，登录态可配置有效期（默认 12 小时）
- 支持通过环境变量关闭鉴权（`APP_AUTH_ENABLED=0`）
- 所有密码均使用 Fernet 对称加密存储在 SQLite 中
- 列表接口不返回明文密码，仅在编辑或打开目标页时按单条接口解密
- 数据导出文件中密码字段以密文形式（`passwordCiphertext` / `jumpPasswordCiphertext`）呈现，可重新导入恢复但不可直接作为明文清单使用
- 密钥管理：支持环境变量注入、本地密钥文件、自动生成三种模式，容器化部署时可通过 volume 持久化密钥

### 其他

- 浅色/暗色双主题切换
- 数据导入导出（支持全量设备+云平台记录+设置的 JSON 导入导出）
- 响应式布局，适配不同屏幕宽度
- Docker Compose 一键部署，runtime 目录挂载持久化

## 安全说明

- 列表接口不直接返回明文密码
- 只有编辑记录或主动打开目标页时，才按单条接口取密
- SQLite 中的密码字段以密文形式存储
- 导出文件默认导出密文，不导出明文密码
- Chrome 插件只接受本管理面板发出的自动填充上下文

## 技术栈

### 前端

- React
- Vite
- Tailwind CSS
- shadcn/ui

源码入口：
- [frontend/src/App.jsx](/D:/ws/Vscode/firewall-login-manager/frontend/src/App.jsx:1)

构建输出：
- [html/index.html](/D:/ws/Vscode/firewall-login-manager/html/index.html:1)

### 后端

- Python 3.11
- `http.server`
- SQLite
- `cryptography`

入口文件：
- [app.py](/D:/ws/Vscode/firewall-login-manager/app.py:1)

### 插件

- Chrome Manifest V3
- 插件目录：[html/Yulin_Ops_AutoFill](/D:/ws/Vscode/firewall-login-manager/html/Yulin_Ops_AutoFill)
- 插件压缩包：[html/Yulin_Ops_AutoFill.zip](/D:/ws/Vscode/firewall-login-manager/html/Yulin_Ops_AutoFill.zip)

## 目录结构

```text
firewall-login-manager/
├─ app.py
├─ Dockerfile
├─ compose.yaml
├─ requirements.txt
├─ package.json
├─ frontend/
├─ html/
├─ seed/
├─ runtime/
└─ user_info_export_20260428_142420.csv
```

## 本地开发

### 1. 安装前端依赖

```powershell
npm install
```

### 2. 构建前端

```powershell
npm run build
```

### 3. 安装后端依赖

```powershell
python -m pip install -r requirements.txt
```

### 4. 启动服务

```powershell
python app.py
```

默认访问地址：

- [http://127.0.0.1:8080/login](http://127.0.0.1:8080/login)
- [http://127.0.0.1:8080/drives](http://127.0.0.1:8080/drives)
- [http://127.0.0.1:8080/cloud](http://127.0.0.1:8080/cloud)

默认登录账号：

- 用户名：`admin`
- 密码：`admin123456`

如需修改，可在启动前设置环境变量：

```powershell
$env:APP_AUTH_USERNAME = "your-admin"
$env:APP_AUTH_PASSWORD = "your-password"
python app.py
```

## Chrome 插件使用

面板左侧“资源”区域提供：

- 插件说明
- 插件清单
- 插件脚本
- 下载插件 ZIP

也可以直接访问：

- [http://127.0.0.1:8080/Yulin_Ops_AutoFill.zip](http://127.0.0.1:8080/Yulin_Ops_AutoFill.zip)

安装步骤：

1. 下载 `Yulin_Ops_AutoFill.zip`
2. 解压到本地目录
3. 打开 `chrome://extensions/`
4. 开启“开发者模式”
5. 点击“加载已解压的扩展程序”
6. 选择解压后的 `Yulin_Ops_AutoFill` 目录

如果修改了插件代码，需要在 Chrome 扩展页手动点一次“重新加载”。

## Docker 部署

### 方式一：直接使用 `docker compose`

```powershell
docker compose up --build -d
```

默认端口映射：

- 宿主机：`8081`
- 容器：`8080`

默认访问地址：

- [http://127.0.0.1:8081/login](http://127.0.0.1:8081/login)
- [http://127.0.0.1:8081/drives](http://127.0.0.1:8081/drives)
- [http://127.0.0.1:8081/cloud](http://127.0.0.1:8081/cloud)

### 方式二：服务器从零部署

#### 1. 拉取代码

```bash
git clone https://github.com/windseeker302/Operations-panel.git
cd Operations-panel
```

#### 2. 可选：切到指定分支

```bash
git branch
git checkout main
```

#### 3. 配置环境变量

推荐在项目根目录创建 `.env` 文件：

```env
APP_SECRET_KEY=请替换为你自己的Fernet密钥
APP_AUTH_USERNAME=admin
APP_AUTH_PASSWORD=请替换为强密码
```

如果你不想写 `.env`，也可以直接在当前 shell 里导出：

```bash
export APP_SECRET_KEY='请替换为你自己的Fernet密钥'
export APP_AUTH_USERNAME='admin'
export APP_AUTH_PASSWORD='请替换为强密码'
```

#### 4. 启动服务

```bash
docker compose up --build -d
```

#### 5. 检查运行状态

```bash
docker compose ps
docker compose logs -f
```

#### 6. 打开页面

- `http://服务器IP:8081/login`
- `http://服务器IP:8081/drives`
- `http://服务器IP:8081/cloud`

#### 7. 下载并安装插件

- 打开 `http://服务器IP:8081/drives`
- 左侧“资源”里点击“下载插件 ZIP”
- 解压后到 `chrome://extensions/` 导入 `Yulin_Ops_AutoFill` 目录

### 持久化数据

`compose.yaml` 默认挂载：

- `/opt/firewall-login-manager/runtime:/app/runtime`

目录内会保存：

- `firewall-login-manager.db`
- `app-secret.key`（未显式配置 `APP_SECRET_KEY` 时）

### 升级部署

服务器更新代码后，执行：

```bash
cd Operations-panel
git pull
docker compose up --build -d
```

查看状态：

```bash
docker compose ps
docker compose logs -f
```

停止服务：

```bash
docker compose down
```

## 关键环境变量

- `APP_HOST`：监听地址，默认 `0.0.0.0`
- `APP_PORT`：监听端口，默认 `8080`
- `APP_RUNTIME_DIR`：运行时目录
- `APP_DB_PATH`：SQLite 数据库文件
- `APP_STATIC_DIR`：静态文件目录
- `APP_SEED_FILE`：设备初始数据文件
- `APP_CLOUD_SEED_FILE`：云平台初始数据文件
- `APP_SECRET_KEY`：Fernet 密钥，建议服务器显式配置
- `APP_SECRET_KEY_FILE`：本地密钥文件路径
- `APP_AUTH_ENABLED`：是否启用登录鉴权，默认启用
- `APP_AUTH_USERNAME`：登录用户名
- `APP_AUTH_PASSWORD`：登录密码

## API 概览

### 认证接口

- `GET /api/auth/session`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### 基础接口

- `GET /api/healthz`
- `GET /api/bootstrap`
- `GET /api/export`
- `POST /api/import`

### 设备接口

- `POST /api/devices`
- `PUT /api/devices/{id}`
- `DELETE /api/devices/{id}`
- `GET /api/devices/{id}/secret`
- `POST /api/devices/{id}/pin`

### 云平台接口

- `POST /api/cloud-logins`
- `PUT /api/cloud-logins/{id}`
- `DELETE /api/cloud-logins/{id}`
- `GET /api/cloud-logins/{id}/secret`
- `POST /api/cloud-logins/{id}/pin`

### 设置接口

- `POST /api/settings/cloud-login-url`

## 备份说明

导出文件中的密码字段不包含明文，而是密文字段：

- 设备：`passwordCiphertext`
- 云平台：`jumpPasswordCiphertext`

这类导出文件可以重新导入本系统恢复数据，但不能直接当作明文密码清单使用。
