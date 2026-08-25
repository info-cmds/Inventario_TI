import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding new employee Carlos Gonzalez Osorio...');

  // Find branch DIRECCION DE SALUD (Code: DIR-SAL or name containing DIRECCION DE SALUD)
  let branch = await prisma.branch.findFirst({
    where: {
      OR: [
        { code: 'DIR-SAL' },
        { name: { contains: 'DIRECCION DE SALUD' } },
      ],
    },
  });

  if (!branch) {
    // Fallback to first health branch or any branch
    const sectorSalud = await prisma.sector.findFirst({ where: { name: 'Salud' } });
    branch = await prisma.branch.create({
      data: {
        name: 'DIRECCION DE SALUD',
        code: 'DIR-SAL',
        sectorId: sectorSalud?.id || (await prisma.sector.findFirst())!.id,
        status: 'ACTIVA',
      },
    });
  }

  // Find or create department General / Administración
  let department = await prisma.department.findFirst({
    where: {
      branchId: branch.id,
      name: { contains: 'General' },
    },
  });

  if (!department) {
    department = await prisma.department.create({
      data: {
        name: 'General / Administración',
        branchId: branch.id,
      },
    });
  }

  const rut = '16.543.210-8';

  // Check if employee exists by email or RUT
  const existing = await prisma.employee.findFirst({
    where: {
      OR: [
        { email: 'cgonzalezo@cmds.cl' },
        { rut_document: rut },
      ],
    },
  });

  if (existing) {
    const updated = await prisma.employee.update({
      where: { id: existing.id },
      data: {
        names: 'Carlos',
        paternal_surname: 'Gonzalez',
        maternal_surname: 'Osorio',
        full_name: 'Carlos Gonzalez Osorio',
        email: 'cgonzalezo@cmds.cl',
        position: 'Informático',
        branchId: branch.id,
        departmentId: department.id,
        status: 'ACTIVO',
      },
    });
    console.log('Employee updated successfully:', updated);
  } else {
    const created = await prisma.employee.create({
      data: {
        rut_document: rut,
        names: 'Carlos',
        paternal_surname: 'Gonzalez',
        maternal_surname: 'Osorio',
        full_name: 'Carlos Gonzalez Osorio',
        email: 'cgonzalezo@cmds.cl',
        position: 'Informático',
        branchId: branch.id,
        departmentId: department.id,
        status: 'ACTIVO',
      },
    });
    console.log('Employee created successfully:', created);
  }
}

main()
  .catch((e) => {
    console.error('Error adding employee:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
