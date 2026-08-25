import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const dumpPath = path.join(process.cwd(), 'prisma', 'production_data_dump.json');

  if (fs.existsSync(dumpPath)) {
    console.log('📦 Detectado archivo de volcado completo de producción (production_data_dump.json)...');
    console.log('🚀 Iniciando restauración automática de base de datos...');
    
    // Dynamically import and run import script logic
    const { importData } = require('../scripts/import_to_postgres');
    await importData();
    return;
  }

  console.log('⚠️ No se detectó production_data_dump.json. Ejecutando siembra inicial básica...');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la siembra de la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
