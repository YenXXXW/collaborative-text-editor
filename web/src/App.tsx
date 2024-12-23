import './App.css'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import JoinRoomPage from './pages/JoinRoom'

function App() {


  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/join-room" element={<JoinRoomPage />} />
      </Routes>
    </>
  )
}

export default App
