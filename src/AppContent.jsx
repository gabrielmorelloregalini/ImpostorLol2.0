import { useGame } from './context/GameContext'
import HomeScreen from './components/HomeScreen'
import OnlineLobby from './components/OnlineLobby'
import GameScreen from './components/GameScreen'

export default function AppContent() {
  const { phase } = useGame()

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">El Impostor de LOL</h1>
        <p className="app-subtitle">Juego de deduccion social</p>
      </div>
      <main className="app-main">
        {phase === 'home' && <HomeScreen />}
        {phase === 'lobby' && <OnlineLobby />}
        {(phase === 'roleReveal' || phase === 'result') && <GameScreen />}
      </main>
    </div>
  )
}
