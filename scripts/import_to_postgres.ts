import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importData() {
  console.log('🚀 Iniciando restauración/importación de datos a PostgreSQL...');

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
  for (const item of data.sectors) {
    await prisma.sector.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        description: item.description,
        status: item.status,
      },
      create: {
        id: item.id,
        name: item.name,
        description: item.description,
        status: item.status,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // 2. Branches
  console.log(`⏳ Cargando ${data.branches.length} sucursales...`);
  for (const item of data.branches) {
    await prisma.branch.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        code: item.code,
        sectorId: item.sectorId,
        status: item.status,
      },
      create: {
        id: item.id,
        name: item.name,
        code: item.code,
        sectorId: item.sectorId,
        status: item.status,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // 3. Departments
  console.log(`⏳ Cargando ${data.departments.length} departamentos...`);
  for (const item of data.departments) {
    await prisma.department.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        vlan: item.vlan,
        branchId: item.branchId,
      },
      create: {
        id: item.id,
        name: item.name,
        vlan: item.vlan,
        branchId: item.branchId,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // 4. Users (Credenciales & Passwords Hashed)
  console.log(`⏳ Cargando ${data.users.length} usuarios y credenciales...`);
  for (const item of data.users) {
    await prisma.user.upsert({
      where: { id: item.id },
      update: {
        email: item.email,
        name: item.name,
        password: item.password,
        role: item.role,
        must_change_password: item.must_change_password,
      },
      create: {
        id: item.id,
        email: item.email,
        name: item.name,
        password: item.password,
        role: item.role,
        must_change_password: item.must_change_password,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // 5. UserBranchPermissions
  console.log(`⏳ Cargando ${data.userBranchPermissions.length} permisos de usuario...`);
  for (const item of data.userBranchPermissions) {
    await prisma.userBranchPermission.upsert({
      where: { id: item.id },
      update: {
        userId: item.userId,
        sectorId: item.sectorId,
        branchId: item.branchId,
        departmentId: item.departmentId,
      },
      create: {
        id: item.id,
        userId: item.userId,
        sectorId: item.sectorId,
        branchId: item.branchId,
        departmentId: item.departmentId,
      },
    });
  }

  // 6. EquipmentTypes
  console.log(`⏳ Cargando ${data.equipmentTypes.length} tipos de equipos...`);
  for (const item of data.equipmentTypes) {
    await prisma.equipmentType.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        sectorId: item.sectorId,
        description: item.description,
        dynamic_attributes: item.dynamic_attributes,
        associated_brands: item.associated_brands,
      },
      create: {
        id: item.id,
        name: item.name,
        sectorId: item.sectorId,
        description: item.description,
        dynamic_attributes: item.dynamic_attributes,
        associated_brands: item.associated_brands,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // 7. Brands
  console.log(`⏳ Cargando ${data.brands.length} marcas...`);
  for (const item of data.brands) {
    await prisma.brand.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        sectorId: item.sectorId,
      },
      create: {
        id: item.id,
        name: item.name,
        sectorId: item.sectorId,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // 8. EquipmentModels
  console.log(`⏳ Cargando ${data.equipmentModels.length} modelos de equipos...`);
  for (const item of data.equipmentModels) {
    await prisma.equipmentModel.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        sectorId: item.sectorId,
        brandId: item.brandId,
        typeId: item.typeId,
        ram: item.ram,
        processor: item.processor,
        storage: item.storage,
        specs: item.specs,
      },
      create: {
        id: item.id,
        name: item.name,
        sectorId: item.sectorId,
        brandId: item.brandId,
        typeId: item.typeId,
        ram: item.ram,
        processor: item.processor,
        storage: item.storage,
        specs: item.specs,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // 9. Employees
  console.log(`⏳ Cargando ${data.employees.length} funcionarios...`);
  for (const item of data.employees) {
    await prisma.employee.upsert({
      where: { id: item.id },
      update: {
        rut_document: item.rut_document,
        names: item.names,
        paternal_surname: item.paternal_surname,
        maternal_surname: item.maternal_surname,
        full_name: item.full_name,
        email: item.email,
        position: item.position,
        branchId: item.branchId,
        departmentId: item.departmentId,
        status: item.status,
        history_logs: item.history_logs,
      },
      create: {
        id: item.id,
        rut_document: item.rut_document,
        names: item.names,
        paternal_surname: item.paternal_surname,
        maternal_surname: item.maternal_surname,
        full_name: item.full_name,
        email: item.email,
        position: item.position,
        branchId: item.branchId,
        departmentId: item.departmentId,
        status: item.status,
        history_logs: item.history_logs,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // 10. Equipment
  console.log(`⏳ Cargando ${data.equipment.length} equipos...`);
  for (const item of data.equipment) {
    await prisma.equipment.upsert({
      where: { id: item.id },
      update: {
        asset_tag: item.asset_tag,
        serial_number: item.serial_number,
        typeId: item.typeId,
        brandId: item.brandId,
        modelId: item.modelId,
        branchId: item.branchId,
        departmentId: item.departmentId,
        vlan: item.vlan,
        ip_address: item.ip_address,
        dynamic_values: item.dynamic_values,
        status: item.status,
        history_logs: item.history_logs,
      },
      create: {
        id: item.id,
        asset_tag: item.asset_tag,
        serial_number: item.serial_number,
        typeId: item.typeId,
        brandId: item.brandId,
        modelId: item.modelId,
        branchId: item.branchId,
        departmentId: item.departmentId,
        vlan: item.vlan,
        ip_address: item.ip_address,
        dynamic_values: item.dynamic_values,
        status: item.status,
        history_logs: item.history_logs,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // 11. EquipmentAssignments
  console.log(`⏳ Cargando ${data.equipmentAssignments.length} asignaciones e historial...`);
  for (const item of data.equipmentAssignments) {
    await prisma.equipmentAssignment.upsert({
      where: { id: item.id },
      update: {
        equipmentId: item.equipmentId,
        employeeId: item.employeeId,
        fecha_inicio: new Date(item.fecha_inicio),
        fecha_fin: item.fecha_fin ? new Date(item.fecha_fin) : null,
        assignedByUserId: item.assignedByUserId,
        notes: item.notes,
      },
      create: {
        id: item.id,
        equipmentId: item.equipmentId,
        employeeId: item.employeeId,
        fecha_inicio: new Date(item.fecha_inicio),
        fecha_fin: item.fecha_fin ? new Date(item.fecha_fin) : null,
        assignedByUserId: item.assignedByUserId,
        notes: item.notes,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  console.log('🎉 ¡RESTAURACIÓN Y MIGRACIÓN COMPLETADA EXITOSAMENTE CON 100% DE REGISTROS!');
}

importData()
  .catch((e) => {
    console.error('❌ Error durante la importación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
