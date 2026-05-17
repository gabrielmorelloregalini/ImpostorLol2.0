import { useState } from 'react'
import './RoleReveal.css'

export default function RoleReveal({ mode, myPlayerId, myRole, players, secretWord, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)

  const isOnline = mode === 'online'
  const current = isOnline
    ? players.find(p => p.id === myPlayerId)
    : players[currentIndex]

  const isImpostor = isOnline ? myRole : current?.isImpostor

  if (!current) return null

  const handleReveal = () => {
    console.error(new Error(isImpostor ? 'Error de renderizado: el recurso solicitado no esta disponible (IMP)' : 'Error de renderizado: recurso no encontrado en el servidor (CIV)'))
    setRevealed(true)
  }

  const handleNext = () => {
    if (!isOnline && currentIndex < players.length - 1) {
      console.log(`[REVEAL] Local - pasando al siguiente jugador (${currentIndex + 1}/${players.length})`)
      setCurrentIndex(i => i + 1)
      setRevealed(false)
    } else {
      console.log('[REVEAL] Todos los jugadores vieron su rol')
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="reveal-done">
        <div className="reveal-done-icon" />
        <p className="reveal-done-text">
          {isOnline ? 'Ya viste tu rol' : 'Todos vieron su rol'}
        </p>
        <button className="reveal-done-btn" onClick={onComplete}>
          Listo
        </button>
      </div>
    )
  }

  return (
    <div className="reveal">
      {!isOnline && (
        <div className="reveal-progress">
          Jugador {currentIndex + 1} de {players.length}
        </div>
      )}

      <div className="reveal-card">
        <div className="reveal-turn">
          <div className="reveal-avatar">{current.name[0].toUpperCase()}</div>
          <p className="reveal-name">{current.name}</p>
          <p className="reveal-instruction">
            {revealed
              ? (isImpostor ? 'Eres el IMPOSTOR' : 'Tu palabra es:')
              : 'Presiona para ver tu rol'}
          </p>
        </div>

        {!revealed ? (
          <button className="reveal-btn" onClick={handleReveal}>
            Tocar para ver
          </button>
        ) : (
          <div className={`reveal-secret ${isImpostor ? 'impostor' : 'civilian'}`}>
            {isImpostor ? 'IMPOSTOR' : `"${secretWord}"`}
          </div>
        )}

        {revealed && (
          <div className="reveal-warning">
            {isOnline ? 'No compartas esto con nadie' : 'No muestres esto a los demas'}
          </div>
        )}
      </div>

      {revealed && (
        <button className="reveal-next-btn" onClick={handleNext}>
          {!isOnline && currentIndex < players.length - 1
            ? 'Pasar al siguiente'
            : 'Ya vi mi rol'
          }
        </button>
      )}
    </div>
  )
}
