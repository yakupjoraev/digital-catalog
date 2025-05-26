#!/usr/bin/env node

import { MainParser } from './services/mainParser';
import { DatabaseIntegration } from './services/databaseIntegration';
import { ObjectData } from './services/pdfParser';

interface CLIOptions {
  command: string;
  url?: string;
  backend?: string;
  clear?: boolean;
  sync?: boolean;
  help?: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    command: 'parse'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--url':
      case '-u':
        options.url = args[++i];
        break;
      case '--backend':
      case '-b':
        options.backend = args[++i];
        break;
      case '--clear':
      case '-c':
        options.clear = true;
        break;
      case '--sync':
      case '-s':
        options.sync = true;
        break;
      case 'parse':
      case 'upload':
      case 'sync':
      case 'stats':
      case 'clear':
        options.command = arg;
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🚀 Парсер объектов благоустройства Волгограда

ИСПОЛЬЗОВАНИЕ:
  npm run cli [команда] [опции]

КОМАНДЫ:
  parse     Парсить объекты с сайта volgograd.ru (по умолчанию)
  upload    Загрузить данные в backend
  sync      Синхронизировать: парсить и загрузить в backend
  stats     Показать статистику из backend
  clear     Очистить все объекты в backend

ОПЦИИ:
  --url, -u <url>        URL конкретного PDF для парсинга
  --backend, -b <url>    URL backend сервера (по умолчанию: http://localhost:5000)
  --clear, -c            Очистить базу перед загрузкой
  --sync, -s             Синхронизировать с backend после парсинга
  --help, -h             Показать эту справку

ПРИМЕРЫ:
  npm run cli parse                                    # Парсить сайт
  npm run cli -- parse --url "https://example.com/file.pdf"  # Парсить конкретный PDF
  npm run cli sync                                     # Парсить и загрузить в backend
  npm run cli upload --backend http://localhost:5000  # Загрузить в backend
`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  const backendUrl = options.backend || process.env.BACKEND_URL || 'http://localhost:5000';
  const apiKey = process.env.API_KEY;

  console.log('🚀 Парсер объектов благоустройства Волгограда');
  console.log('=' .repeat(60));

  try {
    switch (options.command) {
      case 'parse':
        await handleParse(options, backendUrl, apiKey);
        break;
      case 'upload':
        await handleUpload(backendUrl, apiKey);
        break;
      case 'sync':
        await handleSync(options, backendUrl, apiKey);
        break;
      case 'stats':
        await handleStats(backendUrl, apiKey);
        break;
      case 'clear':
        await handleClear(backendUrl, apiKey);
        break;
      default:
        console.error(`❌ Неизвестная команда: ${options.command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
}

async function handleParse(options: CLIOptions, backendUrl: string, apiKey?: string) {
  const parser = new MainParser();
  let objects: ObjectData[] = [];

  if (options.url) {
    console.log(`📄 Парсинг конкретного PDF: ${options.url}`);
    objects = await parser.parsePDFByUrl(options.url);
  } else {
    console.log('🌐 Парсинг сайта volgograd.ru...');
    objects = await parser.parseVolgogradObjects();
  }

  if (objects.length > 0) {
    console.log('\n📊 Статистика:');
    const stats = parser.getStatistics(objects);
    printStats(stats);

    if (options.sync) {
      console.log('\n🔄 Синхронизация с backend...');
      const db = new DatabaseIntegration({ backendUrl, apiKey });
      await db.syncObjects(objects, options.clear);
    }
  } else {
    console.log('⚠️ Объекты не найдены');
  }
}

async function handleUpload(backendUrl: string, apiKey?: string) {
  console.log('📤 Загрузка последних распарсенных данных в backend...');
  
  // Ищем последний JSON файл с данными
  const fs = require('fs');
  const path = require('path');
  const dataDir = path.join(__dirname, 'data/output');
  
  if (!fs.existsSync(dataDir)) {
    console.error('❌ Папка с данными не найдена. Сначала выполните парсинг.');
    return;
  }

  const files = fs.readdirSync(dataDir)
    .filter((file: string) => file.endsWith('.json') && !file.includes('_report'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('❌ JSON файлы с данными не найдены. Сначала выполните парсинг.');
    return;
  }

  const latestFile = files[0];
  const filePath = path.join(dataDir, latestFile);
  
  console.log(`📁 Загружаю данные из файла: ${latestFile}`);
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const db = new DatabaseIntegration({ backendUrl, apiKey });
  await db.uploadObjects(data);
}

async function handleSync(options: CLIOptions, backendUrl: string, apiKey?: string) {
  console.log('🔄 Синхронизация: парсинг + загрузка в backend...');
  
  const parser = new MainParser();
  let objects: ObjectData[] = [];

  if (options.url) {
    objects = await parser.parsePDFByUrl(options.url);
  } else {
    objects = await parser.parseVolgogradObjects();
  }

  if (objects.length > 0) {
    const db = new DatabaseIntegration({ backendUrl, apiKey });
    await db.syncObjects(objects, options.clear);
  } else {
    console.log('⚠️ Нет данных для синхронизации');
  }
}

async function handleStats(backendUrl: string, apiKey?: string) {
  console.log('📊 Получение статистики из backend...');
  
  const db = new DatabaseIntegration({ backendUrl, apiKey });
  const isConnected = await db.checkConnection();
  
  if (!isConnected) {
    console.error('❌ Backend недоступен');
    return;
  }

  const stats = await db.getObjectsStats();
  
  if (stats) {
    console.log('\n📈 Статистика объектов в базе данных:');
    console.log(JSON.stringify(stats, null, 2));
  } else {
    console.log('⚠️ Не удалось получить статистику');
  }
}

async function handleClear(backendUrl: string, apiKey?: string) {
  console.log('🗑️ Очистка всех объектов в backend...');
  
  const db = new DatabaseIntegration({ backendUrl, apiKey });
  const success = await db.clearAllObjects();
  
  if (success) {
    console.log('✅ База данных очищена');
  } else {
    console.log('❌ Ошибка очистки базы данных');
  }
}

function printStats(stats: any) {
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
  
  if (Object.keys(stats.byStatus).length > 0) {
    console.log('\nПо статусам:');
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
  }
  
  console.log(`\nДополнительно:`);
  console.log(`  С координатами: ${stats.withCoordinates}`);
  console.log(`  С фото: ${stats.withPhotos}`);
  console.log(`  С бюджетом: ${stats.withBudget}`);
  console.log(`  С площадью: ${stats.withArea}`);
}

// Запуск
if (require.main === module) {
  main();
} 