import { PrismaClient } from '@prisma/client';
import loadParsedData from './loadParsedData';

const prisma = new PrismaClient();

async function fullRestore() {
  try {
    console.log('🔄 Полное восстановление данных...\n');

    // Проверяем текущее состояние базы
    const currentCount = await prisma.object.count();
    console.log(`📊 Текущее количество объектов в базе: ${currentCount}`);

    if (currentCount === 0) {
      console.log('📦 База данных пуста, выполняем полное восстановление...\n');
      
      // 1. Загружаем тестовые данные
      console.log('1️⃣ Запуск seed скрипта...');
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec('npm run db:seed', (error: any, stdout: any, stderr: any) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
      
      // 2. Загружаем спарсенные данные
      console.log('\n2️⃣ Загрузка спарсенных данных...');
      await loadParsedData();
      
    } else if (currentCount < 20) {
      console.log('⚠️  В базе мало данных, загружаем недостающие...\n');
      
      // Загружаем только спарсенные данные
      await loadParsedData();
      
    } else {
      console.log('✅ База данных содержит достаточно данных');
    }

    const finalCount = await prisma.object.count();
    console.log(`\n🎉 Восстановление завершено! Всего объектов: ${finalCount}`);

  } catch (error) {
    console.error('❌ Ошибка при восстановлении данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск если файл вызван напрямую
if (require.main === module) {
  fullRestore();
}

export default fullRestore; 