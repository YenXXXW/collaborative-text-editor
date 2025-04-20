import axiosInstance from "@/lib/axios"

export const JoinRoomService = {
  async checkRoom(roomId: number) {
    const res = await axiosInstance.get(`/check-room?roomId=${roomId}`)
    return res
  }


}
