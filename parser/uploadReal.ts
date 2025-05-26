#!/usr/bin/env node

import { DatabaseIntegration } from './services/databaseIntegration';
import * as fs from 'fs';
import * as path from 'path';

async function uploadRealData() {
  console.log('📤 Загрузка реальных данных в backend');
  console.log('=' .repeat(50));

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const apiKey = process.env.API_KEY;

  console.log(`🔗 Backend URL: ${backendUrl}`);

  try {
    // Ищем последний JSON файл с реальными данными
    const dataDir = path.join(__dirname, 'data/output');
    
    if (!fs.existsSync(dataDir)) {
      console.error('❌ Папка с данными не найдена. Сначала выполните парсинг.');
      return;
    }

    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.json') && !file.includes('test_objects'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.error('❌ Файлы с реальными данными не найдены. Сначала выполните парсинг.');
      console.log('Запустите: npm run test-real');
      return;
    }

    const latestFile = files[0];
    const filePath = path.join(dataDir, latestFile);
    
    console.log(`📁 Загружаю данные из файла: ${latestFile}`);
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!Array.isArray(data) || data.length === 0) {
      console.error('❌ Файл не содержит данных или имеет неверный формат.');
      return;
    }

    console.log(`📊 Найдено объектов: ${data.length}`);

    const db = new DatabaseIntegration({ backendUrl, apiKey });

    // Проверяем подключение
    console.log('\n🔍 Проверка подключения к backend...');
    const isConnected = await db.checkConnection();
    
    if (!isConnected) {
      console.error('❌ Backend недоступен. Убедитесь, что сервер запущен на', backendUrl);
      return;
    }

    console.log('✅ Backend доступен');

    // Загружаем данные
    console.log('\n📤 Загрузка реальных данных...');
    const results = await db.uploadObjects(data);

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

    // Показываем обновленную статистику
    console.log('\n📈 Обновленная статистика из backend:');
    const stats = await db.getObjectsStats();
    if (stats) {
      console.log(JSON.stringify(stats, null, 2));
    }

    console.log('\n🎉 Загрузка реальных данных завершена!');
    console.log('🌐 Теперь можете посмотреть объекты на сайте: http://localhost:3000');

  } catch (error) {
    console.error('❌ Ошибка загрузки:', error);
  }
}

// Запуск
if (require.main === module) {
  uploadRealData();
} 