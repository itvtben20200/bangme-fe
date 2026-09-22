import { mkdir, appendFile, access } from 'fs/promises'
import { constants } from 'fs'
import path from 'path'
import { pbkdf2Sync, randomBytes } from 'crypto'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type RegistrationPayload = {
  email?: unknown
  username?: unknown
  password?: unknown
  firstName?: unknown
  lastName?: unknown
  street?: unknown
  postalCode?: unknown
  city?: unknown
  country?: unknown
}

type ValidRegistration = {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
  street: string
  postalCode: string
  city: string
  country: string
}

const header = [
  'createdAt',
  'email',
  'username',
  'passwordHash',
  'passwordSalt',
  'firstName',
  'lastName',
  'street',
  'postalCode',
  'city',
  'country',
].join(',') + '\n'

function readText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function csvEscape(value: string) {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${safeValue.replace(/"/g, '""')}"`
}

function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex')
  return { hash, salt }
}

async function ensureCsvFile(filePath: string) {
  try {
    await access(filePath, constants.F_OK)
  } catch {
    await appendFile(filePath, header, 'utf8')
  }
}

function getBackendApiUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000/api'
  return baseUrl.replace(/\/$/, '')
}

async function saveToDatabase(payload: ValidRegistration) {
  const response = await fetch(`${getBackendApiUrl()}/marketing/prelaunch-creators`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ ...payload, source: 'for-creators' }),
  })

  if (!response.ok) {
    throw new Error('Database capture failed')
  }
}

export async function POST(request: Request) {
  let payload: RegistrationPayload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const email = readText(payload.email).toLowerCase()
  const username = readText(payload.username)
  const password = readText(payload.password)
  const firstName = readText(payload.firstName)
  const lastName = readText(payload.lastName)
  const street = readText(payload.street)
  const postalCode = readText(payload.postalCode)
  const city = readText(payload.city)
  const country = readText(payload.country)

  if (!email || !email.includes('@')) {
    return NextResponse.json({ message: 'Bitte gib eine gültige E-Mail-Adresse ein.' }, { status: 400 })
  }

  if (username.length < 3) {
    return NextResponse.json({ message: 'Der Benutzername muss mindestens 3 Zeichen lang sein.' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ message: 'Das Passwort muss mindestens 8 Zeichen lang sein.' }, { status: 400 })
  }

  if (!firstName || !lastName || !street || !postalCode || !city || !country) {
    return NextResponse.json({ message: 'Bitte fülle alle Felder aus.' }, { status: 400 })
  }

  const { hash, salt } = createPasswordHash(password)
  const dataDirectory = path.join(process.cwd(), 'data')
  const filePath = path.join(dataDirectory, 'prelaunch-creators.csv')
  const row = [
    new Date().toISOString(),
    email,
    username,
    hash,
    salt,
    firstName,
    lastName,
    street,
    postalCode,
    city,
    country,
  ].map(csvEscape).join(',') + '\n'

  try {
    await mkdir(dataDirectory, { recursive: true })
    await ensureCsvFile(filePath)
    await appendFile(filePath, row, 'utf8')
  } catch {
    return NextResponse.json({ message: 'Die Anmeldung konnte nicht gespeichert werden.' }, { status: 500 })
  }

  try {
    await saveToDatabase({ email, username, password, firstName, lastName, street, postalCode, city, country })
  } catch {
    return NextResponse.json({ message: 'Deine Anmeldung wurde lokal gespeichert, konnte aber noch nicht in der Datenbank gespeichert werden.' }, { status: 502 })
  }

  return NextResponse.json({ message: 'Du hast dich erfolgreich vorangemeldet.' })
}