import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { RoomCreateService } from '@/services/roomCreateService'
import { useState } from 'react'

export default function Home() {
  const [createdRoomId, setCreatedRoomId] = useState<number | null>(null)
  const navigate = useNavigate()
  const createRoom = async () => {
    const res = await RoomCreateService(44444)
    setCreatedRoomId(res.id)


  }
  return (
    <>
      <Button onClick={createRoom}>Create A Room</Button>

      <Button onClick={() => { navigate("/join-room") }}>Join Room</Button>
    </>

  )
}
