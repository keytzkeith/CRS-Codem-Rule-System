#!/usr/bin/env node

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const bcrypt = require('bcryptjs')
const { Client } = require('pg')

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  const usernameArg = process.argv[4]
  const fullNameArg = process.argv[5]

  if (!email || !password) {
    console.error('Usage: node scripts/set-admin-user.js <email> <password> [username] [full-name]')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters long')
    process.exit(1)
  }

  const normalizedEmail = email.toLowerCase().trim()
  const username = (usernameArg || normalizedEmail.split('@')[0] || 'admin').trim()
  const fullName = (fullNameArg || username).trim()
  const passwordHash = await bcrypt.hash(password, 10)

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    await client.connect()

    const existing = await client.query(
      'SELECT id, email, username FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [normalizedEmail]
    )

    let result

    if (existing.rows.length) {
      result = await client.query(
        `UPDATE users
           SET password_hash = $2,
               username = COALESCE(NULLIF(username, ''), $3),
               full_name = COALESCE(NULLIF(full_name, ''), $4),
               role = 'admin',
               tier = 'pro',
               is_active = true,
               is_verified = true,
               admin_approved = true,
               verification_token = null,
               verification_expires = null,
               updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, email, username, role, tier, is_active, is_verified, admin_approved`,
        [existing.rows[0].id, passwordHash, username, fullName]
      )

      console.log('[SUCCESS] Updated existing user as admin:')
      console.log(result.rows[0])
    } else {
      result = await client.query(
        `INSERT INTO users (
           email, username, password_hash, full_name,
           verification_token, verification_expires,
           role, is_verified, admin_approved, is_active, tier, marketing_consent
         ) VALUES ($1, $2, $3, $4, null, null, 'admin', true, true, true, 'pro', false)
         RETURNING id, email, username, role, tier, is_active, is_verified, admin_approved`,
        [normalizedEmail, username, passwordHash, fullName]
      )

      console.log('[SUCCESS] Created new admin user:')
      console.log(result.rows[0])
    }
  } catch (error) {
    console.error('[ERROR] Failed to create or update admin user:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
