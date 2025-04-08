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
  joinRoom: (roomId: number, username: string) => void;
  sendChange: (change: Change) => void;
  sendJoined: () => void;
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


  const joinRoom = (roomId: number, username: string) => {
    console.log(userId)
    const newSocket = new WebSocket(`wss://collaborative-text-editor-tulc.onrender.com/v1/ws?roomId=${roomId}&userId=${userId}&username=${username}`);

    newSocket.onopen = () => {
      setHasJoined(true);
      console.log("socket connection is set up")
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "change" && data.userId !== userId) {
        setRemoteChange(data.change);
      }
      if (data.type === "init") {
        setInitValue(data.program)
        setLanguage(data.language)
      }
      if (data.event === "new_user_joined") {

        setUsersInRoom(data.usersInRoom)
        if (data.userId !== userId) {
          setAlertMessage(`${userId} joined room `)
        }
      }
      if (data.event === "new_program") {
        if (data.userId !== userId) {
          setInitValue("//some comment")
        }
      }
      if (data.event === "user_leave") {
        if (data.userId !== userId) {
          setAlertMessage(`${userId} left room `)
        }
        setUsersInRoom([...data.usersInRoom])
      }

      if (data.event === "lang_change") {
        if (data.userId !== userId) {
          console.log("languate change", data.language)
          setLanguage(data.language)
        }
      }

    };

    newSocket.onerror = (error) => {
      console.error("Error connecting to the socket", error);
    };

    newSocket.onclose = () => {
      console.log("Socket connection closed");
      setHasJoined(false);
    };

    setSocket(newSocket);
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

  const sendJoined = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          event: "new_user_joined",
          change: null,
          userId: userId
        })
      )
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
