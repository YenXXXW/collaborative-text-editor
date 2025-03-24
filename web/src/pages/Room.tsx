import { useEffect, useState } from "react"
import Editor from "@/components/EditorReact"
import { useRoom } from "@/context/RoomContext"
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { User } from "@/model/User"
import { IoCopyOutline, IoCopySharp } from "react-icons/io5"
import LOGO from "@/assets/logo.png"

export default function Room() {
  const location = useLocation();
  const userName = location.state?.username;

  const navigate = useNavigate()

  const { roomId } = useParams()
  const { leaveRoom, userId, remoteChange, sendChange, initValue, usersInRoom } = useRoom()
  const [language, setLanguage] = useState('javascript');
  const [copied, setCopied] = useState(false)
  const [totalUsersInRoom, setTotalUsersInRoom] = useState<User[]>([
    {
      userId,
      userName: userName ?? "wai"
    }
  ]);


  const colors = [
    "#4a3bc3",
    "#9c340b",
    "#0f16cb"
  ]

  const handleLeavRoom = () => {
    leaveRoom()
    navigate("/")

  }

  useEffect(() => {
    if (usersInRoom.length > 0) {
      setTotalUsersInRoom(usersInRoom)

    }
  }, [usersInRoom])

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false)
      }, 2000)

    }
  }, [copied])

  const copyToClipboard = () => {
    if (!roomId) return

    navigator.clipboard.writeText(roomId)
      .then(() => setCopied(true))
      .catch(() => setCopied(false))

  }

  return (
    <section className="w-screen h-screen flex">
      <div className="">
        <div className="h-[4vh] px-3 text-white text-sm  bg-neutral-800 flex  justify-between ">

          <div className="flex items-center">
            <img src={LOGO} width={40} height={40} />
            <h3 className="font-mono text-red-600 font-bold">
              Code Collab
            </h3>
          </div>
          <div className="flex ">
            <div className="flex items-center gap-3 ">
              <p>
                RoomId
              </p>
              <div className="rounded-sm flex gap-3 px-2 py-1 bg-neutral-900">
                {roomId}

                <button onClick={copyToClipboard}>
                  {
                    copied ?
                      <IoCopySharp />
                      :
                      <IoCopyOutline />
                  }

                </button>
              </div>
            </div>
            {/*             
            <div>
              Users in Room
              <div className="flex gap-4">
                {
                  totalUsersInRoom.map((user) =>
                    <div key={user.userId} className="flex flex-col items-center">
                      <div className={`w-9 text-center ${user.userId === userId ? "bg-blue-600" : "bg-red-700"} py-2 px-3 rounded-md`}>
                        {user.userName[0]}
                      </div>
                      {user.userName}
                    </div>
                  )
                }
              </div>

          </div>
*/}

            <select
              onChange={(e) => setLanguage(e.target.value)}
              className="focus:outline-none bg-black"
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
            onClick={handleLeavRoom}
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
      <div className="w-[20vw]">
        hello
      </div>
    </section>
  )

}
