import csv
import json
import os
import sqlite3
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from cryptography.fernet import Fernet, InvalidToken


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = Path(os.environ.get("APP_STATIC_DIR", BASE_DIR / "html")).resolve()
RUNTIME_DIR = Path(os.environ.get("APP_RUNTIME_DIR", BASE_DIR / "runtime")).resolve()
DB_PATH = Path(os.environ.get("APP_DB_PATH", RUNTIME_DIR / "firewall-login-manager.db")).resolve()
SEED_FILE = Path(os.environ.get("APP_SEED_FILE", BASE_DIR / "seed" / "default_devices.json")).resolve()
CLOUD_SEED_FILE = Path(
    os.environ.get("APP_CLOUD_SEED_FILE", BASE_DIR / "user_info_export_20260428_142420.csv")
).resolve()
DEFAULT_CLOUD_LOGIN_URL = (
    "https://auth.ylaky.com/mounisso/login.action/authenticate?"
    "service=https:%2F%2Fauth.ylaky.com%2Fmounisso%2Fv1%2Fcas%2Flogin%3Fservice%3D"
    "https%253A%252F%252Foc.ylaky.com%253A31943%252Fmounisess%252Fv1%252Fauth%253Fservice%253D"
    "https%25253A%25252F%25252Foc.ylaky.com%25253A31943%25252Fmomaintenancewebsite%25252Funiportal%25252F"
    "%26locale%3Dzh-cn%26uni_locale%3Dzh-cn"
)
DEFAULT_CLOUD_JUMP_PASSWORD = "Pass@2026!!11"
SECRET_PREFIX = "enc:v1:"
SECRET_KEY_PATH = Path(os.environ.get("APP_SECRET_KEY_FILE", RUNTIME_DIR / "app-secret.key")).resolve()
_SECRET_BOX: Fernet | None = None
CLOUD_ACCOUNT_LABELS = {
    "HLW_danganguan_admin": "互联网榆林市档案馆",
    "HLW_dashuju_admin": "互联网大数据公司业务系统",
    "HLW_database": "互联网数据库",
    "HLW_fagaiwei_admin": "互联网发改委业务系统",
    "HLW_funvlianhehui": "互联网榆林市妇女联合会",
    "HLW_gongxinju_admin": "互联网工信局业务系统",
    "HLW_gongxinju_xinxihuazhongxin": "互联网榆林工业信息化推广应用中心",
    "HLW_jgsw_admin": "互联网机关事务局业务系统",
    "HLW_jiaotongjingcha": "互联网交通警察支队",
    "HLW_jiliang_admin": "互联网榆林市计量技术研究院",
    "HLW_jinrongju_admin": "互联网金融局业务系统",
    "HLW_jinrongju_difangjinrong": "互联网金融局地方金融统计及风险检测预警平台",
    "HLW_kejiju_admin": "互联网科技局-榆林市秦创原创新驱动网络平台",
    "HLW_kxjsxh": "互联网_榆林市科学技术协会",
    "HLW_laoganbuju_admin": "互联网老干部局",
    "HLW_mizhizuzhibu_admin": "互联网米脂县组织部",
    "HLW_nengyuanju_admin": "互联网能源局",
    "HLW_qianxin": "互联网奇安信",
    "HLW_shichangjiandu_admin": "互联网榆林市市场监督管理局",
    "HLW_shichangjiandu_tezhongshebei": "互联网市场监督管理局特种设备管理",
    "HLW_shirenda_admin": "互联网市人大",
    "HLW_shizhengfu_admin": "互联网区榆林市政府",
    "HLW_shuiliju": "互联网榆林市水利局",
    "HLW_sifaju_admin": "互联网司法局",
    "HLW_suideshiwei_admin": "互联网绥德县县委",
    "HLW_tongjiju_admin": "互联网统计局业务系统",
    "HLW_wenlvju_admin": "互联网文旅局",
    "HLW_xingzhenshenpi_admin": "互联网行政审批局业务系统",
    "HLW_yingjiguanli_admin": "互联网区应急管理局",
    "HLW_zhigongwei_admin": "互联网市直工委业务系统",
    "HLW_zhihui_admin": "互联网智慧局业务系统",
    "HLW_zhujianju_admin": "互联网住建局业务系统",
    "HLW_zonggonghui_admin": "互联网总工会业务系统",
    "HLW_zonggonghui_gongzuopingtai": "互联网榆林市总工会网上工作平台",
    "HLW_zuzhibu_admin": "互联网榆林智慧党建平台",
    "WPS_admin": "政务网金山WPS云文档",
    "danganguan_admin": "政务网榆林市档案馆",
    "database": "政务网数据库",
    "fagaiwei_admin": "政务网发改委交易中心",
    "fagaiwei_xinyonggongxiang": "政务网发改委信用共享服务平台",
    "fagaiwei_youhuayingshang": "政务网发改委优化营商环境服务中心",
    "fagawei_youhuayingshang": "政务网发改委优化营商环境服务中心",
    "fagaiwei_zhihuizhaoshang": "政务网发改委产业链分析和智慧招商平台",
    "hlw_gongqingtuan": "互联网榆林市委共青团",
    "hlw_nongyenongcunju": "互联网农业农村局",
    "oa-admin": "政务网榆林市党政机关OA办公系统",
    "qanx_admin": "政务网qanx",
    "qianxin": "政务网奇安信",
    "ren-admin": "政务网榆尔证书在线服务系统-榆尔LRA",
    "shichangjiandu_admin": "政务网榆林市市场监督管理局",
    "shizhengfu_admin": "政务网榆林市政府",
    "shuiliju_admin": "政务网榆林市水利局",
    "web-admin": "政务网远桥Web虚拟主机资源",
    "weilaiguoji": "未来国际运维",
    "wlgj_admin": "政务网运维管理系统-未来国际",
    "xingzhengshenpiju_admin": "政务网行政审批局",
    "yingjiguanliju_admin": "政务网区榆林市应急管理局",
    "yulinshinengyuanju_admin": "政务网能源局",
    "zhang-admin": "政务网卫士通电子印章在线服务系统",
    "zhihui_admin": "政务网-智慧局-业务系统云资源",
    "zhihui_xiangmuguanli": "政务网-智慧局-项目管理系统",
    "zhongan_admin": "政务网中安网脉2期终端系统",
    "zhujianju_admin": "政务网住建局业务系统",
    "zuzhibu_admin": "政务网市委组织部智慧党建平台",
    "HLW_tuiyijunren_admin": "榆林市退役军人就业创业服务系统",
    "hlw_zhengxie_admin": "互联网政协-政协门户网站管理系统",
    "hlw_shujuju_admin": "互联网-数据局",
    "shujuju_admin": "政务网-数据局",
    "hlw_shiweidangshiyanjiu": "互联网-党史研究室",
    "weijianwei_admin": "政务网_卫健委",
    "hlw_weijianwei": "互联网_卫健委",
    "hlw_jishengxiehui": "互联网_计生协会",
    "HLW_shengtaihuanjing": "互联网生态环境局",
}


