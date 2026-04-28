const currentUrl = window.location.href;
const AUTOFILL_CONTEXT_KEY = "yulin_ops_autofill_context";
const AUTOFILL_CONTEXT_TTL = 3 * 60 * 1000;
const AUTOFILL_CONTEXT_MESSAGE_TYPE = "YL_OPS_AUTOFILL_CONTEXT";
const AUTOFILL_CONTEXT_ACK_TYPE = "YL_OPS_AUTOFILL_CONTEXT_STORED";

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

function setFieldValue(field, value) {
  if (!field || !value) return false;
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  if (nativeSetter) {
    nativeSetter.call(field, value);
  } else {
    field.value = value;
  }
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.dispatchEvent(new Event("blur", { bubbles: true }));
  return true;
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

  const tenantField = pickVisibleInput(
    'input[name*="tenant" i], input[id*="tenant" i], input[placeholder*="租户"], input[placeholder*="tenant" i]'
  );
  const userField = pickVisibleInput(
    [
      "input#ti_auto_id_1",
      'input.inputWidth[placeholder="用户名"]',
      'input[tiny3version][placeholder="用户名"]',
      'input[name="user"]',
      'input[name="usr"]',
      "input#username",
      'input[name="txt_name"]',
      "input#txt_username09",
      'input[placeholder*="用户"]',
      'input[placeholder*="账号"]',
      'input[placeholder*="用户名"]',
      'input[name*="account" i]',
      'input[id*="user" i]',
    ].join(", ")
  );
  const passwordField = pickVisibleInput(
    [
      "input#ti_auto_id_2",
      'input.inputWidth[type="password"][placeholder="密码"]',
      'input[tiny3version][type="password"][placeholder="密码"]',
      'input[type="password"]',
      'input[name="password"]',
      'input[name="pwd"]',
      "input#password",
      'input[name*="password" i]',
      'input[id*="password" i]',
    ].join(", ")
  );

  const filled = [];
  if (setFieldValue(tenantField, plan.tenantCode || plan.tenantName || "")) {
    filled.push("租户ID");
  }
  if (setFieldValue(userField, plan.username || "")) {
    filled.push("账号");
  }
  if (setFieldValue(passwordField, plan.password || "")) {
    filled.push("密码");
  }

  if (!filled.length) {
    console.log("[运维助手] 未找到匹配的输入框");
    return false;
  }

  maybeCheckPolicy();
  maybeFocusCaptcha();
  console.log(`[运维助手] ${plan.sourceLabel || "自动填充"} 已填充: ${filled.join("、")}`);
  return true;
}

function scheduleFill(plan, options = {}) {
  const retries = options.retries ?? 6;
  const delay = options.delay ?? 900;
  const clearOnSuccess = options.clearOnSuccess ?? false;

  const attemptFill = async (round = 0) => {
    const done = fillCredentialFields(plan);
    if (done) {
      if (clearOnSuccess) {
        await clearAutofillContext();
      }
      return;
    }
    if (round >= retries - 1) {
      return;
    }
    window.setTimeout(() => {
      attemptFill(round + 1);
    }, delay);
  };

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

if (isPanelPage()) {
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

(async () => {
  const activeContext = await loadAutofillContext();
  if (!activeContext || activeContext.kind === "reset") {
    return;
  }

  if (activeContext.kind === "cloud" && isCloudPage(currentUrl) && contextMatchesCurrentUrl(activeContext)) {
    window.setTimeout(
      () => scheduleFill(buildPlanFromContext(activeContext), { retries: 8, delay: 1000, clearOnSuccess: true }),
      1200
    );
    return;
  }

  if (activeContext.kind === "device" && contextMatchesCurrentUrl(activeContext)) {
    window.setTimeout(
      () => scheduleFill(buildPlanFromContext(activeContext), { retries: 6, delay: 900, clearOnSuccess: true }),
      1000
    );
  }
})();
