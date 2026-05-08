import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_PORT = "8000";

function getExpoHostIp() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(":")[0];
}

function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const expoHostIp = getExpoHostIp();
  if (expoHostIp) {
    return `http://${expoHostIp}:${API_PORT}`;
  }

  return `http://127.0.0.1:${API_PORT}`;
}

const API_BASE_URL = getApiBaseUrl();

console.log("[API] Base URL:", API_BASE_URL);

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

function getRequestUrl(config) {
  try {
    return API.getUri(config);
  } catch {
    return `${config?.baseURL || ""}${config?.url || ""}`;
  }
}

API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Token may not be set yet.
    }
    console.log(`[API] ${config.method?.toUpperCase()} -> ${getRequestUrl(config)}`);
    return config;
  },
  (error) => {
    console.error("[API] Request setup error:", error.message);
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} from ${getRequestUrl(response.config)}`);
    return response;
  },
  (error) => {
    const requestUrl = getRequestUrl(error.config);

    if (error.code === "ECONNABORTED") {
      console.error(`[API] Timeout after 15s: ${requestUrl}`);
    } else if (error.message === "Network Error") {
      console.error(
        `[API] Network Error: cannot reach ${requestUrl}. ` +
          "Confirm FastAPI is running on 0.0.0.0:8000 and the phone can open the backend URL."
      );
    } else if (error.response) {
      console.error(
        `[API] HTTP ${error.response.status} from ${requestUrl}:`,
        error.response.data || error.message
      );
    } else {
      console.error(`[API] Request failed for ${requestUrl}:`, error.message);
    }
    return Promise.reject(error);
  }
);

export { API_BASE_URL };
export default API;
