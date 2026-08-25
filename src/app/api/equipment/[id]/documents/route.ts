import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { id } = await params;
    const { name, fileType, url, sizeBytes, notes } = await req.json();

    if (!name || !url) {
      return NextResponse.json({ error: 'Nombre del archivo y contenido son obligatorios' }, { status: 400 });
    }

    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    let docs: any[] = [];
    try {
      docs = JSON.parse(equipment.attached_documents || '[]');
    } catch (e) {}

    const nowFormatted = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) +
      ' hrs';

    const newDoc = {
      id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      fileType: fileType || 'otro',
      url,
      sizeBytes: sizeBytes || 0,
      uploadedAt: nowFormatted,
      uploadedByName: sessionUser.name,
      notes: notes ? notes.trim() : '',
    };

    docs.unshift(newDoc);

    let historyLogs: any[] = [];
    try {
      historyLogs = JSON.parse(equipment.history_logs || '[]');
    } catch (e) {}

    historyLogs.unshift({
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: nowFormatted,
      userId: sessionUser.id,
      userName: sessionUser.name,
      userEmail: sessionUser.email,
      type: 'DOCUMENTO',
      details: `Documento adjuntado a la ficha del equipo por ${sessionUser.name}`,
      changes: [
        `Documento adjuntado: ${name.trim()} (${fileType || 'Archivo'})`,
        ...(notes ? [`Notas adjuntas: ${notes.trim()}`] : []),
      ],
    });

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        attached_documents: JSON.stringify(docs),
        history_logs: JSON.stringify(historyLogs),
      },
      include: {
        type: true,
        brand: true,
        model: true,
        branch: { include: { sector: true } },
        department: true,
        assignments: {
          where: { fecha_fin: null },
          include: { employee: true },
        },
      },
    });

    return NextResponse.json({ success: true, equipment: updatedEquipment, document: newDoc });
  } catch (error: any) {
    console.error('Error attaching document:', error);
    return NextResponse.json({ error: 'Error al adjuntar documento: ' + error.message }, { status: 500 });
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
    const { docId } = await req.json();

    if (!docId) {
      return NextResponse.json({ error: 'ID del documento es obligatorio' }, { status: 400 });
    }

    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    let docs: any[] = [];
    try {
      docs = JSON.parse(equipment.attached_documents || '[]');
    } catch (e) {}

    const docToDelete = docs.find((d: any) => d.id === docId);
    const updatedDocs = docs.filter((d: any) => d.id !== docId);

    const nowFormatted = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) +
      ' hrs';

    let historyLogs: any[] = [];
    try {
      historyLogs = JSON.parse(equipment.history_logs || '[]');
    } catch (e) {}

    historyLogs.unshift({
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: nowFormatted,
      userId: sessionUser.id,
      userName: sessionUser.name,
      userEmail: sessionUser.email,
      type: 'DOCUMENTO',
      details: `Documento eliminado de la ficha del equipo por ${sessionUser.name}`,
      changes: [
        `Documento eliminado: ${docToDelete?.name || docId}`,
      ],
    });

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        attached_documents: JSON.stringify(updatedDocs),
        history_logs: JSON.stringify(historyLogs),
      },
      include: {
        type: true,
        brand: true,
        model: true,
        branch: { include: { sector: true } },
        department: true,
        assignments: {
          where: { fecha_fin: null },
          include: { employee: true },
        },
      },
    });

    return NextResponse.json({ success: true, equipment: updatedEquipment });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Error al eliminar documento: ' + error.message }, { status: 500 });
  }
}
