import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding 4 new employees from image into Casa Central Corporativa -> Informática...');

  // Find branch Casa Central Corporativa (Code: CC-01)
  let branch = await prisma.branch.findFirst({
    where: {
      OR: [
        { code: 'CC-01' },
        { name: { contains: 'Casa Central' } },
      ],
    },
  });

  if (!branch) {
    const sectorCC = await prisma.sector.findFirst({ where: { name: 'Casa Central' } });
    branch = await prisma.branch.create({
      data: {
        name: 'Casa Central Corporativa',
        code: 'CC-01',
        sectorId: sectorCC?.id || (await prisma.sector.findFirst())!.id,
        status: 'ACTIVA',
      },
    });
  }

  // Find department Informática
  let department = await prisma.department.findFirst({
    where: {
      branchId: branch.id,
      name: { contains: 'Informática' },
    },
  });

  if (!department) {
    department = await prisma.department.create({
      data: {
        name: 'Informática',
        branchId: branch.id,
      },
    });
  }

  const employeesList = [
    {
      rut: '16468798-8',
      names: 'JORGE',
      paternal: 'ABARCA',
      maternal: 'PINAZO',
      email: 'jabarca@cmds.cl',
      position: 'Informático',
    },
    {
      rut: '10633447-K',
      names: 'RAUL GONZALO',
      paternal: 'HORMAZABAL',
      maternal: 'FIGUEROA',
      email: 'rhormazabal@cmds.cl',
      position: 'Informático',
    },
    {
      rut: '11141811-K',
      names: 'LUIS OCTAVIO',
      paternal: 'OBREGON',
      maternal: 'ABARCA',
      email: 'lobregon@cmds.cl',
      position: 'Informático',
    },
    {
      rut: '10084313-7',
      names: 'MIRKO FRANCISCO',
      paternal: 'LONGA',
      maternal: 'SOTO',
      email: 'mlonga@cmds.cl',
      position: 'Informático',
    },
  ];

  for (const emp of employeesList) {
    const fullName = `${emp.names} ${emp.paternal} ${emp.maternal}`.trim();
    const existing = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: emp.email },
          { rut_document: emp.rut },
        ],
      },
    });

    if (existing) {
      const updated = await prisma.employee.update({
        where: { id: existing.id },
        data: {
          rut_document: emp.rut,
          names: emp.names,
          paternal_surname: emp.paternal,
          maternal_surname: emp.maternal,
          full_name: fullName,
          email: emp.email,
          position: emp.position,
          branchId: branch.id,
          departmentId: department.id,
          status: 'ACTIVO',
        },
      });
      console.log('Updated employee:', updated.full_name, updated.rut_document);
    } else {
      const created = await prisma.employee.create({
        data: {
          rut_document: emp.rut,
          names: emp.names,
          paternal_surname: emp.paternal,
          maternal_surname: emp.maternal,
          full_name: fullName,
          email: emp.email,
          position: emp.position,
          branchId: branch.id,
          departmentId: department.id,
          status: 'ACTIVO',
        },
      });
      console.log('Created employee:', created.full_name, created.rut_document);
    }
  }

  console.log('All 4 employees inserted successfully without wiping any data.');
}

main()
  .catch((e) => {
    console.error('Error inserting employees:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
