import {  Routes, Route } from "react-router-dom"
import Home from "./pages/home"
import JoinRoom from "./pages/JoinRoom"
import { RoomProvider } from "./context/RoomContext"

function App() {
  return (
    <RoomProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join-room" element={<JoinRoom />} />
        </Routes>
    </RoomProvider>
  )
}

export default App
