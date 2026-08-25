import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Auditando usuarios y hashes de contraseñas en dev.db...');
  const users = await prisma.user.findMany();

  const testPasswords = ['admin123', 'admin', '123456', 'superadmin', 'cmds2026', 'admin.123'];

  for (const user of users) {
    console.log(`\n----------------------------------------`);
    console.log(`👤 ID: ${user.id}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🏷️ Nombre: ${user.name}`);
    console.log(`🛡️ Rol: ${user.role}`);
    console.log(`🔑 Debe Cambiar Password: ${user.must_change_password}`);

    let matchedPassword = null;
    for (const pass of testPasswords) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        matchedPassword = pass;
        break;
      }
    }

    if (matchedPassword) {
      console.log(`✅ Contraseña probada que coincide: "${matchedPassword}"`);
    } else {
      console.log(`⚠️ Contraseña actual no coincide con la lista de prueba básica (hash bcrypt propio).`);
    }
  }
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
