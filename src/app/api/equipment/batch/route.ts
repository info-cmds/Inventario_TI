import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const {
      typeId,
      brandId,
      modelId,
      branchId,
      departmentId,
      dynamic_values,
      status,
      items,
    } = await req.json();

    if (!typeId || !branchId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Debe especificar Tipo de Equipo, Sucursal y al menos un equipo en el lote.' },
        { status: 400 }
      );
    }

    const targetDeptId = departmentId || null;
    const targetStatus = status || 'disponible';
    const dynStr = typeof dynamic_values === 'string' ? dynamic_values : JSON.stringify(dynamic_values || {});

    // Clean & validate items array
    const candidateItems: { asset_tag: string; serial_number: string }[] = [];
    const validationErrors: string[] = [];
    const seenTagsInBatch = new Set<string>();
    const seenSerialsInBatch = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const tag = row.asset_tag ? String(row.asset_tag).trim().toUpperCase() : '';
      const serial = row.serial_number ? String(row.serial_number).trim().toUpperCase() : '';

      if (!tag && !serial) continue; // skip completely empty rows

      if (!tag) {
        validationErrors.push(`Fila ${i + 1}: El código Asset Tag no puede estar vacío.`);
        continue;
      }
      if (!serial) {
        validationErrors.push(`Fila ${i + 1}: El Número de Serie no puede estar vacío.`);
        continue;
      }

      if (seenTagsInBatch.has(tag)) {
        validationErrors.push(`Fila ${i + 1}: Asset Tag '${tag}' está duplicado en este mismo lote.`);
        continue;
      }
      if (seenSerialsInBatch.has(serial)) {
        validationErrors.push(`Fila ${i + 1}: Número de Serie '${serial}' está duplicado en este mismo lote.`);
        continue;
      }

      seenTagsInBatch.add(tag);
      seenSerialsInBatch.add(serial);
      candidateItems.push({ asset_tag: tag, serial_number: serial });
    }

    if (candidateItems.length === 0) {
      return NextResponse.json(
        { error: validationErrors.length > 0 ? validationErrors.join(' | ') : 'No se ingresaron filas válidas con Asset Tag y Serie.' },
        { status: 400 }
      );
    }

    // Query DB for existing Asset Tags and Serial Numbers
    const existingTagRecords = await prisma.equipment.findMany({
      where: { asset_tag: { in: Array.from(seenTagsInBatch) } },
      select: { asset_tag: true },
    });
    const existingDbTags = new Set(existingTagRecords.map((t) => t.asset_tag));

    const existingSerialRecords = await prisma.equipment.findMany({
      where: { serial_number: { in: Array.from(seenSerialsInBatch) } },
      select: { serial_number: true },
    });
    const existingDbSerials = new Set(existingSerialRecords.map((s) => s.serial_number));

    // Separate candidate items into new items to create vs skipped existing items
    const itemsToCreate: { asset_tag: string; serial_number: string }[] = [];
    const skippedItems: { asset_tag: string; serial_number: string; reason: string }[] = [];

    for (const item of candidateItems) {
      let isDuplicate = false;
      let reason = '';

      if (existingDbTags.has(item.asset_tag) && existingDbSerials.has(item.serial_number)) {
        isDuplicate = true;
        reason = `Asset Tag (${item.asset_tag}) y Serie (${item.serial_number}) ya existen`;
      } else if (existingDbTags.has(item.asset_tag)) {
        isDuplicate = true;
        reason = `Asset Tag (${item.asset_tag}) ya está registrado`;
      } else if (existingDbSerials.has(item.serial_number)) {
        isDuplicate = true;
        reason = `Número de serie (${item.serial_number}) ya está registrado`;
      }

      if (isDuplicate) {
        skippedItems.push({
          asset_tag: item.asset_tag,
          serial_number: item.serial_number,
          reason,
        });
      } else {
        itemsToCreate.push(item);
      }
    }

    // Insert only non-existing items
    if (itemsToCreate.length > 0) {
      const recordsToCreate = itemsToCreate.map((item) => ({
        asset_tag: item.asset_tag,
        serial_number: item.serial_number,
        typeId,
        brandId: brandId || null,
        modelId: modelId || null,
        branchId,
        departmentId: targetDeptId,
        dynamic_values: dynStr,
        status: targetStatus,
      }));

      await prisma.equipment.createMany({
        data: recordsToCreate,
      });
    }

    let message = '';
    if (itemsToCreate.length > 0 && skippedItems.length === 0) {
      message = `Se registraron exitosamente los ${itemsToCreate.length} equipos del lote.`;
    } else if (itemsToCreate.length > 0 && skippedItems.length > 0) {
      message = `Se registraron ${itemsToCreate.length} equipos nuevos. ${skippedItems.length} equipos fueron omitidos porque ya existen en la plataforma.`;
    } else {
      message = `No se agregaron nuevos equipos. Todos los ${skippedItems.length} equipos indicados ya existen registrados en el sistema.`;
    }

    return NextResponse.json({
      success: true,
      createdCount: itemsToCreate.length,
      skippedCount: skippedItems.length,
      createdItems: itemsToCreate,
      skippedItems: skippedItems,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      message,
    });
  } catch (error: any) {
    console.error('Error creating batch equipment:', error);
    return NextResponse.json(
      { error: 'Error al registrar equipos por lote: ' + error.message },
      { status: 500 }
    );
  }
}
