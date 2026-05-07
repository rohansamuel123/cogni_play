import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = axios.create({
  // Fallback directly to the IP address shown in your Expo terminal logs
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://172.17.1.238:8000",
  timeout: 15000, // 15 seconds — prevents infinite hangs
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth interceptor — attach JWT token to every request
API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // silently fail — token might not be set yet
    }
    console.log(`[API] ${config.method?.toUpperCase()} -> ${config.baseURL}${config.url}`);
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
    console.log(`[API] ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("[API] Timeout -- backend did not respond within 15s");
    } else if (error.message === "Network Error") {
      console.error(
        "[API] Network Error -- cannot reach backend at:",
        error.config?.baseURL
      );
    } else {
      console.error("[API] Error:", error.response?.status, error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
