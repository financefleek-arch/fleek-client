// src/api/client.js
// Mirrors all the API calls from index.html

const BASE_URL = 'https://financialplanning-production-6bf6.up.railway.app';

let _token = null;

export const setToken = (token) => { _token = token; };
export const getToken = () => _token;

async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (_token) headers['X-Auth-Token'] = _token;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...opts,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (res.status === 401) return { __unauthorized: true };
      return json;
    } catch {
      return { error: `Server error (${res.status})` };
    }
  } catch (e) {
    return { error: 'Network error — check your connection' };
  }
}

// ── Auth ──────────────────────────────────────────────────────────
export const login = (username, password) =>
  request('/api/login', { method: 'POST', body: { username, password } });

export const logout = () =>
  request('/api/logout', { method: 'POST' });

// ── Family data ───────────────────────────────────────────────────
export const getFamilyData = (familyId) =>
  request(`/api/families/${familyId}/data`);

export const getFamilyPlan = (familyId) =>
  request(`/api/families/${familyId}/plan`);

// ── CAS / Mutual Funds ────────────────────────────────────────────
export const getMemberCAS = (familyId, memberId) =>
  request(`/api/families/${familyId}/members/${memberId}/cas`);

// ── Change password ───────────────────────────────────────────────
export const changePassword = (memberId, currentPassword, newPassword) =>
  request(`/api/members/${memberId}/change-password`, {
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
  });
