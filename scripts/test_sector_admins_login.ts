import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('=== VERIFYING SECTOR ADMINISTRATOR FILTERING & ACCESS ===');

  const emails = [
    'admin.salud@cmds.cl',
    'admin.educacion@cmds.cl',
    'admin.casacentral@cmds.cl',
  ];

  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userBranchPermissions: {
          include: {
            branch: { include: { sector: true } }
          }
        }
      }
    });

    if (!user) {
      console.error(`User ${email} NOT FOUND`);
      continue;
    }

    const branchIds = user.userBranchPermissions.map(p => p.branchId);
    const sectors = new Set(user.userBranchPermissions.map(p => p.branch.sector.name));
    const sectorIds = new Set(user.userBranchPermissions.map(p => p.branch.sectorId));

    console.log(`\n👤 User: ${user.name} (${user.email})`);
    console.log(`   - Permitted Sectors: ${Array.from(sectors).join(', ')} (IDs: ${Array.from(sectorIds).join(', ')})`);
    console.log(`   - Total Permitted Branches: ${branchIds.length}`);

    // Query employees for this user
    const employees = await prisma.employee.findMany({
      where: {
        branchId: { in: branchIds }
      },
      include: { branch: { include: { sector: true } } }
    });

    const otherSectorEmp = employees.filter(e => !sectorIds.has(e.branch.sectorId));
    console.log(`   - Employees fetched: ${employees.length} | Leakage from other sectors: ${otherSectorEmp.length}`);

    // Query equipment for this user
    const equipment = await prisma.equipment.findMany({
      where: {
        branchId: { in: branchIds }
      },
      include: { branch: { include: { sector: true } } }
    });

    const otherSectorEq = equipment.filter(eq => !sectorIds.has(eq.branch.sectorId));
    console.log(`   - Equipment fetched: ${equipment.length} | Leakage from other sectors: ${otherSectorEq.length}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
