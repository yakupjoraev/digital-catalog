#!/usr/bin/env node

import { testObjects, saveTestData } from './testData';
import { DatabaseIntegration } from './services/databaseIntegration';

async function testUpload() {
  console.log('🧪 Тестирование загрузки данных в backend');
  console.log('=' .repeat(50));

  // Сохраняем тестовые данные
  saveTestData();

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const apiKey = process.env.API_KEY;

  console.log(`🔗 Backend URL: ${backendUrl}`);

  const db = new DatabaseIntegration({ backendUrl, apiKey });

  try {
    // Проверяем подключение к backend
    console.log('\n🔍 Проверка подключения к backend...');
    const isConnected = await db.checkConnection();
    
    if (!isConnected) {
      console.error('❌ Backend недоступен. Убедитесь, что сервер запущен на', backendUrl);
      process.exit(1);
    }

    console.log('✅ Backend доступен');

    // Загружаем тестовые данные
    console.log('\n📤 Загрузка тестовых данных...');
    const results = await db.uploadObjects(testObjects);

    console.log('\n📊 Результаты загрузки:');
    console.log(`✅ Успешно загружено: ${results.success}`);
    console.log(`❌ Ошибок: ${results.errors}`);

    if (results.errors > 0) {
      console.log('\n❌ Детали ошибок:');
      results.details
        .filter(detail => detail.status === 'error')
        .forEach(detail => {
          console.log(`  - ${detail.object}: ${detail.error}`);
        });
    }

    // Получаем статистику
    console.log('\n📈 Статистика из backend:');
    const stats = await db.getObjectsStats();
    if (stats) {
      console.log(JSON.stringify(stats, null, 2));
    }

    console.log('\n🎉 Тестирование завершено!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  testUpload();
} 