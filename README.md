# El Impostor de LOL

Juego de deduccion social multijugador. Los civiles reciben una palabra secreta y el impostor debe hacerse pasar por uno de ellos sin saber cual es.

## Modos de juego

- **Local** — Pasan el dispositivo, cada jugador ve su rol en privado.
- **Online** — Cada jugador se conecta desde su propio dispositivo a una sala.

## Deploy en Render

### 1. Preparar el repositorio

```bash
git init
git add .
git commit -m "primer commit"
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

### 2. Crear el Web Service en Render

1. Ir a https://render.com y crear cuenta (login con GitHub).
2. Click **"New +"** > **"Web Service"**.
3. Conectar repositorio de GitHub y seleccionarlo.
4. Completar los campos:

| Campo | Valor |
|---|---|
| **Name** | `impostor-de-lol` |
| **Region** | `Ohio (US)` |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install --include=dev && npm run build && cd server && npm install` |
| **Start Command** | `node server/index.js` |
| **Plan** | `Free` |

5. Ir a **"Environment"** y agregar estas variables:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `VITE_SERVER_URL` | `https://impostor-de-lol.onrender.com` |

6. Click **"Create Web Service"**.
7. Esperar 3-5 minutos a que termine el build y primer deploy.
8. En el dashboard del servicio, activar **"Auto-Deploy"** (esta activado por defecto si conectaste GitHub).

### 3. Actualizar el deploy (despues de un push)

Render hace deploy automatico cuando pusheas a la branch. Si no:

1. Ir al dashboard de Render > el servicio.
2. Click **"Manual Deploy"** > **"Deploy latest commit"**.
3. Esperar 2-3 minutos.

### 4. Verificar

Una vez deployado, abrir la URL que Render asigna (ej: `https://impostor-de-lol.onrender.com`).

Probar:

- **Modo Local** — Agregar jugadores y empezar partida.
- **Modo Online** — Abrir dos pestanas del navegador. En una crear sala, en la otra unirse con el codigo.

### Local (desarrollo)

```bash
# Terminal 1 - Servidor
cd server
npm run dev

# Terminal 2 - Cliente
npm run dev
```

Abrir http://localhost:5173

### Estructura del proyecto

```
├── server/             # Backend Socket.io (Express)
│   ├── index.js        # Servidor, salas, eventos
│   └── package.json
├── src/                # Frontend React
│   ├── components/     # Componentes de UI
│   ├── context/        # Estado global (GameContext)
│   ├── services/       # Conexion Socket.io
│   └── data/           # Palabras y campeones
├── package.json        # Frontend
├── vite.config.js
└── .gitignore
```
