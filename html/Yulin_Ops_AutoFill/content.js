const currentUrl = window.location.href;
const AUTOFILL_CONTEXT_KEY = "yulin_ops_autofill_context";
const AUTOFILL_CONTEXT_TTL = 3 * 60 * 1000;
const AUTOFILL_CONTEXT_MESSAGE_TYPE = "YL_OPS_AUTOFILL_CONTEXT";
const AUTOFILL_CONTEXT_ACK_TYPE = "YL_OPS_AUTOFILL_CONTEXT_STORED";

const TENANT_SELECTORS = [
  'input[name*="tenant" i]',
  'input[id*="tenant" i]',
  'input[placeholder*="tenant" i]',
  'input[placeholder*="租户"]',
  'input[placeholder*="租户ID"]',
];

const USERNAME_SELECTORS = [
  "input#ti_auto_id_1",
  'input[data-ddg-inputtype="identities.firstName"]',
  'input.inputWidth[placeholder="用户名"]',
  'input[tiny3version][placeholder="用户名"]',
  'input[name="user"]',
  'input[name="usr"]',
  'input[name="username"]',
  'input[name="txt_name"]',
  'input[name*="account" i]',
  "input#username",
  "input#txt_username09",
  'input[id*="username" i]',
  'input[id*="user" i]',
  'input[autocomplete="username"]',
  'input[placeholder*="用户名"]',
  'input[placeholder*="账号"]',
  'input[placeholder*="用户"]',
];

const PASSWORD_SELECTORS = [
  "input#ti_auto_id_2",
  'input[data-ddg-inputtype="credentials.password.current"]',
  'input.inputWidth[type="password"][placeholder="密码"]',
  'input[tiny3version][type="password"][placeholder="密码"]',
  'input[type="password"]',
  'input[name="password"]',
  'input[name="pwd"]',
  "input#password",
  'input[id*="password" i]',
  'input[autocomplete="current-password"]',
  'input[placeholder*="密码"]',
];

let panelMessageListenerInstalled = false;

function isCloudPage(url) {
  return /auth\.ylaky\.com|oc\.ylaky\.com/i.test(url);
}

function isPlatformEntryPage(url) {
  return /auth\.ylaky\.com|login\.action|authenticate/i.test(url);
}

function isPanelPage() {
  return Boolean(document.querySelector('[data-panel-app="firewall-login-manager"]'));
}

function hasStorageApi() {
  return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
}

function safeParseUrl(rawUrl) {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

function normalizeContext(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.kind === "reset") {
    return { kind: "reset", savedAt: Date.now() };
  }

  return {
    kind: payload.kind || "device",
    targetUrl: String(payload.targetUrl || "").trim(),
    tenantName: String(payload.tenantName || "").trim(),
    tenantCode: String(payload.tenantCode || "").trim(),
    platformAccount: String(payload.platformAccount || "").trim(),
    jumpUsername: String(payload.jumpUsername || "").trim(),
    jumpPassword: String(payload.jumpPassword || "").trim(),
    username: String(payload.username || "").trim(),
    password: String(payload.password || "").trim(),
    sourceLabel: String(payload.sourceLabel || "").trim(),
    savedAt: Date.now(),
  };
}

async function saveAutofillContext(context) {
  if (!context) return;
  if (hasStorageApi()) {
    await chrome.storage.local.set({ [AUTOFILL_CONTEXT_KEY]: context });
    return;
  }
  sessionStorage.setItem(AUTOFILL_CONTEXT_KEY, JSON.stringify(context));
}

async function loadAutofillContext() {
  let context = null;
  if (hasStorageApi()) {
    const result = await chrome.storage.local.get(AUTOFILL_CONTEXT_KEY);
    context = result?.[AUTOFILL_CONTEXT_KEY] || null;
  } else {
    const raw = sessionStorage.getItem(AUTOFILL_CONTEXT_KEY);
    context = raw ? JSON.parse(raw) : null;
  }

  if (!context) return null;
  if (!context.savedAt || Date.now() - context.savedAt > AUTOFILL_CONTEXT_TTL) {
    await clearAutofillContext();
    return null;
  }
  return context;
}

