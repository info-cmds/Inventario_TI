import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- REASSIGNING ALL EMPLOYEES TO SECTOR CASA CENTRAL & SUCURSAL CASA CENTRAL CMDS (SIN DEPTO) ---');

  // 1. Find or create Sector Casa Central
  let ccSector = await prisma.sector.findFirst({
    where: {
      OR: [
        { name: { contains: 'Casa Central' } },
        { name: { contains: 'CASA CENTRAL' } },
      ],
    },
    include: { branches: true },
  });

  if (!ccSector) {
    console.log('Sector Casa Central not found, creating...');
    ccSector = await prisma.sector.create({
      data: {
        name: 'Casa Central',
        description: 'Sector Corporativo Casa Central CMDS',
        status: 'ACTIVO',
      },
      include: { branches: true },
    });
  }

  console.log(`Sector Casa Central ID: ${ccSector.id} (${ccSector.name})`);

  // 2. Find or create Branch Casa Central CMDS
  let ccBranch = await prisma.branch.findFirst({
    where: {
      OR: [
        { name: { contains: 'Casa Central' } },
        { name: { contains: 'CASA CENTRAL' } },
        { code: 'CCC' },
        { code: 'CC-CMDS' },
      ],
    },
  });

  if (!ccBranch) {
    console.log('Branch Casa Central CMDS not found, creating...');
    ccBranch = await prisma.branch.create({
      data: {
        name: 'Casa Central CMDS',
        code: 'CC-CMDS',
        sectorId: ccSector.id,
        status: 'ACTIVA',
      },
    });
  } else {
    // Ensure the branch is linked to Sector Casa Central
    if (ccBranch.sectorId !== ccSector.id) {
      ccBranch = await prisma.branch.update({
        where: { id: ccBranch.id },
        data: { sectorId: ccSector.id, name: 'Casa Central CMDS' },
      });
    }
  }

  console.log(`Branch Casa Central CMDS ID: ${ccBranch.id} (${ccBranch.name})`);

  // 3. Reassign ALL employees to Casa Central CMDS with departmentId: null
  const allEmployees = await prisma.employee.findMany();
  console.log(`Total employees in system: ${allEmployees.length}`);

  const updateResult = await prisma.employee.updateMany({
    data: {
      branchId: ccBranch.id,
      departmentId: null,
    },
  });

  console.log(`Reassigned ${updateResult.count} employees to Branch 'Casa Central CMDS' with departmentId = null (Sin Depto Asignado).`);

  // 4. Update active equipment assignments location parameters (branchId & departmentId)
  const activeAssignments = await prisma.equipmentAssignment.findMany({
    where: { fecha_fin: null },
  });

  let eqUpdateCount = 0;
  for (const assign of activeAssignments) {
    await prisma.equipment.update({
      where: { id: assign.equipmentId },
      data: {
        branchId: ccBranch.id,
        departmentId: null,
      },
    });
    eqUpdateCount++;
  }

  console.log(`Updated location parameters for ${eqUpdateCount} active equipment to Casa Central CMDS (Sin Depto).`);
  console.log('--- REASSIGNMENT COMPLETE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
