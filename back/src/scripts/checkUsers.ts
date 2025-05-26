import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Проверка пользователей в базе данных...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (users.length === 0) {
      console.log('❌ Пользователи не найдены в базе данных');
      return;
    }

    console.log(`✅ Найдено пользователей: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`👤 Пользователь ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Создан: ${user.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Найдем администратора
    const admin = users.find(user => user.role === 'ADMIN');
    if (admin) {
      console.log('🛡️  ДАННЫЕ ДЛЯ ВХОДА АДМИНИСТРАТОРА:');
      console.log(`📧 Email: ${admin.email}`);
      console.log(`👤 Username: ${admin.username}`);
      console.log(`🔑 Пароль: admin123 (если не менялся)`);
      console.log(`🛠️  Role: ${admin.role}`);
    } else {
      console.log('❌ Администратор не найден');
    }

  } catch (error) {
    console.error('❌ Ошибка проверки пользователей:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск скрипта
checkUsers(); 