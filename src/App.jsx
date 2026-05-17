import { GameProvider } from './context/GameContext'
import AppContent from './AppContent'
import './App.css'

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  )
}

export default App
