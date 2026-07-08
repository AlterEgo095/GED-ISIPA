/**
 * Migration script: hash all plaintext passwords in the database
 * Run: npx tsx scripts/migrate-passwords.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

async function main() {
  console.log('🔐 Starting password migration...')
  
  const users = await prisma.user.findMany({
    select: { id: true, email: true, password: true },
  })

  let migrated = 0
  let skipped = 0

  for (const user of users) {
    // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      skipped++
      continue
    }

    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })
    migrated++
    console.log(`  ✅ Migrated: ${user.email}`)
  }

  console.log(`\n📊 Migration complete: ${migrated} migrated, ${skipped} already hashed, ${users.length} total`)
  
  if (migrated > 0) {
    console.log('⚠️  All passwords have been re-hashed. Users must use their original passwords (now verified via bcrypt.compare).')
  }
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
