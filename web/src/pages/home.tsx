import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RoomCreateService } from '@/services/roomCreateService'
import { useRoom } from '@/context/RoomContext'
import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import LOGO from "@/assets/logo.png"

export default function Home() {
  const { joinRoom, hasJoined, userId } = useRoom()
  const navigate = useNavigate()
  const [roomId, setRoomId] = useState("")
  const [username, setUsername] = useState(localStorage.getItem("cteusername") || "")
  const [loading, setLoading] = useState(false)

  const createRoom = async () => {

    setLoading(true)
    const res = await RoomCreateService(userId, username)
    console.log(res)
    setRoomId(res.room_id)
    joinRoom(res.room_id, res.username)
  }

  // Watch for hasJoined to change and navigate after connection is established
  useEffect(() => {
    if (hasJoined) {
      setLoading(false)
      navigate(`/room/${roomId}`, { state: { username } })
    }
  }, [hasJoined, navigate])

  return (
    <section className='flex justify-center items-center h-screen'>
      <div className='flex flex-col items-center gap-4 w-[300px] relative' >
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

        <Button className={`${username === "" && "opacity-90 pointer-events-none"} w-full`} onClick={createRoom}>Create A Room</Button>
        <Button
          className='w-full'
          onClick={() => {
            console.log("usernmae", username)
            localStorage.setItem("cteusername", username)
            navigate("/join-room", { state: { username } })
          }}
        >
          Join Room

        </Button>
        {
          loading &&
          <div className='absolute bottom-[-20%]'>
            <LoadingSpinner />
          </div>
        }
      </div>
    </section>
  )
}