async function clearAutofillContext() {
  if (hasStorageApi()) {
    await chrome.storage.local.remove(AUTOFILL_CONTEXT_KEY);
    return;
  }
  sessionStorage.removeItem(AUTOFILL_CONTEXT_KEY);
}

function contextMatchesCurrentUrl(context) {
  if (!context?.targetUrl) return true;
  const target = safeParseUrl(context.targetUrl);
  const current = safeParseUrl(currentUrl);
  if (!target || !current) {
    return currentUrl.includes(context.targetUrl) || context.targetUrl.includes(currentUrl);
  }
  if (current.origin === target.origin) {
    return true;
  }
  return current.hostname === target.hostname;
}

function pickVisibleInput(selectorText) {
  const elements = Array.from(document.querySelectorAll(selectorText));
  return elements.find((element) => element.offsetWidth > 0 && element.offsetHeight > 0) || elements[0] || null;
}

function pickField(selectors) {
  return pickVisibleInput(selectors.join(", "));
}

function setFieldValue(field, value) {
  if (!field || !value) return false;
  field.removeAttribute("readonly");
  field.removeAttribute("disabled");
  field.focus();
  field.click();
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  if (nativeSetter) {
    nativeSetter.call(field, value);
  } else {
    field.value = value;
  }
  field.setAttribute("value", value);
  if (field._valueTracker && typeof field._valueTracker.setValue === "function") {
    field._valueTracker.setValue("");
  }
  field.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
  field.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));
  field.dispatchEvent(new Event("blur", { bubbles: true }));
  return field.value === value || field.getAttribute("value") === value;
}

function maybeCheckPolicy() {
  const policyCheckbox = document.querySelector('input[name="checkbox"][type="checkbox"]');
  if (policyCheckbox && !policyCheckbox.checked) {
    policyCheckbox.click();
  }
}

function maybeFocusCaptcha() {
  const captchaInput = document.querySelector('input[name="captcha"], input[placeholder*="验证码"]');
  if (captchaInput) {
    captchaInput.focus();
  }
}

function fillCredentialFields(plan) {
  if (!plan) return false;

  const tenantField = pickField(TENANT_SELECTORS);
  const userField = pickField(USERNAME_SELECTORS);
  const passwordField = pickField(PASSWORD_SELECTORS);

  const expected = [];
  const filled = [];
  const missing = [];

  const tenantValue = plan.tenantCode || plan.tenantName || "";
  const usernameValue = plan.username || "";
  const passwordValue = plan.password || "";

  if (tenantValue) {
    expected.push("租户ID");
    if (setFieldValue(tenantField, tenantValue)) {
      filled.push("租户ID");
    } else {
      missing.push("租户ID");
    }
  }

  if (usernameValue) {
    expected.push("账号");
    if (setFieldValue(userField, usernameValue)) {
      filled.push("账号");
    } else {
      missing.push("账号");
    }
  }

  if (passwordValue) {
    expected.push("密码");
    if (setFieldValue(passwordField, passwordValue)) {
      filled.push("密码");
    } else {
      missing.push("密码");
    }
  }

  if (!filled.length) {
    console.log("[运维助手] 未找到匹配的输入框");
    return false;
  }

  maybeCheckPolicy();
  maybeFocusCaptcha();

  if (missing.length) {
    console.log(`[运维助手] ${plan.sourceLabel || "自动填充"} 部分成功，待重试: ${missing.join("、")}`);
    return false;
  }

  console.log(`[运维助手] ${plan.sourceLabel || "自动填充"} 已填充: ${filled.join("、")}`);
  return expected.length > 0;
}

