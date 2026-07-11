const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fix() {
  const SALT_ROUNDS = 12;
  
  // 1. Fix superadmin@aeip.cd password
  const newPass1 = "SuperAdmin@GED2025!";
  const hash1 = await bcrypt.hash(newPass1, SALT_ROUNDS);
  const u1 = await prisma.user.update({
    where: { email: "superadmin@aeip.cd" },
    data: {
      password: hash1,
      isPlatformAdmin: true,
      accountStatus: "ACTIVE",
      isActive: true,
      emailVerified: true,
    }
  });
  console.log("Updated superadmin@aeip.cd, verified hash:", await bcrypt.compare(newPass1, hash1));

  // 2. Fix ged-admin@isipa.cd password
  const newPass2 = "Admin@GED2025!";
  const hash2 = await bcrypt.hash(newPass2, SALT_ROUNDS);
  const u2 = await prisma.user.update({
    where: { email: "ged-admin@isipa.cd" },
    data: {
      password: hash2,
      isPlatformAdmin: true,
      accountStatus: "ACTIVE",
      isActive: true,
      emailVerified: true,
    }
  });
  console.log("Updated ged-admin@isipa.cd, verified hash:", await bcrypt.compare(newPass2, hash2));

  // 3. Fix admin@isipa.cd password
  const newPass3 = "OrgAdmin@2025!";
  const hash3 = await bcrypt.hash(newPass3, SALT_ROUNDS);
  const u3 = await prisma.user.update({
    where: { email: "admin@isipa.cd" },
    data: {
      password: hash3,
      accountStatus: "ACTIVE",
      isActive: true,
      emailVerified: true,
    }
  });
  console.log("Updated admin@isipa.cd, verified hash:", await bcrypt.compare(newPass3, hash3));

  // 4. Create superadmin@ged.aenews.net if not exists
  const saEmail = "superadmin@ged.aenews.net";
  const saPass = "SuperAdmin@GED2025!";
  const existing = await prisma.user.findUnique({ where: { email: saEmail } });
  
  let platformOrg = await prisma.organization.findFirst({ where: { code: "AEIP-SYS-PLATFORM" } });
  if (!platformOrg) {
    platformOrg = await prisma.organization.create({
      data: {
        name: "AEIP Platform",
        slug: "aeip-platform",
        code: "AEIP-SYS-PLATFORM",
        type: "INSTITUTION",
        status: "ACTIVE",
        plan: "ENTERPRISE",
        primaryColor: "#7c3aed",
        maxUsers: 50,
        maxStorage: 107374182400,
      }
    });
    console.log("Created platform org");
  }

  if (!existing) {
    const saHash = await bcrypt.hash(saPass, SALT_ROUNDS);
    const sa = await prisma.user.create({
      data: {
        email: saEmail,
        name: "Super Administrateur GED",
        password: saHash,
        role: "SUPER_ADMIN",
        isPlatformAdmin: true,
        accountStatus: "ACTIVE",
        isActive: true,
        emailVerified: true,
        organizationId: platformOrg.id,
      }
    });
    console.log("Created superadmin@ged.aenews.net, verified:", await bcrypt.compare(saPass, saHash));
  } else {
    const saHash = await bcrypt.hash(saPass, SALT_ROUNDS);
    await prisma.user.update({
      where: { email: saEmail },
      data: {
        password: saHash,
        role: "SUPER_ADMIN",
        isPlatformAdmin: true,
        accountStatus: "ACTIVE",
        isActive: true,
        emailVerified: true,
        organizationId: platformOrg.id,
      }
    });
    console.log("Updated superadmin@ged.aenews.net, verified:", await bcrypt.compare(saPass, saHash));
  }

  console.log("\n========================================");
  console.log("  LOGIN CREDENTIALS (FIXED):");
  console.log("  superadmin@aeip.cd       / SuperAdmin@GED2025!");
  console.log("  superadmin@ged.aenews.net / SuperAdmin@GED2025!");
  console.log("  ged-admin@isipa.cd       / Admin@GED2025!");
  console.log("  admin@isipa.cd           / OrgAdmin@2025!");
  console.log("========================================");
  
  await prisma.$disconnect();
}

fix().catch(e => { console.error("FIX ERROR:", e); process.exit(1); });
