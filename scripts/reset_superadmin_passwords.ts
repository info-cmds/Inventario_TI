import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPasswords() {
  console.log('🔑 Restableciendo contraseñas de cuentas SUPERADMIN (ppizarro@cmds.cl y cgonzalezo@cmds.cl)...');
  const newHash = await bcrypt.hash('admin123', 10);

  // 1. ppizarro@cmds.cl
  await prisma.user.updateMany({
    where: { email: 'ppizarro@cmds.cl' },
    data: {
      password: newHash,
      must_change_password: false,
    },
  });

  // 2. cgonzalezo@cmds.cl
  await prisma.user.updateMany({
    where: { email: 'cgonzalezo@cmds.cl' },
    data: {
      password: newHash,
      must_change_password: false,
    },
  });

  console.log('✅ Contraseñas de ppizarro@cmds.cl y cgonzalezo@cmds.cl actualizadas a "admin123".');
}

resetPasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
