# Sistema de Marcación Web

Sistema completo de marcación de asistencia con geolocalización, autenticación Google OAuth y verificación biométrica WebAuthn.

## Stack

- **Frontend**: React + Vite + TailwindCSS + @react-oauth/google + WebAuthn
- **Backend**: Node.js + Express + Prisma ORM + JWT
- **DB**: PostgreSQL

## Setup

### Backend
```bash
cd backend
cp .env.example .env   # configurar variables
npm install
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env   # configurar VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

## Módulos

### Empleado (mobile-first)
- Login con Google OAuth
- Verificación de geolocalización (Haversine, radio configurable)
- Marcación con autenticación biométrica WebAuthn
- Historial personal

### Admin
- Login usuario/contraseña
- Dashboard en tiempo real
- Gestión de empleados
- Configuración GPS del local
- Historial completo con filtros
- Intentos fallidos con coordenadas
- Exportación CSV

## Variables de entorno

### Backend (.env)
| Variable | Descripción |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Clave secreta para JWT |
| GOOGLE_CLIENT_ID | Google OAuth Client ID |
| GOOGLE_CLIENT_SECRET | Google OAuth Client Secret |
| FRONTEND_URL | URL del frontend (CORS) |
| PORT | Puerto del servidor (default 3001) |

### Frontend (.env)
| Variable | Descripción |
|----------|-------------|
| VITE_GOOGLE_CLIENT_ID | Google OAuth Client ID |
