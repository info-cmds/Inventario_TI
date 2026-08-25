import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- REASSIGNING ALL EMPLOYEES TO SECTOR EDUCACIÓN ---');

  // Find Sector Educación
  let eduSector = await prisma.sector.findFirst({
    where: {
      OR: [
        { name: { contains: 'Educación' } },
        { name: { contains: 'EDUCACIÓN' } },
        { name: { contains: 'EDUCACION' } },
        { name: { contains: 'Educacion' } },
      ],
    },
    include: { branches: { include: { departments: true } } },
  });

  if (!eduSector) {
    console.log('Sector Educación not found, creating...');
    eduSector = await prisma.sector.create({
      data: {
        name: 'Educación',
        description: 'Sector Educación CMDS',
        status: 'ACTIVO',
      },
      include: { branches: { include: { departments: true } } },
    });
  }

  console.log(`Found Sector Educación: ${eduSector.id} (${eduSector.name})`);

  // Find or create a default branch in Educación sector
  let eduBranch = eduSector.branches[0];
  if (!eduBranch) {
    console.log('No branches in Sector Educación, creating one...');
    eduBranch = await prisma.branch.create({
      data: {
        name: 'Liceo A-12 Jerardo Muñoz Campos',
        code: 'LIC-A12',
        sectorId: eduSector.id,
        status: 'ACTIVA',
      },
      include: { departments: true },
    });
  }

  console.log(`Using Education Branch: ${eduBranch.id} (${eduBranch.name})`);

  // Find or create default department in Education branch
  let eduDept = eduBranch.departments[0];
  if (!eduDept) {
    console.log('Creating default department in Education branch...');
    eduDept = await prisma.department.create({
      data: {
        name: 'GENERAL / ADMINISTRACIÓN',
        branchId: eduBranch.id,
      },
    });
  }

  // Update ALL employees to belong to Education sector (eduBranch & eduDept if needed)
  const allEmps = await prisma.employee.findMany({
    include: { branch: { include: { sector: true } } },
  });

  console.log(`Total employees in system: ${allEmps.length}`);

  let updatedCount = 0;
  for (const emp of allEmps) {
    // If employee is not in Educación sector, reassign to eduBranch
    if (emp.branch?.sector?.id !== eduSector.id) {
      // Find a branch in Education sector or use eduBranch
      await prisma.employee.update({
        where: { id: emp.id },
        data: {
          branchId: eduBranch.id,
          departmentId: eduDept.id,
        },
      });

      // Also update active equipment assignments so equipment branch/dept syncs with employee
      const activeAssignments = await prisma.equipmentAssignment.findMany({
        where: { employeeId: emp.id, fecha_fin: null },
      });

      for (const assign of activeAssignments) {
        await prisma.equipment.update({
          where: { id: assign.equipmentId },
          data: {
            branchId: eduBranch.id,
            departmentId: eduDept.id,
          },
        });
      }

      updatedCount++;
    }
  }

  console.log(`Reassigned ${updatedCount} employees (and their active equipment) to Sector Educación.`);
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
