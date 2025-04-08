import axios, { AxiosInstance } from "axios";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: 'https://collaborative-text-editor-tulc.onrender.com/v1',
  headers: {
    "Content-Type": "application/json"
  }
})

export default axiosInstance
