import { useGame } from '../context/GameContext'
import RoleReveal from './RoleReveal'
import './GameScreen.css'

export default function GameScreen() {
  const { players, secretWord, myPlayerId, myRole, mode, revealComplete } = useGame()

  return (
    <div className="game">
      <div className="game-content">
        <RoleReveal
          mode={mode}
          myPlayerId={myPlayerId}
          myRole={myRole}
          players={players}
          secretWord={secretWord}
          onComplete={revealComplete}
        />
      </div>
    </div>
  )
}
