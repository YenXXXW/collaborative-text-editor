import { Routes, Route } from "react-router-dom"
import Home from "./pages/home"
import JoinRoom from "./pages/JoinRoom"
import { RoomProvider } from "./context/RoomContext"
import Room from "./pages/Room"

function App() {
  return (
    <RoomProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </RoomProvider>
  )
}

export default App
