# Operations-panel

防火墙设备与云平台登录管理面板。

当前版本已经从“纯前端 + 浏览器本地存储”重构为“React 前端 + Python API + SQLite”，并补上了受控取密与密文存储能力。

## 功能概览

- 设备页：维护设备名称、地址、账号、密码、分类、置顶
- 云平台页：维护租户、平台账号、跳板账号、跳板密码、置顶
- 双主题界面：浅色 / 暗色切换
- Chrome 自动填充插件：设备页与云平台页均可自动填充
- 数据导入导出
- Docker Compose 部署

## 安全模型

本次版本重点做了以下安全收口：

- 列表接口不再返回明文密码
- 只有打开目标页或编辑记录时，才按单条接口取密
- 浏览器插件不再依赖 URL hash 传密
- 插件只允许从管理面板页面写入自动填充上下文
- SQLite 中的密码字段改为密文存储
- 导出文件默认导出密文，不导出明文密码

## 技术栈

### 前端

- React
- Vite
- Tailwind CSS
- shadcn/ui

源码目录：

- [frontend/src/App.jsx](/D:/ws/Vscode/firewall-login-manager/frontend/src/App.jsx:1)

构建输出：

- [html/index.html](/D:/ws/Vscode/firewall-login-manager/html/index.html:1)

### 后端

- Python 3.11
- `http.server`
- SQLite
- `cryptography`（用于密码密文存储）

入口文件：

- [app.py](/D:/ws/Vscode/firewall-login-manager/app.py:1)

### 插件

- Chrome Manifest V3
- 内容脚本位于 [html/Yulin_Ops_AutoFill/content.js](/D:/ws/Vscode/firewall-login-manager/html/Yulin_Ops_AutoFill/content.js:1)

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

### 安装前端依赖

```powershell
npm install
```

### 构建前端

```powershell
npm run build
```

### 安装后端依赖

```powershell
python -m pip install -r requirements.txt
```

### 启动服务

```powershell
python app.py
```

默认访问地址：

- [http://127.0.0.1:8080/drives](http://127.0.0.1:8080/drives)
- [http://127.0.0.1:8080/cloud](http://127.0.0.1:8080/cloud)

## Docker 部署

### 启动

```powershell
docker compose up --build -d
```

### 默认端口

- 宿主机：`8081`
- 容器：`8080`

访问地址：

- [http://127.0.0.1:8081/drives](http://127.0.0.1:8081/drives)
- [http://127.0.0.1:8081/cloud](http://127.0.0.1:8081/cloud)

### 必要环境变量

强烈建议在服务器上显式设置 `APP_SECRET_KEY`，不要依赖自动生成：

```powershell
$env:APP_SECRET_KEY = "在安全环境中生成的 Fernet 密钥"
docker compose up --build -d
```

如果未设置 `APP_SECRET_KEY`，程序会在 `runtime/app-secret.key` 生成本地密钥文件，功能可用，但安全性弱于独立环境变量或外部密钥管理。

### 数据持久化

`compose.yaml` 默认挂载：

- `/opt/firewall-login-manager/runtime:/app/runtime`

其中会保存：

- `firewall-login-manager.db`
- `app-secret.key`（未配置 `APP_SECRET_KEY` 时）

## API 概览

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

导出文件中的密码字段不会包含明文，而是包含密文字段：

- 设备：`passwordCiphertext`
- 云平台：`jumpPasswordCiphertext`

这类导出文件可以重新导入本系统恢复数据，但不能直接当作明文密码清单使用。
