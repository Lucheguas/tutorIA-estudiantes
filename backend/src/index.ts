import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { chatRouter } from './routes/chat'
import { tutorRouter } from './routes/tutor'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }))
app.use(express.json())

app.use('/api/chat', chatRouter)
app.use('/api/tutor', tutorRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => console.log(`Backend running on :${PORT}`))
