const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
async function fix() {
  const prisma = new PrismaClient();
  try {
    // 1. Update superadmin@aeip.cd: SUPER_ADMIN + isPlatformAdmin=true + ACTIVE
    const sa = await prisma.user.findUnique({where:{email:'superadmin@aeip.cd'}});
    if (sa) {
      const hash = await bcrypt.hash('SuperAdmin@2025!', 12);
      await prisma.user.update({
        where: {id: sa.id},
        data: {
          password: hash,
          role: 'SUPER_ADMIN',
          isPlatformAdmin: true,
          accountStatus: 'ACTIVE',
          isActive: true,
          emailVerified: true,
        }
      });
      console.log('Updated superadmin@aeip.cd -> SUPER_ADMIN + isPlatformAdmin=true');
    } else {
      // Get AEIP Platform org
      const org = await prisma.organization.findFirst({where:{code:'AEIP-SYS-PLATFORM'}});
      if (!org) {
        console.error('ERROR: AEIP Platform org not found');
        process.exit(1);
      }
      const hash = await bcrypt.hash('SuperAdmin@2025!', 12);
      await prisma.user.create({
        data: {
          email: 'superadmin@aeip.cd',
          name: 'Super Administrateur',
          password: hash,
          role: 'SUPER_ADMIN',
          isPlatformAdmin: true,
          accountStatus: 'ACTIVE',
          isActive: true,
          emailVerified: true,
          organizationId: org.id,
        }
      });
      console.log('Created superadmin@aeip.cd -> SUPER_ADMIN + isPlatformAdmin=true');
    }

    // 2. Update ged-admin@isipa.cd: SUPER_ADMIN + isPlatformAdmin=true
    const ga = await prisma.user.findUnique({where:{email:'ged-admin@isipa.cd'}});
    if (ga) {
      const hash = await bcrypt.hash('SuperAdmin@2025!', 12);
      await prisma.user.update({
        where: {id: ga.id},
        data: {
          password: hash,
          role: 'SUPER_ADMIN',
          isPlatformAdmin: true,
          accountStatus: 'ACTIVE',
          isActive: true,
          emailVerified: true,
        }
      });
      console.log('Updated ged-admin@isipa.cd -> SUPER_ADMIN + isPlatformAdmin=true');
    }

    // 3. Update admin@isipa.cd: keep as ORG_ADMIN but ensure password and status
    const ai = await prisma.user.findUnique({where:{email:'admin@isipa.cd'}});
    if (ai) {
      const hash = await bcrypt.hash('OrgAdmin@2025!', 12);
      await prisma.user.update({
        where: {id: ai.id},
        data: {
          password: hash,
          accountStatus: 'ACTIVE',
          isActive: true,
          emailVerified: true,
        }
      });
      console.log('Updated admin@isipa.cd -> ORG_ADMIN + ACTIVE');
    }

    // 4. Set all other users to ACTIVE
    const allUsers = await prisma.user.findMany();
    for (const u of allUsers) {
      if (!u.isPlatformAdmin) {
        await prisma.user.update({
          where: {id: u.id},
          data: { accountStatus: 'ACTIVE', isActive: true, emailVerified: true }
        });
      }
    }
    console.log('All users set to ACTIVE');

    // 5. List final state
    const finalUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true, isPlatformAdmin: true, accountStatus: true, isActive: true }
    });
    console.log('\nFinal user list:');
    finalUsers.forEach(u => {
      console.log(`  ${u.email} | ${u.role} | platformAdmin: ${u.isPlatformAdmin} | status: ${u.accountStatus} | active: ${u.isActive}`);
    });

  } catch(e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
fix();

