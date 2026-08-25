import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { id } = await params;
    const { name, branchId, vlan } = await req.json();

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        branchId: branchId || undefined,
        vlan: vlan !== undefined ? (vlan ? vlan.trim() : null) : undefined,
      },
      include: { branch: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar departamento' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const targetDeptId = searchParams.get('targetDepartmentId');

    const employeeCount = await prisma.employee.count({
      where: { departmentId: id },
    });

    const equipmentCount = await prisma.equipment.count({
      where: { departmentId: id },
    });

    if (employeeCount > 0 || equipmentCount > 0) {
      if (!targetDeptId) {
        return NextResponse.json(
          {
            requiresReassignment: true,
            employeeCount,
            equipmentCount,
            error: `El departamento tiene ${employeeCount} funcionario(s) y ${equipmentCount} equipo(s) asignados. Debe seleccionar un departamento de destino para transferirlos.`,
          },
          { status: 400 }
        );
      }

      if (targetDeptId === id) {
        return NextResponse.json(
          { error: 'El departamento de destino no puede ser el mismo departamento que se eliminará.' },
          { status: 400 }
        );
      }

      const targetDept = await prisma.department.findUnique({ where: { id: targetDeptId } });
      if (!targetDept) {
        return NextResponse.json({ error: 'El departamento de destino seleccionado no existe.' }, { status: 400 });
      }

      // Reassign all employees and equipment to target department
      if (employeeCount > 0) {
        await prisma.employee.updateMany({
          where: { departmentId: id },
          data: { departmentId: targetDeptId },
        });
      }

      if (equipmentCount > 0) {
        await prisma.equipment.updateMany({
          where: { departmentId: id },
          data: { departmentId: targetDeptId },
        });
      }
    }

    await prisma.department.delete({ where: { id } });
    return NextResponse.json({
      success: true,
      message: 'Departamento eliminado correctamente' + (targetDeptId ? ' y registros reasignados exitosamente.' : '.'),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar departamento: ' + error.message }, { status: 500 });
  }
}
