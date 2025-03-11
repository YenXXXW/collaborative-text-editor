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
      <section className="w-screen h-screen">
        <div className="flex">
          <div className="px-3 text-white text-sm min-w-[250px] max-w-[25vw] bg-gray-900 flex flex-col justify-between pt-5 pb-10">
            <div className="flex flex-col">
              <h3>
                Code Collab
              </h3>
              <div className="flex items-center gap-3 ">
                <p>
                  RoomId
                </p>
                <div className="rounded-sm px-2 py-1 bg-neutral-900">{roomId}</div>
              </div>
              <div>
                Users in Room
              </div>
              <button>
                New
              </button>
              <button>
                Download
              </button>
            </div>
            <button className="py-2 bg-red-600 rounded-sm">
              Leave
            </button>

          </div>
          <Editor
            onChangeHandler={sendChange}
            remoteChange={remoteChange}
            initialValue={initValue}
          />
        </div>
      </section>
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
