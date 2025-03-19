import { useEffect, useState } from "react"
import Editor from "@/components/EditorReact"
import { useRoom } from "@/context/RoomContext"
import { useLocation, useParams } from 'react-router-dom'
import { User } from "@/model/User"

export default function Room() {
  const location = useLocation();
  const userName = location.state?.username;


  const { roomId } = useParams()
  const { leaveRoom, userId, remoteChange, sendChange, initValue, usersInRoom } = useRoom()
  const [language, setLanguage] = useState('javascript');
  const [totalUsersInRoom, setTotalUsersInRoom] = useState<User[]>([
    {
      userId,
      userName: userName ?? "wai"
    }
  ]);


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
                  <div key={user.userId}>
                    {user.userName}
                  </div>
                )
              }
            </div>
            <select
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-black"
            >
              <option value={"javascript"}>JavaScript</option>
              <option value={"python"}>Python</option>
              <option value={"cpp"}>C++</option>
              <option value={"java"}>Java</option>
              <option value={"go"}>Go</option>
              <option value={"rust"}>Rust</option>
              <option value={"php"}>PhP</option>
            </select>
            <button>
              New
            </button>
            <button>
              Download
            </button>
          </div>
          <button
            className="py-2 bg-red-600 rounded-sm"
            onClick={leaveRoom}
          >
            Leave
          </button>

        </div>
        <Editor
          onChangeHandler={sendChange}
          remoteChange={remoteChange}
          initialValue={initValue}
          language={language}
        />
      </div>
    </section>
  )

}
