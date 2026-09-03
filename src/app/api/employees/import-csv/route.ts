import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { CSVImportRow, CSVImportResult } from '@/types';
import { cleanAndFormatRUT } from '../route';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes para realizar importación masiva' }, { status: 403 });
    }

    const { rows }: { rows: CSVImportRow[] } = await req.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No se enviaron filas válidas para importar' }, { status: 400 });
    }

    const result: CSVImportResult = {
      totalProcessed: rows.length,
      createdCount: 0,
      omittedCount: 0,
      failedCount: 0,
      created: [],
      omitted: [],
      failed: [],
    };

    // Load branches and departments for lookup
    const allBranches = await prisma.branch.findMany({
      include: { departments: true },
    });

    const allowedBranchIds =
      sessionUser.role === 'SUPERADMIN'
        ? allBranches.map((b) => b.id)
        : sessionUser.branchPermissions.map((p) => p.branchId);

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 1;
      const rawRut = row.rut_document ? String(row.rut_document).trim() : '';
      const name = row.full_name ? String(row.full_name).trim() : '';
      const email = row.email ? String(row.email).trim().toUpperCase() : '';
      const position = row.position ? String(row.position).trim().toUpperCase() : 'FUNCIONARIO';
      const branchRef = row.branch_code_or_name ? String(row.branch_code_or_name).trim() : '';
      const deptRef = row.department_name ? String(row.department_name).trim() : '';

      // Validation check for mandatory fields
      if (!rawRut) {
        result.failedCount++;
        result.failed.push({
          rut: 'N/A',
          name: name || 'Desconocido',
          error: `Fila ${rowNum}: El RUN es obligatorio y no fue proporcionado en la columna de documento.`,
        });
        continue;
      }

      if (!name) {
        result.failedCount++;
        result.failed.push({
          rut: rawRut,
          name: 'Desconocido',
          error: `Fila ${rowNum}: El Nombre del funcionario es obligatorio y viene en blanco.`,
        });
        continue;
      }

      const rutVal = cleanAndFormatRUT(rawRut);
      if (!rutVal.valid) {
        result.failedCount++;
        result.failed.push({
          rut: rawRut,
          name,
          error: `Fila ${rowNum}: ${rutVal.error || 'RUN no válido o formato incorrecto.'}`,
        });
        continue;
      }

      const formattedRut = rutVal.formatted.toUpperCase();

      // Check duplicate RUN in DB
      const existingInDb = await prisma.employee.findUnique({
        where: { rut_document: formattedRut },
      });

      if (existingInDb) {
        result.omittedCount++;
        result.omitted.push({
          rut: formattedRut,
          name,
          reason: `Fila ${rowNum}: RUN '${formattedRut}' ya existe registrado previamente en el sistema para ${existingInDb.full_name}.`,
        });
        continue;
      }

      // Match Branch
      let targetBranch = allBranches.find(
        (b) =>
          b.code.toUpperCase() === branchRef.toUpperCase() ||
          b.name.toLowerCase() === branchRef.toLowerCase()
      );

      if (!targetBranch && branchRef === '' && allBranches.length > 0) {
        // Fallback to first branch if not specified
        targetBranch = allBranches.find((b) => allowedBranchIds.includes(b.id)) || allBranches[0];
      }

      if (!targetBranch) {
        result.failedCount++;
        result.failed.push({
          rut: formattedRut,
          name,
          error: `Fila ${rowNum}: No se encontró la sucursal o recinto '${branchRef}' en el sistema.`,
        });
        continue;
      }

      // Permission Check for non-superadmin
      if (sessionUser.role !== 'SUPERADMIN' && !allowedBranchIds.includes(targetBranch.id)) {
        result.failedCount++;
        result.failed.push({
          rut: formattedRut,
          name,
          error: `Fila ${rowNum}: Sin permisos para registrar en la sucursal '${targetBranch.name}' (Sector fuera de su perfil).`,
        });
        continue;
      }

      // Match Department
      let targetDept = targetBranch.departments.find(
        (d) => d.name.toLowerCase() === deptRef.toLowerCase()
      );

      if (!targetDept) {
        targetDept = targetBranch.departments.find((d) => d.name.includes('GENERAL') || d.name.includes('ADMIN'));
      }

      if (!targetDept && targetBranch.departments.length > 0) {
        targetDept = targetBranch.departments[0];
      }

      if (!targetDept) {
        // Create General department for branch
        targetDept = await prisma.department.create({
          data: {
            name: 'GENERAL / ADMINISTRACIÓN',
            branchId: targetBranch.id,
          },
        });
      }

      // Create Employee
      try {
        const cleanName = name.trim().toUpperCase();
        const nameParts = cleanName.split(/\s+/);
        const names = nameParts[0] || cleanName;
        const paternal = nameParts[1] || '';
        const maternal = nameParts.slice(2).join(' ') || '';

        const nowFormatted = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
          ' ' +
          new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) +
          ' hrs';

        const initialLogs = [
          {
            id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            timestamp: nowFormatted,
            userId: sessionUser.id,
            userName: sessionUser.name,
            userEmail: sessionUser.email,
            type: 'CREACION',
            details: `Funcionario registrado masivamente mediante importación CSV por ${sessionUser.name}`,
            changes: [
              `Fecha de Creación del Funcionario: ${nowFormatted}`,
              `Registrado mediante CSV con RUN ${formattedRut}`,
              `Nombre: ${cleanName}`,
              `Cargo: ${position}`,
              `Sucursal: ${targetBranch.name}`,
              `Departamento: ${targetDept.name}`,
            ],
          },
        ];

        await prisma.employee.create({
          data: {
            rut_document: formattedRut,
            names,
            paternal_surname: paternal,
            maternal_surname: maternal,
            full_name: cleanName,
            email: email,
            position: position,
            branchId: targetBranch.id,
            departmentId: targetDept.id,
            status: 'ACTIVO',
            history_logs: JSON.stringify(initialLogs),
          },
        });

        result.createdCount++;
        result.created.push({ rut: formattedRut, name: cleanName });
      } catch (err: any) {
        result.failedCount++;
        result.failed.push({
          rut: formattedRut,
          name,
          error: `Fila ${rowNum}: Error de base de datos - ${err.message || 'No se pudo guardar la fila'}`,
        });
      }
    }

    return NextResponse.json({ success: true, report: result });
  } catch (error: any) {
    console.error('Error during CSV import:', error);
    return NextResponse.json({ error: 'Error durante la importación CSV: ' + error.message }, { status: 500 });
  }
}
