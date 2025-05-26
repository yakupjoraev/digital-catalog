#!/usr/bin/env node

import { ImprovedPDFParser } from './services/improvedPDFParser';
import { DatabaseIntegration } from './services/databaseIntegration';
import * as fs from 'fs';
import * as path from 'path';

async function testImprovedParser() {
  console.log('🚀 Тестирование улучшенного парсера PDF');
  console.log('=' .repeat(60));

  const parser = new ImprovedPDFParser();
  
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

    // Парсим объекты с улучшенным алгоритмом
    console.log('\n🔍 Улучшенный парсинг объектов...');
    const objects = parser.parseObjectsFromText(text);

    if (objects.length > 0) {
      console.log(`\n✅ Успешно извлечено объектов: ${objects.length}`);
      
      // Показываем статистику
      const stats = getStatistics(objects);
      console.log('\n📊 Статистика улучшенного парсинга:');
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

      // Показываем лучшие примеры объектов
      console.log('\n📋 Лучшие примеры извлеченных объектов:');
      const bestObjects = objects
        .filter(obj => obj.name.length > 10 && !obj.name.match(/^\d+/))
        .slice(0, 5);

      bestObjects.forEach((obj, index) => {
        console.log(`\n${index + 1}. ${obj.name}`);
        console.log(`   Адрес: ${obj.address}`);
        console.log(`   Район: ${obj.district}`);
        console.log(`   Тип: ${obj.type}`);
        console.log(`   Статус: ${obj.status}`);
        if (obj.description && obj.description.length > 20) {
          console.log(`   Описание: ${obj.description.substring(0, 100)}...`);
        }
        if (obj.budget) {
          console.log(`   Бюджет: ${obj.budget.toLocaleString('ru-RU')} руб.`);
        }
        if (obj.completionDate) {
          console.log(`   Дата завершения: ${obj.completionDate}`);
        }
      });

      // Сохраняем улучшенные данные
      console.log('\n💾 Сохранение улучшенных данных...');
      const filename = `improved_objects_${Date.now()}.json`;
      await parser.saveToJSON(objects, filename);

      // Предлагаем загрузить в backend
      console.log('\n🤔 Хотите загрузить улучшенные данные в backend?');
      console.log('Запустите: npm run upload-improved');

      // Сравнение с предыдущим результатом
      console.log('\n📈 Сравнение с предыдущим парсингом:');
      await compareWithPrevious(objects);

    } else {
      console.log('\n⚠️ Объекты не найдены даже с улучшенным парсером');
      console.log('Возможно, нужно дополнительно настроить алгоритм парсинга');
    }

  } catch (error) {
    console.error('\n❌ Ошибка улучшенного парсинга:', error);
  }

  console.log('\n✅ Тестирование улучшенного парсера завершено');
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
    withDescription: objects.filter(obj => obj.description && obj.description.length > 20).length
  };
}

async function compareWithPrevious(newObjects: any[]): Promise<void> {
  try {
    const outputDir = path.join(__dirname, 'data/output');
    const files = fs.readdirSync(outputDir)
      .filter(file => file.endsWith('.json') && file.includes('manual_'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log('  Нет предыдущих результатов для сравнения');
      return;
    }

    const previousFile = files[0];
    const previousPath = path.join(outputDir, previousFile);
    const previousData = JSON.parse(fs.readFileSync(previousPath, 'utf8'));

    console.log(`  Предыдущий результат: ${previousData.length} объектов`);
    console.log(`  Улучшенный результат: ${newObjects.length} объектов`);
    
    const improvement = newObjects.length - previousData.length;
    if (improvement > 0) {
      console.log(`  📈 Улучшение: +${improvement} объектов`);
    } else if (improvement < 0) {
      console.log(`  📉 Уменьшение: ${improvement} объектов`);
    } else {
      console.log(`  ➡️ Количество не изменилось`);
    }

    // Сравниваем качество названий
    const previousGoodNames = previousData.filter((obj: any) => 
      obj.name.length > 10 && !obj.name.match(/^\d+/)
    ).length;
    
    const newGoodNames = newObjects.filter(obj => 
      obj.name.length > 10 && !obj.name.match(/^\d+/)
    ).length;

    console.log(`  Качественные названия: ${previousGoodNames} → ${newGoodNames}`);

  } catch (error) {
    console.log('  Ошибка сравнения с предыдущими результатами');
  }
}

// Запуск
if (require.main === module) {
  testImprovedParser();
} 