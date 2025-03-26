import { useRef, useEffect, useState } from "react"
import Editor, { EditorReactRef } from "@/components/EditorReact"
import { useRoom } from "@/context/RoomContext"
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { User } from "@/model/User"

import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { IoCopyOutline, IoCopySharp } from "react-icons/io5"
import LOGO from "@/assets/logo.png"

export default function Room() {
  const location = useLocation();
  const userName = location.state?.username;

  const navigate = useNavigate()

  const { roomId } = useParams()
  const { leaveRoom, userId, remoteChange, sendChange, initValue, usersInRoom, createNewInstance } = useRoom()
  const [language, setLanguage] = useState('javascript');
  const [copied, setCopied] = useState(false)
  const [roomIdShown, setRoomIdShown] = useState(false)
  const [totalUsersInRoom, setTotalUsersInRoom] = useState<User[]>([
    {
      userId,
      userName: userName ?? "wai"
    }
  ]);



  const languages: Record<string, string> = {
    "javascript": "js",
    "java": "java",
    "php": "php",
    "go": "go",
    "cpp": "cpp",
    "rust": "rs",
    "python": "py"

  }

  const editorRef = useRef<EditorReactRef | null>(null);

  const colors = [
    "#4a3bc3",
    "#9c340b",
    "#0f16cb"
  ]

  const handleLeavRoom = () => {
    leaveRoom()
    navigate("/")

  }

  const handleDownload = () => {
    const editorInstance = editorRef.current?.getEditorInstance();


    if (!editorInstance) {
      console.error("Editor instance not found.");
      return;
    }

    const content = editorInstance.getValue();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    console.log(language)
    a.download = `code.${languages[language]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const handleCreateNewInstance = () => {

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
    <section className="w-screen h-screen  bg-neutral-800 text-white ">
      <div className="h-[6vh] px-3 text-white text-sm  flex  justify-between ">
        <div className="flex items-center">
          <img src={LOGO} width={40} height={40} />
          <h3 className="font-mono text-red-600 font-bold">
            Code Collab
          </h3>
        </div>
        <div className="flex w-[40vw] justify-between px-5">
          <div className="flex relative items-center gap-3 ">
            <div className="flex gap-5">
              <p>
                RoomId
              </p>
              <button onClick={() => setRoomIdShown(!roomIdShown)}>
                {

                  roomIdShown ?
                    <IoIosArrowUp />
                    :
                    <IoIosArrowDown />
                }
              </button>
            </div>
            <div className={`${!roomIdShown && "hidden"} z-20 absolute bottom-[-40%]`}>
              <div className="rounded-sm flex gap-3  py-1 bg-neutral-800">
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
          </div>

          <select
            onChange={(e) => setLanguage(e.target.value)}
            className="focus:outline-none bg-neutral-800 "
          >
            {Object.keys(languages).map(lang => (
              <option value={lang}>{lang}</option>
            ))}
          </select>
          <button onClick={createNewInstance}>
            New
          </button>
          <button onClick={handleDownload}>
            Download
          </button>

          <button
            className="py-2 bg-red-600 rounded-sm"
            onClick={handleLeavRoom}
          >
            Leave
          </button>
        </div>

      </div>
      <div className="flex">
        <Editor
          ref={editorRef}
          onChangeHandler={sendChange}
          remoteChange={remoteChange}
          initialValue={initValue}
          language={language}
        />

        <div className="w-[20vw]">
          <div>
            Users in Room
            <div className="">
              {
                totalUsersInRoom.map((user) =>
                  <div key={user.userId} className="flex items-center">
                    <div className={`w-9 text-center ${user.userId === userId ? "bg-blue-600" : "bg-red-700"} py-2 px-3 rounded-md`}>
                      {user.userName[0]}
                    </div>
                    {user.userName}
                  </div>
                )
              }
            </div>

          </div>
        </div>
      </div>


    </section>
  )

}
