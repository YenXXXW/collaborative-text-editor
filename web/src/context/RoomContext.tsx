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
  joinRoom: (roomId: number) => void;
  sendChange: (change: Change) => void;
  userId: string;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [remoteChange, setRemoteChange] = useState<Change | null>(null);
  const [initValue, setInitValue] = useState("")
  const [userId] = useState(uuid())

  const joinRoom = (roomId: number) => {
    console.log(userId)
    const newSocket = new WebSocket(`ws://localhost:8080/v1/ws?roomId=${roomId}&userId=${userId}`);

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

  return (
    <RoomContext.Provider value={{ socket, initValue, hasJoined, remoteChange, joinRoom, sendChange, userId }}>
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
