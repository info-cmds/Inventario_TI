import { PrismaClient } from '@prisma/client';
import { cleanAndFormatRUT } from '../src/app/api/employees/route';
import { POST as createDepartmentPOST } from '../src/app/api/departments/route';
import { POST as createAssignmentPOST } from '../src/app/api/assignments/route';
import { PUT as updateEquipmentPUT } from '../src/app/api/equipment/[id]/route';
import { createToken } from '../src/lib/auth';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details: string;
  error?: string;
}

const results: TestResult[] = [];

function logResult(suite: string, name: string, passed: boolean, details: string, error?: string) {
  results.push({ suite, name, passed, details, error });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] ${suite} -> ${name}: ${details}`);
  if (error) {
    console.error(`   Error details: ${error}`);
  }
}

function createMockNextRequest(url: string, method: string, body?: any, cookieToken?: string): NextRequest {
  const headers = new Headers();
  headers.set('content-type', 'application/json');
  if (cookieToken) {
    headers.set('cookie', `tech_inv_token=${cookieToken}`);
  }
  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function runTestSuite() {
  console.log('=================================================================');
  console.log('   BATERÍA DE PRUEBAS AUTOMATIZADAS DE BACKEND (PRISMA + NEXT.JS)');
  console.log('=================================================================\n');

  // 0. Conteos Iniciales e Integridad de Datos
  const initialCounts = {
    employees: await prisma.employee.count(),
    equipment: await prisma.equipment.count(),
    departments: await prisma.department.count(),
    branches: await prisma.branch.count(),
    assignments: await prisma.equipmentAssignment.count(),
  };

  console.log('📊 CONTEO INICIAL DE LA BASE DE DATOS:');
  console.log(`   - Funcionarios (Employees): ${initialCounts.employees}`);
  console.log(`   - Equipos (Equipment):       ${initialCounts.equipment}`);
  console.log(`   - Departamentos (Depts):     ${initialCounts.departments}`);
  console.log(`   - Sucursales (Branches):     ${initialCounts.branches}`);
  console.log(`   - Asignaciones (History):    ${initialCounts.assignments}\n`);

  // Obtener sucursales para pruebas
  const branches = await prisma.branch.findMany({ take: 2 });
  if (branches.length < 2) {
    throw new Error('Se requieren al menos 2 sucursales en la base de datos para ejecutar las pruebas.');
  }
  const branchA = branches[0];
  const branchB = branches[1];

  // -----------------------------------------------------------------
  // PRUEBA 1: Restricción de unicidad @@unique([name, branchId])
  // -----------------------------------------------------------------
  console.log('--- TEST SUITE 1: Restricción @@unique([name, branchId]) en Department ---');
  const testDeptName = `DEPT_TEST_UNIQ_${Date.now()}`;
  let createdDept1: any = null;
  let createdDept3: any = null;

  try {
    // 1.1 Crear primer departamento en Sucursal A
    createdDept1 = await prisma.department.create({
      data: { name: testDeptName, branchId: branchA.id },
    });
    logResult(
      'Department Unique Index',
      'Creación Exitosa Dept D1 en Sucursal A',
      true,
      `Departamento creado con ID=${createdDept1.id}, Name="${testDeptName}", BranchId=${branchA.id}`
    );

    // 1.2 Intentar crear departamento duplicado en la MISMA Sucursal A -> Debe fallar P2002
    let duplicateFailedAsExpected = false;
    try {
      await prisma.department.create({
        data: { name: testDeptName, branchId: branchA.id },
      });
    } catch (err: any) {
      if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
        duplicateFailedAsExpected = true;
        logResult(
          'Department Unique Index',
          'Rechazo de Duplicado en Misma Sucursal (P2002)',
          true,
          `Prisma rechazó correctamente la inserción duplicada en la misma sucursal. Error: P2002 (${err.meta?.target || 'name, branchId'})`
        );
      } else {
        logResult(
          'Department Unique Index',
          'Rechazo de Duplicado en Misma Sucursal',
          false,
          `Se lanzó un error pero no fue P2002: ${err.message}`
        );
      }
    }

    if (!duplicateFailedAsExpected) {
      logResult(
        'Department Unique Index',
        'Rechazo de Duplicado en Misma Sucursal',
        false,
        'FALLO CRÍTICO: La base de datos permitió insertar dos departamentos con el mismo nombre en la misma sucursal!'
      );
    }

    // 1.3 Crear departamento con el MISMO nombre en DIFERENTE Sucursal B -> Debe tener éxito
    createdDept3 = await prisma.department.create({
      data: { name: testDeptName, branchId: branchB.id },
    });
    logResult(
      'Department Unique Index',
      'Permite Mismo Nombre en Diferente Sucursal B',
      true,
      `Departamento creado exitosamente en Sucursal B ID=${createdDept3.id}, demostrando unicidad compuesta.`
    );
  } catch (e: any) {
    logResult('Department Unique Index', 'Error General Test 1', false, e.message);
  } finally {
    // Limpieza inmediata Test 1
    if (createdDept1) await prisma.department.delete({ where: { id: createdDept1.id } }).catch(() => {});
    if (createdDept3) await prisma.department.delete({ where: { id: createdDept3.id } }).catch(() => {});
  }

  // -----------------------------------------------------------------
  // PRUEBA 2: Normalización estricta de RUT (cleanAndFormatRUT)
  // -----------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Normalización Estricta de RUT (cleanAndFormatRUT) ---');
  const rutTestCases = [
    { input: '12.345.678-K', expectedValid: true, expectedFormatted: '12345678-K', desc: 'Formato con puntos y guion con letra K' },
    { input: '12345678K', expectedValid: true, expectedFormatted: '12345678-K', desc: 'Sin puntos ni guion con K minúscula o mayúscula' },
    { input: '12 345 678 K', expectedValid: true, expectedFormatted: '12345678-K', desc: 'Con espacios entre dígitos y DV K' },
    { input: '12.345.678-9', expectedValid: true, expectedFormatted: '12345678-9', desc: 'Formato estándar con DV numérico' },
    { input: ' 76.543.210 - k ', expectedValid: true, expectedFormatted: '76543210-K', desc: 'Con espacios al inicio, medio y final' },
    { input: '1-9', expectedValid: true, expectedFormatted: '1-9', desc: 'Mínimo largo válido (2 caracteres)' },
    { input: '', expectedValid: false, expectedFormatted: '', desc: 'Cadena vacía' },
    { input: '   ', expectedValid: false, expectedFormatted: '', desc: 'Solo espacios' },
    { input: 'K', expectedValid: false, expectedFormatted: '', desc: 'Un solo carácter' },
    { input: '---', expectedValid: false, expectedFormatted: '', desc: 'Solo guiones/símbolos' },
  ];

  for (const tc of rutTestCases) {
    const res = cleanAndFormatRUT(tc.input);
    const pass = res.valid === tc.expectedValid && (tc.expectedValid ? res.formatted === tc.expectedFormatted : true);
    logResult(
      'RUT Normalization',
      `Variante: "${tc.input}"`,
      pass,
      pass
        ? `Resultado: valid=${res.valid}, formatted="${res.formatted}" (${tc.desc})`
        : `ESPERADO: valid=${tc.expectedValid}, formatted="${tc.expectedFormatted}" | OBTENIDO: valid=${res.valid}, formatted="${res.formatted}"`
    );
  }

  // -----------------------------------------------------------------
  // PRUEBA 3: Permisos Multi-Sucursal en POST /api/assignments
  // -----------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Permisos Multi-Sucursal en POST /api/assignments ---');
  
  // Buscar o crear usuarios/equipos/funcionarios de prueba
  const eqA = await prisma.equipment.findFirst({ where: { branchId: branchA.id } });
  const eqB = await prisma.equipment.findFirst({ where: { branchId: branchB.id } });
  const empA = await prisma.employee.findFirst({ where: { branchId: branchA.id, status: 'ACTIVO' } });
  const empB = await prisma.employee.findFirst({ where: { branchId: branchB.id, status: 'ACTIVO' } });

  if (!eqA || !eqB || !empA || !empB) {
    logResult('Multi-Branch Permissions', 'Setup Data', false, 'Faltan datos de equipos/funcionarios en ambas sucursales');
  } else {
    // Guardar estados originales para restaurar
    const origEqAStatus = eqA.status;
    const origEqBStatus = eqB.status;

    // Colocar temporalmente en disponible si no lo están
    await prisma.equipment.update({ where: { id: eqA.id }, data: { status: 'disponible' } });
    await prisma.equipment.update({ where: { id: eqB.id }, data: { status: 'disponible' } });

    // Tokens JWT de prueba
    const tokenAdminBranchA = await createToken({
      id: 'usr-admin-a',
      email: 'admin.a@test.com',
      name: 'Admin Sucursal A',
      role: 'ADMINISTRADOR',
      must_change_password: false,
      branchPermissions: [{ branchId: branchA.id, departmentId: null }],
    });

    const tokenSuperAdmin = await createToken({
      id: 'usr-superadmin',
      email: 'superadmin@test.com',
      name: 'Super Admin Test',
      role: 'SUPERADMIN',
      must_change_password: false,
      branchPermissions: [],
    });

    const tokenLector = await createToken({
      id: 'usr-lector',
      email: 'lector@test.com',
      name: 'Lector Test',
      role: 'LECTOR',
      must_change_password: false,
      branchPermissions: [{ branchId: branchA.id, departmentId: null }],
    });

    let createdAssignmentId: string | null = null;

    try {
      // 3.1 LECTOR no puede asignar
      const reqLector = createMockNextRequest('http://localhost:3000/api/assignments', 'POST', {
        equipmentId: eqA.id,
        employeeId: empA.id,
      }, tokenLector);
      const resLector = await createAssignmentPOST(reqLector);
      const dataLector = await resLector.json();
      logResult(
        'Multi-Branch Permissions',
        'Bloqueo a Usuario Rol LECTOR (403)',
        resLector.status === 403,
        `Status=${resLector.status}, Error="${dataLector.error}"`
      );

      // 3.2 Admin A intenta asignar Equipo A (Sucursal A) a Funcionario B (Sucursal B - Fuera de permiso)
      const reqCrossEmp = createMockNextRequest('http://localhost:3000/api/assignments', 'POST', {
        equipmentId: eqA.id,
        employeeId: empB.id,
      }, tokenAdminBranchA);
      const resCrossEmp = await createAssignmentPOST(reqCrossEmp);
      const dataCrossEmp = await resCrossEmp.json();
      const passCrossEmp = resCrossEmp.status === 403 && dataCrossEmp.error?.includes('fuera de su sector asignado');
      logResult(
        'Multi-Branch Permissions',
        'Rechazo: Funcionario Destino Fuera de Permisos (403)',
        passCrossEmp,
        `Status=${resCrossEmp.status}, Mensaje="${dataCrossEmp.error}"`
      );

      // 3.3 Admin A intenta asignar Equipo B (Sucursal B - Sin permiso) a Funcionario A (Sucursal A)
      const reqCrossEq = createMockNextRequest('http://localhost:3000/api/assignments', 'POST', {
        equipmentId: eqB.id,
        employeeId: empA.id,
      }, tokenAdminBranchA);
      const resCrossEq = await createAssignmentPOST(reqCrossEq);
      const dataCrossEq = await resCrossEq.json();
      const passCrossEq = resCrossEq.status === 403 && dataCrossEq.error?.includes('pertenecientes a esta sucursal');
      logResult(
        'Multi-Branch Permissions',
        'Rechazo: Equipo Perteneciente a Sucursal Sin Permiso (403)',
        passCrossEq,
        `Status=${resCrossEq.status}, Mensaje="${dataCrossEq.error}"`
      );

      // 3.4 Admin A asigna Equipo A (Sucursal A) a Funcionario A (Sucursal A) -> PERMITIDO (201)
      const reqValid = createMockNextRequest('http://localhost:3000/api/assignments', 'POST', {
        equipmentId: eqA.id,
        employeeId: empA.id,
        notes: 'Prueba de asignación válida',
      }, tokenAdminBranchA);
      const resValid = await createAssignmentPOST(reqValid);
      const dataValid = await resValid.json();
      const passValid = resValid.status === 201 && dataValid.success === true;
      if (passValid && dataValid.assignment?.id) {
        createdAssignmentId = dataValid.assignment.id;
      }
      logResult(
        'Multi-Branch Permissions',
        'Asignación Permitida Dentro de la Misma Sucursal (201)',
        passValid,
        `Status=${resValid.status}, Success=${dataValid.success}, AssignmentID=${dataValid.assignment?.id || 'N/A'}`
      );

    } finally {
      // Restaurar estados originales
      if (createdAssignmentId) {
        await prisma.equipmentAssignment.delete({ where: { id: createdAssignmentId } }).catch(() => {});
      }
      await prisma.equipment.update({ where: { id: eqA.id }, data: { status: origEqAStatus } });
      await prisma.equipment.update({ where: { id: eqB.id }, data: { status: origEqBStatus } });
    }
  }

  // -----------------------------------------------------------------
  // PRUEBA 4: Prevención de Asignaciones Huérfanas y Cierre Atómico en PUT /api/equipment/[id]
  // -----------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Prevención de Asignaciones Huérfanas y Cierre Atómico ---');
  
  const testEq = await prisma.equipment.findFirst({ include: { assignments: { where: { fecha_fin: null } } } });
  const testEmp = await prisma.employee.findFirst({ where: { status: 'ACTIVO' } });

  if (!testEq || !testEmp) {
    logResult('Orphan Prevention', 'Setup Data', false, 'No hay equipo o funcionario disponible para la prueba.');
  } else {
    const origStatus = testEq.status;
    const origBranchId = testEq.branchId;
    const origDeptId = testEq.departmentId;

    const adminToken = await createToken({
      id: 'usr-admin-global',
      email: 'admin@empresa.com',
      name: 'Admin Test Global',
      role: 'SUPERADMIN',
      must_change_password: false,
      branchPermissions: [],
    });

    let activeAssignId: string | null = null;

    try {
      // Pasó A: Crear una asignación activa (fecha_fin = null)
      await prisma.equipment.update({ where: { id: testEq.id }, data: { status: 'disponible' } });
      const newAssign = await prisma.equipmentAssignment.create({
        data: {
          equipmentId: testEq.id,
          employeeId: testEmp.id,
          assignedByUserId: (await prisma.user.findFirst())?.id || 'usr-admin-global',
          fecha_inicio: new Date(),
        },
      });
      activeAssignId = newAssign.id;
      await prisma.equipment.update({ where: { id: testEq.id }, data: { status: 'asignado' } });

      logResult(
        'Orphan Prevention',
        'Setup Asignación Activa Inicial',
        newAssign.fecha_fin === null,
        `Asignación creada ID=${newAssign.id}, fecha_fin=NULL (Activa)`
      );

      // 4.1 Cambio de estado a 'en_reparacion' mediante PUT /api/equipment/[id]
      const reqReparacion = createMockNextRequest(
        `http://localhost:3000/api/equipment/${testEq.id}`,
        'PUT',
        { status: 'en_reparacion' },
        adminToken
      );
      const resReparacion = await updateEquipmentPUT(reqReparacion, { params: Promise.resolve({ id: testEq.id }) });
      const dataReparacion = await resReparacion.json();

      // Verificar que la asignación activa se cerró (fecha_fin != null)
      const checkAssign1 = await prisma.equipmentAssignment.findUnique({ where: { id: activeAssignId } });
      const activeAssignsCount1 = await prisma.equipmentAssignment.count({ where: { equipmentId: testEq.id, fecha_fin: null } });

      const passReparacion = resReparacion.status === 200 && checkAssign1?.fecha_fin !== null && activeAssignsCount1 === 0;
      logResult(
        'Orphan Prevention',
        'Cierre Atómico al cambiar a "en_reparacion"',
        passReparacion,
        `Asignación fecha_fin=${checkAssign1?.fecha_fin?.toISOString() || 'NULL'}, Asignaciones Activas Pendientes=${activeAssignsCount1}`
      );

      // 4.2 Probar con cambio a 'dado_de_baja'
      // Re-crear asignación activa
      const newAssign2 = await prisma.equipmentAssignment.create({
        data: {
          equipmentId: testEq.id,
          employeeId: testEmp.id,
          assignedByUserId: (await prisma.user.findFirst())?.id || 'usr-admin-global',
          fecha_inicio: new Date(),
        },
      });
      activeAssignId = newAssign2.id;
      await prisma.equipment.update({ where: { id: testEq.id }, data: { status: 'asignado' } });

      const reqBaja = createMockNextRequest(
        `http://localhost:3000/api/equipment/${testEq.id}`,
        'PUT',
        { status: 'dado_de_baja', decommissionReason: 'Falla irreparable de prueba' },
        adminToken
      );
      const resBaja = await updateEquipmentPUT(reqBaja, { params: Promise.resolve({ id: testEq.id }) });
      const checkAssign2 = await prisma.equipmentAssignment.findUnique({ where: { id: activeAssignId } });
      const activeAssignsCount2 = await prisma.equipmentAssignment.count({ where: { equipmentId: testEq.id, fecha_fin: null } });

      const passBaja = resBaja.status === 200 && checkAssign2?.fecha_fin !== null && activeAssignsCount2 === 0;
      logResult(
        'Orphan Prevention',
        'Cierre Atómico al cambiar a "dado_de_baja"',
        passBaja,
        `Asignación fecha_fin=${checkAssign2?.fecha_fin?.toISOString() || 'NULL'}, Asignaciones Activas Pendientes=${activeAssignsCount2}`
      );

      // 4.3 Probar con cambio a 'disponible'
      const newAssign3 = await prisma.equipmentAssignment.create({
        data: {
          equipmentId: testEq.id,
          employeeId: testEmp.id,
          assignedByUserId: (await prisma.user.findFirst())?.id || 'usr-admin-global',
          fecha_inicio: new Date(),
        },
      });
      activeAssignId = newAssign3.id;
      await prisma.equipment.update({ where: { id: testEq.id }, data: { status: 'asignado' } });

      const reqDisponible = createMockNextRequest(
        `http://localhost:3000/api/equipment/${testEq.id}`,
        'PUT',
        { status: 'disponible' },
        adminToken
      );
      const resDisponible = await updateEquipmentPUT(reqDisponible, { params: Promise.resolve({ id: testEq.id }) });
      const checkAssign3 = await prisma.equipmentAssignment.findUnique({ where: { id: activeAssignId } });
      const activeAssignsCount3 = await prisma.equipmentAssignment.count({ where: { equipmentId: testEq.id, fecha_fin: null } });

      const passDisponible = resDisponible.status === 200 && checkAssign3?.fecha_fin !== null && activeAssignsCount3 === 0;
      logResult(
        'Orphan Prevention',
        'Cierre Atómico al cambiar a "disponible"',
        passDisponible,
        `Asignación fecha_fin=${checkAssign3?.fecha_fin?.toISOString() || 'NULL'}, Asignaciones Activas Pendientes=${activeAssignsCount3}`
      );

    } finally {
      // Limpieza de asignaciones de prueba
      await prisma.equipmentAssignment.deleteMany({
        where: { equipmentId: testEq.id, notes: undefined, fecha_inicio: { gte: new Date(Date.now() - 3600000) } },
      }).catch(() => {});

      // Restaurar estado original del equipo
      await prisma.equipment.update({
        where: { id: testEq.id },
        data: {
          status: origStatus,
          branchId: origBranchId,
          departmentId: origDeptId,
        },
      });
    }
  }

  // -----------------------------------------------------------------
  // VERIFICACIÓN FINAL: Conservación 100% de la Base de Datos
  // -----------------------------------------------------------------
  console.log('\n--- VERIFICACIÓN FINAL DE CONSERVACIÓN DE DATOS ---');
  const finalCounts = {
    employees: await prisma.employee.count(),
    equipment: await prisma.equipment.count(),
    departments: await prisma.department.count(),
    branches: await prisma.branch.count(),
    assignments: await prisma.equipmentAssignment.count(),
  };

  const empPass = finalCounts.employees === initialCounts.employees;
  const eqPass = finalCounts.equipment === initialCounts.equipment;
  const deptPass = finalCounts.departments === initialCounts.departments;
  const branchPass = finalCounts.branches === initialCounts.branches;

  console.log(`📌 Funcionarios (Employees): Inicial ${initialCounts.employees} -> Final ${finalCounts.employees} (${empPass ? 'CONSERVADO INTAMBADO' : 'DESVIACIÓN'})`);
  console.log(`📌 Equipos (Equipment):       Inicial ${initialCounts.equipment} -> Final ${finalCounts.equipment} (${eqPass ? 'CONSERVADO INTAMBADO' : 'DESVIACIÓN'})`);
  console.log(`📌 Departamentos:             Inicial ${initialCounts.departments} -> Final ${finalCounts.departments} (${deptPass ? 'CONSERVADO INTAMBADO' : 'DESVIACIÓN'})`);
  console.log(`📌 Sucursales:                Inicial ${initialCounts.branches} -> Final ${finalCounts.branches} (${branchPass ? 'CONSERVADO INTAMBADO' : 'DESVIACIÓN'})`);

  const allPassed = results.every((r) => r.passed) && empPass && eqPass && deptPass && branchPass;

  console.log('\n=================================================================');
  console.log(`  RESUMEN GENERAL: ${allPassed ? '🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE' : '⚠️ SE DETECTARON FALLOS EN LAS PRUEBAS'}`);
  console.log(`  Total Pruebas Ejecutadas: ${results.length}`);
  console.log(`  Exitosas: ${results.filter((r) => r.passed).length}`);
  console.log(`  Fallidas: ${results.filter((r) => !r.passed).length}`);
  console.log('=================================================================\n');

  return { results, initialCounts, finalCounts, allPassed };
}

runTestSuite()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Fatal error running test suite:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
