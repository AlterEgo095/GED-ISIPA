const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
async function addAdmin() {
  const prisma = new PrismaClient();
  try {
    // Check if ged-admin@isipa.cd exists
    const existing = await prisma.user.findUnique({where:{email:'ged-admin@isipa.cd'}});
    if (existing) {
      console.log('ged-admin@isipa.cd already exists, updating password...');
      const hash = await bcrypt.hash('Admin@2025!', 12);
      await prisma.user.update({where:{id:existing.id},data:{password:hash,role:'SUPER_ADMIN',isActive:true}});
      console.log('Password updated');
    } else {
      const hash = await bcrypt.hash('Admin@2025!', 12);
      const user = await prisma.user.create({
        data:{
          email:'ged-admin@isipa.cd',
          name:'Administrateur GED-ISIPA',
          password:hash,
          role:'SUPER_ADMIN',
          organizationId:'cmrcayuel0003kjos13nxqboq',
          isActive:true,
        }
      });
      console.log('Created:', user.email, 'role:', user.role);
    }
    
    // Also update existing superadmin@aeip.cd password
    const sa = await prisma.user.findUnique({where:{email:'superadmin@aeip.cd'}});
    if (sa) {
      const hash = await bcrypt.hash('Admin@2025!', 12);
      await prisma.user.update({where:{id:sa.id},data:{password:hash}});
      console.log('Updated superadmin@aeip.cd password');
    }
    
    // Also update admin@isipa.cd password and make them ORG_ADMIN (already is)
    const ai = await prisma.user.findUnique({where:{email:'admin@isipa.cd'}});
    if (ai) {
      const hash = await bcrypt.hash('Manager@2025!', 12);
      await prisma.user.update({where:{id:ai.id},data:{password:hash}});
      console.log('Updated admin@isipa.cd password');
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
addAdmin();
