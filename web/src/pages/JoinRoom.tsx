import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRoom } from "@/context/RoomContext"
import { useNavigate } from "react-router-dom"

export default function JoinRoomPage() {
  const { sendJoined, joinRoom, hasJoined, initValue } = useRoom()
  const [roomId, setRoomId] = useState<number | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    if (hasJoined) {
      if (initValue === "") {
        return
      }
      sendJoined()
      navigate(`/room/${roomId}`)
    }
  }, [hasJoined, initValue, roomId, navigate])

  if (hasJoined && initValue === "") {
    return <div>Loading...</div>
  }

  return (
    <>
      <div className="flex flex-col gap-4 items-center justify-center min-h-screen">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Room ID"
            onChange={(e) => setRoomId(Number(e.target.value))}
          />
          <Button onClick={() => roomId && joinRoom(roomId)}>Join Room</Button>
        </div>
      </div>
    </>
  )
}
