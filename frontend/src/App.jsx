import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Cloud,
  Copy,
  Download,
  Globe,
  KeyRound,
  LayoutGrid,
  List,
  Moon,
  Pencil,
  Pin,
  Plus,
  RefreshCcw,
  Search,
  Server,
  Shield,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";

const CLOUD_URL_FALLBACK =
  "https://auth.ylaky.com/mounisso/login.action/authenticate?service=https:%2F%2Fauth.ylaky.com%2Fmounisso%2Fv1%2Fcas%2Flogin%3Fservice%3Dhttps%253A%252F%252Foc.ylaky.com%253A31943%252Fmounisess%252Fv1%252Fauth%253Fservice%253Dhttps%25253A%25252F%25252Foc.ylaky.com%25253A31943%25252Fmomaintenancewebsite%25252Funiportal%25252F%26locale%3Dzh-cn%26uni_locale%3Dzh-cn";

const TAB_ROUTE_MAP = {
  devices: "/drives",
  cloud: "/cloud",
};

const DEVICE_FORM_DEFAULT = {
  name: "",
  url: "",
  username: "",
  password: "",
  category: "Sangfor",
  isPinned: false,
};

const CLOUD_FORM_DEFAULT = {
  tenantName: "",
  tenantCode: "",
  platformAccount: "",
  jumpPassword: "",
  isPinned: false,
  notes: "",
};

const PLUGIN_GUIDE_URL = "/plugin-guide.html";
const PLUGIN_MANIFEST_URL = "/Yulin_Ops_AutoFill/manifest.json";
const PLUGIN_SCRIPT_URL = "/Yulin_Ops_AutoFill/content.js";
const AUTOFILL_CONTEXT_MESSAGE_TYPE = "YL_OPS_AUTOFILL_CONTEXT";
const AUTOFILL_CONTEXT_ACK_TYPE = "YL_OPS_AUTOFILL_CONTEXT_STORED";

const THEME_STORAGE_KEY = "panel_theme";

const SURFACE_CLASS =
  "rounded-[28px] border border-slate-200 bg-white shadow-sm transition-[background-color,border-color,box-shadow,color] duration-300 ease-out dark:border-white/5 dark:bg-neutral-900 dark:shadow-[0_18px_60px_rgba(0,0,0,0.35)]";
const PANEL_CLASS =
  "border border-slate-200 bg-white shadow-sm transition-[background-color,border-color,box-shadow,color] duration-300 ease-out dark:border-white/5 dark:bg-black/15 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]";
const FIELD_CLASS =
  "h-11 rounded-2xl border-slate-200 bg-slate-100 text-slate-700 placeholder:text-slate-400 transition-[background-color,border-color,color,box-shadow] duration-300 ease-out focus-visible:border-indigo-400/60 focus-visible:ring-indigo-400/20 dark:border-white/7 dark:bg-neutral-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-violet-400/50 dark:focus-visible:ring-violet-400/20";
const ACTION_BUTTON_CLASS =
  "h-11 rounded-2xl border-slate-200 bg-white text-slate-600 shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out hover:bg-slate-100 hover:text-slate-800 dark:border-white/7 dark:bg-white/[0.03] dark:text-zinc-300 dark:shadow-none dark:hover:bg-white/[0.06] dark:hover:text-white";
const PRIMARY_BUTTON_CLASS =
  "h-11 rounded-2xl border-0 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 text-white shadow-[0_12px_32px_rgba(99,102,241,0.35)] transition-[background-image,box-shadow,transform,filter] duration-300 ease-out hover:from-violet-400 hover:via-indigo-400 hover:to-cyan-300";
const CARD_CLASS =
  "overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-[background-color,border-color,box-shadow,color] duration-300 ease-out dark:border-white/5 dark:bg-neutral-900 dark:text-zinc-100 dark:shadow-[0_18px_40px_rgba(0,0,0,0.22)]";

function getTabFromPathname(pathname) {
  if (pathname === "/cloud") return "cloud";
  return "devices";
}

function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return "dark";
}

