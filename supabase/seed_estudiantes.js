/**
 * Crea cuentas Auth para los 61 estudiantes existentes en Supabase.
 * REQUISITO: haber corrido student_auth.sql primero en el SQL Editor.
 *
 * node supabase/seed_estudiantes.js
 *
 * Login generado:
 *   email:    {codigo}@unfv.edu.pe
 *   password: Alumno2026*
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_KEY en el entorno.')
  console.error('Ejemplo: SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=sb_secret_... node supabase/seed_estudiantes.js')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const CURSO_ID = '00000000-0000-0000-0000-000000000002'
const PASSWORD = 'Alumno2026*'

async function run() {
  console.log('═══════════════════════════════════════════')
  console.log(' Creando cuentas para estudiantes UNFV')
  console.log('═══════════════════════════════════════════\n')

  // Verificar que student_profiles existe
  const { error: chk } = await sb.from('student_profiles').select('id').limit(1)
  if (chk) {
    console.error('❌ student_profiles no existe. Corre student_auth.sql en el SQL Editor primero.')
    process.exit(1)
  }

  // Cargar todos los estudiantes existentes
  const { data: estudiantes, error: eE } = await sb
    .from('estudiantes')
    .select('id, codigo, apellidos_y_nombres')
    .order('apellidos_y_nombres')

  if (eE) { console.error('ERROR:', eE.message); process.exit(1) }
  console.log(`${estudiantes.length} estudiantes encontrados en la BD\n`)

  // Obtener lista de users de Auth (para evitar duplicados)
  let page = 1
  const allAuthUsers = []
  while (true) {
    const { data } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
    if (!data?.users?.length) break
    allAuthUsers.push(...data.users)
    if (data.users.length < 1000) break
    page++
  }
  const emailsExistentes = new Set(allAuthUsers.map(u => u.email))
  console.log(`${allAuthUsers.length} usuarios auth existentes\n`)

  let creados = 0, existentes = 0, errores = 0

  for (const est of estudiantes) {
    const email  = `${est.codigo}@unfv.edu.pe`
    const nombre = est.apellidos_y_nombres

    process.stdout.write(`  ${nombre.padEnd(38)} `)

    let userId

    if (emailsExistentes.has(email)) {
      // Ya tiene cuenta auth — obtener su ID
      userId = allAuthUsers.find(u => u.email === email)?.id
      process.stdout.write('[ya existe] ')
      existentes++
    } else {
      // Crear cuenta nueva
      const { data: nu, error: eA } = await sb.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { codigo: est.codigo }
      })
      if (eA) {
        console.log(`ERROR: ${eA.message}`)
        errores++
        continue
      }
      userId = nu.user.id
      process.stdout.write('[creado]    ')
      creados++
    }

    // Vincular en student_profiles
    const { error: eP } = await sb
      .from('student_profiles')
      .upsert({ user_id: userId, estudiante_id: est.id }, { onConflict: 'user_id' })

    if (eP) {
      console.log(`ERROR profile: ${eP.message}`)
      errores++
    } else {
      console.log(`→ ${email}`)
    }
  }

  console.log('\n═══════════════════════════════════════════')
  console.log(` Creados: ${creados}  Existentes: ${existentes}  Errores: ${errores}`)
  console.log(' Contraseña para todos: Alumno2026*')
  console.log(' Harold: 202371426@unfv.edu.pe / Alumno2026*')
  console.log('═══════════════════════════════════════════\n')
}

run().catch(console.error)
