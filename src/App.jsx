import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Room from './pages/Room'
import Referee from './pages/Referee'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomId" element={<Room />} />
      <Route path="/room/:roomId/referee" element={<Referee />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
