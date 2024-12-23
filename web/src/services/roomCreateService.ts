import axiosInstance from "@/lib/axios"

export const RoomCreateService = async (creatorId: number) => {
  const payload = {
    "creator_id": creatorId,
    "users_in_room": [creatorId]
  }
  try {

    const res = await axiosInstance.post("/create-room", payload)
    console.log(res.data)
    return res.data.data

  } catch (error) {
    console.log("Error creating room")
    throw error
  }
}
