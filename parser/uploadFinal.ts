#!/usr/bin/env node

import { DatabaseIntegration } from './services/databaseIntegration';
import * as fs from 'fs';
import * as path from 'path';

async function uploadFinalData() {
  console.log('📤 Загрузка ФИНАЛЬНЫХ данных с полной информацией в backend');
  console.log('=' .repeat(70));

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const apiKey = process.env.API_KEY;

  console.log(`🔗 Backend URL: ${backendUrl}`);

  try {
    // Ищем последний JSON файл с финальными данными
    const dataDir = path.join(__dirname, 'data/output');
    
    if (!fs.existsSync(dataDir)) {
      console.error('❌ Папка с данными не найдена. Сначала выполните парсинг.');
      return;
    }

    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.json') && file.includes('final_full_objects'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.error('❌ Файлы с финальными данными не найдены. Сначала выполните парсинг.');
      console.log('Запустите: npm run test-final');
      return;
    }

    const latestFile = files[0];
    const filePath = path.join(dataDir, latestFile);
    
    console.log(`📁 Загружаю ФИНАЛЬНЫЕ данные из файла: ${latestFile}`);
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!Array.isArray(data) || data.length === 0) {
      console.error('❌ Файл не содержит данных или имеет неверный формат.');
      return;
    }

    console.log(`📊 Найдено объектов с ПОЛНОЙ информацией: ${data.length}`);

    // Показываем статистику данных
    console.log('\n📈 Статистика ФИНАЛЬНЫХ данных:');
    const stats = analyzeData(data);
    console.log(`  С названиями: ${stats.withNames} (${(stats.withNames/data.length*100).toFixed(1)}%)`);
    console.log(`  С адресами: ${stats.withAddresses} (${(stats.withAddresses/data.length*100).toFixed(1)}%)`);
    console.log(`  С районами: ${stats.withDistricts} (${(stats.withDistricts/data.length*100).toFixed(1)}%)`);
    console.log(`  С подрядчиками: ${stats.withContractors} (${(stats.withContractors/data.length*100).toFixed(1)}%)`);
    console.log(`  С заказчиками: ${stats.withCustomers} (${(stats.withCustomers/data.length*100).toFixed(1)}%)`);
    console.log(`  С бюджетом: ${stats.withBudget} (${(stats.withBudget/data.length*100).toFixed(1)}%)`);
    console.log(`  С датами: ${stats.withDates} (${(stats.withDates/data.length*100).toFixed(1)}%)`);
    console.log(`  С фотографиями: ${stats.withPhotos} (${(stats.withPhotos/data.length*100).toFixed(1)}%)`);

    const db = new DatabaseIntegration({ backendUrl, apiKey });

    // Проверяем подключение
    console.log('\n🔍 Проверка подключения к backend...');
    const isConnected = await db.checkConnection();
    
    if (!isConnected) {
      console.error('❌ Backend недоступен. Убедитесь, что сервер запущен на', backendUrl);
      return;
    }

    console.log('✅ Backend доступен');

    // Загружаем ФИНАЛЬНЫЕ данные
    console.log('\n📤 Загрузка ФИНАЛЬНЫХ данных с полной информацией...');
    const results = await db.uploadObjects(data);

    console.log('\n📊 Результаты загрузки ФИНАЛЬНЫХ данных:');
    console.log(`✅ Успешно загружено: ${results.success}`);
    console.log(`❌ Ошибок: ${results.errors}`);

    if (results.errors > 0) {
      console.log('\n❌ Детали ошибок:');
      results.details
        .filter(detail => detail.status === 'error')
        .slice(0, 10) // Показываем только первые 10 ошибок
        .forEach(detail => {
          console.log(`  - ${detail.object}: ${detail.error}`);
        });
      
      if (results.errors > 10) {
        console.log(`  ... и еще ${results.errors - 10} ошибок`);
      }
    }

    // Показываем успешно загруженные объекты
    if (results.success > 0) {
      console.log('\n✅ Успешно загруженные объекты:');
      results.details
        .filter(detail => detail.status === 'success')
        .slice(0, 5)
        .forEach(detail => {
          console.log(`  ✅ ${detail.object}`);
        });
      
      if (results.success > 5) {
        console.log(`  ... и еще ${results.success - 5} объектов`);
      }
    }

    // Показываем обновленную статистику
    console.log('\n📈 Обновленная статистика из backend:');
    const backendStats = await db.getObjectsStats();
    if (backendStats) {
      console.log(JSON.stringify(backendStats, null, 2));
    }

    console.log('\n🎉 Загрузка ФИНАЛЬНЫХ данных завершена!');
    console.log('🌐 Теперь можете посмотреть объекты с ПОЛНОЙ информацией на сайте: http://localhost:3000');
    console.log('📸 Объекты с фотографиями будут отображаться со слайдерами');
    console.log('🗺️ Все объекты будут показаны на карте с синими маркерами');

  } catch (error) {
    console.error('❌ Ошибка загрузки ФИНАЛЬНЫХ данных:', error);
  }
}

function analyzeData(data: any[]): any {
  return {
    withNames: data.filter(obj => obj.name && obj.name.length > 10 && !obj.name.match(/^\d+/)).length,
    withAddresses: data.filter(obj => obj.address && obj.address !== 'Адрес не указан').length,
    withDistricts: data.filter(obj => obj.district && obj.district !== 'Не указан').length,
    withContractors: data.filter(obj => obj.contractor && obj.contractor.length > 5).length,
    withCustomers: data.filter(obj => obj.customer && obj.customer.length > 5).length,
    withBudget: data.filter(obj => obj.budget || obj.budgetMillion).length,
    withDates: data.filter(obj => obj.startDate || obj.endDate).length,
    withPhotos: data.filter(obj => obj.photos && obj.photos.length > 0).length
  };
}

// Запуск
if (require.main === module) {
  uploadFinalData();
} 