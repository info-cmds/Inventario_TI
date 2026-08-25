import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DELETING ALL DEPARTMENTS IN SECTORS EDUCACIÓN AND SALUD ---');

  // Find Sectors Educación and Salud
  const targetSectors = await prisma.sector.findMany({
    where: {
      OR: [
        { name: { contains: 'Educación' } },
        { name: { contains: 'EDUCACIÓN' } },
        { name: { contains: 'Educacion' } },
        { name: { contains: 'EDUCACION' } },
        { name: { contains: 'Salud' } },
        { name: { contains: 'SALUD' } },
      ],
    },
    include: {
      branches: {
        include: {
          departments: true,
        },
      },
    },
  });

  const sectorIds = targetSectors.map((s) => s.id);
  console.log(`Found ${targetSectors.length} target sectors (${targetSectors.map((s) => s.name).join(', ')})`);

  // Get all branch IDs belonging to these sectors
  const targetBranches = await prisma.branch.findMany({
    where: { sectorId: { in: sectorIds } },
    include: { departments: true },
  });

  const targetBranchIds = targetBranches.map((b) => b.id);
  console.log(`Found ${targetBranches.length} branches in target sectors.`);

  // Get all department IDs to delete
  const targetDepartments = await prisma.department.findMany({
    where: { branchId: { in: targetBranchIds } },
  });

  const targetDeptIds = targetDepartments.map((d) => d.id);
  console.log(`Found ${targetDepartments.length} departments to delete in Educación & Salud.`);

  if (targetDeptIds.length === 0) {
    console.log('No departments found in Educación or Salud sectors.');
    return;
  }

  // 1. Unlink employees from target departments (set departmentId = null)
  const unlinkedEmps = await prisma.employee.updateMany({
    where: { departmentId: { in: targetDeptIds } },
    data: { departmentId: null },
  });
  console.log(`Unlinked ${unlinkedEmps.count} employees from target departments (set to null).`);

  // 2. Unlink equipment from target departments (set departmentId = null)
  const unlinkedEq = await prisma.equipment.updateMany({
    where: { departmentId: { in: targetDeptIds } },
    data: { departmentId: null },
  });
  console.log(`Unlinked ${unlinkedEq.count} equipment from target departments (set to null).`);

  // 3. Unlink UserBranchPermissions from target departments (set departmentId = null)
  const unlinkedPerms = await prisma.userBranchPermission.updateMany({
    where: { departmentId: { in: targetDeptIds } },
    data: { departmentId: null },
  });
  console.log(`Unlinked ${unlinkedPerms.count} user branch permissions from target departments.`);

  // 4. Delete the target departments
  const deletedDepts = await prisma.department.deleteMany({
    where: { id: { in: targetDeptIds } },
  });

  console.log(`Successfully deleted ${deletedDepts.count} departments from Educación and Salud sectors.`);
  console.log('--- DELETION COMPLETE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
