import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Проверяем, есть ли уже администратор
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('❌ Администратор уже существует:', existingAdmin.username);
      return;
    }

    // Данные администратора
    const adminData = {
      username: 'admin',
      email: 'admin@volgograd-catalog.ru',
      password: 'admin123', // В продакшене используйте сложный пароль
      role: 'ADMIN'
    };

    // Хеширование пароля
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

    // Создание администратора
    const admin = await prisma.user.create({
      data: {
        username: adminData.username,
        email: adminData.email,
        password: hashedPassword,
        role: adminData.role
      }
    });

    console.log('✅ Администратор успешно создан:');
    console.log('📧 Email:', admin.email);
    console.log('👤 Username:', admin.username);
    console.log('🔑 Password:', adminData.password);
    console.log('🛡️ Role:', admin.role);
    console.log('');
    console.log('⚠️  ВАЖНО: Смените пароль после первого входа!');

  } catch (error) {
    console.error('❌ Ошибка создания администратора:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск скрипта
createAdmin(); 