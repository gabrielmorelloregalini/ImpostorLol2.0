import { useState } from 'react'
import wordPacks from '../data/words'
import { useGame } from '../context/GameContext'
import './HomeScreen.css'

export default function HomeScreen() {
  const { startLocalGame, createOnlineRoom, joinOnlineRoom, error } = useGame()

  const [mode, setMode] = useState('local')
  const [playerName, setPlayerName] = useState('')
  const [players, setPlayers] = useState([])
  const [selectedPack, setSelectedPack] = useState(Object.keys(wordPacks)[0])
  const [numImpostors, setNumImpostors] = useState(1)

  // Online state
  const [onlineTab, setOnlineTab] = useState('create')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [onlineName, setOnlineName] = useState('')
  const [loading, setLoading] = useState(false)

  const addPlayer = () => {
    const name = playerName.trim()
    if (!name) return
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) return
    if (players.length >= 20) return
    setPlayers([...players, { name, id: Date.now() }])
    setPlayerName('')
  }

  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id))
  }

  const handleLocalStart = () => {
    const pack = wordPacks[selectedPack]
    const secretWord = pack[Math.floor(Math.random() * pack.length)]

    const arr = [...players]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    const impostorIds = new Set(arr.slice(0, numImpostors).map(p => p.id))

    const playersWithRoles = players.map(p => ({
      ...p,
      isImpostor: impostorIds.has(p.id),
    }))

    startLocalGame({ players: playersWithRoles, secretWord, wordPack: selectedPack })
  }

  const handleCreateRoom = async () => {
    if (!onlineName.trim()) return
    setLoading(true)
    try {
      await createOnlineRoom({ playerName: onlineName.trim(), wordPack: selectedPack, numImpostors })
    } catch {
      // error handled by context
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim() || !onlineName.trim()) return
    setLoading(true)
    try {
      await joinOnlineRoom({ code: roomCodeInput.trim().toUpperCase(), playerName: onlineName.trim() })
    } catch {
      // error handled by context
    } finally {
      setLoading(false)
    }
  }

  const canStart = players.length >= 3

  return (
    <div className="home">
      <div className="home-card">
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'local' ? 'active' : ''}`}
            onClick={() => setMode('local')}
          >
            Local
          </button>
          <button
            className={`mode-btn ${mode === 'online' ? 'active' : ''}`}
            onClick={() => setMode('online')}
          >
            Online
          </button>
        </div>

        {error && <div className="home-error">{error}</div>}

        {mode === 'local' ? (
          <>
            <h2 className="home-section-title">Partida local</h2>

            <div className="home-section">
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

            <div className="home-section">
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

            <div className="home-section">
              <label className="home-label">Agregar jugadores ({players.length}/20)</label>
              <div className="home-input-row">
                <input
                  className="home-input"
                  placeholder="Nombre del jugador"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addPlayer() }}
                />
                <button className="home-btn-add" onClick={addPlayer}>+</button>
              </div>
            </div>

            {players.length > 0 && (
              <div className="home-players">
                {players.map(p => (
                  <div key={p.id} className="home-player-tag">
                    <span>{p.name}</span>
                    <button className="home-remove-btn" onClick={() => removePlayer(p.id)}>×</button>
                  </div>
                ))}
              </div>
            )}

            <p className="home-hint">Minimo 3 jugadores</p>

            <button
              className={`home-start-btn ${canStart ? '' : 'disabled'}`}
              disabled={!canStart}
              onClick={handleLocalStart}
            >
              {canStart ? 'Empezar partida' : `Faltan ${3 - players.length} jugadores`}
            </button>
          </>
        ) : (
          <>
            <div className="online-tabs">
              <button
                className={`online-tab ${onlineTab === 'create' ? 'active' : ''}`}
                onClick={() => setOnlineTab('create')}
              >
                Crear sala
              </button>
              <button
                className={`online-tab ${onlineTab === 'join' ? 'active' : ''}`}
                onClick={() => setOnlineTab('join')}
              >
                Unirse
              </button>
            </div>

            <div className="home-section">
              <label className="home-label">Tu nombre</label>
              <input
                className="home-input"
                placeholder="Ingresa tu nombre"
                value={onlineName}
                onChange={e => setOnlineName(e.target.value)}
              />
            </div>

            {onlineTab === 'create' ? (
              <>
                <div className="home-section">
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

                <div className="home-section">
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
                  className={`home-start-btn ${!onlineName.trim() || loading ? 'disabled' : ''}`}
                  disabled={!onlineName.trim() || loading}
                  onClick={handleCreateRoom}
                >
                  {loading ? 'Creando...' : 'Crear sala'}
                </button>
              </>
            ) : (
              <>
                <div className="home-section">
                  <label className="home-label">Codigo de sala</label>
                  <input
                    className="home-input"
                    placeholder="Ej: ABC"
                    value={roomCodeInput}
                    onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                    maxLength={3}
                    style={{ textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center' }}
                  />
                </div>

                <button
                  className={`home-start-btn ${!roomCodeInput.trim() || !onlineName.trim() || loading ? 'disabled' : ''}`}
                  disabled={!roomCodeInput.trim() || !onlineName.trim() || loading}
                  onClick={handleJoinRoom}
                >
                  {loading ? 'Uniendose...' : 'Unirse a la sala'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
