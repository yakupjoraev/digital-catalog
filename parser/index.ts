import { parseVolgograd } from './services/parser';
import { saveToFile } from './utils/fileUtils';

async function main() {
  console.log('🚀 Запуск парсера данных об объектах благоустройства Волгограда...');
  
  try {
    // Парсинг данных
    const objects = await parseVolgograd();
    
    console.log(`✅ Найдено объектов: ${objects.length}`);
    
    // Сохранение в файл
    await saveToFile(objects, './data/objects.json');
    
    console.log('💾 Данные сохранены в ./data/objects.json');
    
    // Статистика
    const stats = {
      total: objects.length,
      byDistrict: objects.reduce((acc: any, obj) => {
        acc[obj.district] = (acc[obj.district] || 0) + 1;
        return acc;
      }, {}),
      byType: objects.reduce((acc: any, obj) => {
        acc[obj.type] = (acc[obj.type] || 0) + 1;
        return acc;
      }, {})
    };
    
    console.log('📊 Статистика:');
    console.log(`   Всего объектов: ${stats.total}`);
    console.log('   По районам:', stats.byDistrict);
    console.log('   По типам:', stats.byType);
    
  } catch (error) {
    console.error('❌ Ошибка парсинга:', error);
    process.exit(1);
  }
}

// Запуск парсера
if (require.main === module) {
  main();
}
