const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const users = await prisma.user.findMany({ select: { email: true, password: true } });
  const passwords = ['Admin@2024!', 'Admin@2025!', 'SuperAdmin@GED2025!', 'Admin@123', 'admin123', 'password', 'Admin123!', 'SuperAdmin@2025!', 'P@ssw0rd', 'Admin@2024', 'Admin2024!', 'ged2025'];
  
  for (const user of users) {
    for (const pw of passwords) {
      const r = await bcrypt.compare(pw, user.password);
      if (r) console.log('MATCH: ' + user.email + ' / ' + pw);
    }
  }
  console.log('Test complete - no more matches');
  await prisma.$disconnect();
}
test().catch(e => { console.error(e); process.exit(1); });
