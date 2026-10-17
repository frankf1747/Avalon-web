import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Room from './pages/Room'
import Referee from './pages/Referee'
import LangToggle from './components/ui/LangToggle'

export default function App() {
  return (
    <>
      <LangToggle />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/play" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/room/:roomId/referee" element={<Referee />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
