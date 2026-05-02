import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.56.1:8000",
});

export default API;
