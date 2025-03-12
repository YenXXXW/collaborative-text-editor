import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { RoomCreateService } from '@/services/roomCreateService'
import { useRoom } from '@/context/RoomContext'
import { useEffect, useState } from 'react'

export default function Home() {
  const { joinRoom, hasJoined, userId } = useRoom()
  const navigate = useNavigate()
  const [roomId, setRoomId] = useState("")

  const createRoom = async () => {
    const res = await RoomCreateService(userId)
    console.log(res)
    setRoomId(res.room_id)
    joinRoom(res.room_id)
  }

  // Watch for hasJoined to change and navigate after connection is established
  useEffect(() => {
    if (hasJoined) {
      navigate(`/room/${roomId}`)
    }
  }, [hasJoined, navigate])

  return (
    <>
      <Button onClick={createRoom}>Create A Room</Button>
      <Button onClick={() => { navigate("/join-room") }}>Join Room</Button>
    </>
  )
}
