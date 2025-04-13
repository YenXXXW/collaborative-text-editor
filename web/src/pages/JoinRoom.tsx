import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRoom } from "@/context/RoomContext"
import { useLocation, useNavigate } from "react-router-dom"
import LOGO from "@/assets/logo.png"
import LoadingSpinner from "@/components/LoadingSpinner"

export default function JoinRoomPage() {

  const location = useLocation();
  const userName = location.state?.username;
  const [loading, setLoading] = useState(false)


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
      setLoading(false)
      navigate(`/room/${roomId}`)
    }
  }, [hasJoined, initValue, roomId, navigate])

  if (hasJoined && initValue === "") {
    return <div>Loading...</div>
  }

  return (
    <>
      <div className="flex flex-col gap-4 items-center justify-center min-h-screen">
        <div className="w-[300px] relative flex flex-col items-center gap-4">

          <div className="flex justify-center my-6">
            <img src={LOGO} width={70} height={70} />
            <h3 className="text-3xl font-mono text-red-600 font-bold">
              Code Collab
            </h3>
          </div>
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
            className={`w-full ${username === "" && "opacity-90 pointer-events-none"}`}
            onClick={() => {
              if (roomId) {
                setLoading(true)
                localStorage.setItem("userName", userName);
                joinRoom(roomId, username)
              }
            }}
          >Join Room</Button>

          {
            loading &&
            <div className='absolute bottom-[-20%]'>
              <LoadingSpinner />
            </div>
          }
        </div>
      </div>
    </>
  )
}
