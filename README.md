# TutorIA — Plataforma de Tutoría Inteligente

Sistema web de tutoría universitaria con gamificación socrática, seguimiento académico y tutor con IA.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| Backend | Node.js + Express + TypeScript |
| Base de datos | Supabase (PostgreSQL + Auth + Realtime) |
| IA | Claude (Anthropic) — modelo socrático |
| Animaciones | Framer Motion |
| Gráficos | Recharts |

## Funcionalidades

### Estudiante
- **Onboarding**: 7 preguntas al primer inicio para determinar perfil de aprendizaje (carrera, ciclo, rendimiento, horas de estudio, situación laboral, estilo de aprendizaje, motivación)
- **Dashboard**: semana actual (1–16), créditos aprobados, nota más alta/baja, radar de rendimiento, datos personales, alerta de riesgo académico
- **Asistencias**: visualización por semana (16 semanas) para cada curso; alerta si supera 33% de inasistencias
- **Sílabo**: contenido del sílabo por semana, expandible, con recursos por tema
- **Ruta de aprendizaje**: árbol estilo git-branch, cada nodo es un tema de una semana; completa temas para ganar XP; temas futuros bloqueados
- **Recursos**: material de estudio filtrado por curso del ciclo actual
- **Tutor IA**: chat socrático con Claude — nunca da respuestas directas, guía con preguntas; dificultad adaptada por score (básico → intermedio → avanzado → experto)
- **Métodos de estudio**: guías de Pomodoro (con temporizador interactivo), Feynman, Flowntime, Repetición Espaciada, Recall Activo, Sistema Cornell
- **Notificaciones**: push en tiempo real vía Supabase Realtime (entregas, avisos, XP ganado, alertas de riesgo)

### Gamificación
- Sistema XP/Niveles: gana XP por completar temas, interactuar con el tutor y completar el perfil
- Racha de días consecutivos
- Barra de progreso hacia el siguiente nivel en el sidebar
- Notificación automática al tutor cuando un estudiante supera 33% de inasistencias

## Estructura del proyecto

```
proyecto-tutoria/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── App.tsx              # Router + AuthProvider
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # Auth + perfil global
│   │   ├── hooks/
│   │   │   └── useNotifications.ts
│   │   ├── lib/
│   │   │   └── supabase.ts      # Cliente Supabase + tipos DB
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── ProfileQuestionnaire.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Attendance.tsx
│   │   │   ├── Syllabus.tsx
│   │   │   ├── LearningPath.tsx
│   │   │   ├── Resources.tsx
│   │   │   ├── Chat.tsx
│   │   │   ├── StudyMethods.tsx
│   │   │   └── Notifications.tsx
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── Sidebar.tsx
│   │   └── types/
│   │       └── index.ts
│   ├── .env                     # Variables de entorno (no comitear)
│   └── vite.config.ts
│
├── backend/                     # Express + TypeScript
│   ├── src/
│   │   ├── index.ts             # Entry point
│   │   └── routes/
│   │       ├── chat.ts          # Proxy LLM socrático
│   │       └── tutor.ts         # Verificación riesgo académico
│   └── .env                     # Variables de entorno (no comitear)
│
├── supabase/
│   └── schema.sql               # Schema completo + RLS + datos de ejemplo
│
└── start.ps1                    # Script para arrancar dev en Windows
```

## Configuración

### 1. Base de datos

Ejecutar `supabase/schema.sql` en el SQL Editor de tu proyecto Supabase. Esto crea todas las tablas, políticas RLS y datos de ejemplo.

### 2. Variables de entorno

**`frontend/.env`**
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_API_URL=http://localhost:3001
```

**`backend/.env`**
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu_service_role_key
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
```

### 3. Instalar dependencias

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 4. Iniciar

```powershell
# Windows — abre dos terminales automáticamente
.\start.ps1
```

O manualmente:
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

## Base de datos — Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `student_profiles` | Perfil del estudiante + XP + nivel + racha |
| `courses` | Catálogo de cursos por carrera y ciclo |
| `student_courses` | Matrícula: estudiante ↔ curso + nota |
| `attendance` | Asistencia por semana (1–16) por curso |
| `syllabus_topics` | Temas del sílabo por semana + recursos + completados |
| `notifications` | Notificaciones en tiempo real |
| `chat_messages` | Historial del chat con el tutor IA |
| `achievements` | Logros y medallas del estudiante |

Todas las tablas tienen RLS activado — cada estudiante solo ve sus propios datos.

## Colores

Esquema naranja + oscuro:
- Fondo principal: `#0f0f0f`
- Superficie: `#1a1a1a`
- Acento: `#f97316` (orange-500)
- Texto: `#f1f5f9`
