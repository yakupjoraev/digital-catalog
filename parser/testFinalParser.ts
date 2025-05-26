#!/usr/bin/env node

import { FinalParser, FullObjectData } from './services/finalParser';
import * as fs from 'fs';
import * as path from 'path';

async function testFinalParser() {
  console.log('🎯 Тестирование ФИНАЛЬНОГО парсера с ПОЛНОЙ информацией');
  console.log('=' .repeat(70));

  const parser = new FinalParser();
  
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

    // Парсим объекты с ПОЛНОЙ информацией
    console.log('\n🎯 ФИНАЛЬНЫЙ парсинг с полной информацией...');
    const objects = parser.parseObjectsFromText(text);

    if (objects.length > 0) {
      console.log(`\n✅ Успешно извлечено объектов: ${objects.length}`);
      
      // Показываем полную статистику
      const stats = getFullStatistics(objects);
      console.log('\n📊 ПОЛНАЯ статистика финального парсинга:');
      console.log(`Всего объектов: ${stats.total}`);
      
      if (Object.keys(stats.byDistrict).length > 0) {
        console.log('\n🏘️ По районам:');
        Object.entries(stats.byDistrict).forEach(([district, count]) => {
          console.log(`  ${district}: ${count}`);
        });
      }
      
      if (Object.keys(stats.byType).length > 0) {
        console.log('\n🏗️ По типам:');
        Object.entries(stats.byType).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
      }

      if (Object.keys(stats.byRegion).length > 0) {
        console.log('\n🌍 По регионам:');
        Object.entries(stats.byRegion).forEach(([region, count]) => {
          console.log(`  ${region}: ${count}`);
        });
      }

      console.log('\n📈 Качество извлеченных данных:');
      console.log(`  С координатами: ${stats.withCoordinates} (${(stats.withCoordinates/stats.total*100).toFixed(1)}%)`);
      console.log(`  С фотографиями: ${stats.withPhotos} (${(stats.withPhotos/stats.total*100).toFixed(1)}%)`);
      console.log(`  С бюджетом: ${stats.withBudget} (${(stats.withBudget/stats.total*100).toFixed(1)}%)`);
      console.log(`  С описанием: ${stats.withDescription} (${(stats.withDescription/stats.total*100).toFixed(1)}%)`);
      console.log(`  С подрядчиком: ${stats.withContractor} (${(stats.withContractor/stats.total*100).toFixed(1)}%)`);
      console.log(`  С заказчиком: ${stats.withCustomer} (${(stats.withCustomer/stats.total*100).toFixed(1)}%)`);
      console.log(`  С датами: ${stats.withDates} (${(stats.withDates/stats.total*100).toFixed(1)}%)`);

      // Показываем лучшие примеры объектов с ПОЛНОЙ информацией
      console.log('\n📋 Примеры объектов с ПОЛНОЙ информацией:');
      objects.slice(0, 3).forEach((obj, index) => {
        console.log(`\n${index + 1}. 🏗️ ${obj.name}`);
        console.log(`   📍 Адрес: ${obj.address}`);
        console.log(`   🏘️ Район: ${obj.district}`);
        console.log(`   🌍 Регион: ${obj.region}`);
        console.log(`   🏷️ Тип: ${obj.type}`);
        console.log(`   📊 Статус: ${obj.status} (${obj.status_detailed})`);
        
        if (obj.customer) {
          console.log(`   👤 Заказчик: ${obj.customer}`);
        }
        
        if (obj.contractor) {
          console.log(`   🏢 Подрядчик: ${obj.contractor}`);
        }
        
        if (obj.startDate) {
          console.log(`   📅 Дата начала: ${obj.startDate}`);
        }
        
        if (obj.endDate) {
          console.log(`   🏁 Дата завершения: ${obj.endDate}`);
        }
        
        if (obj.budgetMillion) {
          console.log(`   💰 Бюджет: ${obj.budgetMillion} млн руб. (${obj.budget?.toLocaleString('ru-RU')} руб.)`);
        }
        
        if (obj.photos && obj.photos.length > 0) {
          console.log(`   📸 Фотографий: ${obj.photos.length}`);
        }
        
        if (obj.coordinates) {
          console.log(`   🗺️ Координаты: ${obj.coordinates.lat}, ${obj.coordinates.lng}`);
        }
        
        if (obj.description && obj.description.length > 20) {
          console.log(`   📝 Описание: ${obj.description.substring(0, 150)}...`);
        }
      });

      // Сохраняем ПОЛНЫЕ данные
      console.log('\n💾 Сохранение ПОЛНЫХ данных...');
      const filename = `final_full_objects_${Date.now()}.json`;
      await parser.saveFullDataToJSON(objects, filename);

      // Предлагаем загрузить в backend
      console.log('\n🤔 Хотите загрузить ПОЛНЫЕ данные в backend?');
      console.log('Запустите: npm run upload-final');

      // Сравнение с предыдущими результатами
      console.log('\n📈 Сравнение с предыдущими парсингами:');
      await compareWithPrevious(objects);

      // Показываем общую оценку качества
      const qualityScore = calculateQualityScore(objects);
      console.log(`\n🎯 ОБЩАЯ ОЦЕНКА КАЧЕСТВА: ${qualityScore.toFixed(1)}%`);
      
      if (qualityScore >= 80) {
        console.log('🎉 ОТЛИЧНО! Данные высокого качества');
      } else if (qualityScore >= 60) {
        console.log('👍 ХОРОШО! Данные приемлемого качества');
      } else {
        console.log('⚠️ УДОВЛЕТВОРИТЕЛЬНО. Можно улучшить');
      }

    } else {
      console.log('\n⚠️ Объекты не найдены даже с финальным парсером');
      console.log('Возможно, нужно дополнительно настроить алгоритм парсинга');
    }

  } catch (error) {
    console.error('\n❌ Ошибка финального парсинга:', error);
  }

  console.log('\n✅ Тестирование ФИНАЛЬНОГО парсера завершено');
}

