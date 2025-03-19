import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RoomCreateService } from '@/services/roomCreateService'
import { useRoom } from '@/context/RoomContext'
import { useEffect, useState } from 'react'

export default function Home() {
  const { joinRoom, hasJoined, userId } = useRoom()
  const navigate = useNavigate()
  const [roomId, setRoomId] = useState("")
  const [username, setUsername] = useState("")

  const createRoom = async () => {
    const res = await RoomCreateService(userId, username)
    console.log(res)
    setRoomId(res.room_id)
    joinRoom(res.room_id, res.username)
  }

  // Watch for hasJoined to change and navigate after connection is established
  useEffect(() => {
    if (hasJoined) {
      navigate(`/room/${roomId}`, { state: { username } })
    }
  }, [hasJoined, navigate])

  return (
    <>
      <Input
        type="text"
        value={username}
        placeholder='Enter UserName'
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
      />

      <Button className={`${username === "" && "opacity-90 pointer-events-none"}`} onClick={createRoom}>Create A Room</Button>
      <Button onClick={() => { navigate("/join-room") }}>Join Room</Button>
    </>
  )
}
