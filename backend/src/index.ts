import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { chatRouter } from './routes/chat'
import { tutorRouter } from './routes/tutor'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: true })) // ponytail: allow all in dev; restrict to specific ngrok URLs in prod
app.use(express.json())

app.use('/api/chat', chatRouter)
app.use('/api/tutor', tutorRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => console.log(`Backend running on :${PORT}`))

