#!/usr/bin/env node

import { SpecializedParser } from './services/specializedParser';
import { DatabaseIntegration } from './services/databaseIntegration';
import * as fs from 'fs';
import * as path from 'path';

async function testSpecializedParser() {
  console.log('🎯 Тестирование специализированного парсера PDF');
  console.log('=' .repeat(60));

  const parser = new SpecializedParser();
  
  try {
    // Используем уже скачанный PDF файл
    const downloadsDir = path.join(__dirname, 'data/downloads');
    const files = fs.readdirSync(downloadsDir)
      .filter(file => file.endsWith('.pdf'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log('❌ PDF файлы не найдены. Сначала запустите: npm run test-real');
      return;
    }

    const latestPDF = files[0];
    const pdfPath = path.join(downloadsDir, latestPDF);
    
    console.log(`📄 Используем PDF файл: ${latestPDF}`);

    // Извлекаем текст
    console.log('\n📖 Извлечение текста из PDF...');
    const text = await parser.extractTextFromPDF(pdfPath);

    // Парсим объекты со специализированным алгоритмом
    console.log('\n🎯 Специализированный парсинг объектов...');
    const objects = parser.parseObjectsFromText(text);

    if (objects.length > 0) {
      console.log(`\n✅ Успешно извлечено объектов: ${objects.length}`);
      
      // Показываем статистику
      const stats = getStatistics(objects);
      console.log('\n📊 Статистика специализированного парсинга:');
      console.log(`Всего объектов: ${stats.total}`);
      
      if (Object.keys(stats.byDistrict).length > 0) {
        console.log('\nПо районам:');
        Object.entries(stats.byDistrict).forEach(([district, count]) => {
          console.log(`  ${district}: ${count}`);
        });
      }
      
      if (Object.keys(stats.byType).length > 0) {
        console.log('\nПо типам:');
        Object.entries(stats.byType).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
      }

      console.log('\nДополнительная статистика:');
      console.log(`  С координатами: ${stats.withCoordinates}`);
      console.log(`  С бюджетом: ${stats.withBudget}`);
      console.log(`  С описанием: ${stats.withDescription}`);
      console.log(`  С датой завершения: ${stats.withCompletionDate}`);

      // Показываем лучшие примеры объектов
      console.log('\n📋 Примеры извлеченных объектов:');
      objects.slice(0, 5).forEach((obj, index) => {
        console.log(`\n${index + 1}. ${obj.name}`);
        console.log(`   Адрес: ${obj.address}`);
        console.log(`   Район: ${obj.district}`);
        console.log(`   Тип: ${obj.type}`);
        console.log(`   Статус: ${obj.status}`);
        if (obj.description && obj.description.length > 20) {
          console.log(`   Описание: ${obj.description.substring(0, 150)}...`);
        }
        if (obj.budget) {
          console.log(`   Бюджет: ${obj.budget.toLocaleString('ru-RU')} руб.`);
        }
        if (obj.completionDate) {
          console.log(`   Дата завершения: ${obj.completionDate}`);
        }
        if (obj.coordinates) {
          console.log(`   Координаты: ${obj.coordinates.lat}, ${obj.coordinates.lng}`);
        }
      });

      // Сохраняем специализированные данные
      console.log('\n💾 Сохранение специализированных данных...');
      const filename = `specialized_objects_${Date.now()}.json`;
      await parser.saveToJSON(objects, filename);

      // Предлагаем загрузить в backend
      console.log('\n🤔 Хотите загрузить специализированные данные в backend?');
      console.log('Запустите: npm run upload-specialized');

      // Сравнение с предыдущими результатами
      console.log('\n📈 Сравнение с предыдущими парсингами:');
      await compareWithPrevious(objects);

    } else {
      console.log('\n⚠️ Объекты не найдены даже со специализированным парсером');
      console.log('Возможно, нужно дополнительно настроить алгоритм парсинга');
    }

  } catch (error) {
    console.error('\n❌ Ошибка специализированного парсинга:', error);
  }

  console.log('\n✅ Тестирование специализированного парсера завершено');
}

function getStatistics(objects: any[]): any {
  return {
    total: objects.length,
    byDistrict: objects.reduce((acc, obj) => {
      acc[obj.district] = (acc[obj.district] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byType: objects.reduce((acc, obj) => {
      acc[obj.type] = (acc[obj.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: objects.reduce((acc, obj) => {
      acc[obj.status] = (acc[obj.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    withCoordinates: objects.filter(obj => obj.coordinates).length,
    withPhotos: objects.filter(obj => obj.photos && obj.photos.length > 0).length,
    withBudget: objects.filter(obj => obj.budget).length,
    withDescription: objects.filter(obj => obj.description && obj.description.length > 20).length,
    withCompletionDate: objects.filter(obj => obj.completionDate).length
  };
}

async function compareWithPrevious(newObjects: any[]): Promise<void> {
  try {
    const outputDir = path.join(__dirname, 'data/output');
    const files = fs.readdirSync(outputDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log('  Нет предыдущих результатов для сравнения');
      return;
    }

    // Сравниваем с разными типами парсинга
    const comparisons = [
      { pattern: 'manual_', name: 'Базовый парсер' },
      { pattern: 'improved_', name: 'Улучшенный парсер' },
      { pattern: 'test_objects', name: 'Тестовые данные' }
    ];

    for (const comp of comparisons) {
      const file = files.find(f => f.includes(comp.pattern));
      if (file) {
        const filePath = path.join(outputDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        console.log(`\n  ${comp.name}: ${data.length} объектов`);
        
        const qualityScore = calculateQualityScore(data);
        const newQualityScore = calculateQualityScore(newObjects);
        
        console.log(`    Качество: ${qualityScore.toFixed(1)}% → ${newQualityScore.toFixed(1)}%`);
      }
    }

    console.log(`\n  Специализированный парсер: ${newObjects.length} объектов`);

  } catch (error) {
    console.log('  Ошибка сравнения с предыдущими результатами');
  }
}

function calculateQualityScore(objects: any[]): number {
  if (objects.length === 0) return 0;
  
  let score = 0;
  const maxScore = objects.length * 6; // 6 критериев качества
  
  objects.forEach(obj => {
    if (obj.name && obj.name.length > 10 && !obj.name.match(/^\d+/)) score++;
    if (obj.address && obj.address !== 'Адрес не указан') score++;
    if (obj.district && obj.district !== 'Не указан') score++;
    if (obj.type && obj.type !== 'другое') score++;
    if (obj.description && obj.description.length > 20) score++;
    if (obj.budget || obj.completionDate) score++;
  });
  
  return (score / maxScore) * 100;
}

// Запуск
if (require.main === module) {
  testSpecializedParser();
} 