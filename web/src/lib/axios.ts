import axios, { AxiosInstance } from "axios";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8080/v1',
  headers: {
    "Content-Type": "application/json"
  }
})

export default axiosInstance
