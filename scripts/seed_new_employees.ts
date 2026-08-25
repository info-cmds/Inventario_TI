import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawEmployees = [
  { rut: '20415812-6', names: 'MARCELA', paternal: 'ACUÑA', maternal: 'VILLALOBOS', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '6381543-8', names: 'HERNAN', paternal: 'ALBORNOZ', maternal: 'CABEZAS', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '16704571-5', names: 'ESTIVEN WAL', paternal: 'ARACENA', maternal: 'VILLAR', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '13419503-7', names: 'CLAUDIA', paternal: 'ARAYA', maternal: 'RIVERA', position: 'EMPLEADO SERVICIO', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '15021909-4', names: 'ANGIE ANDR', paternal: 'ASTORGA', maternal: 'ARAN', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '11837021-K', names: 'MARIELA', paternal: 'ATENAS', maternal: 'VIDAL', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '9530346-3', names: 'ROSA', paternal: 'AZOCAR', maternal: 'GUTIERREZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '18311162-0', names: 'PRISCILLA', paternal: 'BARRERA', maternal: 'FIGUEROA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '10741453-3', names: 'NADJA ANGE', paternal: 'BAUDRAND', maternal: 'JERIA', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '19443835-4', names: 'PAMELA', paternal: 'BOLADOS', maternal: 'REYES', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '7673503-4', names: 'CARLOS JOSE', paternal: 'BORQUEZ', maternal: 'SALFATE', position: 'GUARDIA DE SEGURIDAD', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '9922969-1', names: 'LUIS', paternal: 'BRAVO', maternal: 'DIAZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '18125133-6', names: 'KAROL VIVIAI', paternal: 'BRAÑA', maternal: 'GALLARDO', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '24871339-9', names: 'YENY', paternal: 'CABALLERO', maternal: 'QUISPE', position: 'EMPLEADO SERVICIO', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '22258952-5', names: 'ELSA', paternal: 'CAMPOS', maternal: 'MAMANI', position: 'EMPLEADO SERVICIO', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '16704764-5', names: 'ANYELINA', paternal: 'CARVAJAL', maternal: 'CALABACER', position: 'EMPLEADO SERVICIO', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '4865864-4', names: 'ANDRES', paternal: 'CASTILLO', maternal: 'ROJAS', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '17468580-0', names: 'MARILENE DE', paternal: 'CATALAN', maternal: 'MOYANO', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '20415667-0', names: 'BASTIAN', paternal: 'CAYO', maternal: 'CAYO', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '10270999-3', names: 'MAURO AND', paternal: 'CHIANG', maternal: 'OSSANDON', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '21617459-3', names: 'KATHERINE', paternal: 'CONDE', maternal: 'CHAPARRO', position: 'EMPLEADO SERVICIO', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '8069442-3', names: 'REMBERTO', paternal: 'CORTES', maternal: 'VELIZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '12614746-5', names: 'SANDRA', paternal: 'CRUZ', maternal: 'BERRIOS', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '11343765-0', names: 'SUAN PAOLA', paternal: 'DAHMEN', maternal: 'HAYASHIDA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '20261858-8', names: 'PEDRO ALON', paternal: 'ECHEVERRIA', maternal: 'RAMIREZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '20730895-1', names: 'LEONARDO', paternal: 'ESCRIBAN', maternal: 'VERAGUA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '8705951-0', names: 'LUIS', paternal: 'FAUNDEZ', maternal: 'SILVA', position: 'GUARDIA DE SEGURIDAD', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '20463540-4', names: 'SOFIA CATAL', paternal: 'FUENTES', maternal: 'GONZALEZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '7690539-8', names: 'GERMAN EST', paternal: 'GODOY', maternal: 'RAMIREZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '9192272-K', names: 'ORIANA', paternal: 'GONZALEZ', maternal: 'SAAVEDRA', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '10466458-K', names: 'LORENA', paternal: 'GUTIERREZ', maternal: 'GAVIA', position: 'EMPLEADO SERVICIO', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '8944948-0', names: 'JOSE', paternal: 'HERRERA', maternal: 'VALENZUELA', position: 'GUARDIA DE SEGURIDAD', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '13220899-9', names: 'LEONARD', paternal: 'HORMAZABA', maternal: 'LOPEZ', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '13643594-9', names: 'YANINA', paternal: 'ISKRAC', maternal: 'ARAYA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '10569027-4', names: 'MOISES', paternal: 'JIMENEZ', maternal: 'ARAYA', position: 'EMPLEADO SERVICIO', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '19950855-5', names: 'ELIAS', paternal: 'JIMENEZ', maternal: 'QUISPE', position: 'GUARDIA DE SEGURIDAD', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '17435996-2', names: 'MILAN', paternal: 'JOFRE', maternal: 'JOFRE', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '20732401-9', names: 'MACARENA', paternal: 'LARA', maternal: 'ESPINOZA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '19952284-1', names: 'DIEGO IGNAC', paternal: 'LEILA', maternal: 'CANIHUANTE', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '20960339-K', names: 'KADISHA COI', paternal: 'LOEZAR', maternal: 'LEGUNAD', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '11468961-0', names: 'XIMENA', paternal: 'MARTINEZ', maternal: 'GUZMAN', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '11814051-6', names: 'SANDRA', paternal: 'MATURANA', maternal: 'ESPINOZA', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '20415073-7', names: 'SIRIO', paternal: 'MATUS', maternal: 'HERNANDEZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '9643861-3', names: 'HUGO', paternal: 'MELCHOR', maternal: 'PEREZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '19891741-9', names: 'JOSE MANUE', paternal: 'MOLINA', maternal: 'LEIVA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '15021127-1', names: 'MARCELA JAC', paternal: 'MOY', maternal: 'MATURANA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '19396473-7', names: 'NICOLAS', paternal: 'PALMA', maternal: 'DIAZ', position: 'GUARDIA DE SEGURIDAD', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '17438234-4', names: 'KAREN NICO', paternal: 'PARDO', maternal: 'DIAZ', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '8658611-8', names: 'PATRICIA', paternal: 'PENA', maternal: 'VALDES', position: 'EMPLEADO SERVICIO', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '11090519-K', names: 'YOLANDA', paternal: 'PEREZ', maternal: 'SANHUEZA', position: 'GUARDIA DE SEGURIDAD', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '18014559-1', names: 'IVANIA CECIL', paternal: 'RAFFO', maternal: 'RAFFO', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '19710968-8', names: 'GABRIELA', paternal: 'REYES', maternal: 'TOLEDO', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '25066190-8', names: 'SIRLEHY SOFI', paternal: 'RICARDO', maternal: 'PETRO', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '15975018-3', names: 'EDISON', paternal: 'RIVAS', maternal: 'HUERTA', position: 'EMPLEADO SERVICIO', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '16705931-7', names: 'SANDY', paternal: 'RODRIGUEZ', maternal: 'GONZALEZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '18311820-K', names: 'MANUEL', paternal: 'ROJAS', maternal: 'SANHUEZA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '17438644-7', names: 'MILENKO ALE', paternal: 'ROJAS', maternal: 'TOLEDO', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '7493887-6', names: 'ARTURO', paternal: 'RUBIO', maternal: 'HERRERA', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '15023817-K', names: 'HILDA', paternal: 'SALINAS', maternal: 'SALINAS', position: 'GUARDIA DE SEGURIDAD', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '19463404-8', names: 'MELANIE', paternal: 'SEPULVEDA', maternal: 'SANTANDER', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '17017473-9', names: 'MIGUEL PATF', paternal: 'TAN', maternal: 'GONZALEZ', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '15689931-3', names: 'KAREN', paternal: 'TELLO', maternal: 'DIAZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '13365969-2', names: 'WILMA ALEJA', paternal: 'VEGA', maternal: 'CARDENAS', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '19692323-3', names: 'KARLA ALEJA', paternal: 'VERGARA', maternal: 'CORTES', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '15812082-8', names: 'MANUEL', paternal: 'VIDELA', maternal: 'RIVERA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '16260001-K', names: 'ERICK', paternal: 'VIZCARRA', maternal: 'PEREZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
  { rut: '8391084-4', names: 'ISABEL DELF', paternal: 'YOMA', maternal: 'PEREZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'DAF' },
];

async function main() {
  console.log('--- Iniciando verificación e inserción de nuevos funcionarios ---');

  // 1. Check or create Sector "Casa Central"
  let sector = await prisma.sector.findFirst({
    where: { name: { contains: 'Casa Central' } },
  });
  if (!sector) {
    sector = await prisma.sector.create({
      data: {
        name: 'Casa Central',
        description: 'Casa Central Corporativa CMDS',
        status: 'ACTIVO',
      },
    });
    console.log('Sector creado:', sector.name);
  }

  // 2. Check or create Branch "Casa Central Corporativa"
  let branch = await prisma.branch.findFirst({
    where: {
      OR: [
        { name: { contains: 'Casa Central' } },
        { code: 'CCC-01' },
      ],
    },
  });

  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Casa Central Corporativa',
        code: 'CCC-01',
        sectorId: sector.id,
        status: 'ACTIVA',
      },
    });
    console.log('Sucursal creada:', branch.name);
  }

  // 3. Check or create Department "DAF"
  let dept = await prisma.department.findFirst({
    where: {
      branchId: branch.id,
      name: { contains: 'DAF' },
    },
  });

  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: 'DAF (Dirección de Administración y Finanzas)',
        branchId: branch.id,
      },
    });
    console.log('Departamento creado:', dept.name);
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const emp of rawEmployees) {
    const fullName = `${emp.names} ${emp.paternal} ${emp.maternal}`.trim();

    // Check if employee with this RUT or full_name already exists in DB
    const existingByRut = await prisma.employee.findUnique({
      where: { rut_document: emp.rut },
    });

    const existingByName = await prisma.employee.findFirst({
      where: { full_name: fullName },
    });

    if (existingByRut || existingByName) {
      console.log(`[OMITIDO] Funcionario ya existe: ${emp.rut} - ${fullName}`);
      skippedCount++;
    } else {
      const email = `${emp.names.toLowerCase().replace(/\s+/g, '.')}.${emp.paternal.toLowerCase()}@cmds.cl`;
      await prisma.employee.create({
        data: {
          rut_document: emp.rut,
          names: emp.names,
          paternal_surname: emp.paternal,
          maternal_surname: emp.maternal,
          full_name: fullName,
          email,
          position: emp.position,
          branchId: branch.id,
          departmentId: dept.id,
          status: 'ACTIVO',
        },
      });
      console.log(`[CREADO] Funcionario insertado: ${emp.rut} - ${fullName}`);
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
