const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function seed() {
  const prisma = new PrismaClient();
  try {
    // 1. Ensure AEIP Platform organization exists (system org for superadmin)
    let platformOrg = await prisma.organization.findFirst({ where: { code: 'AEIP-SYS-PLATFORM' } });
    if (!platformOrg) {
      platformOrg = await prisma.organization.create({
        data: {
          name: 'AEIP Platform',
          slug: 'aeip-platform',
          code: 'AEIP-SYS-PLATFORM',
          type: 'INSTITUTION',
          status: 'ACTIVE',
          plan: 'ENTERPRISE',
          primaryColor: '#7c3aed',
          settings: JSON.stringify({
            modules: ['documents', 'workflows', 'audit', 'archives', 'departments', 'notifications'],
            defaultLanguage: 'fr',
            timezone: 'Africa/Kinshasa',
            isPlatformOrg: true
          }),
          maxUsers: 50,
          maxStorage: 107374182400,
        }
      });
      console.log('Platform org created:', platformOrg.id);
    } else {
      console.log('Platform org exists:', platformOrg.id);
    }

    // 2. Create UNIQUE superadmin account
    const SUPERADMIN_EMAIL = 'superadmin@ged.aenews.net';
    const SUPERADMIN_PASSWORD = 'SuperAdmin@GED2025!';
    
    const existingSA = await prisma.user.findUnique({ where: { email: SUPERADMIN_EMAIL } });
    if (existingSA) {
      // Update to ensure isPlatformAdmin=true and correct role
      const hash = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);
      await prisma.user.update({
        where: { id: existingSA.id },
        data: {
          password: hash,
          role: 'SUPER_ADMIN',
          isPlatformAdmin: true,
          accountStatus: 'ACTIVE',
          emailVerified: true,
          isActive: true,
          organizationId: platformOrg.id,
        }
      });
      console.log('Superadmin updated:', SUPERADMIN_EMAIL);
    } else {
      const hash = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);
      const sa = await prisma.user.create({
        data: {
          email: SUPERADMIN_EMAIL,
          name: 'Super Administrateur GED',
          password: hash,
          role: 'SUPER_ADMIN',
          isPlatformAdmin: true,
          accountStatus: 'ACTIVE',
          emailVerified: true,
          isActive: true,
          organizationId: platformOrg.id,
        }
      });
      console.log('Superadmin created:', sa.email, 'id:', sa.id);
    }

    // 3. Also mark existing superadmin@aeip.cd as platform admin
    const aeipSA = await prisma.user.findUnique({ where: { email: 'superadmin@aeip.cd' } });
    if (aeipSA) {
      await prisma.user.update({
        where: { id: aeipSA.id },
        data: {
          isPlatformAdmin: true,
          accountStatus: 'ACTIVE',
          emailVerified: true,
          organizationId: platformOrg.id,
        }
      });
      console.log('superadmin@aeip.cd marked as platformAdmin');
    }

    // 4. Also mark ged-admin@isipa.cd as platform admin
    const gedSA = await prisma.user.findUnique({ where: { email: 'ged-admin@isipa.cd' } });
    if (gedSA) {
      await prisma.user.update({
        where: { id: gedSA.id },
        data: {
          isPlatformAdmin: true,
          accountStatus: 'ACTIVE',
          emailVerified: true,
        }
      });
      console.log('ged-admin@isipa.cd marked as platformAdmin');
    }

    // 5. Set all existing users to ACTIVE status and emailVerified
    const updateResult = await prisma.user.updateMany({
      where: { accountStatus: 'ACTIVE' },
      data: { emailVerified: true, accountStatus: 'ACTIVE' }
    });
    console.log(`All existing users confirmed: ${updateResult.count} users set to ACTIVE/emailVerified`);

    // 6. System settings
    await prisma.systemSetting.upsert({
      where: { key: 'platform_name' },
      update: { value: 'GED-ISIPA' },
      create: { key: 'platform_name', value: 'GED-ISIPA' }
    });
    await prisma.systemSetting.upsert({
      where: { key: 'platform_version' },
      update: { value: '2.0.0' },
      create: { key: 'platform_version', value: '2.0.0' }
    });
    await prisma.systemSetting.upsert({
      where: { key: 'require_admin_validation' },
      update: { value: 'true' },
      create: { key: 'require_admin_validation', value: 'true' }
    });
    await prisma.systemSetting.upsert({
      where: { key: 'default_language' },
      update: { value: 'fr' },
      create: { key: 'default_language', value: 'fr' }
    });
    await prisma.systemSetting.upsert({
      where: { key: 'superadmin_email' },
      update: { value: SUPERADMIN_EMAIL },
      create: { key: 'superadmin_email', value: SUPERADMIN_EMAIL }
    });

    console.log('\n==============================================');
    console.log('  SUPERADMIN CREDENTIALS:');
    console.log('  Email:    ' + SUPERADMIN_EMAIL);
    console.log('  Password: ' + SUPERADMIN_PASSWORD);
    console.log('  ==============================================');
    console.log('\nSEED COMPLETE');

  } catch(e) {
    console.error('SEED ERROR:', e.message);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}
seed().catch(e => { console.error(e); process.exit(1); });
