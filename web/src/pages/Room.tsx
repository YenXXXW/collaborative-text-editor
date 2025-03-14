import { useEffect, useState } from "react"
import Editor from "@/components/EditorReact"
import { useRoom } from "@/context/RoomContext"
import { useParams } from 'react-router-dom'

export default function Room() {

  const { roomId } = useParams()
  const { userId, remoteChange, sendChange, initValue, usersInRoom } = useRoom()
  const [totalUsersInRoom, setTotalUsersInRoom] = useState<string[]>([userId]);


  useEffect(() => {
    if (usersInRoom.length > 0) {
      setTotalUsersInRoom(usersInRoom)

    }
  }, [usersInRoom])

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
              {
                totalUsersInRoom.map(user =>
                  <>
                    {user}
                  </>
                )
              }
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
