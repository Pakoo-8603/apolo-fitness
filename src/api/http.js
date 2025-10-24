// src/api/http.js
import axios from "axios";

/**
 * ENV
 * - VITE_API_BASE_URL: ej. http://127.0.0.1:8000/api/v1
 * - VITE_TOKEN_STORAGE_KEY (opcional)
 * - VITE_EMPRESA_STORAGE_KEY (opcional)
 * - VITE_SUCURSAL_STORAGE_KEY (opcional)
 */
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const TOKEN_STORAGE_KEY =
  import.meta.env.VITE_TOKEN_STORAGE_KEY || "agora.tokens";
export const EMPRESA_STORAGE_KEY =
  import.meta.env.VITE_EMPRESA_STORAGE_KEY || "agora.empresa";
export const SUCURSAL_STORAGE_KEY =
  import.meta.env.VITE_SUCURSAL_STORAGE_KEY || "agora.sucursal";

/** Normaliza baseURL: sin trailing slash */
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

/** ===== Empresa/Sucursal (contexto) ===== */
let currentEmpresaId = null;
let currentSucursalId = null;

export function setEmpresaId(id) {
  currentEmpresaId = id != null && id !== "" ? String(id) : null;
  if (currentEmpresaId) {
    localStorage.setItem(EMPRESA_STORAGE_KEY, currentEmpresaId);
  } else {
    localStorage.removeItem(EMPRESA_STORAGE_KEY);
  }
}
export function getEmpresaId() {
  if (currentEmpresaId) return currentEmpresaId;
  const raw = localStorage.getItem(EMPRESA_STORAGE_KEY);
  currentEmpresaId = raw || null;
  return currentEmpresaId;
}

export function setSucursalId(id) {
  currentSucursalId = id != null && id !== "" ? String(id) : null;
  if (currentSucursalId) {
    localStorage.setItem(SUCURSAL_STORAGE_KEY, currentSucursalId);
  } else {
    localStorage.removeItem(SUCURSAL_STORAGE_KEY);
  }
}
export function getSucursalId() {
  if (currentSucursalId) return currentSucursalId;
  const raw = localStorage.getItem(SUCURSAL_STORAGE_KEY);
  currentSucursalId = raw || null;
  return currentSucursalId;
}

/** ===== Tokens ===== */
export function getTokens() {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function saveTokens(tokens) {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}
export function clearTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  // Al cerrar sesión, limpia también el contexto
  localStorage.removeItem(EMPRESA_STORAGE_KEY);
  localStorage.removeItem(SUCURSAL_STORAGE_KEY);
  currentEmpresaId = null;
  currentSucursalId = null;
}

/** ===== Cliente axios =====
 * Usa rutas SIN slash inicial en http.get/post/... para que se peguen a baseURL.
 */
const http = axios.create({
  baseURL: `${BASE_URL}/`,
  timeout: 20000,
});

/** ===== Refresh queue state ===== */
let isRefreshing = false;
let refreshQueue = [];
function flushRefreshQueue(error, newAccessToken = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newAccessToken);
  });
  refreshQueue = [];
}

/** ===== Interceptor de request ===== */
http.interceptors.request.use((config) => {
  // Bearer
  const tokens = getTokens();
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }

  // Contexto de empresa/sucursal
  const emp = getEmpresaId();
  if (emp) config.headers["X-Empresa-Id"] = emp;

  const suc = getSucursalId();
  if (suc && suc !== "all") {
    config.headers["X-Sucursal-Id"] = suc; // solo numérico
  } else {
    // por si acaso algún cliente dejó algo previo
    delete config.headers["X-Sucursal-Id"];
  }
  return config;
});

/** ===== Interceptor de response (401 -> refresh) ===== */
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original || original.__isRetryRequest) {
      return Promise.reject(error);
    }

    // Sólo intentamos refresh con 401
    if (error.response?.status === 401) {
      const tokens = getTokens();
      if (!tokens?.refresh) {
        clearTokens();
        return Promise.reject(error);
      }

      // Si ya hay un refresh en curso, nos colgamos de la cola
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (newAccess) => {
              original.headers.Authorization = `Bearer ${newAccess}`;
              resolve(http(original));
            },
            reject,
          });
        });
      }

      // Marcamos y disparamos refresh
      original.__isRetryRequest = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/token/refresh/`, {
          refresh: tokens.refresh,
        });

        const newAccess = data?.access;
        if (!newAccess) throw new Error("No se recibió access token en refresh");

        // Guarda y resuelve cola
        saveTokens({ ...tokens, access: newAccess });
        flushRefreshQueue(null, newAccess);
        isRefreshing = false;

        // Reintenta la request original con el nuevo token
        original.headers.Authorization = `Bearer ${newAccess}`;
        return http(original);
      } catch (refreshErr) {
        flushRefreshQueue(refreshErr, null);
        isRefreshing = false;
        clearTokens();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default http;

/** Helpers opcionales para usar desde stores/layouts */
export const system = {
  setEmpresa: (id) => setEmpresaId(id),
  setSucursal: (id) => setSucursalId(id),
  getEmpresa: () => getEmpresaId(),
  getSucursal: () => getSucursalId(),
};
