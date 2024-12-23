import axiosInstance from "@/lib/axios"

export const CheckHealth = async () => {
  try {
    const res = await axiosInstance.get("/health")
    console.log("health check", res.data)
  } catch (error) {
    console.log("error checking health", error)
    throw error
  }

}
