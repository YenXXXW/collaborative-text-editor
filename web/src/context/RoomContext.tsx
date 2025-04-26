import { User } from '@/model/User';
import { createContext, useContext, ReactNode, useState, useRef, useEffect } from 'react';

interface Change {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
  text: string;
  rangeLength: number;
  userId?: string;
}

interface RoomContextType {
  wsconnstatus: boolean;
  hasJoined: boolean;
  remoteChange: Change | null;
  initValue: string,
  joinRoom: (roomId: number, username: string, userId: string) => Promise<void>;
  sendChange: (change: Change) => void;
  sendJoined: (type: string) => void;
  leaveRoom: () => void;
  userId: string;
  usersInRoom: User[]
  alertMessage: string,
  setAlertMessage: React.Dispatch<React.SetStateAction<string>>,
  createNewInstance: () => void,
  programmingLanguageChange: (lang: string) => void,
  language: string,
  setLanguage: React.Dispatch<React.SetStateAction<string>>,
  setUserId: React.Dispatch<React.SetStateAction<string>>
  newProgramInstance: () => void
  remoteNewInstanceFlag: boolean
  resetRemoteNewProgramChangeFlag: () => void

}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [hasJoined, setHasJoined] = useState(false);
  const [remoteChange, setRemoteChange] = useState<Change | null>(null);
  const [initValue, setInitValue] = useState("")
  const [userId, setUserId] = useState('')
  const [usersInRoom, setUsersInRoom] = useState<User[]>([])
  const [alertMessage, setAlertMessage] = useState("")
  const [language, setLanguage] = useState('javascript');
  const wsconnstatusRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null)


  const userIdRef = useRef('')

  //when the other users click the New
  const [remoteNewInstanceFlag, setRemoteNewInstanceFlag] = useState(false);

  useEffect(() => {
    userIdRef.current = userId;
    console.log("userId in context", userIdRef)
  }, [userId]);

  const joinRoom = (roomId: number, username: string, UserId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (socketRef.current) {
        return
      }



      console.log("userId before the ws", userIdRef.current)
      const newSocket = new WebSocket(`${import.meta.env.VITE_WS_URL}?roomId=${roomId}&userId=${UserId}&username=${username}`);
      socketRef.current = newSocket

      newSocket.onopen = () => {
        setHasJoined(true);
        resolve()
        console.log("socket connection is set up")
      };

      newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.event || data.type) {
          case "change":

            if (data.userId !== userIdRef.current) {

              console.log(data)
              console.log(userIdRef)
              setRemoteChange(data.change);
            }
            break;

          case "init":
            setInitValue(data.program);
            setLanguage(data.language);
            break;

          case "user_rejoin":
            setUsersInRoom(data.usersInRoom);
            if (data.userId !== userIdRef.current) {
              const user = data.usersInRoom.find((user: any) => user.userId === data.userId);
              setAlertMessage(`${user.userName} rejoined room`);
            }
            break;

          case "new_user_joined":
            setUsersInRoom(data.usersInRoom);
            if (data.userId !== userIdRef.current) {
              const user = data.usersInRoom.find((user: any) => user.userId === data.userId);
              setAlertMessage(`${user.userName} joined room`);
            }

            setUsersInRoom([...data.usersInRoom]);
            break;

          case "new_program":
            if (data.userId !== userIdRef.current) {
              setRemoteNewInstanceFlag(true)
            }
            break;

          case "user_leave":
            if (data.userId !== userIdRef.current) {

              setAlertMessage(`${data.leaveuser.userName} left room`);
            }
            console.log("users in room", ...data.usersInRoom)
            setUsersInRoom([...data.usersInRoom]);
            break;

          case "lang_change":
            if (data.userId !== userIdRef.current) {

              console.log("language change", data.language);
              setLanguage(data.language);
            }
            break;

          default:
            // handle unknown event/type if needed
            break;
        }


      };

      newSocket.onerror = (error) => {
        reject()
        console.error("Error connecting to the socket", error);
      };

      newSocket.onclose = () => {
        console.log("Socket connection closed");
        setHasJoined(false);
      };

    })

  };

  const sendChange = (change: Change) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "change",
          change,
          userId: userIdRef.current
        })
      );
    }
  };

  const sendJoined = (type: string) => {

    if (socketRef.current) {
      if (type === "New_User_Join") {


        socketRef.current.send(
          JSON.stringify({
            event: "new_user_joined",
            change: null,
            userId: userIdRef.current
          })
        )
      } else {
        socketRef.current.send(
          JSON.stringify({
            event: "user_rejoin",
            change: null,
            userId: userIdRef.current
          })
        )
      }
    } else {
      console.log("ws connetion is not ready")
    }
  }

  const leaveRoom = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        (
          JSON.stringify({
            event: "user_leave",
            change: null,
            userId: userIdRef.current
          })
        )
      )
      socketRef.current.close(1000, 'user left the room')
      socketRef.current = null
      wsconnstatusRef.current = false
      setHasJoined(false)
    }

  }

  //below code for new instance creation is not used  
  // when the user clicks "New" button, sendChange performs setting the new code for other editor instances in the room
  const createNewInstance = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          event: "new_program",
          change: null,
          userId: userIdRef.current
        })
      )
    }

    setInitValue("//some comment")
  }

  const programmingLanguageChange = (lang: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          event: "lang_change",
          language: lang,
          change: null,
          userId: userIdRef.current
        })
      )
    }

  }

  const newProgramInstance = () => {

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          event: "new_program",
          change: null,
          userId: userIdRef.current
        })
      )
    }

  }

  const resetRemoteNewProgramChangeFlag = () => {
    setRemoteNewInstanceFlag(false)

  }

  return (
    <RoomContext.Provider
      value={{
        setUserId,
        programmingLanguageChange,
        alertMessage,
        setAlertMessage,
        leaveRoom,
        sendJoined,
        wsconnstatus: wsconnstatusRef.current,
        initValue,
        hasJoined,
        remoteChange,
        joinRoom,
        sendChange,
        userId,
        usersInRoom,
        createNewInstance,
        language,
        setLanguage,
        newProgramInstance,
        remoteNewInstanceFlag: remoteNewInstanceFlag,
        resetRemoteNewProgramChangeFlag: resetRemoteNewProgramChangeFlag
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('context undefined');
  }
  return context;
} 
