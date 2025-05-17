import { useRef, useEffect, useState } from "react"
import Editor, { EditorReactRef } from "@/components/EditorReact"
import { useRoom } from "@/context/RoomContext"
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { User } from "@/model/User"
import { IoCopyOutline, IoCopySharp } from "react-icons/io5"
import LOGO from "@/assets/logo.png"
import LoadingSpinner from "@/components/LoadingSpinner"
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import { JoinRoomService } from "@/services/joinRoomService"

export default function Room() {
  const location = useLocation();
  const userName = location.state?.username;


  const navigate = useNavigate()
  const { roomId } = useParams()
  const newInstanceCreateRef = useRef(false)
  const { resetRemoteNewProgramChangeFlag, remoteNewInstanceFlag, newProgramInstance, setUserId, sendJoined, hasJoined, programmingLanguageChange, joinRoom, alertMessage, setAlertMessage, leaveRoom, remoteChange, sendChange, initValue, usersInRoom, language, setLanguage } = useRoom()
  const [copied, setCopied] = useState(false)
  const userId = localStorage.getItem("cteuserId")
  const [userLeave, setUserLeave] = useState(false)
  const [showSiderBar, setShowSiderBar] = useState(false)
  const [totalUsersInRoom, setTotalUsersInRoom] = useState<User[]>([
    {
      userId: userId!,
      userName: userName
    }
  ]);

  useEffect(() => {
    console.log("showSidebar", showSiderBar)
  }, [showSiderBar])


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
    setUserLeave(true)
    leaveRoom()
    navigate("/", { replace: true })

  }



  const rejoin = async (roomId: number, userName: string) => {
    const userId = localStorage.getItem("cteuserId")
    if (!userId) return
    setUserId(userId)
    await joinRoom(roomId, userName, userId)
    sendJoined("Rejoin")
  }

  useEffect(() => {
    if (!hasJoined && !userLeave) {
      const userName = localStorage.getItem("cteusername")

      if (roomId && userName) {
        rejoin(parseInt(roomId), userName)
      }

    }
  }, [hasJoined])


  useEffect(() => {
    if (remoteNewInstanceFlag) {
      newInstanceCreateRef.current = true
      const editorInstance = editorRef.current?.getEditorInstance()
      editorInstance?.setValue('// some comment')
      resetRemoteNewProgramChangeFlag()
      //this is not good but this will casue one effect only as the resetRemoteNewProgramChangeRef only run the remoteNewInstance RRef is true  
    }
  }, [remoteNewInstanceFlag])

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
    a.download = `code.${languages[language]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const handleCreateNewInstance = () => {
    try {
      newInstanceCreateRef.current = true
      newProgramInstance()

      const editorInstance = editorRef.current?.getEditorInstance();
      if (!editorInstance) {
        throw new Error("Editor instance not found.");
      }

      editorInstance.setValue("//some comment")
    } catch (err) {
      console.error("error creating new program instance", err)

    }

  }

  const handleRunCode = async () => {
    try {
      await JoinRoomService.runcode()
    } catch (err) {
    }


  }


  useEffect(() => {
    if (usersInRoom.length > 0) {
      const thisuser = usersInRoom.find(user => user.userId == userId)
      const otherUsers = usersInRoom.filter(user => user.userId !== userId)

      if (thisuser) {

        const sortedusers = [thisuser, ...otherUsers]
        setTotalUsersInRoom(sortedusers)
      }

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
      {
        hasJoined ?
          <>

            <div className="absolute z-30 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {

                alertMessage !== "" &&
                <div className="w-60 border-zinc-600 border rounded-sm p-10">
                  <p className="text-white/80 text-md font-semibold">{alertMessage}</p>
                  <button onClick={() => setAlertMessage("")}
                    className="block ml-auto mt-5 bg-white text-black font-semibold py-1 px-2 rounded-md "
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

                <button onClick={handleRunCode}>
                  Run
                </button>
                <button onClick={() => setShowSiderBar(!showSiderBar)}>
                  <HiOutlineMenuAlt3 size={21} />
                </button>
              </div>

            </div>
            <div className="flex bg-neutral-800">
              <div className={`${showSiderBar ? 'w-[80vw]' : 'w-[100vw]'}`}>
                <Editor
                  ref={editorRef}
                  onChangeHandler={(change) => {
                    if (userId)
                      if (!newInstanceCreateRef.current) {
                        sendChange(change)
                      } else {
                        newInstanceCreateRef.current = false;
                      }

                  }}
                  remoteChange={remoteChange}
                  initialValue={initValue}
                  language={language}
                />
              </div>

              {
                <div
                  className={`fixed top-[6vh] right-0 h-[94vh] bg-neutral-900 shadow-lg w-[20vw] flex flex-col justify-between pt-5 pb-10 px-4
    transition-transform duration-300 ease-in-out
    ${showSiderBar ? 'translate-x-0' : 'translate-x-full'}
  `}
                >
                  <div>
                    Participants
                    <div className="my-4">
                      {
                        totalUsersInRoom.map((user, i) =>
                          <div key={i} className="flex gap-3 items-center my-4">
                            <div className={`w-9 text-center ${user.userId === userId ? "bg-green-600" : "bg-blue-500"} py-2 px-3 rounded-lg`}>
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
              }
            </div>
          </>

          :
          <LoadingSpinner />
      }


    </section >

  )

}
