import React from 'react'
import ReactDOM from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import '../../src/index.css'
import { useLangStore } from '../../src/i18n'
import Home from '../../src/pages/Home'
import Lobby from '../../src/pages/Lobby'
import RoleReveal from '../../src/pages/RoleReveal'
import Night from '../../src/pages/Night'
import Discuss from '../../src/pages/Discuss'
import Vote from '../../src/pages/Vote'
import Mission from '../../src/pages/Mission'
import End from '../../src/pages/End'
import Referee from '../../src/pages/Referee'
import LangToggle from '../../src/components/ui/LangToggle'
import { buildScenario } from './scenario'

const params = new URLSearchParams(location.search)
const screen = params.get('screen') || 'home'
useLangStore.getState().setLang(params.get('lang') || 'en')

const demo = buildScenario(screen)
window.__demo = demo
const { room, me, secret } = demo
const noop = () => {}

const pages = {
  home: <Home />,
  lobby: <Lobby room={room} me={me} onLeave={noop} />,
  reveal: <RoleReveal room={room} me={me} secret={secret} />,
  night: <Night room={room} me={me} secret={secret} />,
  discuss: <Discuss room={room} me={me} />,
  vote: <Vote room={room} me={me} />,
  mission: <Mission room={room} me={me} secret={secret} />,
  end: <End room={room} me={me} onLeave={noop} />,
  referee: (
    <Routes><Route path="/room/:roomId/referee" element={<Referee />} /></Routes>
  ),
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <MemoryRouter initialEntries={[`/room/${room.id}/referee`]}><LangToggle />{pages[screen]}</MemoryRouter>
)

// Role card starts face down; flip it like a player would.
if (screen === 'reveal') {
  setTimeout(() => [...document.querySelectorAll('button')].find(b => /Reveal|查看/.test(b.textContent))?.click(), 300)
}
