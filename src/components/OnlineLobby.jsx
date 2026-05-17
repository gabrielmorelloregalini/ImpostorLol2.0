import { useState } from 'react'
import wordPacks from '../data/words'
import { useGame } from '../context/GameContext'
import './OnlineLobby.css'

export default function OnlineLobby() {
  const { players, roomCode, isHost, startOnlineGame, reset } = useGame()
  const [selectedPack, setSelectedPack] = useState(Object.keys(wordPacks)[0])
  const [numImpostors, setNumImpostors] = useState(1)

  const canStart = isHost && players.length >= 3

  const handleStart = () => {
    if (!canStart) return
    startOnlineGame({ wordPack: selectedPack, numImpostors })
  }

  return (
    <div className="lobby">
      <div className="lobby-card">
        <div className="lobby-code-section">
          <p className="lobby-code-label">Codigo de sala</p>
          <div className="lobby-code">{roomCode}</div>
          <p className="lobby-code-hint">Comparti este codigo con tus amigos</p>
        </div>

        <div className="lobby-players-section">
          <h3 className="lobby-players-title">
            Jugadores ({players.length})
          </h3>
          <div className="lobby-players-list">
            {players.map((p, i) => (
              <div key={p.id} className="lobby-player">
                <span className="lobby-player-avatar">{p.name[0].toUpperCase()}</span>
                <span className="lobby-player-name">{p.name}</span>
                {i === 0 && <span className="lobby-player-host">Host</span>}
              </div>
            ))}
          </div>
          {players.length < 3 && (
            <p className="lobby-min-hint">Esperando jugadores... (min 3)</p>
          )}
        </div>

        {isHost && (
          <div className="lobby-config">
            <div className="lobby-config-section">
              <label className="home-label">Paquete de palabras</label>
              <select
                className="home-select"
                value={selectedPack}
                onChange={e => setSelectedPack(e.target.value)}
              >
                {Object.keys(wordPacks).map(pack => (
                  <option key={pack} value={pack}>{pack}</option>
                ))}
              </select>
            </div>

            <div className="lobby-config-section">
              <label className="home-label">Impostores: {numImpostors}</label>
              <input
                type="range"
                min="1"
                max="3"
                value={numImpostors}
                onChange={e => setNumImpostors(Number(e.target.value))}
                className="home-range"
              />
            </div>

            <button
              className={`lobby-start-btn ${canStart ? '' : 'disabled'}`}
              disabled={!canStart}
              onClick={handleStart}
            >
              {canStart ? 'Empezar partida' : `Faltan ${3 - players.length} jugadores`}
            </button>
          </div>
        )}

        {!isHost && (
          <div className="lobby-waiting">
            <p>Esperando a que el host inicie la partida...</p>
          </div>
        )}

        <button className="lobby-leave-btn" onClick={reset}>
          Salir de la sala
        </button>
      </div>
    </div>
  )
}