def now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_secret_box() -> Fernet:
    global _SECRET_BOX
    if _SECRET_BOX is not None:
        return _SECRET_BOX

    raw_key = os.environ.get("APP_SECRET_KEY", "").strip()
    if raw_key:
        key = raw_key.encode("utf-8")
    else:
        RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
        SECRET_KEY_PATH.parent.mkdir(parents=True, exist_ok=True)
        if SECRET_KEY_PATH.exists():
            key = SECRET_KEY_PATH.read_text(encoding="utf-8").strip().encode("utf-8")
        else:
            key = Fernet.generate_key()
            SECRET_KEY_PATH.write_text(key.decode("utf-8"), encoding="utf-8")

    try:
        _SECRET_BOX = Fernet(key)
    except ValueError as exc:
        raise RuntimeError("APP_SECRET_KEY 不合法，必须使用 Fernet 密钥") from exc
    return _SECRET_BOX


def is_secret_encrypted(value: str) -> bool:
    return str(value or "").startswith(SECRET_PREFIX)


def encrypt_secret(value: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    if is_secret_encrypted(raw):
        return raw
    token = get_secret_box().encrypt(raw.encode("utf-8")).decode("utf-8")
    return f"{SECRET_PREFIX}{token}"


def decrypt_secret(value: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    if not is_secret_encrypted(raw):
        return raw
    token = raw[len(SECRET_PREFIX) :]
    try:
        return get_secret_box().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("密文无法解密，请检查 APP_SECRET_KEY 或密钥文件") from exc


def migrate_secret_columns(conn: sqlite3.Connection) -> None:
    device_rows = conn.execute("SELECT id, password FROM devices WHERE password <> ''").fetchall()
    for row in device_rows:
        encrypted = encrypt_secret(row["password"])
        if encrypted != row["password"]:
            conn.execute("UPDATE devices SET password = ? WHERE id = ?", (encrypted, row["id"]))

    cloud_rows = conn.execute("SELECT id, jump_password FROM cloud_logins WHERE jump_password <> ''").fetchall()
    for row in cloud_rows:
        encrypted = encrypt_secret(row["jump_password"])
        if encrypted != row["jump_password"]:
            conn.execute("UPDATE cloud_logins SET jump_password = ? WHERE id = ?", (encrypted, row["id"]))


def build_cloud_note(platform_account: str, existing_note: str) -> str:
    label = CLOUD_ACCOUNT_LABELS.get(str(platform_account or "").strip(), "")
    note = str(existing_note or "").strip()
    if not label:
        return note
    if not note:
        return label
    if label in note:
        return note
    return f"{label} | {note}"


def sync_cloud_account_metadata(conn: sqlite3.Connection) -> None:
    rows = conn.execute("SELECT id, platform_account, jump_username, notes FROM cloud_logins").fetchall()
    for row in rows:
        platform_account = str(row["platform_account"] or "").strip()
        next_jump_username = platform_account
        next_note = build_cloud_note(platform_account, row["notes"])
        if next_jump_username != str(row["jump_username"] or "") or next_note != str(row["notes"] or ""):
            conn.execute(
                """
                UPDATE cloud_logins
                SET jump_username = ?, notes = ?, updated_at = ?
                WHERE id = ?
                """,
                (next_jump_username, next_note, now_iso(), row["id"]),
            )


def initialize_database() -> None:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    get_secret_box()
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS devices (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                username TEXT DEFAULT '',
                password TEXT DEFAULT '',
                category TEXT NOT NULL,
                is_pinned INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS cloud_logins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_name TEXT NOT NULL,
                tenant_code TEXT DEFAULT '',
                platform_account TEXT DEFAULT '',
                jump_username TEXT DEFAULT '',
                jump_password TEXT DEFAULT '',
                is_pinned INTEGER NOT NULL DEFAULT 0,
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        ensure_cloud_login_schema(conn)

        device_count = conn.execute("SELECT COUNT(*) FROM devices").fetchone()[0]
        if device_count == 0 and SEED_FILE.exists():
            seed_devices_from_json(conn, SEED_FILE)

        cloud_login_count = conn.execute("SELECT COUNT(*) FROM cloud_logins").fetchone()[0]
        if cloud_login_count == 0 and CLOUD_SEED_FILE.exists():
            seed_cloud_logins_from_csv(conn, CLOUD_SEED_FILE)

        migrate_secret_columns(conn)
        sync_cloud_account_metadata(conn)

        conn.execute(
            """
            INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO NOTHING
            """,
            ("cloud_login_url", DEFAULT_CLOUD_LOGIN_URL, now_iso()),
        )


def seed_devices_from_json(conn: sqlite3.Connection, json_path: Path) -> int:
    items = json.loads(json_path.read_text(encoding="utf-8"))
    timestamp = now_iso()
    rows = [
        (
            item["id"],
            item["name"],
            item["url"],
            item.get("username", ""),
            encrypt_secret(item.get("password", "")),
            item.get("category", "Toolbox"),
            1 if item.get("isPinned") else 0,
            timestamp,
            timestamp,
        )
        for item in items
    ]
    if rows:
        conn.executemany(
            """
            INSERT INTO devices (id, name, url, username, password, category, is_pinned, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )
    return len(rows)


def seed_cloud_logins_from_csv(conn: sqlite3.Connection, csv_path: Path) -> int:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    timestamp = now_iso()
    prepared_rows: list[tuple] = []
    for row in rows:
        tenant_code = str(row.get("租户ID", "")).strip()
        platform_account = str(row.get("用户名", "")).strip()
        user_id = str(row.get("用户ID", "")).strip()
        if not tenant_code and not platform_account:
            continue
        prepared_rows.append(
            (
                tenant_code or platform_account,
                tenant_code,
                platform_account,
                platform_account,
                encrypt_secret(DEFAULT_CLOUD_JUMP_PASSWORD),
                0,
                build_cloud_note(platform_account, f"用户ID: {user_id}" if user_id else ""),
                timestamp,
                timestamp,
            )
        )

    if prepared_rows:
        conn.executemany(
            """
            INSERT INTO cloud_logins (
                tenant_name, tenant_code, platform_account, jump_username, jump_password, is_pinned, notes, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            prepared_rows,
        )
    return len(prepared_rows)


def device_row_to_dict(row: sqlite3.Row, include_secrets: bool = False) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "url": row["url"],
        "username": row["username"],
        "password": decrypt_secret(row["password"]) if include_secrets else "",
        "category": row["category"],
        "isPinned": bool(row["is_pinned"]),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def cloud_row_to_dict(row: sqlite3.Row, include_secrets: bool = False) -> dict:
    return {
        "id": row["id"],
        "tenantName": row["tenant_name"],
        "tenantCode": row["tenant_code"],
        "platformAccount": row["platform_account"],
        "jumpUsername": row["jump_username"],
        "jumpPassword": decrypt_secret(row["jump_password"]) if include_secrets else "",
        "isPinned": bool(row["is_pinned"]),
        "notes": row["notes"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def device_export_to_dict(row: sqlite3.Row) -> dict:
    data = device_row_to_dict(row, include_secrets=False)
    data["passwordCiphertext"] = row["password"] or ""
    return data


def cloud_export_to_dict(row: sqlite3.Row) -> dict:
    data = cloud_row_to_dict(row, include_secrets=False)
    data["jumpPasswordCiphertext"] = row["jump_password"] or ""
    return data


def list_devices(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        """
        SELECT id, name, url, username, password, category, is_pinned, created_at, updated_at
        FROM devices
        ORDER BY is_pinned DESC, category ASC, id ASC
        """
    ).fetchall()
    return [device_row_to_dict(row, include_secrets=False) for row in rows]


def list_cloud_logins(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        """
        SELECT id, tenant_name, tenant_code, platform_account, jump_username, jump_password, is_pinned, notes, created_at, updated_at
        FROM cloud_logins
        ORDER BY is_pinned DESC, tenant_name COLLATE NOCASE ASC, tenant_code COLLATE NOCASE ASC, id ASC
        """
    ).fetchall()
    return [cloud_row_to_dict(row, include_secrets=False) for row in rows]


def export_devices(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        """
        SELECT id, name, url, username, password, category, is_pinned, created_at, updated_at
        FROM devices
        ORDER BY is_pinned DESC, category ASC, id ASC
        """
    ).fetchall()
    return [device_export_to_dict(row) for row in rows]


def export_cloud_logins(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        """
        SELECT id, tenant_name, tenant_code, platform_account, jump_username, jump_password, is_pinned, notes, created_at, updated_at
        FROM cloud_logins
        ORDER BY is_pinned DESC, tenant_name COLLATE NOCASE ASC, tenant_code COLLATE NOCASE ASC, id ASC
        """
    ).fetchall()
    return [cloud_export_to_dict(row) for row in rows]


def get_device_row(conn: sqlite3.Connection, device_id: int) -> sqlite3.Row | None:
    return conn.execute("SELECT * FROM devices WHERE id = ?", (device_id,)).fetchone()


def get_cloud_row(conn: sqlite3.Connection, cloud_id: int) -> sqlite3.Row | None:
    return conn.execute("SELECT * FROM cloud_logins WHERE id = ?", (cloud_id,)).fetchone()


def read_setting(conn: sqlite3.Connection, key: str, default: str = "") -> str:
    row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else default


def ensure_column(conn: sqlite3.Connection, table_name: str, column_name: str, column_ddl: str) -> None:
    columns = {row["name"] for row in conn.execute(f"PRAGMA table_info({table_name})").fetchall()}
    if column_name not in columns:
        conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_ddl}")


def ensure_cloud_login_schema(conn: sqlite3.Connection) -> None:
    ensure_column(conn, "cloud_logins", "tenant_code", "tenant_code TEXT DEFAULT ''")
    ensure_column(conn, "cloud_logins", "is_pinned", "is_pinned INTEGER NOT NULL DEFAULT 0")


def parse_id_from_path(path: str, prefix: str) -> int:
    raw = unquote(path[len(prefix) :]).strip("/")
    if "/" in raw:
        raise ValueError("标识不合法")
    try:
        return int(raw)
    except ValueError as exc:
        raise ValueError("标识不合法") from exc


def parse_nested_id_from_path(path: str, prefix: str) -> int:
    raw = unquote(path[len(prefix) :]).strip("/")
    head = raw.split("/", 1)[0]
    try:
        return int(head)
    except ValueError as exc:
        raise ValueError("标识不合法") from exc


def normalize_secret_payload(payload: dict, plain_key: str, cipher_key: str, default_plain: str = "") -> str:
    ciphertext = str(payload.get(cipher_key, "")).strip()
    if ciphertext:
        if not is_secret_encrypted(ciphertext):
            raise ValueError(f"{cipher_key} 格式不合法")
        return ciphertext
    plaintext = str(payload.get(plain_key, "")).strip()
    if not plaintext:
        plaintext = default_plain
    return encrypt_secret(plaintext)


def normalize_device_payload(payload: dict) -> dict:
    name = str(payload.get("name", "")).strip()
    url = str(payload.get("url", "")).strip()
    category = str(payload.get("category", "")).strip() or "Toolbox"
    if not name or not url:
        raise ValueError("设备名称和地址不能为空")
    return {
        "id": payload.get("id"),
        "name": name,
        "url": url,
        "username": str(payload.get("username", "")).strip(),
        "password": normalize_secret_payload(payload, "password", "passwordCiphertext"),
        "category": category,
        "isPinned": bool(payload.get("isPinned", False)),
    }


def normalize_cloud_payload(payload: dict) -> dict:
    tenant_name = str(payload.get("tenantName", "")).strip()
    tenant_code = str(payload.get("tenantCode", "")).strip()
    platform_account = str(payload.get("platformAccount", "")).strip()
    if not tenant_name and not tenant_code:
        raise ValueError("租户名称和租户ID不能同时为空")
    return {
        "id": payload.get("id"),
        "tenantName": tenant_name or tenant_code,
        "tenantCode": tenant_code,
        "platformAccount": platform_account,
        "jumpUsername": platform_account,
        "jumpPassword": normalize_secret_payload(
            payload,
            "jumpPassword",
            "jumpPasswordCiphertext",
            DEFAULT_CLOUD_JUMP_PASSWORD,
        ),
        "isPinned": bool(payload.get("isPinned", False)),
        "notes": build_cloud_note(platform_account, str(payload.get("notes", "")).strip()),
    }


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def log_message(self, format: str, *args) -> None:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {self.address_string()} {format % args}")

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.send_response(HTTPStatus.FOUND)
            self.send_header("Location", "/drives")
            self.end_headers()
            return

        if parsed.path.startswith("/api/"):
            self.handle_api_get()
            return

        if parsed.path in {"/drives", "/cloud"}:
            self.path = "/index.html"

        super().do_GET()

    def do_POST(self) -> None:
        if not self.path.startswith("/api/"):
            self.send_json({"error": "未找到接口"}, status=404)
            return
        self.handle_api_post()

    def do_PUT(self) -> None:
        if not self.path.startswith("/api/"):
            self.send_json({"error": "未找到接口"}, status=404)
            return
        self.handle_api_put()

    def do_DELETE(self) -> None:
        if not self.path.startswith("/api/"):
            self.send_json({"error": "未找到接口"}, status=404)
            return
        self.handle_api_delete()

    def translate_path(self, path: str) -> str:
        clean_path = urlparse(path).path
        if clean_path in {"/drives", "/cloud"}:
            return str(STATIC_DIR / "index.html")

        target = (STATIC_DIR / clean_path.lstrip("/")).resolve()
        if not str(target).startswith(str(STATIC_DIR)):
            return str(STATIC_DIR / "index.html")
        if target.is_dir():
            target = target / "index.html"
        if not target.exists() and "." not in Path(clean_path).name:
            return str(STATIC_DIR / "index.html")
        return str(target)

    def parse_json_body(self) -> dict:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length) if content_length else b"{}"
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def send_json(self, payload: dict | list, status: int = 200, headers: dict | None = None) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        if headers:
            for key, value in headers.items():
                self.send_header(key, value)
        self.end_headers()
        self.wfile.write(data)

    def send_empty(self, status: int = 204) -> None:
        self.send_response(status)
        self.end_headers()

    def send_api_error(self, message: str, status: int = 400) -> None:
        self.send_json({"error": message}, status=status)

    def handle_api_get(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/healthz":
            self.send_json({"status": "ok", "time": now_iso()})
            return

        with get_connection() as conn:
            if parsed.path == "/api/bootstrap":
                self.send_json(
                    {
                        "devices": list_devices(conn),
                        "cloudLogins": list_cloud_logins(conn),
                        "settings": {
                            "cloudLoginUrl": read_setting(conn, "cloud_login_url", DEFAULT_CLOUD_LOGIN_URL)
                        },
                    }
                )
                return

            if parsed.path.startswith("/api/devices/") and parsed.path.endswith("/secret"):
                device_id = parse_nested_id_from_path(parsed.path, "/api/devices/")
                row = get_device_row(conn, device_id)
                if not row:
                    self.send_api_error("设备不存在", status=404)
                    return
                self.send_json(device_row_to_dict(row, include_secrets=True))
                return

            if parsed.path.startswith("/api/cloud-logins/") and parsed.path.endswith("/secret"):
                cloud_id = parse_nested_id_from_path(parsed.path, "/api/cloud-logins/")
                row = get_cloud_row(conn, cloud_id)
                if not row:
                    self.send_api_error("租户记录不存在", status=404)
                    return
                self.send_json(cloud_row_to_dict(row, include_secrets=True))
                return

            if parsed.path == "/api/export":
                self.send_json(
                    {
                        "exportedAt": now_iso(),
                        "devices": export_devices(conn),
                        "cloudLogins": export_cloud_logins(conn),
                        "settings": {
                            "cloudLoginUrl": read_setting(conn, "cloud_login_url", DEFAULT_CLOUD_LOGIN_URL),
                            "secretFormat": SECRET_PREFIX,
                        },
                    }
                )
                return

        self.send_api_error("未找到接口", status=404)

    def handle_api_post(self) -> None:
        parsed = urlparse(self.path)
        body = self.parse_json_body()
        with get_connection() as conn:
            if parsed.path.startswith("/api/devices/") and parsed.path.endswith("/pin"):
                device_id = parse_nested_id_from_path(parsed.path, "/api/devices/")
                cursor = conn.execute(
                    """
                    UPDATE devices
                    SET is_pinned = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (1 if bool(body.get("isPinned")) else 0, now_iso(), device_id),
                )
                if cursor.rowcount == 0:
                    self.send_api_error("设备不存在", status=404)
                    return
                row = conn.execute("SELECT * FROM devices WHERE id = ?", (device_id,)).fetchone()
                self.send_json(device_row_to_dict(row))
                return

            if parsed.path.startswith("/api/cloud-logins/") and parsed.path.endswith("/pin"):
                cloud_id = parse_nested_id_from_path(parsed.path, "/api/cloud-logins/")
                cursor = conn.execute(
                    """
                    UPDATE cloud_logins
                    SET is_pinned = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (1 if bool(body.get("isPinned")) else 0, now_iso(), cloud_id),
                )
                if cursor.rowcount == 0:
                    self.send_api_error("租户记录不存在", status=404)
                    return
                row = conn.execute("SELECT * FROM cloud_logins WHERE id = ?", (cloud_id,)).fetchone()
                self.send_json(cloud_row_to_dict(row))
                return

            if parsed.path == "/api/devices":
                item = normalize_device_payload(body)
                timestamp = now_iso()
                cursor = conn.execute(
                    """
                    INSERT INTO devices (name, url, username, password, category, is_pinned, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        item["name"],
                        item["url"],
                        item["username"],
                        item["password"],
                        item["category"],
                        1 if item["isPinned"] else 0,
                        timestamp,
                        timestamp,
                    ),
                )
                row = conn.execute("SELECT * FROM devices WHERE id = ?", (cursor.lastrowid,)).fetchone()
                self.send_json(device_row_to_dict(row), status=201)
                return

            if parsed.path == "/api/cloud-logins":
                item = normalize_cloud_payload(body)
                timestamp = now_iso()
                cursor = conn.execute(
                    """
                    INSERT INTO cloud_logins (
                        tenant_name, tenant_code, platform_account, jump_username, jump_password, is_pinned, notes, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        item["tenantName"],
                        item["tenantCode"],
                        item["platformAccount"],
                        item["jumpUsername"],
                        item["jumpPassword"],
                        1 if item["isPinned"] else 0,
                        item["notes"],
                        timestamp,
                        timestamp,
                    ),
                )
                row = conn.execute("SELECT * FROM cloud_logins WHERE id = ?", (cursor.lastrowid,)).fetchone()
                self.send_json(cloud_row_to_dict(row), status=201)
                return

            if parsed.path == "/api/import":
                self.import_payload(conn, body)
                self.send_json(
                    {
                        "devices": list_devices(conn),
                        "cloudLogins": list_cloud_logins(conn),
                        "settings": {
                            "cloudLoginUrl": read_setting(conn, "cloud_login_url", DEFAULT_CLOUD_LOGIN_URL)
                        },
                    }
                )
                return

            if parsed.path == "/api/settings/cloud-login-url":
                value = str(body.get("value", "")).strip() or DEFAULT_CLOUD_LOGIN_URL
                conn.execute(
                    """
                    INSERT INTO settings (key, value, updated_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
                    """,
                    ("cloud_login_url", value, now_iso()),
                )
                self.send_json({"cloudLoginUrl": value})
                return

        self.send_api_error("未找到接口", status=404)

    def handle_api_put(self) -> None:
        parsed = urlparse(self.path)
        body = self.parse_json_body()
        with get_connection() as conn:
            if parsed.path.startswith("/api/devices/"):
                device_id = parse_id_from_path(parsed.path, "/api/devices/")
                item = normalize_device_payload(body)
                cursor = conn.execute(
                    """
                    UPDATE devices
                    SET name = ?, url = ?, username = ?, password = ?, category = ?, is_pinned = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (
                        item["name"],
                        item["url"],
                        item["username"],
                        item["password"],
                        item["category"],
                        1 if item["isPinned"] else 0,
                        now_iso(),
                        device_id,
                    ),
                )
                if cursor.rowcount == 0:
                    self.send_api_error("设备不存在", status=404)
                    return
                row = conn.execute("SELECT * FROM devices WHERE id = ?", (device_id,)).fetchone()
                self.send_json(device_row_to_dict(row))
                return

            if parsed.path.startswith("/api/cloud-logins/"):
                cloud_id = parse_id_from_path(parsed.path, "/api/cloud-logins/")
                item = normalize_cloud_payload(body)
                cursor = conn.execute(
                    """
                    UPDATE cloud_logins
                    SET tenant_name = ?, tenant_code = ?, platform_account = ?, jump_username = ?, jump_password = ?, is_pinned = ?, notes = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (
                        item["tenantName"],
                        item["tenantCode"],
                        item["platformAccount"],
                        item["jumpUsername"],
                        item["jumpPassword"],
                        1 if item["isPinned"] else 0,
                        item["notes"],
                        now_iso(),
                        cloud_id,
                    ),
                )
                if cursor.rowcount == 0:
                    self.send_api_error("租户记录不存在", status=404)
                    return
                row = conn.execute("SELECT * FROM cloud_logins WHERE id = ?", (cloud_id,)).fetchone()
                self.send_json(cloud_row_to_dict(row))
                return

        self.send_api_error("未找到接口", status=404)

    def handle_api_delete(self) -> None:
        parsed = urlparse(self.path)
        with get_connection() as conn:
            if parsed.path.startswith("/api/devices/"):
                device_id = parse_id_from_path(parsed.path, "/api/devices/")
                conn.execute("DELETE FROM devices WHERE id = ?", (device_id,))
                self.send_empty()
                return

            if parsed.path.startswith("/api/cloud-logins/"):
                cloud_id = parse_id_from_path(parsed.path, "/api/cloud-logins/")
                conn.execute("DELETE FROM cloud_logins WHERE id = ?", (cloud_id,))
                self.send_empty()
                return

        self.send_api_error("未找到接口", status=404)

    def import_payload(self, conn: sqlite3.Connection, payload: dict) -> None:
        devices = payload.get("devices")
        cloud_logins = payload.get("cloudLogins")
        settings = payload.get("settings", {})

        if devices is not None:
            timestamp = now_iso()
            normalized_devices = [normalize_device_payload(item) for item in devices]
            conn.execute("DELETE FROM devices")
            conn.executemany(
                """
                INSERT INTO devices (id, name, url, username, password, category, is_pinned, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        int(item.get("id") or 0) or None,
                        item["name"],
                        item["url"],
                        item["username"],
                        item["password"],
                        item["category"],
                        1 if item["isPinned"] else 0,
                        timestamp,
                        timestamp,
                    )
                    for item in normalized_devices
                ],
            )

        if cloud_logins is not None:
            timestamp = now_iso()
            normalized_cloud = [normalize_cloud_payload(item) for item in cloud_logins]
            conn.execute("DELETE FROM cloud_logins")
            conn.executemany(
                """
                INSERT INTO cloud_logins (
                    id, tenant_name, tenant_code, platform_account, jump_username, jump_password, is_pinned, notes, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        int(item.get("id") or 0) or None,
                        item["tenantName"],
                        item["tenantCode"],
                        item["platformAccount"],
                        item["jumpUsername"],
                        item["jumpPassword"],
                        1 if item["isPinned"] else 0,
                        item["notes"],
                        timestamp,
                        timestamp,
                    )
                    for item in normalized_cloud
                ],
            )

        if "cloudLoginUrl" in settings:
            value = str(settings.get("cloudLoginUrl", "")).strip() or DEFAULT_CLOUD_LOGIN_URL
            conn.execute(
                """
                INSERT INTO settings (key, value, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
                """,
                ("cloud_login_url", value, now_iso()),
            )


class SafeHandler(AppHandler):
    def handle_one_request(self) -> None:
        try:
            super().handle_one_request()
        except ValueError as exc:
            self.send_json({"error": str(exc)}, status=400)
        except json.JSONDecodeError:
            self.send_json({"error": "JSON 解析失败"}, status=400)
        except Exception as exc:
            self.send_json({"error": f"服务端内部错误: {exc}"}, status=500)


def main() -> None:
    initialize_database()
    host = os.environ.get("APP_HOST", "0.0.0.0")
    port = int(os.environ.get("APP_PORT", "8080"))
    server = ThreadingHTTPServer((host, port), SafeHandler)
    print(f"服务已启动: http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
