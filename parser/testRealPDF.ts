#!/usr/bin/env node

import { MainParser } from './services/mainParser';
import { DatabaseIntegration } from './services/databaseIntegration';

async function testRealPDF() {
  console.log('🌐 Тестирование парсинга реального PDF с volgograd.ru');
  console.log('=' .repeat(60));

  const parser = new MainParser();
  
  // URL реального PDF файла
  const pdfUrl = 'https://www.volgograd.ru/vo-project/obekty-np-2025-2030/!ОБЪЕКТЫ%20БЛАГОУСТРОЙСТВА%2022.05.2025.pdf';
  
  console.log(`📄 PDF URL: ${pdfUrl}`);

  try {
    // Парсим PDF файл
    console.log('\n🔍 Парсинг PDF файла...');
    const objects = await parser.parsePDFByUrl(pdfUrl, 'Объекты благоустройства 2025');

    if (objects.length > 0) {
      console.log(`\n✅ Успешно извлечено объектов: ${objects.length}`);
      
      // Показываем статистику
      const stats = parser.getStatistics(objects);
      console.log('\n📊 Статистика извлеченных данных:');
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

      // Показываем первые 3 объекта как примеры
      console.log('\n📋 Примеры извлеченных объектов:');
      objects.slice(0, 3).forEach((obj, index) => {
        console.log(`\n${index + 1}. ${obj.name}`);
        console.log(`   Адрес: ${obj.address}`);
        console.log(`   Район: ${obj.district}`);
        console.log(`   Тип: ${obj.type}`);
        console.log(`   Статус: ${obj.status}`);
        if (obj.description) {
          console.log(`   Описание: ${obj.description.substring(0, 100)}...`);
        }
        if (obj.area) {
          console.log(`   Площадь: ${obj.area} м²`);
        }
        if (obj.budget) {
          console.log(`   Бюджет: ${obj.budget.toLocaleString('ru-RU')} руб.`);
        }
      });

      // Предлагаем загрузить в backend
      console.log('\n🤔 Хотите загрузить эти данные в backend?');
      console.log('Запустите: npm run upload-real');

    } else {
      console.log('\n⚠️ Объекты не найдены в PDF файле');
      console.log('Возможные причины:');
      console.log('  - PDF файл недоступен');
      console.log('  - Изменился формат документа');
      console.log('  - Ошибка парсинга текста');
    }

  } catch (error) {
    console.error('\n❌ Ошибка парсинга:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('certificate')) {
        console.log('\n💡 Совет: Проблема с SSL сертификатом. Парсер должен автоматически игнорировать SSL ошибки.');
      } else if (error.message.includes('timeout')) {
        console.log('\n💡 Совет: Превышено время ожидания. Попробуйте еще раз.');
      } else if (error.message.includes('404')) {
        console.log('\n💡 Совет: PDF файл не найден. Проверьте URL.');
      }
    }
  }

  console.log('\n✅ Тестирование завершено');
}

// Запуск
if (require.main === module) {
  testRealPDF();
} 