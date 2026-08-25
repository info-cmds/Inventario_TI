import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  console.log('📦 Iniciando exportación de base de datos SQLite (dev.db)...');

  const users = await prisma.user.findMany();
  const permissions = await prisma.userBranchPermission.findMany();
  const sectors = await prisma.sector.findMany();
  const branches = await prisma.branch.findMany();
  const departments = await prisma.department.findMany();
  const employees = await prisma.employee.findMany();
  const equipmentTypes = await prisma.equipmentType.findMany();
  const brands = await prisma.brand.findMany();
  const models = await prisma.equipmentModel.findMany();
  const equipment = await prisma.equipment.findMany();
  const assignments = await prisma.equipmentAssignment.findMany();

  const dump = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0',
    },
    counts: {
      users: users.length,
      userBranchPermissions: permissions.length,
      sectors: sectors.length,
      branches: branches.length,
      departments: departments.length,
      employees: employees.length,
      equipmentTypes: equipmentTypes.length,
      brands: brands.length,
      equipmentModels: models.length,
      equipment: equipment.length,
      equipmentAssignments: assignments.length,
    },
    data: {
      users,
      userBranchPermissions: permissions,
      sectors,
      branches,
      departments,
      employees,
      equipmentTypes,
      brands,
      equipmentModels: models,
      equipment,
      equipmentAssignments: assignments,
    },
  };

  const outputPath = path.join(process.cwd(), 'prisma', 'production_data_dump.json');
  fs.writeFileSync(outputPath, JSON.stringify(dump, null, 2), 'utf-8');

  console.log('✅ Exportación completada con éxito.');
  console.log(`📁 Archivo generado: ${outputPath}`);
  console.log('📊 Resumen de registros exportados:');
  console.table(dump.counts);
}

exportData()
  .catch((e) => {
    console.error('❌ Error durante la exportación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