function getFullStatistics(objects: FullObjectData[]): any {
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
    byRegion: objects.reduce((acc, obj) => {
      acc[obj.region || 'Не указан'] = (acc[obj.region || 'Не указан'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: objects.reduce((acc, obj) => {
      acc[obj.status] = (acc[obj.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    withCoordinates: objects.filter(obj => obj.coordinates).length,
    withPhotos: objects.filter(obj => obj.photos && obj.photos.length > 0).length,
    withBudget: objects.filter(obj => obj.budget || obj.budgetMillion).length,
    withDescription: objects.filter(obj => obj.description && obj.description.length > 20).length,
    withContractor: objects.filter(obj => obj.contractor && obj.contractor.length > 5).length,
    withCustomer: objects.filter(obj => obj.customer && obj.customer.length > 5).length,
    withDates: objects.filter(obj => obj.startDate || obj.endDate).length
  };
}

async function compareWithPrevious(newObjects: FullObjectData[]): Promise<void> {
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
      { pattern: 'specialized_', name: 'Специализированный парсер' }
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
        
        const improvement = newQualityScore - qualityScore;
        if (improvement > 0) {
          console.log(`    📈 Улучшение: +${improvement.toFixed(1)}%`);
        }
      }
    }

    console.log(`\n  🎯 ФИНАЛЬНЫЙ парсер: ${newObjects.length} объектов`);

  } catch (error) {
    console.log('  Ошибка сравнения с предыдущими результатами');
  }
}

function calculateQualityScore(objects: any[]): number {
  if (objects.length === 0) return 0;
  
  let score = 0;
  const maxScore = objects.length * 10; // 10 критериев качества
  
  objects.forEach(obj => {
    if (obj.name && obj.name.length > 10 && !obj.name.match(/^\d+/)) score++;
    if (obj.address && obj.address !== 'Адрес не указан') score++;
    if (obj.district && obj.district !== 'Не указан') score++;
    if (obj.type && obj.type !== 'другое') score++;
    if (obj.description && obj.description.length > 20) score++;
    if (obj.budget || obj.budgetMillion) score++;
    if (obj.contractor && obj.contractor.length > 5) score++;
    if (obj.customer && obj.customer.length > 5) score++;
    if (obj.startDate || obj.endDate) score++;
    if (obj.coordinates) score++;
  });
  
  return (score / maxScore) * 100;
}

// Запуск
if (require.main === module) {
  testFinalParser();
} 