import axios from "axios";

const API = axios.create({
  baseURL: "https://fornix-medical.vercel.app/api/v1",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Fornix-Android-App",
  },
});

export default API;