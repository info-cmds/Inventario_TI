import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawEmployees = [
  { rut: '10348120-1', names: 'WALDO', paternal: 'AHUMADA', maternal: 'ESPINOZA', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '18792296-8', names: 'NICOLE', paternal: 'ALVARADO', maternal: 'RODRIGUEZ', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '12838820-6', names: 'ISABEL ALEJANDRA', paternal: 'CORTES', maternal: 'SANTANDER', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '17433827-2', names: 'YOLANDA MACARENA', paternal: 'CUTURRUFO', maternal: 'ASTUDILLO', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '21451950-K', names: 'MARIA JOSE', paternal: 'ESPINOZA', maternal: 'YUPANQUI', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '11202867-6', names: 'JOSE ALFREDO', paternal: 'GODOY', maternal: 'SOTO', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '19452552-4', names: 'BIANCA', paternal: 'GUTIERREZ', maternal: 'GALLARDO', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '15339493-8', names: 'VIVIANA', paternal: 'IRRIBARREN', maternal: 'TURIS', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '18233750-1', names: 'DANIELA MARIANA', paternal: 'LOPEZ', maternal: 'ROJAS', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '12802353-4', names: 'CARLOS', paternal: 'RIVERA', maternal: 'ARAYA', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '15975052-3', names: 'MARCELO ALEJANDRO', paternal: 'SAAVEDRA', maternal: 'GANDARA', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '13647970-9', names: 'YAMAYOSHI ANTONIO', paternal: 'SATO', maternal: 'MARTINEZ', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '15015318-2', names: 'JUAN', paternal: 'VALDIVIA', maternal: 'ARAYA', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
  { rut: '21157082-2', names: 'ANTHONY URBAN', paternal: 'ZARATE', maternal: 'BRICE O', position: 'FUNCIONARIO OBRAS', branch: 'Casa Central Corporativa', dept: 'OBRAS' },
];

async function main() {
  console.log('--- Iniciando verificación e inserción de funcionarios OBRAS ---');

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

  // 2. Check or create Department "OBRAS" under Casa Central Corporativa
  let dept = await prisma.department.findFirst({
    where: {
      branchId: branch.id,
      name: { contains: 'OBRAS' },
    },
  });

  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: 'OBRAS (Dirección de Obras y Proyectos)',
        branchId: branch.id,
      },
    });
    console.log('Departamento creado:', dept.name);
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const emp of rawEmployees) {
    const names = emp.names.trim().toUpperCase();
    const paternal = emp.paternal.trim().toUpperCase();
    const maternal = emp.maternal.trim().toUpperCase();
    const rut = emp.rut.trim().toUpperCase();
    const fullName = `${names} ${paternal} ${maternal}`.trim();

    // Check if employee with this RUT or full_name already exists in DB
    const existingByRut = await prisma.employee.findUnique({
      where: { rut_document: rut },
    });

    const existingByName = await prisma.employee.findFirst({
      where: { full_name: fullName },
    });

    if (existingByRut || existingByName) {
      console.log(`[OMITIDO] Funcionario ya existe: ${rut} - ${fullName}`);
      skippedCount++;
    } else {
      const firstWord = names.split(' ')[0].toLowerCase();
      const email = `${firstWord}.${paternal.toLowerCase()}@cmds.cl`.toUpperCase();
      await prisma.employee.create({
        data: {
          rut_document: rut,
          names,
          paternal_surname: paternal,
          maternal_surname: maternal,
          full_name: fullName,
          email,
          position: emp.position.toUpperCase(),
          branchId: branch.id,
          departmentId: dept.id,
          status: 'ACTIVO',
        },
      });
      console.log(`[CREADO] Funcionario insertado: ${rut} - ${fullName}`);
      createdCount++;
    }
  }

  console.log(`\nResumen final: ${createdCount} creados, ${skippedCount} omitidos (ya existían).`);
}

main()
  .catch((e) => {
    console.error('Error al ejecutar script:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
