import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Editor from "@/components/EditorReact"
import { useRoom } from "@/context/RoomContext"

export default function JoinRoomPage() {
  const { joinRoom, hasJoined, remoteChange, sendChange, initValue } = useRoom()
  const [roomId, setRoomId] = useState<number | null>(null)

  useEffect(() => {
    console.log(initValue)
  }, [initValue])
  if (hasJoined) {
    if (initValue === "") {
      return (
        <div>
          loading
        </div>
      )
    }


    return (
      <>
        <Editor
          onChangeHandler={sendChange}
          remoteChange={remoteChange}
          initialValue={initValue}
        />
      </>
    )
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
