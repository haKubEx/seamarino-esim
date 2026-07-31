import axios from "axios";

export const esimClient = axios.create({
  baseURL: process.env.ESIM_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});