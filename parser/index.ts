import { MainParser } from './services/mainParser';
import { ObjectData } from './services/pdfParser';

async function main() {
  console.log('🚀 Запуск парсера объектов благоустройства Волгограда');
  console.log('=' .repeat(60));

  const parser = new MainParser();

  try {
    // Получаем аргументы командной строки
    const args = process.argv.slice(2);
    
    if (args.length > 0 && args[0].startsWith('http')) {
      // Парсим конкретный PDF по URL
      const pdfUrl = args[0];
      const title = args[1] || 'Manual PDF';
      
      console.log(`📄 Парсинг конкретного PDF: ${pdfUrl}`);
      const objects = await parser.parsePDFByUrl(pdfUrl, title);
      
      if (objects.length > 0) {
        console.log('\n📊 Статистика:');
        const stats = parser.getStatistics(objects);
        console.log(JSON.stringify(stats, null, 2));
      }
      
    } else {
      // Основной парсинг сайта
      console.log('🌐 Начинаю полный парсинг сайта volgograd.ru...');
      const objects = await parser.parseVolgogradObjects();
      
      if (objects.length > 0) {
        console.log('\n📊 Итоговая статистика:');
        const stats = parser.getStatistics(objects);
        console.log(`Всего объектов: ${stats.total}`);
        console.log('\nПо районам:');
        Object.entries(stats.byDistrict).forEach(([district, count]) => {
          console.log(`  ${district}: ${count}`);
        });
        console.log('\nПо типам:');
        Object.entries(stats.byType).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
        console.log('\nПо статусам:');
        Object.entries(stats.byStatus).forEach(([status, count]) => {
          console.log(`  ${status}: ${count}`);
        });
        console.log(`\nОбъекты с координатами: ${stats.withCoordinates}`);
        console.log(`Объекты с фото: ${stats.withPhotos}`);
        console.log(`Объекты с бюджетом: ${stats.withBudget}`);
        console.log(`Объекты с площадью: ${stats.withArea}`);
      } else {
        console.log('⚠️ Объекты не найдены. Возможные причины:');
        console.log('  - Сайт недоступен');
        console.log('  - Изменилась структура сайта');
        console.log('  - PDF файлы не найдены');
        console.log('  - Ошибка парсинга PDF');
      }
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }

  console.log('\n✅ Парсинг завершен');
}

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Необработанная ошибка Promise:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Необработанное исключение:', error);
  process.exit(1);
});

// Запуск
if (require.main === module) {
  main();
}

export { MainParser, ObjectData };
