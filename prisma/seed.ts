import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Sectors, Branches, Casa Central Departments, 39 Monitors, and Employees...');

  // Clean existing tables
  await prisma.equipmentAssignment.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.equipmentType.deleteMany();
  await prisma.userBranchPermission.deleteMany();
  await prisma.department.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.user.deleteMany();

  // Create Password Hashes (Preserving demo test credentials)
  const defaultPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. Create Sectors
  const sectorEdu = await prisma.sector.create({
    data: {
      name: 'Educación',
      description: 'Liceos, Escuelas, Colegios y Jardines Infantiles VTF',
      status: 'ACTIVO',
    },
  });

  const sectorSalud = await prisma.sector.create({
    data: {
      name: 'Salud',
      description: 'CECOSF, CESFAM, Farmacia Comunal y Red de Salud',
      status: 'ACTIVO',
    },
  });

  const sectorCasaCentral = await prisma.sector.create({
    data: {
      name: 'Casa Central',
      description: 'Direcciones Generales y Administración Central Corporativa',
      status: 'ACTIVO',
    },
  });

  // 2. Create Users (Preserving existing demo test credentials)
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@empresa.com',
      name: 'Super Administrador Global',
      password: defaultPasswordHash,
      role: 'SUPERADMIN',
      must_change_password: true,
    },
  });

  const adminEdu = await prisma.user.create({
    data: {
      email: 'admin.educacion@empresa.com',
      name: 'Gonzalo Ramírez (Admin Educación)',
      password: defaultPasswordHash,
      role: 'ADMINISTRADOR',
      must_change_password: false,
    },
  });

  const adminSalud = await prisma.user.create({
    data: {
      email: 'admin.salud@empresa.com',
      name: 'Dra. Elena Fuentes (Admin Salud)',
      password: defaultPasswordHash,
      role: 'ADMINISTRADOR',
      must_change_password: false,
    },
  });

  const lectorValparaiso = await prisma.user.create({
    data: {
      email: 'lector.valparaiso@empresa.com',
      name: 'Mariana López (Lector Valparaíso)',
      password: defaultPasswordHash,
      role: 'LECTOR',
      must_change_password: false,
    },
  });

  // 3. Create Branches for Sector Educación
  const eduBranchesData = [
    { code: 'A-12', name: 'Liceo Comercial "Jerardo Muñoz Campos"' },
    { code: 'A-14', name: 'Liceo "Tecnico"' },
    { code: 'A-15', name: 'Liceo "Mario Bahamonde Silva"' },
    { code: 'A-16', name: 'Liceo "Eulogio Gordo Moneo"' },
    { code: 'A-17', name: 'Liceo "Marta Narea Diaz"' },
    { code: 'A-22', name: 'Liceo "La Portada"' },
    { code: 'A-26', name: 'Liceo "Oscar Bonilla Bradanovic"' },
    { code: 'A-33', name: 'Liceo Politécnico Los Arenales' },
    { code: 'B-13', name: 'Liceo "Domingo Herrera Rivera"' },
    { code: 'B-29', name: 'Liceo "Andrés Sabella Galvez"' },
    { code: 'B-32', name: 'Liceo "Dr. Antonio Rendic"' },
    { code: 'B-35', name: 'Colegio "La Concepción"' },
    { code: 'B-36', name: 'Liceo "La Chimba"' },
    { code: 'D-58', name: 'Escuela "Japón"' },
    { code: 'D-59', name: 'Escuela "España"' },
    { code: 'D-65', name: 'Escuela "Padre Gustavo Le Paige"' },
    { code: 'D-66', name: 'Escuela "Italia"' },
    { code: 'D-68', name: 'Escuela "José Papic Radnic"' },
    { code: 'D-72', name: 'Escuela "Ljubica Domic W."' },
    { code: 'D-73', name: 'Escuela "Republica EE.UU"' },
    { code: 'D-74', name: 'Escuela "Alcalde Maximiliano Poblete"' },
    { code: 'D-75', name: 'Escuela "Dario Salas Diaz"' },
    { code: 'D-85', name: 'Escuela "Romulo J. Peña"' },
    { code: 'D-86', name: 'Escuela "Juan Lopez"' },
    { code: 'D-90', name: 'Escuela "Republica Argentina"' },
    { code: 'D-121', name: 'Escuela "Humberto González Echegoyen"' },
    { code: 'D-129', name: 'Escuela "Juan Pablo II"' },
    { code: 'D-136', name: 'Escuela "Reverendo Padre Patricio Cariola"' },
    { code: 'D-138', name: 'Escuela "Padre Alberto Hurtado"' },
    { code: 'D-139', name: 'Escuela "Elmo Funez Carrizo"' },
    { code: 'E-56', name: 'Escuela "Huanchaca"' },
    { code: 'E-57', name: 'Escuela Parvulos "Marcela Paz"' },
    { code: 'E-67', name: 'Escuela "Claudio Matte Perez"' },
    { code: 'E-77', name: 'Escuela "Juan Sandoval Carrasco"' },
    { code: 'E-79', name: 'Escuela "Ecuador"' },
    { code: 'E-80', name: 'Escuela "Arturo Prat Chacón"' },
    { code: 'E-81', name: 'Escuela "Héroes de la Concepción"' },
    { code: 'E-84', name: 'Escuela "Las Americas Profesor Justo Valladares"' },
    { code: 'E-87', name: 'Escuela "Las Rocas"' },
    { code: 'E-88', name: 'Escuela "Edda Cuneo"' },
    { code: 'E-97', name: 'Escuela "La Bandera"' },
    { code: 'F-60', name: 'Liceo Artístico "Armando Carrera"' },
    { code: 'F-78', name: 'Escuela "General Manuel Baquedano"' },
    { code: 'F-89', name: 'Escuela "Fundacion Minera Escondida"' },
    { code: 'F-94', name: 'Escuela "Santiago Amengual"' },
    { code: 'F-96', name: 'Instituto Cientifico Educ. Jose Maza Sancho' },
    { code: 'F-112', name: 'Escuela Parvulos "Los Pinguinitos"' },
    { code: 'F-128', name: 'Escuela Parvulos "Semillita"' },
    { code: 'G-111', name: 'Escuela "Gabriela Mistral"' },
    { code: 'G-113', name: 'Escuela Parvulos "Blanca Nieves"' },
    { code: 'VTF-1', name: 'Jardín Infantil "Esperanza"' },
    { code: 'VTF-2', name: 'Jardín Infantil "Riqueza Escondida"' },
    { code: 'VTF-3', name: 'Jardín Infantil "Mi Rinconcito Feliz"' },
    { code: 'VTF-4', name: 'Sala Cuna Pedacito de Sol A-22' },
    { code: 'VTF-5', name: 'Jardín Infantil "Arbolía"' },
    { code: 'VTF-6', name: 'Jardín Infantil "Caballito de Mar"' },
    { code: 'VTF-7', name: 'Jardín Infantil "El Portal de Belén"' },
    { code: 'VTF-8', name: 'Jardín Infantil "Pankarita"' },
    { code: 'VTF-9', name: 'Jardín Infantil "Sueño de Colores"' },
    { code: 'VTF-10', name: 'J.Infantil y Sala Cuna "Perlitas del Desierto"' },
  ];

  const createdEduBranches = [];
  for (const b of eduBranchesData) {
    const branch = await prisma.branch.create({
      data: {
        name: b.name,
        code: b.code,
        sectorId: sectorEdu.id,
        status: 'ACTIVA',
      },
    });
    createdEduBranches.push(branch);
  }

  // 4. Create Branches for Sector Salud
  const saludBranchesData = [
    { code: 'CEC-COV', name: 'CECOSF COVIEFI' },
    { code: 'CEC-CHI', name: 'CECOSF LA CHIMBA' },
    { code: 'CPR-NOR', name: 'CPR NORTE' },
    { code: 'CPR-SUR', name: 'CPR SUR' },
    { code: 'CES-SUR', name: 'CENTRO SUR' },
    { code: 'CES-COR', name: 'CORVALLIS' },
    { code: 'DIR-SAL', name: 'DIRECCION DE SALUD' },
    { code: 'DIS-COL', name: 'DISPOSITIVO COLOSO' },
    { code: 'DRO-SAL', name: 'DROGUERIA' },
    { code: 'FAR-COM', name: 'FARMACIA COMUNAL' },
    { code: 'CES-JPII', name: 'JUAN PABLO II' },
    { code: 'LAB-SAL', name: 'LABORATORIO' },
    { code: 'CES-[#MC]', name: 'MARÍA CRISTINA' },
    { code: 'CES-NOR', name: 'NORTE' },
    { code: 'CES-ORI', name: 'ORIENTE' },
    { code: 'CES-REN', name: 'RENDIC' },
    { code: 'SAR-COV', name: 'SAR COVIEFI' },
    { code: 'CES-VAL', name: 'VALDIVIESO' },
  ];

  const createdSaludBranches = [];
  let branchDirSalud: any = null;
  for (const b of saludBranchesData) {
    const branch = await prisma.branch.create({
      data: {
        name: b.name,
        code: b.code,
        sectorId: sectorSalud.id,
        status: 'ACTIVA',
      },
    });
    createdSaludBranches.push(branch);
    if (b.code === 'DIR-SAL') branchDirSalud = branch;
  }

  // 5. Create Branch & Departments ONLY for Casa Central Corporativa
  const branchCasaCentral = await prisma.branch.create({
    data: {
      name: 'Casa Central Corporativa',
      code: 'CC-01',
      sectorId: sectorCasaCentral.id,
      status: 'ACTIVA',
    },
  });

  const casaCentralDepts = [
    'Abastecimiento',
    'Auditoria',
    'Comunicaciones',
    'Contabilidad',
    'DAF',
    'Educación',
    'Extraescolar',
    'Gabinete',
    'Informática',
    'Jurídica',
    'Obras',
    'PIE',
    'Planificación',
    'Presupuesto',
    'Prevención',
    'Remuneraciones',
    'RRHH',
    'SEP',
    'Servicios Generales',
    'SGE',
    'Tesorería',
  ];

  const createdCCDepts = [];
  for (const deptName of casaCentralDepts) {
    const dept = await prisma.department.create({
      data: {
        name: deptName,
        branchId: branchCasaCentral.id,
      },
    });
    createdCCDepts.push(dept);
  }

  const deptInformaticaCC = createdCCDepts.find((d) => d.name === 'Informática') || createdCCDepts[0];

  // Department for Direccion de Salud
  const deptDirSaludGen = await prisma.department.create({
    data: {
      name: 'General / Administración',
      branchId: branchDirSalud.id,
    },
  });

  // Employees List
  const employeesList = [
    {
      rut: '16.543.210-8',
      names: 'Carlos',
      paternal: 'Gonzalez',
      maternal: 'Osorio',
      fullName: 'Carlos Gonzalez Osorio',
      email: 'cgonzalezo@cmds.cl',
      position: 'Informático',
      branchId: branchDirSalud.id,
      deptId: deptDirSaludGen.id,
    },
    {
      rut: '16468798-8',
      names: 'JORGE',
      paternal: 'ABARCA',
      maternal: 'PINAZO',
      fullName: 'JORGE ABARCA PINAZO',
      email: 'jabarca@cmds.cl',
      position: 'Informático',
      branchId: branchCasaCentral.id,
      deptId: deptInformaticaCC.id,
    },
    {
      rut: '10633447-K',
      names: 'RAUL GONZALO',
      paternal: 'HORMAZABAL',
      maternal: 'FIGUEROA',
      fullName: 'RAUL GONZALO HORMAZABAL FIGUEROA',
      email: 'rhormazabal@cmds.cl',
      position: 'Informático',
      branchId: branchCasaCentral.id,
      deptId: deptInformaticaCC.id,
    },
    {
      rut: '11141811-K',
      names: 'LUIS OCTAVIO',
      paternal: 'OBREGON',
      maternal: 'ABARCA',
      fullName: 'LUIS OCTAVIO OBREGON ABARCA',
      email: 'lobregon@cmds.cl',
      position: 'Informático',
      branchId: branchCasaCentral.id,
      deptId: deptInformaticaCC.id,
    },
    {
      rut: '10084313-7',
      names: 'MIRKO FRANCISCO',
      paternal: 'LONGA',
      maternal: 'SOTO',
      fullName: 'MIRKO FRANCISCO LONGA SOTO',
      email: 'mlonga@cmds.cl',
      position: 'Informático',
      branchId: branchCasaCentral.id,
      deptId: deptInformaticaCC.id,
    },
  ];

  for (const emp of employeesList) {
    await prisma.employee.create({
      data: {
        rut_document: emp.rut,
        names: emp.names,
        paternal_surname: emp.paternal,
        maternal_surname: emp.maternal,
        full_name: emp.fullName,
        email: emp.email,
        position: emp.position,
        branchId: emp.branchId,
        departmentId: emp.deptId,
        status: 'ACTIVO',
      },
    });
  }

  // Assign user permissions
  await prisma.userBranchPermission.create({
    data: {
      userId: adminEdu.id,
      sectorId: sectorEdu.id,
      branchId: createdEduBranches[0].id,
    },
  });

  await prisma.userBranchPermission.create({
    data: {
      userId: adminSalud.id,
      sectorId: sectorSalud.id,
      branchId: createdSaludBranches[0].id,
    },
  });

  await prisma.userBranchPermission.create({
    data: {
      userId: lectorValparaiso.id,
      sectorId: sectorSalud.id,
      branchId: createdSaludBranches[0].id,
    },
  });

  // 6. Create Equipment Types
  const typeMonitor = await prisma.equipmentType.create({
    data: {
      name: 'Monitor de Escritorio',
      description: 'Pantallas y monitores corporativos',
      dynamic_attributes: JSON.stringify([
        { key: 'brand', label: 'Marca', type: 'text', required: true },
        { key: 'model', label: 'Modelo', type: 'text', required: true },
        { key: 'inches', label: 'Tamaño (Pulgadas)', type: 'number', required: false },
      ]),
    },
  });

  await prisma.equipmentType.create({
    data: {
      name: 'Laptop Notebook',
      description: 'Equipos portátiles para docentes y funcionarios',
      dynamic_attributes: JSON.stringify([
        { key: 'ram', label: 'Memoria RAM (GB)', type: 'number', required: true },
        { key: 'processor', label: 'Procesador', type: 'text', required: true },
        { key: 'storage', label: 'Almacenamiento SSD (GB)', type: 'number', required: true },
      ]),
    },
  });

  // 7. Seed 39 Monitors (All set to 'disponible')
  const defaultDeptCC = createdCCDepts.find((d) => d.name === 'Abastecimiento') || createdCCDepts[0];

  const monitorsList = [
    { serial: '408NTLE41712', brand: 'LG', model: '24MS500' },
    { serial: '409NTSUDP806', brand: 'LG', model: '24MS500' },
    { serial: '407NTWG4B169', brand: 'LG', model: '24MS500' },
    { serial: '408NTUW41742', brand: 'LG', model: '24MS500' },
    { serial: '409NTNHDP743', brand: 'LG', model: '24MS500' },
    { serial: '408NTCZ41563', brand: 'LG', model: '24MS500' },
    { serial: '408NTTQ41617', brand: 'LG', model: '24MS500' },
    { serial: '409NTXRDP818', brand: 'LG', model: '24MS500' },
    { serial: '409NTYTDP754', brand: 'LG', model: '24MS500' },
    { serial: '408NTQD41732', brand: 'LG', model: '24MS500' },
    { serial: '408NTFA41723', brand: 'LG', model: '24MS500' },
    { serial: '408NTFA41771', brand: 'LG', model: '24MS500' },
    { serial: '408NTXR41698', brand: 'LG', model: '24MS500' },
    { serial: '407NTWG4B217', brand: 'LG', model: '24MS500' },
    { serial: '409NTABDP768', brand: 'LG', model: '24MS500' },
    { serial: '408NTWG41601', brand: 'LG', model: '24MS500' },
    { serial: '408ntvs41727', brand: 'LG', model: '24MS500' },
    { serial: '409NTKFDP813', brand: 'LG', model: '24MS500' },
    { serial: '408NTDV41714', brand: 'LG', model: '24MS500' },
    { serial: '408NTKF41765', brand: 'LG', model: '24MS500' },
    { serial: '409NTNHDP767', brand: 'LG', model: '24MS500' },
    { serial: '407NTHM4B201', brand: 'LG', model: '24MS500' },
    { serial: '408NTWG41721', brand: 'LG', model: '24MS500' },
    { serial: '409NTJJDP820', brand: 'LG', model: '24MS500' },
    { serial: '408NTSU41758', brand: 'LG', model: '24MS500' },
    { serial: '408NTEP41740', brand: 'LG', model: '24MS500' },
    { serial: '409NTUWDP814', brand: 'LG', model: '24MS500' },
    { serial: '409NTDVDP762', brand: 'LG', model: '24MS500' },
    { serial: '407NTTQ4B185', brand: 'LG', model: '24MS500' },
    { serial: '408NTGY41615', brand: 'LG', model: '24MS500' },
    { serial: '408NTXR41722', brand: 'LG', model: '24MS500' },
    { serial: '409NTZNDP805', brand: 'LG', model: '24MS500' },
    { serial: '408NTXR41746', brand: 'LG', model: '24MS500' },
    { serial: '408NTLE41736', brand: 'LG', model: '24MS500' },
    { serial: '409NTTQDP809', brand: 'LG', model: '24MS500' },
    { serial: '409BTHMDP753', brand: 'LG', model: '24MS500' },
    { serial: 'XU0244900217', brand: 'VIEWSONIC', model: 'VA2714' },
    { serial: 'XU0244900413', brand: 'VIEWSONIC', model: 'VA2714' },
    { serial: 'XU0244900215', brand: 'VIEWSONIC', model: 'VA2714' },
  ];

  let counter = 1;
  for (const m of monitorsList) {
    const assetTag = `MON-${m.brand.toUpperCase()}-${String(counter).padStart(3, '0')}`;
    await prisma.equipment.create({
      data: {
        asset_tag: assetTag,
        serial_number: m.serial.trim().toUpperCase(),
        typeId: typeMonitor.id,
        branchId: branchCasaCentral.id,
        departmentId: defaultDeptCC.id,
        dynamic_values: JSON.stringify({
          brand: m.brand,
          model: m.model,
          inches: m.brand === 'VIEWSONIC' ? 27 : 24,
        }),
        status: 'disponible',
      },
    });
    counter++;
  }

  console.log(`Database seeded with 39 Monitors, Sectors, Branches, Departments, and 5 Employees.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
