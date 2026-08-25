import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function importData() {
  console.log('🚀 Iniciando restauración ultra-rápida de datos a Neon PostgreSQL...');

  const dumpPath = path.join(process.cwd(), 'prisma', 'production_data_dump.json');
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`No se encontró el archivo de datos: ${dumpPath}`);
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
  const { data } = dump;

  console.log('📊 Registros a importar:');
  console.table(dump.counts);

  // 1. Sectors
  console.log(`⏳ Cargando ${data.sectors.length} sectores...`);
  await prisma.sector.createMany({
    data: data.sectors.map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    })),
    skipDuplicates: true,
  });

  // 2. Branches
  console.log(`⏳ Cargando ${data.branches.length} sucursales...`);
  await prisma.branch.createMany({
    data: data.branches.map((b: any) => ({
      ...b,
      createdAt: new Date(b.createdAt),
      updatedAt: new Date(b.updatedAt),
    })),
    skipDuplicates: true,
  });

  // 3. Departments
  console.log(`⏳ Cargando ${data.departments.length} departamentos...`);
  await prisma.department.createMany({
    data: data.departments.map((d: any) => ({
      ...d,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
    })),
    skipDuplicates: true,
  });

  // 4. Users (Credenciales & Passwords Hashed)
  console.log(`⏳ Cargando ${data.users.length} usuarios y credenciales...`);
  await prisma.user.createMany({
    data: data.users.map((u: any) => ({
      ...u,
      createdAt: new Date(u.createdAt),
      updatedAt: new Date(u.updatedAt),
    })),
    skipDuplicates: true,
  });

  // 5. UserBranchPermissions
  console.log(`⏳ Cargando ${data.userBranchPermissions.length} permisos de usuario...`);
  await prisma.userBranchPermission.createMany({
    data: data.userBranchPermissions,
    skipDuplicates: true,
  });

  // 6. EquipmentTypes
  console.log(`⏳ Cargando ${data.equipmentTypes.length} tipos de equipos...`);
  await prisma.equipmentType.createMany({
    data: data.equipmentTypes.map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
    })),
    skipDuplicates: true,
  });

  // 7. Brands
  console.log(`⏳ Cargando ${data.brands.length} marcas...`);
  await prisma.brand.createMany({
    data: data.brands.map((b: any) => ({
      ...b,
      createdAt: new Date(b.createdAt),
      updatedAt: new Date(b.updatedAt),
    })),
    skipDuplicates: true,
  });

  // 8. EquipmentModels
  console.log(`⏳ Cargando ${data.equipmentModels.length} modelos de equipos...`);
  await prisma.equipmentModel.createMany({
    data: data.equipmentModels.map((m: any) => ({
      ...m,
      createdAt: new Date(m.createdAt),
      updatedAt: new Date(m.updatedAt),
    })),
    skipDuplicates: true,
  });

  // 9. Employees (Bulk import 2,070 records in 1 batch)
  console.log(`⏳ Cargando ${data.employees.length} funcionarios en lote rápido...`);
  const employeesBatch = data.employees.map((e: any) => ({
    ...e,
    createdAt: new Date(e.createdAt),
    updatedAt: new Date(e.updatedAt),
  }));
  await prisma.employee.createMany({
    data: employeesBatch,
    skipDuplicates: true,
  });

  // 10. Equipment
  console.log(`⏳ Cargando ${data.equipment.length} equipos...`);
  const equipmentBatch = data.equipment.map((eq: any) => ({
    ...eq,
    createdAt: new Date(eq.createdAt),
    updatedAt: new Date(eq.updatedAt),
  }));
  await prisma.equipment.createMany({
    data: equipmentBatch,
    skipDuplicates: true,
  });

  // 11. EquipmentAssignments
  console.log(`⏳ Cargando ${data.equipmentAssignments.length} asignaciones...`);
  const assignmentsBatch = data.equipmentAssignments.map((a: any) => ({
    ...a,
    fecha_inicio: new Date(a.fecha_inicio),
    fecha_fin: a.fecha_fin ? new Date(a.fecha_fin) : null,
    createdAt: new Date(a.createdAt),
    updatedAt: new Date(a.updatedAt),
  }));
  await prisma.equipmentAssignment.createMany({
    data: assignmentsBatch,
    skipDuplicates: true,
  });

  console.log('🎉 ¡RESTAURACIÓN Y MIGRACIÓN COMPLETADA EXITOSAMENTE EN SEGUNDOS!');
}

if (require.main === module) {
  importData()
    .catch((e) => {
      console.error('❌ Error durante la importación:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