function scheduleFill(plan, options = {}) {
  const retries = options.retries ?? 6;
  const delay = options.delay ?? 900;
  const clearOnSuccess = options.clearOnSuccess ?? false;
  const clearDelay = options.clearDelay ?? 0;
  let finished = false;

  const finish = async () => {
    if (finished) return;
    finished = true;
    observer.disconnect();
    if (!clearOnSuccess) {
      return;
    }
    if (clearDelay > 0) {
      window.setTimeout(() => {
        clearAutofillContext().catch(() => {});
      }, clearDelay);
      return;
    }
    await clearAutofillContext();
  };

  const attemptFill = async (round = 0) => {
    if (finished) return;
    const done = fillCredentialFields(plan);
    if (done) {
      await finish();
      return;
    }
    if (round >= retries - 1) {
      return;
    }
    window.setTimeout(() => {
      attemptFill(round + 1);
    }, delay);
  };

  const observer = new MutationObserver(() => {
    if (finished) return;
    if (fillCredentialFields(plan)) {
      finish();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "type", "value", "placeholder"],
  });

  attemptFill();
}

function buildPlanFromContext(context) {
  if (!context) return null;
  if (context.kind === "cloud") {
    const username = isPlatformEntryPage(currentUrl)
      ? context.platformAccount || context.jumpUsername || ""
      : context.jumpUsername || context.platformAccount || "";

    return {
      tenantName: context.tenantName || context.tenantCode || "",
      tenantCode: context.tenantCode || context.tenantName || "",
      username,
      password: context.jumpPassword || "",
      sourceLabel: context.sourceLabel || context.tenantName || context.tenantCode || "云平台",
    };
  }

  return {
    username: context.username || "",
    password: context.password || "",
    sourceLabel: context.sourceLabel || "设备登录",
  };
}

function installPanelMessageListener() {
  if (panelMessageListenerInstalled) return;
  panelMessageListenerInstalled = true;

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== "firewall-login-manager" || data.type !== AUTOFILL_CONTEXT_MESSAGE_TYPE) {
      return;
    }

    Promise.resolve()
      .then(async () => {
        const context = normalizeContext(data.payload);
        if (!context) {
          throw new Error("无效的自动填充上下文");
        }
        if (context.kind === "reset") {
          await clearAutofillContext();
        } else {
          await saveAutofillContext(context);
        }
        window.postMessage(
          {
            source: "yulin-ops-autofill",
            type: AUTOFILL_CONTEXT_ACK_TYPE,
            requestId: data.requestId,
          },
          "*"
        );
      })
      .catch((error) => {
        console.error("[运维助手] 上下文写入失败", error);
        window.postMessage(
          {
            source: "yulin-ops-autofill",
            type: AUTOFILL_CONTEXT_ACK_TYPE,
            requestId: data.requestId,
            error: String(error?.message || error),
          },
          "*"
        );
      });
  });
}

if (isPanelPage()) {
  installPanelMessageListener();
} else {
  const observer = new MutationObserver(() => {
    if (!isPanelPage()) return;
    installPanelMessageListener();
    observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

(async () => {
  const activeContext = await loadAutofillContext();
  if (!activeContext || activeContext.kind === "reset") {
    return;
  }

  if (activeContext.kind === "cloud" && isCloudPage(currentUrl) && contextMatchesCurrentUrl(activeContext)) {
    window.setTimeout(
      () =>
        scheduleFill(buildPlanFromContext(activeContext), {
          retries: 12,
          delay: 1000,
          clearOnSuccess: true,
          clearDelay: 15000,
        }),
      1200
    );
    return;
  }

  if (activeContext.kind === "device" && contextMatchesCurrentUrl(activeContext)) {
    window.setTimeout(
      () => scheduleFill(buildPlanFromContext(activeContext), { retries: 8, delay: 900, clearOnSuccess: true }),
      1000
    );
  }
})();
