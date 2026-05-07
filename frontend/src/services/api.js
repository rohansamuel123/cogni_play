import axios from "axios";

const API = axios.create({
  // Fallback directly to the IP address shown in your Expo terminal logs
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://172.17.1.238:8000",
  timeout: 15000, // 15 seconds — prevents infinite hangs
  headers: {
    "Content-Type": "application/json",
  },
});

// Debug interceptor — logs every outgoing request
API.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} → ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error("[API] Request setup error:", error.message);
    return Promise.reject(error);
  }
);

// Debug interceptor — logs responses & errors
API.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("[API] ⏱ Timeout — backend did not respond within 15s");
    } else if (error.message === "Network Error") {
      console.error(
        "[API] ❌ Network Error — cannot reach backend at:",
        error.config?.baseURL
      );
      console.error(
        "    → Check: (1) backend is running, (2) firewall allows port 8000, (3) IP is correct"
      );
    } else {
      console.error("[API] ❌ Error:", error.response?.status, error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
