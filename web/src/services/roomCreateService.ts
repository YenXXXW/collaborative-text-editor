import axiosInstance from "@/lib/axios"

export const RoomCreateService = async (creatorId: string, creatorName: string) => {
  const payload = {
    "creator_id": creatorId,
    "users_in_room": [creatorId],
    "creator_name": creatorName
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