function App() {
  const [tab, setTab] = useState(() => getTabFromPathname(window.location.pathname));
  const [theme, setTheme] = useState(getInitialTheme);
  const [deviceView, setDeviceView] = useState(localStorage.getItem("panel_device_view") || "table");
  const [pageSize, setPageSize] = useState(Number(localStorage.getItem("panel_page_size") || 20));
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceCategory, setDeviceCategory] = useState("all");
  const [cloudSearch, setCloudSearch] = useState("");
  const [devicePage, setDevicePage] = useState(1);
  const [cloudPage, setCloudPage] = useState(1);
  const [boot, setBoot] = useState({
    devices: [],
    cloudLogins: [],
    settings: { cloudLoginUrl: "" },
  });
  const [deviceStatus, setDeviceStatus] = useState({});
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState("device");
  const [dialogMode, setDialogMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [deviceForm, setDeviceForm] = useState(DEVICE_FORM_DEFAULT);
  const [cloudForm, setCloudForm] = useState(CLOUD_FORM_DEFAULT);
  const [cloudLoginUrlInput, setCloudLoginUrlInput] = useState(CLOUD_URL_FALLBACK);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("panel_device_view", deviceView);
  }, [deviceView]);

  useEffect(() => {
    localStorage.setItem("panel_page_size", String(pageSize));
  }, [pageSize]);

  useEffect(() => {
    const handlePopState = () => {
      setTab(getTabFromPathname(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const targetPath = TAB_ROUTE_MAP[tab] || TAB_ROUTE_MAP.devices;
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, "", targetPath);
    }
  }, [tab]);

  useEffect(() => {
    setCloudLoginUrlInput(boot.settings.cloudLoginUrl || CLOUD_URL_FALLBACK);
  }, [boot.settings.cloudLoginUrl]);

  async function api(path, options = {}) {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "请求失败");
    }
    return data;
  }

  async function loadData(showMessage = false) {
    try {
      setLoading(true);
      const data = await api("/api/bootstrap");
      setBoot(data);
      setDeviceStatus({});
      if (showMessage) showToast("数据已刷新");
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  }

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(""), 2400);
  }

  const filteredDevices = useMemo(() => {
    return boot.devices.filter((item) => {
      const status = deviceStatus[item.id] || "idle";
      const keyword = deviceSearch.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        [item.name, item.url, item.username, item.category, status]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      const matchesCategory = deviceCategory === "all" || item.category === deviceCategory;
      return matchesKeyword && matchesCategory;
    });
  }, [boot.devices, deviceCategory, deviceSearch, deviceStatus]);

  const pinnedDevices = useMemo(
    () => filteredDevices.filter((item) => item.isPinned),
    [filteredDevices]
  );
  const normalDevices = useMemo(
    () => filteredDevices.filter((item) => !item.isPinned),
    [filteredDevices]
  );

  const devicePageCount = Math.max(1, Math.ceil(normalDevices.length / pageSize));
  const pagedDevices = normalDevices.slice((devicePage - 1) * pageSize, devicePage * pageSize);

  const filteredCloudLogins = useMemo(() => {
    return boot.cloudLogins.filter((item) => {
      const keyword = cloudSearch.trim().toLowerCase();
      return (
        !keyword ||
        [item.tenantName, item.tenantCode, item.platformAccount, item.notes]
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [boot.cloudLogins, cloudSearch]);

  const pinnedCloudLogins = useMemo(
    () => filteredCloudLogins.filter((item) => item.isPinned),
    [filteredCloudLogins]
  );
  const normalCloudLogins = useMemo(
    () => filteredCloudLogins.filter((item) => !item.isPinned),
    [filteredCloudLogins]
  );

  const cloudPageCount = Math.max(1, Math.ceil(normalCloudLogins.length / pageSize));
  const pagedCloudLogins = normalCloudLogins.slice((cloudPage - 1) * pageSize, cloudPage * pageSize);

  useEffect(() => {
    setDevicePage((prev) => Math.min(prev, devicePageCount));
  }, [devicePageCount]);

  useEffect(() => {
    setCloudPage((prev) => Math.min(prev, cloudPageCount));
  }, [cloudPageCount]);

  async function copyText(text) {
    if (!text) {
      showToast("没有可复制的内容");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("已复制到剪贴板");
    } catch {
      const input = document.createElement("textarea");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      showToast("已复制到剪贴板");
    }
  }

  async function testDevice(device) {
    setDeviceStatus((prev) => ({ ...prev, [device.id]: "testing" }));
    let probeUrl = device.url;
    try {
      const url = new URL(device.url);
      if (url.protocol === "https:" && !url.port) {
        url.port = "443";
        probeUrl = url.toString();
      }
    } catch {
      probeUrl = device.url;
    }

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 2000);
      await fetch(probeUrl, { mode: "no-cors", cache: "no-cache", signal: controller.signal });
      window.clearTimeout(timeoutId);
      setDeviceStatus((prev) => ({ ...prev, [device.id]: "online" }));
    } catch (error) {
      setDeviceStatus((prev) => ({
        ...prev,
        [device.id]: error.name === "AbortError" ? "offline" : "online",
      }));
    }
  }

  async function batchTestCurrentPage() {
    const targets = [...(devicePage === 1 ? pinnedDevices : []), ...pagedDevices];
    if (!targets.length) {
      showToast("当前页没有可检测的设备");
      return;
    }
    showToast(`已发起 ${targets.length} 个设备检测`);
    await Promise.allSettled(targets.map((device) => testDevice(device)));
  }

  function navigateToTab(nextTab) {
    const targetPath = TAB_ROUTE_MAP[nextTab] || TAB_ROUTE_MAP.devices;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
    setTab(nextTab);
  }

  async function fetchDeviceSecret(deviceId) {
    return api(`/api/devices/${deviceId}/secret`);
  }

  async function fetchCloudSecret(cloudId) {
    return api(`/api/cloud-logins/${cloudId}/secret`);
  }

  async function sendAutofillContext(payload) {
    return new Promise((resolve, reject) => {
      const requestId = `autofill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const timer = window.setTimeout(() => {
        window.removeEventListener("message", handleAck);
        reject(new Error("扩展未响应，请确认自动填充插件已重新加载"));
      }, 1800);

      function handleAck(event) {
        const data = event.data;
        if (event.source !== window || !data || data.type !== AUTOFILL_CONTEXT_ACK_TYPE || data.requestId !== requestId) {
          return;
        }
        window.clearTimeout(timer);
        window.removeEventListener("message", handleAck);
        if (data.error) {
          reject(new Error(data.error));
          return;
        }
        resolve();
      }

      window.addEventListener("message", handleAck);
      window.postMessage(
        {
          source: "firewall-login-manager",
          type: AUTOFILL_CONTEXT_MESSAGE_TYPE,
          requestId,
          payload,
        },
        "*"
      );
    });
  }

  async function openDevice(device) {
    try {
      const secret = await fetchDeviceSecret(device.id);
      await sendAutofillContext({
        kind: "device",
        targetUrl: device.url,
        username: secret.username || "",
        password: secret.password || "",
        sourceLabel: device.name || "设备登录",
      });
    } catch (error) {
      showToast(`${error.message}，已直接打开页面`);
    }
    window.open(device.url, "_blank", "noopener,noreferrer");
  }

  async function openCloud(item) {
    try {
      const secret = await fetchCloudSecret(item.id);
      await sendAutofillContext({
        kind: "cloud",
        targetUrl: cloudLoginUrl,
        tenantName: secret.tenantName || item.tenantName || "",
        tenantCode: secret.tenantCode || item.tenantCode || "",
        platformAccount: secret.platformAccount || item.platformAccount || "",
        jumpUsername: secret.platformAccount || item.platformAccount || "",
        jumpPassword: secret.jumpPassword || "",
        sourceLabel: secret.tenantName || secret.tenantCode || item.platformAccount || "云平台",
      });
    } catch (error) {
      showToast(`${error.message}，已直接打开页面`);
    }
    window.open(cloudLoginUrl, "_blank", "noopener,noreferrer");
  }

  async function openCloudWithoutAutofill() {
    try {
      await sendAutofillContext({ kind: "reset" });
    } catch {
      // 插件未安装时仍允许直接打开平台，但不会自动填充。
    }
    window.open(cloudLoginUrl, "_blank", "noopener,noreferrer");
  }

  function openCreateDialog(type) {
    setDialogType(type);
    setDialogMode("create");
    setEditingId(null);
    setDeviceForm(DEVICE_FORM_DEFAULT);
    setCloudForm(CLOUD_FORM_DEFAULT);
    setDialogOpen(true);
  }

  async function openEditDevice(device) {
    try {
      const secret = await fetchDeviceSecret(device.id);
      setDialogType("device");
      setDialogMode("edit");
      setEditingId(device.id);
      setDeviceForm({
        name: device.name,
        url: device.url,
        username: secret.username || device.username || "",
        password: secret.password || "",
        category: device.category,
        isPinned: Boolean(device.isPinned),
      });
      setDialogOpen(true);
    } catch (error) {
      showToast(error.message);
    }
  }

  async function openEditCloud(item) {
    try {
      const secret = await fetchCloudSecret(item.id);
      setDialogType("cloud");
      setDialogMode("edit");
      setEditingId(item.id);
      setCloudForm({
        tenantName: item.tenantName || "",
        tenantCode: item.tenantCode || "",
        platformAccount: secret.platformAccount || item.platformAccount || "",
        jumpPassword: secret.jumpPassword || "",
        isPinned: Boolean(item.isPinned),
        notes: item.notes || "",
      });
      setDialogOpen(true);
    } catch (error) {
      showToast(error.message);
    }
  }

  async function submitDeviceForm(event) {
    event.preventDefault();
    const path = dialogMode === "create" ? "/api/devices" : `/api/devices/${editingId}`;
    const method = dialogMode === "create" ? "POST" : "PUT";
    try {
      await api(path, { method, body: JSON.stringify(deviceForm) });
      setDialogOpen(false);
      await loadData();
      showToast(dialogMode === "create" ? "设备记录已新增" : "设备记录已更新");
    } catch (error) {
      showToast(error.message);
    }
  }

  async function submitCloudForm(event) {
    event.preventDefault();
    const path = dialogMode === "create" ? "/api/cloud-logins" : `/api/cloud-logins/${editingId}`;
    const method = dialogMode === "create" ? "POST" : "PUT";
    try {
      await api(path, { method, body: JSON.stringify(cloudForm) });
      setDialogOpen(false);
      await loadData();
      showToast(dialogMode === "create" ? "租户记录已新增" : "租户记录已更新");
    } catch (error) {
      showToast(error.message);
    }
  }

  async function togglePin(device) {
    try {
      await api(`/api/devices/${device.id}/pin`, {
        method: "POST",
        body: JSON.stringify({ isPinned: !device.isPinned }),
      });
      await loadData();
      showToast(device.isPinned ? "已取消置顶" : "已置顶设备");
    } catch (error) {
      showToast(error.message);
    }
  }

  async function deleteDevice(device) {
    if (!window.confirm(`确定删除设备“${device.name}”吗？`)) return;
    try {
      await api(`/api/devices/${device.id}`, { method: "DELETE" });
      await loadData();
      showToast("设备记录已删除");
    } catch (error) {
      showToast(error.message);
    }
  }

  async function deleteCloud(item) {
    const label = item.tenantName || item.tenantCode || item.platformAccount || "当前租户";
    if (!window.confirm(`确定删除租户“${label}”吗？`)) return;
    try {
      await api(`/api/cloud-logins/${item.id}`, { method: "DELETE" });
      await loadData();
      showToast("租户记录已删除");
    } catch (error) {
      showToast(error.message);
    }
  }

  async function toggleCloudPin(item) {
    try {
      await api(`/api/cloud-logins/${item.id}/pin`, {
        method: "POST",
        body: JSON.stringify({ isPinned: !item.isPinned }),
      });
      await loadData();
      showToast(item.isPinned ? "已取消置顶租户" : "已置顶租户");
    } catch (error) {
      showToast(error.message);
    }
  }

  async function saveCloudLoginUrl() {
    try {
      const result = await api("/api/settings/cloud-login-url", {
        method: "POST",
        body: JSON.stringify({ value: cloudLoginUrlInput }),
      });
      setBoot((prev) => ({
        ...prev,
        settings: { ...prev.settings, cloudLoginUrl: result.cloudLoginUrl },
      }));
      showToast("统一登录链接已保存");
    } catch (error) {
      showToast(error.message);
    }
  }

  async function exportData() {
    try {
      const data = await api("/api/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `firewall-login-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showToast("备份已导出");
    } catch (error) {
      showToast(error.message);
    }
  }

  async function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!window.confirm("导入会覆盖当前数据库中的设备和租户数据，是否继续？")) {
        event.target.value = "";
        return;
      }
      await api("/api/import", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await loadData();
      showToast("备份已导入");
    } catch (error) {
      showToast(`导入失败：${error.message}`);
    } finally {
      event.target.value = "";
    }
  }

  function handleThemeToggle(event) {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const applyTheme = () => setTheme(nextTheme);
    const supportsTransition =
      typeof document !== "undefined" &&
      typeof document.startViewTransition === "function" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!supportsTransition) {
      applyTheme();
      return;
    }

    const buttonRect = event?.currentTarget?.getBoundingClientRect?.();
    if (!buttonRect) {
      applyTheme();
      return;
    }

    const originX = buttonRect.left + buttonRect.width / 2;
    const originY = buttonRect.top + buttonRect.height / 2;
    const revealRadius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY)
    );
    const root = document.documentElement;

    root.style.setProperty("--theme-toggle-x", `${originX}px`);
    root.style.setProperty("--theme-toggle-y", `${originY}px`);
    root.style.setProperty("--theme-toggle-radius", `${revealRadius}px`);
    root.classList.add("theme-transition-active");

    const transition = document.startViewTransition(() => {
      applyTheme();
    });

    transition.finished.finally(() => {
      root.classList.remove("theme-transition-active");
      root.style.removeProperty("--theme-toggle-x");
      root.style.removeProperty("--theme-toggle-y");
      root.style.removeProperty("--theme-toggle-radius");
    });
  }

  const cloudLoginUrl = boot.settings.cloudLoginUrl || CLOUD_URL_FALLBACK;
  const deviceOnlineCount = filteredDevices.filter((item) => deviceStatus[item.id] === "online").length;
  const currentRouteLabel = tab === "devices" ? "设备页" : "云平台页";

  return (
    <div data-panel-app="firewall-login-manager" className="min-h-screen bg-app text-slate-800 dark:text-zinc-100">
      <div className="mx-auto flex max-w-[1820px] flex-col gap-5 p-4 lg:flex-row lg:p-6">
        <aside
          className={`${SURFACE_CLASS} shrink-0 self-start overflow-hidden lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-60`}
        >
          <div className="flex min-h-[760px] flex-col px-4 py-5 lg:h-full lg:min-h-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm dark:bg-white/[0.08] dark:text-white dark:shadow-[0_0_24px_rgba(99,102,241,0.25)]">
                  <Layers3Icon />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-500">
                    Panel
                  </div>
                  <div className="mt-1 truncate text-2xl font-semibold text-slate-800 dark:text-white">
                    面板
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={theme === "dark" ? "切换到浅色主题" : "切换到暗色主题"}
                title={theme === "dark" ? "切换到浅色主题" : "切换到暗色主题"}
                className="h-10 w-10 rounded-2xl border-slate-200 bg-white text-slate-600 shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out hover:scale-[1.03] hover:bg-slate-100 hover:text-slate-800 dark:border-white/7 dark:bg-white/[0.03] dark:text-zinc-300 dark:shadow-none dark:hover:bg-white/[0.06] dark:hover:text-white"
                onClick={handleThemeToggle}
              >
                {theme === "dark" ? (
                  <Sun className="size-4 transition-transform duration-500 ease-out hover:rotate-90" />
                ) : (
                  <Moon className="size-4 transition-transform duration-500 ease-out hover:-rotate-12" />
                )}
              </Button>
            </div>

            <nav className="mt-8 space-y-3">
              <SidebarMenuItem
                active={tab === "devices"}
                icon={Server}
                title="设备页"
                onClick={() => navigateToTab("devices")}
              />
              <SidebarMenuItem
                active={tab === "cloud"}
                icon={Cloud}
                title="云平台页"
                onClick={() => navigateToTab("cloud")}
              />
            </nav>

            <div className={`mt-8 rounded-[24px] p-3 ${PANEL_CLASS}`}>
              <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-500">
                资源
              </div>
              <div className="mt-3 space-y-2">
                <SidebarResourceLink
                  href={PLUGIN_GUIDE_URL}
                  title="插件说明"
                  desc="查看安装步骤和云平台自动填充说明"
                />
                <SidebarResourceLink
                  href={PLUGIN_MANIFEST_URL}
                  title="插件清单"
                  desc="查看 Chrome 扩展 manifest"
                />
                <SidebarResourceLink
                  href={PLUGIN_SCRIPT_URL}
                  title="插件脚本"
                  desc="查看自动填充规则脚本"
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-5">
          <section className={`${SURFACE_CLASS} p-6 lg:p-7`}>
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-zinc-500">
                  {tab === "devices" ? "Device Center" : "Cloud Center"}
                </div>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-800 dark:text-white">
                  {currentRouteLabel}
                </h2>
              </div>

              <div className="flex flex-wrap gap-3 xl:justify-end">
                <Button variant="outline" className={ACTION_BUTTON_CLASS} onClick={() => loadData(true)}>
                  <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                  刷新
                </Button>
                <Button variant="outline" className={ACTION_BUTTON_CLASS} onClick={exportData}>
                  <Download className="size-4" />
                  导出
                </Button>
                <label className="inline-flex">
                  <input type="file" className="hidden" accept=".json" onChange={importData} />
                  <span className={`inline-flex cursor-pointer items-center gap-2 px-4 ${ACTION_BUTTON_CLASS}`}>
                    <Upload className="size-4" />
                    导入
                  </span>
                </label>
                <Button
                  className={PRIMARY_BUTTON_CLASS}
                  onClick={() => openCreateDialog(tab === "devices" ? "device" : "cloud")}
                >
                  <Plus className="size-4" />
                  {tab === "devices" ? "新增设备" : "新增租户"}
                </Button>
              </div>
            </div>

            {tab === "devices" ? (
              <div className="mt-7 grid gap-4 lg:grid-cols-3">
                <TopMetricCard title="设备总数" value={boot.devices.length} desc="当前数据库中的设备记录" />
                <TopMetricCard title="当前筛选" value={filteredDevices.length} desc="符合筛选条件的设备数量" />
                <TopMetricCard title="在线检测" value={deviceOnlineCount} desc="本轮连通性检测在线数量" accent />
              </div>
            ) : (
              <div className="mt-7 space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <TopMetricCard title="租户记录" value={boot.cloudLogins.length} desc="平台租户登录记录数量" />
                  <TopMetricCard title="统一入口" value={cloudLoginUrl ? "已配置" : "未配置"} desc="所有租户共享同一登录地址" />
                  <TopMetricCard title="当前页大小" value={pageSize} desc="列表每页展示条数" accent />
                </div>

                <div className={`rounded-[24px] p-4 lg:p-5 ${PANEL_CLASS}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-lg font-medium text-slate-800 dark:text-white">统一云平台入口</div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                        所有租户打开平台时都会使用这里保存的链接。
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" className={ACTION_BUTTON_CLASS} onClick={() => copyText(cloudLoginUrl)}>
                        <Copy className="size-4" />
                        复制链接
                      </Button>
                      <Button
                        variant="outline"
                        className={ACTION_BUTTON_CLASS}
                        onClick={openCloudWithoutAutofill}
                      >
                        <Globe className="size-4" />
                        打开平台
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <Input
                      value={cloudLoginUrlInput}
                      onChange={(event) => setCloudLoginUrlInput(event.target.value)}
                      className={FIELD_CLASS}
                      placeholder="输入统一登录链接"
                    />
                    <Button className={PRIMARY_BUTTON_CLASS} onClick={saveCloudLoginUrl}>
                      保存链接
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className={`${SURFACE_CLASS} overflow-hidden`}>
            <div className="border-b border-slate-200 px-6 py-6 dark:border-white/5 lg:px-7">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="text-2xl font-semibold text-slate-800 dark:text-white">
                    {tab === "devices" ? "设备列表" : "租户列表"}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400">
                    {tab === "devices"
                      ? `当前显示 ${filteredDevices.length} 条记录，其中置顶 ${pinnedDevices.length} 条。`
                      : `当前显示 ${filteredCloudLogins.length} 条租户记录。`}
                  </p>
                </div>
                <PageSizeSelect pageSize={pageSize} onChange={handlePageSizeChange} />
              </div>

              {tab === "devices" ? (
                <div className="mt-6 grid gap-3 xl:grid-cols-[180px_minmax(0,1fr)_auto_auto]">
                  <Select
                    value={deviceCategory}
                    onValueChange={(value) => {
                      setDeviceCategory(value);
                      setDevicePage(1);
                    }}
                  >
                    <SelectTrigger className={FIELD_CLASS}>
                      <SelectValue placeholder="设备分类" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 bg-white text-slate-800 dark:border-white/8 dark:bg-neutral-900 dark:text-zinc-100">
                      <SelectItem value="all">全部分类</SelectItem>
                      <SelectItem value="Sangfor">Sangfor</SelectItem>
                      <SelectItem value="Venustech">Venustech</SelectItem>
                      <SelectItem value="Toolbox">Toolbox</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <Input
                      className={`${FIELD_CLASS} pl-11`}
                      value={deviceSearch}
                      onChange={(event) => {
                        setDeviceSearch(event.target.value);
                        setDevicePage(1);
                      }}
                      placeholder="搜索设备名称、地址、账号或密码"
                    />
                  </div>

                  <Button variant="outline" className={ACTION_BUTTON_CLASS} onClick={batchTestCurrentPage}>
                    <RefreshCcw className="size-4" />
                    本页检测
                  </Button>

                  <ViewSwitch deviceView={deviceView} onChange={setDeviceView} />
                </div>
              ) : (
                <div className="mt-6 max-w-[620px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <Input
                      className={`${FIELD_CLASS} pl-11`}
                      value={cloudSearch}
                      onChange={(event) => {
                        setCloudSearch(event.target.value);
                        setCloudPage(1);
                      }}
                      placeholder="搜索租户名称、租户ID、平台账号或中文注释"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-6 lg:px-7">
              {tab === "devices" ? (
                deviceView === "grid" ? (
                  <div className="space-y-5">
                    {devicePage === 1 && pinnedDevices.length > 0 ? (
                      <section>
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-zinc-300">
                          <Pin className="size-4 text-amber-500 dark:text-amber-300" />
                          置顶设备
                        </div>
                        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                          {pinnedDevices.map((device) => (
                            <DeviceCard
                              key={device.id}
                              device={device}
                              pinned
                              status={deviceStatus[device.id] || "idle"}
                              onCopy={copyText}
                              onOpen={openDevice}
                              onEdit={openEditDevice}
                              onDelete={deleteDevice}
                              onPin={togglePin}
                              onTest={testDevice}
                            />
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {pagedDevices.length ? (
                      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                        {pagedDevices.map((device) => (
                          <DeviceCard
                            key={device.id}
                            device={device}
                            status={deviceStatus[device.id] || "idle"}
                            onCopy={copyText}
                            onOpen={openDevice}
                            onEdit={openEditDevice}
                            onDelete={deleteDevice}
                            onPin={togglePin}
                            onTest={testDevice}
                          />
                        ))}
                      </section>
                    ) : (
                      <EmptyState title="没有匹配的设备记录" desc="可以调整筛选条件，或者直接新增设备记录。" />
                    )}
                  </div>
                ) : (
                  <DeviceTable
                    devices={[...(devicePage === 1 ? pinnedDevices : []), ...pagedDevices]}
                    deviceStatus={deviceStatus}
                    onOpen={openDevice}
                    onTest={testDevice}
                    onEdit={openEditDevice}
                    onPin={togglePin}
                    onDelete={deleteDevice}
                  />
                )
              ) : pagedCloudLogins.length || (cloudPage === 1 && pinnedCloudLogins.length) ? (
                <div className="space-y-5">
                  {cloudPage === 1 && pinnedCloudLogins.length > 0 ? (
                    <section>
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-zinc-300">
                        <Pin className="size-4 text-amber-500 dark:text-amber-300" />
                        置顶租户
                      </div>
                      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                        {pinnedCloudLogins.map((item) => (
                          <CloudCard
                            key={item.id}
                            item={item}
                            pinned
                            cloudLoginUrl={cloudLoginUrl}
                            onCopy={copyText}
                            onOpen={openCloud}
                            onEdit={openEditCloud}
                            onDelete={deleteCloud}
                            onPin={toggleCloudPin}
                          />
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {pagedCloudLogins.length ? (
                    <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                      {pagedCloudLogins.map((item) => (
                        <CloudCard
                          key={item.id}
                          item={item}
                          cloudLoginUrl={cloudLoginUrl}
                          onCopy={copyText}
                          onOpen={openCloud}
                          onEdit={openEditCloud}
                          onDelete={deleteCloud}
                          onPin={toggleCloudPin}
                        />
                      ))}
                    </section>
                  ) : null}
                </div>
              ) : (
                <EmptyState title="没有匹配的租户记录" desc="可以直接新增云平台租户记录。" />
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-5 dark:border-white/5 lg:px-7">
              <Pagination
                currentPage={tab === "devices" ? devicePage : cloudPage}
                totalPages={tab === "devices" ? devicePageCount : cloudPageCount}
                onChange={tab === "devices" ? setDevicePage : setCloudPage}
              />
            </div>
          </section>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-[28px] border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-neutral-900 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">
              {dialogMode === "create" ? "新增" : "编辑"}
              {dialogType === "device" ? "设备记录" : "租户记录"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "device"
                ? "设备数据会直接写入数据库，用于统一维护登录地址和账号密码。"
                : "租户记录用于统一维护平台账号与跳板机密码。"}
            </DialogDescription>
          </DialogHeader>

          {dialogType === "device" ? (
            <form className="grid gap-4" onSubmit={submitDeviceForm}>
              <div className="grid gap-2">
                <Label htmlFor="device-name">设备名称</Label>
                <Input
                  id="device-name"
                  value={deviceForm.name}
                  onChange={(event) => setDeviceForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                  className={FIELD_CLASS}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>分类</Label>
                  <Select
                    value={deviceForm.category}
                    onValueChange={(value) => setDeviceForm((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className={FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 bg-white text-slate-800 dark:border-white/8 dark:bg-neutral-900 dark:text-zinc-100">
                      <SelectItem value="Sangfor">Sangfor</SelectItem>
                      <SelectItem value="Venustech">Venustech</SelectItem>
                      <SelectItem value="Toolbox">Toolbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-600 dark:border-white/7 dark:bg-white/[0.03] dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={deviceForm.isPinned}
                      onChange={(event) =>
                        setDeviceForm((prev) => ({ ...prev, isPinned: event.target.checked }))
                      }
                    />
                    置顶显示
                  </label>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="device-url">访问地址</Label>
                <Input
                  id="device-url"
                  type="url"
                  value={deviceForm.url}
                  onChange={(event) => setDeviceForm((prev) => ({ ...prev, url: event.target.value }))}
                  required
                  className={FIELD_CLASS}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="device-username">账号</Label>
                  <Input
                    id="device-username"
                    value={deviceForm.username}
                    onChange={(event) => setDeviceForm((prev) => ({ ...prev, username: event.target.value }))}
                    className={FIELD_CLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="device-password">密码</Label>
                  <Input
                    id="device-password"
                    value={deviceForm.password}
                    onChange={(event) => setDeviceForm((prev) => ({ ...prev, password: event.target.value }))}
                    className={FIELD_CLASS}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className={ACTION_BUTTON_CLASS} onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" className={PRIMARY_BUTTON_CLASS}>
                  {dialogMode === "create" ? "保存新增" : "保存修改"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form className="grid gap-4" onSubmit={submitCloudForm}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="tenant-name">租户名称</Label>
                  <Input
                    id="tenant-name"
                    value={cloudForm.tenantName}
                    onChange={(event) => setCloudForm((prev) => ({ ...prev, tenantName: event.target.value }))}
                    className={FIELD_CLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenant-code">租户ID</Label>
                  <Input
                    id="tenant-code"
                    value={cloudForm.tenantCode}
                    onChange={(event) => setCloudForm((prev) => ({ ...prev, tenantCode: event.target.value }))}
                    className={FIELD_CLASS}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="platform-account">平台账号</Label>
                  <Input
                    id="platform-account"
                    value={cloudForm.platformAccount}
                    onChange={(event) => setCloudForm((prev) => ({ ...prev, platformAccount: event.target.value }))}
                    className={FIELD_CLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="jump-password">统一密码</Label>
                  <Input
                    id="jump-password"
                    value={cloudForm.jumpPassword}
                    onChange={(event) => setCloudForm((prev) => ({ ...prev, jumpPassword: event.target.value }))}
                    className={FIELD_CLASS}
                  />
                </div>
              </div>
              <div className="flex items-end">
                <label className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-600 dark:border-white/7 dark:bg-white/[0.03] dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={cloudForm.isPinned}
                    onChange={(event) =>
                      setCloudForm((prev) => ({ ...prev, isPinned: event.target.checked }))
                    }
                  />
                  置顶显示
                </label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">中文注释</Label>
                <Textarea
                  id="notes"
                  value={cloudForm.notes}
                  onChange={(event) => setCloudForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="例如：互联网榆林市档案馆"
                  className="min-h-[110px] rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus-visible:border-indigo-400/60 focus-visible:ring-indigo-400/20 dark:border-white/7 dark:bg-neutral-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-violet-400/50 dark:focus-visible:ring-violet-400/20"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className={ACTION_BUTTON_CLASS} onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" className={PRIMARY_BUTTON_CLASS}>
                  {dialogMode === "create" ? "保存新增" : "保存修改"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-md dark:border-white/10 dark:bg-neutral-900/95 dark:text-white dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
          {toast}
        </div>
      ) : null}
    </div>
  );

  function handlePageSizeChange(value) {
    setPageSize(value);
    setDevicePage(1);
    setCloudPage(1);
  }
}

function SidebarMenuItem({ active, icon: Icon, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-4 py-3.5 text-left transition ${
        active
          ? "bg-indigo-50 text-indigo-600 dark:bg-white/[0.06] dark:text-white"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white"
      }`}
    >
      <span
        className={`absolute left-0 top-3 h-10 w-1 rounded-r-full ${
          active ? "bg-indigo-500 dark:bg-gradient-to-b dark:from-violet-400 dark:to-cyan-300" : "bg-transparent"
        }`}
      />
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
          active
            ? "border-indigo-100 bg-white text-indigo-600 dark:border-white/10 dark:bg-black/30 dark:text-white"
            : "border-slate-200 bg-white text-slate-400 dark:border-white/7 dark:bg-white/[0.02] dark:text-zinc-500"
        }`}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 items-center">
        <div className="truncate text-base font-medium leading-6">{title}</div>
      </div>
    </button>
  );
}

function SidebarResourceLink({ href, title, desc }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50 dark:border-white/7 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
    >
      <div className="text-sm font-medium text-slate-700 dark:text-zinc-200">{title}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-500">{desc}</div>
    </a>
  );
}

function TopMetricCard({ title, value, desc, accent = false }) {
  return (
    <div
      className={`rounded-[24px] border p-6 ${
        accent
          ? "border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 shadow-sm dark:border-white/5 dark:bg-gradient-to-br dark:from-violet-500/12 dark:via-transparent dark:to-cyan-400/10 dark:shadow-none"
          : "border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-white/[0.03] dark:shadow-none"
      }`}
    >
      <div className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500">{title}</div>
      <div className="mt-5 text-4xl font-semibold tracking-tight text-slate-800 dark:text-white">{value}</div>
      <div className="mt-3 text-sm text-slate-500 dark:text-zinc-300">{desc}</div>
    </div>
  );
}

function PageSizeSelect({ pageSize, onChange }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-400">
      <span>每页显示</span>
      <Select value={String(pageSize)} onValueChange={(value) => onChange(Number(value))}>
        <SelectTrigger className="h-11 w-[128px] rounded-2xl border-slate-200 bg-slate-100 text-slate-800 dark:border-white/7 dark:bg-neutral-950 dark:text-zinc-100">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-slate-200 bg-white text-slate-800 dark:border-white/8 dark:bg-neutral-900 dark:text-zinc-100">
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
          <SelectItem value="200">200</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function ViewSwitch({ deviceView, onChange }) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-white/7 dark:bg-white/[0.03]">
      <SegmentButton active={deviceView === "grid"} icon={LayoutGrid} label="卡片" onClick={() => onChange("grid")} />
      <SegmentButton active={deviceView === "table"} icon={List} label="表格" onClick={() => onChange("table")} />
    </div>
  );
}

function SegmentButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm transition ${
        active
          ? "bg-white text-slate-800 shadow-sm dark:bg-white dark:text-neutral-950"
          : "text-slate-500 hover:bg-white hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-white"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function DeviceTable({ devices, deviceStatus, onOpen, onTest, onEdit, onPin, onDelete }) {
  if (!devices.length) {
    return <EmptyState title="没有匹配的设备记录" desc="可以调整筛选条件，或者直接新增设备记录。" />;
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-white/5 dark:bg-black/18">
      <Table className="min-w-[1220px]">
        <TableHeader>
          <TableRow className="border-b border-slate-100 hover:bg-transparent dark:border-white/5">
            <TableHead className="h-14 px-5 text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              设备
            </TableHead>
            <TableHead className="h-14 px-5 text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              分类
            </TableHead>
            <TableHead className="h-14 px-5 text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              地址
            </TableHead>
            <TableHead className="h-14 px-5 text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              账号
            </TableHead>
            <TableHead className="h-14 px-5 text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              密码
            </TableHead>
            <TableHead className="h-14 px-5 text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              状态
            </TableHead>
            <TableHead className="h-14 px-5 text-right text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              操作
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id} className="border-b border-slate-100 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/[0.035]">
              <TableCell className="min-w-[220px] px-5 py-4">
                <div className="flex items-start gap-3">
                  {device.isPinned ? <Pin className="mt-0.5 size-4 text-amber-500 dark:text-amber-300" /> : null}
                  <div>
                    <div className="font-medium text-slate-800 dark:text-white">{device.name}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-zinc-500">设备入口</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-5 py-4">
                <StatusBadge variant={device.category}>{device.category}</StatusBadge>
              </TableCell>
              <TableCell className="max-w-[320px] px-5 py-4 font-mono text-xs text-slate-500 dark:text-zinc-400">
                <div className="break-all">{device.url}</div>
              </TableCell>
              <TableCell className="px-5 py-4 font-mono text-sm text-slate-700 dark:text-zinc-200">{device.username || "-"}</TableCell>
              <TableCell className="px-5 py-4 font-mono text-sm text-slate-500 dark:text-zinc-400">受控访问</TableCell>
              <TableCell className="px-5 py-4">
                <StatusBadge variant={deviceStatus[device.id] || "idle"}>
                  {statusLabel(deviceStatus[device.id] || "idle")}
                </StatusBadge>
              </TableCell>
              <TableCell className="px-5 py-4">
                <div className="flex justify-end gap-2 whitespace-nowrap">
                  <GhostButton onClick={() => onOpen(device)}>打开</GhostButton>
                  <GhostButton onClick={() => onTest(device)}>检测</GhostButton>
                  <GhostButton onClick={() => onEdit(device)}>编辑</GhostButton>
                  <GhostButton onClick={() => onPin(device)}>
                    {device.isPinned ? "取消置顶" : "置顶"}
                  </GhostButton>
                  <DangerGhostButton onClick={() => onDelete(device)}>删除</DangerGhostButton>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DeviceCard({ device, status, onCopy, onEdit, onDelete, onPin, onTest, onOpen, pinned = false }) {
  return (
    <Card className={`${CARD_CLASS} ${pinned ? "shadow-[0_0_0_1px_rgba(245,158,11,0.16)] dark:shadow-[0_0_0_1px_rgba(251,191,36,0.12),0_18px_40px_rgba(0,0,0,0.24)]" : ""}`}>
      <CardHeader className="border-b border-slate-200 pb-4 dark:border-white/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-slate-800 dark:text-white">{device.name}</CardTitle>
            <CardDescription className="mt-2">
              {device.category === "Toolbox" ? "工具入口" : "设备登录节点"}
            </CardDescription>
          </div>
          <StatusBadge variant={status}>{statusLabel(status)}</StatusBadge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge variant={device.category}>{device.category}</StatusBadge>
          {pinned ? <StatusBadge variant="pinned">置顶</StatusBadge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/[0.03]">
          <MiniMetric icon={Globe} label="访问地址" value={device.url} mono />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <MiniMetric icon={KeyRound} label="账号" value={device.username || "-"} mono />
            <MiniMetric icon={Shield} label="密码" value="受控访问" mono />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-xl border-0 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 text-white hover:from-violet-400 hover:via-indigo-400 hover:to-cyan-300"
            onClick={() => onOpen(device)}
          >
            打开设备
          </Button>
          <GhostButton onClick={() => onTest(device)}>检测</GhostButton>
          <GhostButton onClick={() => onCopy(device.username)}>复制账号</GhostButton>
          <GhostButton onClick={() => onEdit(device)}>编辑</GhostButton>
          <GhostButton onClick={() => onPin(device)}>{device.isPinned ? "取消置顶" : "置顶"}</GhostButton>
          <DangerGhostButton onClick={() => onDelete(device)}>删除</DangerGhostButton>
        </div>
      </CardContent>
    </Card>
  );
}

function CloudCard({ item, cloudLoginUrl, onCopy, onEdit, onDelete, onPin, onOpen, pinned = false }) {
  const displayTitle = item.tenantName || item.tenantCode || item.platformAccount || "未命名租户";

  return (
    <Card
      className={`${CARD_CLASS} ${pinned ? "shadow-[0_0_0_1px_rgba(245,158,11,0.16)] dark:shadow-[0_0_0_1px_rgba(251,191,36,0.12),0_18px_40px_rgba(0,0,0,0.24)]" : ""}`}
    >
      <CardHeader className="border-b border-slate-200 pb-4 dark:border-white/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-slate-800 dark:text-white">{displayTitle}</CardTitle>
            <CardDescription className="mt-2">云平台租户与统一密码</CardDescription>
          </div>
          <StatusBadge variant="online">可用</StatusBadge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {pinned ? <StatusBadge variant="pinned">置顶</StatusBadge> : null}
        </div>
        <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-500 dark:border-white/5 dark:bg-white/[0.03] dark:text-zinc-500">
          {cloudLoginUrl}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <InfoBlock label="租户ID" value={item.tenantCode || "-"} onCopy={() => onCopy(item.tenantCode)} />
        <InfoBlock label="平台账号" value={item.platformAccount || "-"} onCopy={() => onCopy(item.platformAccount)} />
        <InfoBlock label="统一密码" value="受控访问" />
        <InfoBlock label="中文注释" value={item.notes || "-"} onCopy={() => onCopy(item.notes)} />

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-xl border-0 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 text-white hover:from-violet-400 hover:via-indigo-400 hover:to-cyan-300"
            onClick={() => onOpen(item)}
          >
            <Globe className="size-3.5" />
            打开平台
          </Button>
          <GhostButton onClick={() => onEdit(item)}>编辑</GhostButton>
          <GhostButton onClick={() => onPin(item)}>{item.isPinned ? "取消置顶" : "置顶"}</GhostButton>
          <DangerGhostButton onClick={() => onDelete(item)}>删除</DangerGhostButton>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniMetric({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-500">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className={`text-sm text-slate-800 dark:text-zinc-100 ${mono ? "break-all font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function InfoBlock({ label, value, onCopy }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-500">{label}</div>
          <div className="break-all font-mono text-sm text-slate-800 dark:text-zinc-100">{value}</div>
        </div>
        {onCopy ? (
          <Button
            size="icon"
            variant="ghost"
            className="rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
            onClick={onCopy}
          >
            <Copy className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function GhostButton({ children, onClick }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function DangerGhostButton({ children, onClick }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-red-500/50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function EmptyState({ title, desc }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center dark:border-white/8 dark:bg-white/[0.02]">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm uppercase tracking-[0.24em] text-slate-500 dark:border-white/6 dark:bg-white/[0.03] dark:text-zinc-500">
        Empty
      </div>
      <h3 className="mt-5 text-xl font-medium text-slate-800 dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-zinc-400">{desc}</p>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:border-white/7 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
        onClick={() => onChange(Math.max(1, currentPage - 1))}
      >
        上一页
      </Button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <Button
          key={page}
          size="sm"
          variant={page === currentPage ? "default" : "outline"}
          className={
            page === currentPage
              ? "rounded-xl border-0 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 text-white"
              : "rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:border-white/7 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
          }
          onClick={() => onChange(page)}
        >
          {page}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:border-white/7 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
      >
        下一页
      </Button>
    </div>
  );
}

function StatusBadge({ variant, children }) {
  const styles = {
    Sangfor: "border-purple-100 bg-purple-100 text-purple-700 dark:border-fuchsia-400/18 dark:bg-fuchsia-500/10 dark:text-fuchsia-200",
    Venustech: "border-emerald-100 bg-emerald-100 text-emerald-700 dark:border-emerald-400/18 dark:bg-emerald-500/10 dark:text-emerald-200",
    Toolbox: "border-sky-100 bg-sky-100 text-sky-700 dark:border-sky-400/18 dark:bg-sky-500/10 dark:text-sky-200",
    online: "border-cyan-100 bg-cyan-100 text-cyan-700 dark:border-cyan-400/18 dark:bg-cyan-500/10 dark:text-cyan-200",
    offline: "border-rose-100 bg-rose-100 text-rose-700 dark:border-rose-400/18 dark:bg-rose-500/10 dark:text-rose-200",
    testing: "border-violet-100 bg-violet-100 text-violet-700 dark:border-violet-400/18 dark:bg-violet-500/10 dark:text-violet-200",
    idle: "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/8 dark:bg-white/[0.03] dark:text-zinc-400",
    pinned: "border-amber-100 bg-amber-100 text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200",
  };

  return (
    <Badge className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[variant] || styles.idle}`}>
      {children}
    </Badge>
  );
}

function statusLabel(status) {
  if (status === "online") return "在线";
  if (status === "offline") return "离线/超时";
  if (status === "testing") return "检测中";
  return "未检测";
}

function Layers3Icon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </svg>
  );
}

export default App;
