import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('=== CREATING/UPDATING SECTOR SUPERADMINISTRATOR ACCOUNTS ===');

  const sectors = await prisma.sector.findMany({
    include: { branches: true }
  });

  const eduSector = sectors.find(s => s.name === 'Educación');
  const saludSector = sectors.find(s => s.name === 'Salud');
  const ccSector = sectors.find(s => s.name === 'Casa Central');

  if (!eduSector || !saludSector || !ccSector) {
    console.error('Error: Required sectors not found');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const targets = [
    {
      name: 'Superadministrador Educación',
      email: 'admin.educacion@cmds.cl',
      sector: eduSector,
    },
    {
      name: 'Superadministrador Casa Central',
      email: 'admin.casacentral@cmds.cl',
      sector: ccSector,
    },
    {
      name: 'Superadministrador Salud',
      email: 'admin.salud@cmds.cl',
      sector: saludSector,
    },
  ];

  for (const t of targets) {
    let user = await prisma.user.findUnique({
      where: { email: t.email },
      include: { userBranchPermissions: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: t.email,
          name: t.name,
          role: 'ADMINISTRADOR',
          password: hashedPassword,
          must_change_password: false,
        },
        include: { userBranchPermissions: true }
      });
      console.log(`[CREATED] User '${t.name}' (${t.email}) created successfully.`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: t.name,
          role: 'ADMINISTRADOR',
          must_change_password: false,
        },
        include: { userBranchPermissions: true }
      });
      console.log(`[UPDATED] User '${t.name}' (${t.email}) updated successfully.`);
    }

    // Assign all branches of the target sector to userBranchPermissions
    const existingBranchIds = new Set(user.userBranchPermissions.map(p => p.branchId));
    let addedCount = 0;

    for (const branch of t.sector.branches) {
      if (!existingBranchIds.has(branch.id)) {
        await prisma.userBranchPermission.create({
          data: {
            userId: user.id,
            sectorId: t.sector.id,
            branchId: branch.id,
            departmentId: null,
          }
        });
        addedCount++;
      }
    }

    const totalPerms = await prisma.userBranchPermission.count({ where: { userId: user.id } });
    console.log(`   -> Sector '${t.sector.name}' has ${t.sector.branches.length} branches. Assigned ${addedCount} new permissions. Total permissions for user: ${totalPerms}`);
  }

  console.log('\n=== FINAL USER VERIFICATION ===');
  const allUsers = await prisma.user.findMany({
    include: {
      userBranchPermissions: {
        include: { branch: { include: { sector: true } } }
      }
    }
  });

  for (const u of allUsers) {
    console.log(`User: ${u.name} | Email: ${u.email} | Role: ${u.role} | Permissions: ${u.userBranchPermissions.length}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
