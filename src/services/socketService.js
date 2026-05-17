import { io as createSocket } from 'socket.io-client'

let socket = null
let errorCallback = null

export async function connect() {
  if (socket) return socket

  const serverUrl = import.meta.env.VITE_SERVER_URL || ''

  socket = createSocket(serverUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 2000,
    timeout: 10000,
  })

  socket.on('connect', () => {
    console.log('Conectado al servidor')
  })

  socket.on('disconnect', (reason) => {
    console.log('Desconectado:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('Error de conexion:', err.message)
    if (errorCallback) {
      errorCallback('No se pudo conectar al servidor. Asegurate de iniciar el servidor primero.')
    }
  })

  return socket
}

export function getSocket() {
  return socket
}

export function setErrorHandler(cb) {
  errorCallback = cb
}

export function disconnect() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
  errorCallback = null
}
