function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function readOption(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function normalizeBaseUrl(input) {
  const value = input?.trim();

  if (!value) {
    throw new Error('请提供预发地址，例如: npm run smoke:remote:admin -- https://preview.example.com');
  }

  const url = new URL(value);
  return url.toString().replace(/\/+$/, '');
}

function getAdminPassword() {
  const password = process.env.SMOKE_ADMIN_PASSWORD?.trim();

  if (!password) {
    throw new Error('缺少 SMOKE_ADMIN_PASSWORD 环境变量');
  }

  return password;
}

function requireHeader(response, headerName, expectedFragment) {
  const headerValue = response.headers.get(headerName);
  assert(headerValue, `缺少响应头: ${headerName}`);
  assert(
    headerValue.includes(expectedFragment),
    `响应头 ${headerName} 缺少期望值: ${expectedFragment}`
  );
}

function updateCookieJar(cookieJar, response) {
  const rawSetCookie = response.headers.get('set-cookie');

  if (!rawSetCookie) {
    return cookieJar;
  }

  const [cookiePart] = rawSetCookie.split(';');
  const separatorIndex = cookiePart.indexOf('=');

  if (separatorIndex === -1) {
    return cookieJar;
  }

  const name = cookiePart.slice(0, separatorIndex).trim();
  const value = cookiePart.slice(separatorIndex + 1).trim();

  if (!name) {
    return cookieJar;
  }

  if (!value) {
    delete cookieJar[name];
    return cookieJar;
  }

  cookieJar[name] = value;
  return cookieJar;
}

function serializeCookieJar(cookieJar) {
  return Object.entries(cookieJar)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function requestJson(url, options = {}, cookieJar = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set('Accept', 'application/json');

  const serializedCookies = serializeCookieJar(cookieJar);
  if (serializedCookies) {
    headers.set('Cookie', serializedCookies);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    redirect: 'follow',
  });

  updateCookieJar(cookieJar, response);

  const contentType = response.headers.get('content-type') ?? '';
  assert(contentType.includes('application/json'), `接口未返回 JSON: ${url}`);

  const payload = await response.json();
  return { response, payload };
}

const baseUrlArg = process.argv.slice(2).find((value) => !value.startsWith('--')) ?? process.env.SMOKE_BASE_URL;
const skipSecurityHeaders = hasFlag('--skip-security-headers');
const baseUrl = normalizeBaseUrl(baseUrlArg);
const adminPassword = getAdminPassword();
const cookieJar = {};

const loginResult = await requestJson(`${baseUrl}/api/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    scope: 'admin',
    password: adminPassword,
  }),
}, cookieJar);

assert(loginResult.response.ok, `管理员登录失败: ${loginResult.response.status}`);
assert(loginResult.payload?.success === true, '管理员登录返回 success=false');
assert(loginResult.payload?.data?.isAuthenticated === true, '管理员登录后 isAuthenticated 不为 true');
assert(loginResult.payload?.data?.isAdminAuthenticated === true, '管理员登录后 isAdminAuthenticated 不为 true');
requireHeader(loginResult.response, 'cache-control', 'no-store');
requireHeader(loginResult.response, 'x-content-type-options', 'nosniff');

if (!skipSecurityHeaders) {
  requireHeader(loginResult.response, 'access-control-allow-origin', '*');
}

const sessionResult = await requestJson(`${baseUrl}/api/auth/session`, {}, cookieJar);
assert(sessionResult.response.ok, `会话检查失败: ${sessionResult.response.status}`);
assert(sessionResult.payload?.data?.isAuthenticated === true, '会话接口未返回已登录状态');
assert(sessionResult.payload?.data?.isAdminAuthenticated === true, '会话接口未返回管理员状态');
requireHeader(sessionResult.response, 'cache-control', 'no-store');

const adminSettingsResult = await requestJson(`${baseUrl}/api/settings/admin`, {}, cookieJar);
assert(adminSettingsResult.response.ok, `管理员设置接口失败: ${adminSettingsResult.response.status}`);
assert(adminSettingsResult.payload?.success === true, '管理员设置接口返回 success=false');
assert(typeof adminSettingsResult.payload?.data?.adminPasswordConfigured === 'boolean', '管理员设置缺少 adminPasswordConfigured');
assert(typeof adminSettingsResult.payload?.data?.appPasswordConfigured === 'boolean', '管理员设置缺少 appPasswordConfigured');
requireHeader(adminSettingsResult.response, 'cache-control', 'no-store');

const entriesResult = await requestJson(`${baseUrl}/api/entries`, {}, cookieJar);
assert(entriesResult.response.ok, `管理员日记列表接口失败: ${entriesResult.response.status}`);
assert(entriesResult.payload?.success === true, '管理员日记列表接口返回 success=false');
assert(Array.isArray(entriesResult.payload?.data), '管理员日记列表 data 不是数组');
requireHeader(entriesResult.response, 'cache-control', 'no-store');

const logoutResult = await requestJson(`${baseUrl}/api/auth/logout`, {
  method: 'POST',
}, cookieJar);
assert(logoutResult.response.ok, `管理员退出登录失败: ${logoutResult.response.status}`);
assert(logoutResult.payload?.success === true, '退出登录返回 success=false');
requireHeader(logoutResult.response, 'cache-control', 'no-store');

const loggedOutSessionResult = await requestJson(`${baseUrl}/api/auth/session`, {}, cookieJar);
assert(loggedOutSessionResult.response.ok, `退出后会话检查失败: ${loggedOutSessionResult.response.status}`);
assert(loggedOutSessionResult.payload?.data?.isAuthenticated === false, '退出后会话仍为已登录');
assert(loggedOutSessionResult.payload?.data?.isAdminAuthenticated === false, '退出后管理员状态未清除');

console.log(`远端管理员 smoke test 通过: ${baseUrl}`);
