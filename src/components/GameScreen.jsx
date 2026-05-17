import { useGame } from '../context/GameContext'
import RoleReveal from './RoleReveal'
import ResultScreen from './ResultScreen'
import './GameScreen.css'

export default function GameScreen() {
  const { phase, mode, players, secretWord, winner, isHost, myPlayerId, revealComplete, declareWinner } = useGame()

  if (phase === 'roleReveal') {
    // In local mode, we need to generate roleState from players
    // In online mode, each player gets their own role from the server
    return (
      <div className="game">
        <div className="game-content">
          <RoleReveal
            mode={mode}
            isHost={isHost}
            myPlayerId={myPlayerId}
            players={players}
            secretWord={secretWord}
            onComplete={revealComplete}
          />
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    return (
      <div className="game">
        <div className="game-content">
          <ResultScreen
            mode={mode}
            isHost={isHost}
            players={players}
            secretWord={secretWord}
            winner={winner}
            onDeclareWinner={declareWinner}
          />
        </div>
      </div>
    )
  }

  return null
}
