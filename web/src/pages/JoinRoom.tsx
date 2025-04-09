import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRoom } from "@/context/RoomContext"
import { useLocation, useNavigate } from "react-router-dom"

export default function JoinRoomPage() {

  const location = useLocation();
  const userName = location.state?.username;


  const { sendJoined, joinRoom, hasJoined, initValue } = useRoom()
  const [roomId, setRoomId] = useState<number | null>(null)
  const [username, setUsername] = useState(userName || "")

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
            type="text"
            value={username}
            placeholder='Enter UserName'
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Room ID"
            onChange={(e) => setRoomId(Number(e.target.value))}
          />
          <Button
            className={`${username === "" && "opacity-90 pointer-events-none"}`}
            onClick={() => roomId && joinRoom(roomId, username)}
          >Join Room</Button>
        </div>
      </div>
    </>
  )
}
