import { useGame } from '../context/GameContext'
import './ResultScreen.css'

export default function ResultScreen({ mode, isHost, players, secretWord, winner, onDeclareWinner }) {
  const { reset } = useGame()

  const showChoice = !winner && (mode === 'local' || isHost)

  return (
    <div className="result">
      {showChoice ? (
        <div className="result-choice">
          <h2 className="result-choice-title">¿Quien gano?</h2>
          <div className="result-choice-buttons">
            <button
              className="result-choice-btn civilians"
              onClick={() => onDeclareWinner('civilians')}
            >
              Ganaron los civiles
            </button>
            <button
              className="result-choice-btn impostor"
              onClick={() => onDeclareWinner('impostor')}
            >
              Gano el impostor
            </button>
          </div>
        </div>
      ) : winner ? (
        <>
          <div className={`result-banner ${winner === 'civilians' ? 'win' : 'lose'}`}>
            <div className="result-banner-icon">
              {winner === 'civilians' ? '🎉' : '😈'}
            </div>
            <h2 className="result-banner-title">
              {winner === 'civilians'
                ? '¡Los civiles ganan!'
                : '¡El impostor gana!'}
            </h2>
            <p className="result-banner-sub">
              {winner === 'civilians'
                ? 'Los civiles descubrieron al impostor'
                : 'El impostor logro escapar'}
            </p>
          </div>

          {secretWord && (
            <div className="result-reveal">
              <div className="result-secret">
                <span className="result-secret-label">Palabra secreta:</span>
                <span className="result-secret-word">"{secretWord}"</span>
              </div>
            </div>
          )}

          <div className="result-players">
            <h3 className="result-players-title">Jugadores</h3>
            <div className="result-players-list">
              {players.map(p => (
                <div key={p.id} className="result-player">
                  <span className="result-player-avatar">{p.name[0].toUpperCase()}</span>
                  <span className="result-player-name">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="result-waiting">
          <p>Esperando a que el host declare el resultado...</p>
        </div>
      )}

      <div className="result-actions">
        <button className="result-play-again" onClick={reset}>
          Jugar de nuevo
        </button>
      </div>
    </div>
  )
}
