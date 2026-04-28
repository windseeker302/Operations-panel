FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /build

COPY package.json jsconfig.json vite.config.js /build/
COPY frontend /build/frontend
COPY html/bookmarks.html /build/html/bookmarks.html
COPY html/plugin-guide.html /build/html/plugin-guide.html
COPY html/Yulin_Ops_AutoFill /build/html/Yulin_Ops_AutoFill
COPY html/Yulin_Ops_AutoFill.zip /build/html/Yulin_Ops_AutoFill.zip
COPY html/yulin_ops_backup_2026-04-22.json /build/html/yulin_ops_backup_2026-04-22.json

RUN npm install
RUN npm run build

FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_HOST=0.0.0.0 \
    APP_PORT=8080 \
    APP_RUNTIME_DIR=/app/runtime \
    APP_DB_PATH=/app/runtime/firewall-login-manager.db \
    APP_STATIC_DIR=/app/html \
    APP_SEED_FILE=/app/seed/default_devices.json \
    APP_CLOUD_SEED_FILE=/app/user_info_export_20260428_142420.csv \
    APP_SECRET_KEY_FILE=/app/runtime/app-secret.key

COPY app.py /app/app.py
COPY requirements.txt /app/requirements.txt
COPY seed /app/seed
COPY user_info_export_20260428_142420.csv /app/user_info_export_20260428_142420.csv
COPY --from=frontend-builder /build/html /app/html

RUN pip install --no-cache-dir -r /app/requirements.txt
RUN mkdir -p /app/runtime

EXPOSE 8080

CMD ["python", "/app/app.py"]
