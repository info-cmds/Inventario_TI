import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawEquipment = [
  { asset_tag: 'CMDS278', serial: 'MXL60310LL', type: 'ALL IN ONE', brand: 'HP', model: '400 G2', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16GB', proc: 'I3-6100T', storage: '500 SSD' },
  { asset_tag: 'CMDS303', serial: 'MXL7241WMP', type: 'ALL IN ONE', brand: 'HP', model: '400 G2', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16GB', proc: 'I5-6500', storage: '500 SSD' },
  { asset_tag: 'CMDS054', serial: 'MXL7241WKG', type: 'ALL IN ONE', brand: 'HP', model: '400 G2', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16GB', proc: 'I5-6500', storage: '500 SSD' },
  { asset_tag: 'CMDS268', serial: 'MXL7241WK3', type: 'ALL IN ONE', brand: 'HP', model: '400 G2', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16 GB', proc: 'I5-6500', storage: '500 SSD' },
  { asset_tag: 'CMDS285', serial: '5CD1518KVH', type: 'NOTEBOOK', brand: 'HP', model: 'FIREFLY 15', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '64GB', proc: 'I7-1165G7', storage: '1TB SSD' },
  { asset_tag: 'CMDS313', serial: 'MXL7241WR6', type: 'ALL IN ONE', brand: 'HP', model: '400 G2', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '8GB', proc: 'I5-6500', storage: '1THDD' },
  { asset_tag: 'CMDS353', serial: '5CD347809B', type: 'NOTEBOOK', brand: 'HP', model: 'PROBOOK 445 G10', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16GB', proc: 'RYZEN 5 7530U', storage: '500SSD' },
  { asset_tag: 'CMDS364', serial: '5CD3478088', type: 'NOTEBOOK', brand: 'HP', model: 'PROBOOK 445 G10', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16GB', proc: 'RYZEN 5 7530U', storage: '500SSD' },
  { asset_tag: 'CMDS380', serial: '5CD347809Z', type: 'NOTEBOOK', brand: 'HP', model: 'PROBOOK 445 G10', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16GB', proc: 'RYZEN 5 7530U', storage: '500SSD' },
  { asset_tag: 'CMDS381', serial: '5CD347808N', type: 'NOTEBOOK', brand: 'HP', model: 'PROBOOK 445 G10', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16GB', proc: 'RYZEN 5 7530U', storage: '500SSD' },
  { asset_tag: 'CMDS383', serial: '5CD3478081', type: 'NOTEBOOK', brand: 'HP', model: 'PROBOOK 445 G10', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16GB', proc: 'RYZEN 5 7530U', storage: '500SSD' },
  { asset_tag: 'CMDS384', serial: '5CD34780B2', type: 'NOTEBOOK', brand: 'HP', model: 'PROBOOK 445 G10', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16GB', proc: 'RYZEN 5 7530U', storage: '500SSD' },
  { asset_tag: 'CMDS385', serial: '5CD347807S', type: 'NOTEBOOK', brand: 'HP', model: 'PROBOOK 445 G10', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16GB', proc: 'RYZEN 5 7530U', storage: '500SSD' },
  { asset_tag: 'CMDS386', serial: '5CD347809S', type: 'NOTEBOOK', brand: 'HP', model: 'PROBOOK 445 G10', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16GB', proc: 'RYZEN 5 7530U', storage: '500SSD' },
  { asset_tag: 'CMDS392', serial: '5CD3478091', type: 'NOTEBOOK', brand: 'HP', model: 'PROBOOK 445 G10', branch: 'Casa Central Corporativa', dept: 'ABASTECIMIENTO', ram: '16GB', proc: 'RYZEN 5 7530U', storage: '500SSD' },
];

async function main() {
  console.log('--- Iniciando verificación e inserción de nuevos equipos al inventario ---');

  // 1. Get or create Branch "Casa Central Corporativa"
  let branch = await prisma.branch.findFirst({
    where: {
      OR: [
        { name: { contains: 'Casa Central' } },
        { code: 'CCC-01' },
      ],
    },
  });

  if (!branch) {
    let sector = await prisma.sector.findFirst({ where: { name: { contains: 'Casa Central' } } });
    if (!sector) {
      sector = await prisma.sector.create({
        data: { name: 'CASA CENTRAL', description: 'Casa Central Corporativa CMDS', status: 'ACTIVO' },
      });
    }
    branch = await prisma.branch.create({
      data: { name: 'CASA CENTRAL CORPORATIVA', code: 'CCC-01', sectorId: sector.id, status: 'ACTIVA' },
    });
  }

  // 2. Get or create Department "ABASTECIMIENTO" under Casa Central Corporativa
  let dept = await prisma.department.findFirst({
    where: {
      branchId: branch.id,
      name: { contains: 'ABASTECIMIENTO' },
    },
  });

  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: 'ABASTECIMIENTO (Dirección de Adquisiciones y Logística)',
        branchId: branch.id,
      },
    });
    console.log('Departamento creado:', dept.name);
  }

  // 3. Get or create Brand "HP"
  let brandObj = await prisma.brand.findFirst({
    where: { name: { equals: 'HP' } },
  });
  if (!brandObj) {
    brandObj = await prisma.brand.create({ data: { name: 'HP' } });
  }

  // Caches
  const typeCache: Record<string, string> = {};
  const modelCache: Record<string, string> = {};

  const getOrCreateType = async (typeName: string) => {
    const clean = typeName.trim().toUpperCase();
    if (typeCache[clean]) return typeCache[clean];

    let t = await prisma.equipmentType.findFirst({ where: { name: clean } });
    if (!t) {
      t = await prisma.equipmentType.create({
        data: {
          name: clean,
          dynamic_attributes: JSON.stringify([
            { key: 'ram', label: 'Memoria RAM', type: 'text' },
            { key: 'processor', label: 'Procesador', type: 'text' },
            { key: 'storage', label: 'Almacenamiento', type: 'text' },
          ]),
        },
      });
      console.log('Tipo de equipo creado:', t.name);
    }
    typeCache[clean] = t.id;
    return t.id;
  };

  const getOrCreateModel = async (modelName: string, typeId: string) => {
    const clean = modelName.trim().toUpperCase();
    if (modelCache[clean]) return modelCache[clean];

    let m = await prisma.equipmentModel.findFirst({ where: { name: clean, brandId: brandObj.id } });
    if (!m) {
      m = await prisma.equipmentModel.create({
        data: {
          name: clean,
          brandId: brandObj.id,
          typeId,
        },
      });
      console.log('Modelo de equipo creado:', m.name);
    }
    modelCache[clean] = m.id;
    return m.id;
  };

  let createdCount = 0;
  let skippedCount = 0;

  for (const eq of rawEquipment) {
    const assetTag = eq.asset_tag.trim().toUpperCase();
    const serial = eq.serial.trim().toUpperCase();

    const existingByTag = await prisma.equipment.findUnique({ where: { asset_tag: assetTag } });
    const existingBySerial = await prisma.equipment.findUnique({ where: { serial_number: serial } });

    if (existingByTag || existingBySerial) {
      console.log(`[OMITIDO] Equipo ya existe en el sistema: ${assetTag} / ${serial}`);
      skippedCount++;
    } else {
      const typeId = await getOrCreateType(eq.type);
      const modelId = await getOrCreateModel(eq.model, typeId);

      const dynamicValues = JSON.stringify({
        ram: eq.ram,
        processor: eq.proc,
        storage: eq.storage,
      });

      await prisma.equipment.create({
        data: {
          asset_tag: assetTag,
          serial_number: serial,
          typeId,
          brandId: brandObj.id,
          modelId,
          branchId: branch.id,
          departmentId: dept.id,
          dynamic_values: dynamicValues,
          status: 'disponible',
        },
      });
      console.log(`[CREADO] Equipo insertado: ${assetTag} | ${serial} | ${eq.type} HP ${eq.model}`);
      createdCount++;
    }
  }

  console.log(`\nResumen final inventario: ${createdCount} equipos creados, ${skippedCount} omitidos (ya existían).`);
}

main()
  .catch((e) => {
    console.error('Error al ejecutar script de equipos:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
