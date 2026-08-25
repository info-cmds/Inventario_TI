import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawEmployees = [
  { rut: '13868073-8', names: 'KAREN', paternal: 'AGUILERA', maternal: 'GARCIA', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'Extraescolar' },
  { rut: '13419628-9', names: 'CRISTIAN', paternal: 'ARANGUA', maternal: 'TORO', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Extraescolar' },
  { rut: '6888612-0', names: 'GUILLERMO', paternal: 'MIRANDA', maternal: 'VALENCIA', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'Extraescolar' },
  { rut: '15960344-K', names: 'NATALIA ANDREA', paternal: 'ALIAGA', maternal: 'ALVAREZ', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '12443425-4', names: 'ORLANDO', paternal: 'ARANCIBIA', maternal: 'MUNIZAGA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '18971965-5', names: 'SEBASTIAN IGNACIO', paternal: 'BENITEZ', maternal: 'ROJAS', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '6930524-5', names: 'JULIO ALBERTO', paternal: 'CALDERON', maternal: 'MARTINEZ', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '11548338-2', names: 'GONZALO', paternal: 'FERNANDEZ', maternal: 'RIVERA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '21180347-9', names: 'GONZALO', paternal: 'GALLEGO', maternal: 'MAZZONE', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '11343494-5', names: 'ALEJANDRO', paternal: 'GOMEZ', maternal: 'YOMA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '7600397-1', names: 'JORGE TOMAS', paternal: 'LARA', maternal: 'CARVAJAL', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '9087888-3', names: 'MAURICIO', paternal: 'LEDEZMA', maternal: 'FERNANDEZ', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '8798029-4', names: 'PEDRO ANTONIO', paternal: 'MIRIC', maternal: 'PARRA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '18371412-0', names: 'KATHERINE NICOLE', paternal: 'MORAGA', maternal: 'TORRES', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '16672267-5', names: 'DIEGO IGNACIO', paternal: 'PEREZ', maternal: 'TORO', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '9914502-1', names: 'MARTA', paternal: 'ROJAS', maternal: 'BARRAZA', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '16242627-3', names: 'VIVIANA ANDREA', paternal: 'SEPULVEDA', maternal: 'LEGAZA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '16162837-9', names: 'PATRICIO', paternal: 'VARGAS', maternal: 'VERA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Planificación' },
  { rut: '12209808-7', names: 'JESSICA', paternal: 'AGUILA', maternal: 'CABALLERO', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '15022803-4', names: 'MIXCY', paternal: 'ALBORNOZ', maternal: 'LOPEZ', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '13645340-8', names: 'MAYLIN SOLEDAD', paternal: 'AVALOS', maternal: 'MONARDES', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '19214972-K', names: 'MARGARITA ISABEL', paternal: 'CASTILLO', maternal: 'CASTILLO', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '12420077-6', names: 'LORENA', paternal: 'CERPA', maternal: 'ARAYA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '20494002-9', names: 'JAVIERA IGNACIA', paternal: 'COLLADO', maternal: 'TORRES', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '19951443-1', names: 'JAVIERA PAZ', paternal: 'FERNANDEZ', maternal: 'GONZALEZ', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '18124182-9', names: 'MARIA FERNANDA', paternal: 'FUENTES', maternal: 'BENAVIDES', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '13869771-1', names: 'DANIELA', paternal: 'GUERRA', maternal: 'SEALZER', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '17735714-6', names: 'ELVIRA KARINA', paternal: 'ITURRIETA', maternal: 'ARAVENA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '15690086-9', names: 'BRENDA CECILIA', paternal: 'MARAADO', maternal: 'ROJAS', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '16133005-1', names: 'FERNANDO', paternal: 'MELENDEZ', maternal: 'OSUNA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '12861566-0', names: 'LILIAN MARICEL', paternal: 'MORIS', maternal: 'BELMONTE', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '17938261-K', names: 'NAYARETH LISSETTE', paternal: 'MUOZ', maternal: 'BRIZUELA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '15582745-9', names: 'MONICA DEL CARMEN', paternal: 'MUOZ', maternal: 'NAVARRO', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '16438922-7', names: 'SUSANA VERONICA', paternal: 'OLIVARES', maternal: 'SERICHE', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '16705214-2', names: 'DOMINGO EDUARDO', paternal: 'SAAVEDRA', maternal: 'VEGA', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '18005926-1', names: 'GABRIELA PAZ', paternal: 'SALDIVAR', maternal: 'VILLALOBOS', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '13980680-8', names: 'ROMINA', paternal: 'TOBAR', maternal: 'LAZCANO', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '22449396-7', names: 'ANGELLA KATHERINE', paternal: 'VILLALOBOS', maternal: 'OYARCE', position: 'Profesionales C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
  { rut: '11377965-9', names: 'MARCELA', paternal: 'ZULETA', maternal: 'GAITAN', position: 'Administrativos C.C.', branch: 'Casa Central Corporativa', dept: 'Educación' },
];

async function main() {
  console.log('--- Iniciando verificación e inserción de nuevos funcionarios (Extraescolar, Planificación, Educación) ---');

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

  const deptMap: Record<string, string> = {};

  const getOrCreateDept = async (deptName: string) => {
    const cleanDeptName = deptName.trim().toUpperCase();
    if (deptMap[cleanDeptName]) return deptMap[cleanDeptName];

    let dept = await prisma.department.findFirst({
      where: {
        branchId: branch.id,
        name: { contains: cleanDeptName },
      },
    });

    if (!dept) {
      dept = await prisma.department.create({
        data: {
          name: cleanDeptName,
          branchId: branch.id,
        },
      });
      console.log('Departamento creado:', dept.name);
    }
    deptMap[cleanDeptName] = dept.id;
    return dept.id;
  };

  let createdCount = 0;
  let skippedCount = 0;

  for (const emp of rawEmployees) {
    const names = emp.names.trim().toUpperCase();
    const paternal = emp.paternal.trim().toUpperCase();
    const maternal = emp.maternal.trim().toUpperCase();
    const rut = emp.rut.trim().toUpperCase();
    const fullName = `${names} ${paternal} ${maternal}`.trim();
    const targetDeptId = await getOrCreateDept(emp.dept);

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
          departmentId: targetDeptId,
          status: 'ACTIVO',
        },
      });
      console.log(`[CREADO] Funcionario insertado (${emp.dept}): ${rut} - ${fullName}`);
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
