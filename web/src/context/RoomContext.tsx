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
  userId: string;
  usersInRoom: string[]
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [remoteChange, setRemoteChange] = useState<Change | null>(null);
  const [initValue, setInitValue] = useState("")
  const [userId] = useState(uuid())
  const [usersInRoom, setUsersInRoom] = useState<string[]>([])

  const joinRoom = (roomId: number, username: string) => {
    console.log(userId)
    const newSocket = new WebSocket(`ws://localhost:8080/v1/ws?roomId=${roomId}&userId=${userId}&username=${username}`);

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
      }
      if (data.event === "new_user_joined") {

        setUsersInRoom(data.usersInRoom)
        if (data.userId !== userId) {
          alert(`${userId} has joined`)
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

  return (
    <RoomContext.Provider value={{ sendJoined, socket, initValue, hasJoined, remoteChange, joinRoom, sendChange, userId, usersInRoom }}>
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
