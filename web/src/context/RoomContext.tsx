import { User } from '@/model/User';
import { createContext, useContext, ReactNode, useState } from 'react';
import { v4 as uuid } from 'uuid';

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
  socket: WebSocket | null;
  hasJoined: boolean;
  remoteChange: Change | null;
  initValue: string,
  joinRoom: (roomId: number, username: string) => Promise<void>;
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

}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [remoteChange, setRemoteChange] = useState<Change | null>(null);
  const [initValue, setInitValue] = useState("")
  const [userId] = useState(uuid())
  const [usersInRoom, setUsersInRoom] = useState<User[]>([])
  const [alertMessage, setAlertMessage] = useState("")
  const [language, setLanguage] = useState('javascript');


  const joinRoom = (roomId: number, username: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const newSocket = new WebSocket(`${import.meta.env.VITE_WS_URL}?roomId=${roomId}&userId=${userId}&username=${username}`);

      newSocket.onopen = () => {
        resolve()
        setHasJoined(true);
        console.log("socket connection is set up")
      };

      newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.event || data.type) {
          case "change":
            if (data.userId !== userId) {
              setRemoteChange(data.change);
            }
            break;

          case "init":
            setInitValue(data.program);
            setLanguage(data.language);
            break;

          case "user_rejoin":
            setUsersInRoom(data.usersInRoom);
            if (data.userId !== userId) {
              const user = data.usersInRoom.find((user: any) => user.userId === data.userId);
              setAlertMessage(`${user.userName} rejoined room`);
            }
            break;

          case "new_user_joined":
            setUsersInRoom(data.usersInRoom);
            if (data.userId !== userId) {
              const user = data.usersInRoom.find((user: any) => user.userId === data.userId);
              setAlertMessage(`${user.userName} joined room`);
            }
            break;

          case "new_program":
            if (data.userId !== userId) {
              setInitValue("//some comment");
            }
            break;

          case "user_leave":
            if (data.userId !== userId) {
              setAlertMessage(`${userId} left room`);
            }
            setUsersInRoom([...data.usersInRoom]);
            break;

          case "lang_change":
            if (data.userId !== userId) {
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

      setSocket(newSocket);
    })

  };

  const sendChange = (change: Change) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "change",
          change,
          userId: userId
        })
      );
    }
  };

  const sendJoined = (type: string) => {

    if (socket?.readyState === WebSocket.OPEN) {
      if (type === "New_User_Join") {

        socket.send(
          JSON.stringify({
            event: "new_user_joined",
            change: null,
            userId: userId
          })
        )
      } else {
        socket.send(
          JSON.stringify({
            event: "user_rejoin",
            change: null,
            userId: userId
          })
        )
      }
    }
  }

  const leaveRoom = () => {
    console.log("leave room clicked")
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        (
          JSON.stringify({
            event: "user_leave",
            change: null,
            userId: userId
          })
        )
      )
      socket.close()
      setHasJoined(false)
    }

  }

  //below code for new instance creation is not used  
  // when the user clicks "New" button, sendChange performs setting the new code for other editor instances in the room
  const createNewInstance = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          event: "new_program",
          change: null,
          userId: userId
        })
      )
    }

    setInitValue("//some comment")
  }

  const programmingLanguageChange = (lang: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          event: "lang_change",
          language: lang,
          change: null,
          userId: userId
        })
      )
    }

  }

  return (
    <RoomContext.Provider value={{ programmingLanguageChange, alertMessage, setAlertMessage, leaveRoom, sendJoined, socket, initValue, hasJoined, remoteChange, joinRoom, sendChange, userId, usersInRoom, createNewInstance, language, setLanguage }}>
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
