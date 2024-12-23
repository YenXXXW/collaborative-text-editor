import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function JoinRoomPage() {

  const [message, setMessage] = useState("")
  const [socket, setSocket] = useState<null | WebSocket>(null)
  const [hasJoined, setHasJoined] = useState(false)

  const handleJoinRoom = () => {

    const socket = new WebSocket("ws://localhost:8080/v1/ws?roomID=12")

    socket.onopen = (event) => {
      setHasJoined(true)
    }

    socket.onmessage = (message) => {
      setMessage(message.data)
    }

    socket.onerror = (error) => {
      console.log("error conneting to the socket", error)
    }

    socket.onclose = () => {
      console.log("socket connection closed")
    }

    setSocket(socket)
  }

  const handleChange = (message: string) => {
    if (socket && socket.readyState == WebSocket.OPEN) {
      socket.send(message)
    }

  }



  return (
    <>

      {
        hasJoined
          ?
          <>
            {message}
            <Input type="text" placeholder="message" onChange={(e) => handleChange(e.target.value)} />
          </>
          :
          <>
            <Input type="number" placeholder="RoomId" />
            <Button onClick={handleJoinRoom}>Join</Button>
          </>
      }

    </>
  )
}
