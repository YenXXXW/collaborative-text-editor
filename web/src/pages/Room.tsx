import { useRef, useEffect, useState } from "react"
import Editor, { EditorReactRef } from "@/components/EditorReact"
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
  const { hasJoined, programmingLanguageChange, joinRoom, alertMessage, setAlertMessage, leaveRoom, userId, remoteChange, sendChange, initValue, usersInRoom, language, setLanguage } = useRoom()
  const [copied, setCopied] = useState(false)
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

  //const colors = [
  //"#4a3bc3",
  //"#9c340b",
  //"#0f16cb"
  //]
  //
  const handleLeavRoom = () => {
    leaveRoom()
    navigate("/")

  }

  useEffect(() => {
    if (!hasJoined) {
      const userName = localStorage.getItem("userName")
      joinRoom(roomId, userName)

    }
  }, [])

  useEffect(() => {
    if (alertMessage !== "") {
      setTimeout(() => {
        setAlertMessage("")
      }, 3000)
    }

  }, [alertMessage])

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

    const editorInstance = editorRef.current?.getEditorInstance();

    if (!editorInstance) {
      console.error("Editor instance not found.");
      return;
    }

    editorInstance.setValue("//some comment")

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

  const handleLanguageChange = (language: string) => {
    setLanguage(language)
    programmingLanguageChange(language)


  }


  return (
    <section className="w-screen h-screen relative bg-neutral-800 text-white ">

      <div className="absolute z-30 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {

          alertMessage !== "" &&
          <div className="w-80 border-zinc-600 border rounded-sm p-10">
            <p className="text-white/80 text-sm">{alertMessage}</p>
            <button onClick={() => setAlertMessage("")}
              className="block ml-auto mt-5 bg-white text-black font-semibold py-2 px-3 rounded-md "
            >
              Close
            </button>
          </div>

        }
      </div>
      <div className="h-[6vh] px-3 text-white text-sm  flex border-b border-b-zinc-600 justify-between ">
        <div className="flex items-center">
          <img src={LOGO} width={40} height={40} />
          <h3 className="font-mono text-red-600 font-bold">
            Code Collab
          </h3>
        </div>
        <div className="flex w-[40vw] justify-between px-5">
          <div className="flex relative items-center gap-3 ">
            <div className="flex gap-2 items-center">
              <p>
                RoomId
              </p>
              <div className="rounded-sm flex gap-3 px-3 py-1 bg-[#0a0a14]">
                {roomId}

                <button onClick={copyToClipboard} className="mb-1">
                  {
                    copied ?
                      <IoCopySharp size={12} />
                      :
                      <IoCopyOutline size={12} />
                  }

                </button>
              </div>
            </div>
          </div>

          <select
            onChange={(e) => handleLanguageChange(e.target.value)}
            value={language}
            className="focus:outline-none bg-neutral-800 "
          >
            {Object.keys(languages).map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <button onClick={handleCreateNewInstance}>
            New
          </button>
          <button onClick={handleDownload}>
            Download
          </button>

        </div>

      </div>
      <div className="flex bg-neutral-800">
        <Editor
          ref={editorRef}
          onChangeHandler={sendChange}
          remoteChange={remoteChange}
          initialValue={initValue}
          language={language}
        />

        <div className="w-[20vw] flex flex-col justify-between pt-5 pb-10 px-4">
          <div>
            Participants
            <div className="my-4">
              {
                totalUsersInRoom.map((user) =>
                  <div key={user.userId} className="flex gap-3 items-center my-4">
                    <div className={`w-9 text-center ${user.userId === userId ? "bg-blue-600" : "bg-red-700"} py-2 px-3 rounded-lg`}>
                      {user.userName[0]}
                    </div>
                    {user.userName}
                  </div>
                )
              }
            </div>

          </div>

          <button
            className="py-2 px-3 bg-red-600 rounded-sm mx-3"
            onClick={handleLeavRoom}
          >
            Leave
          </button>
        </div>
      </div>


    </section>
  )

}
