import './App.css'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import JoinRoomPage from './pages/JoinRoom'
import Editor from './components/Editor'
import EditorReact from './components/EditorReact'

function App() {


  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/editor" element={<EditorReact />} />
        <Route path="/join-room" element={<JoinRoomPage />} />
      </Routes>
    </>
  )
}

export default App
