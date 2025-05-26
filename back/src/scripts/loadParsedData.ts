import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ParsedObject {
  name: string;
  address: string;
  district: string;
  type: string;
  status: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  photos: string[];
  objectNumber: number;
  region: string;
  customer: string;
  contractor: string;
  startDate: string;
  endDate: string;
  budgetMillion: number;
  budget: number;
  completionDate: string;
  fullDescription: string;
  photoIcon: boolean;
  mapIcon: boolean;
  status_detailed: string;
}

// Маппинг типов объектов
const typeMapping: { [key: string]: string } = {
  'парк': 'PARK',
  'сквер': 'SQUARE',
  'пешеходная зона': 'PEDESTRIAN_ZONE',
  'площадка': 'PLAYGROUND',
  'набережная': 'EMBANKMENT',
  'фонтан': 'FOUNTAIN',
  'памятник': 'MONUMENT',
  'территория': 'PARK'
};

// Маппинг районов
const districtMapping: { [key: string]: string } = {
  'Советский': 'SOVETSKY',
  'Краснооктябрьский': 'KRASNOOKTYABRSKY',
  'Дзержинский': 'DZERZHINSKY',
  'Красноармейский': 'KRASNOARMEYSKY',
  'Кировский': 'KIROVSKY',
  'Центральный': 'CENTRAL',
  'Тракторозаводский': 'TRAKTOROZAVODSKY',
  'Ворошиловский': 'VOROSHILOVSKY',
  'Не указан': 'CENTRAL',
  // Районы Волгоградской области
  'Среднеахтубинский': 'SREDNEAKHTUBINSKY',
  'Новоаннинский': 'NOVOANNINSK',
  'Николаевский': 'NIKOLAEVSKY',
  'Палласовский': 'PALLASOVSKY',
  'Суровикинский': 'SUROVIKINSKY',
  'Серафимовичский': 'SERAFIMOVICH',
  'Камышинский': 'KAMYSHINSKY',
  'Старополтавский': 'STAROPOLYAVSKY',
  'Жирновский': 'ZHIRNOVSKY',
  'Калачевский': 'KALACHEVSKY',
  'Ленинский': 'LENINSKY',
  'Котельниковский': 'KOTELNIKOVSKY'
};

// Функция для извлечения района из описания
function extractDistrictFromDescription(description: string, fullDescription: string): string {
  const text = `${description} ${fullDescription}`.toLowerCase();
  
  // Ищем упоминания районов в тексте
  for (const [districtName, districtCode] of Object.entries(districtMapping)) {
    if (districtName === 'Не указан') continue;
    
    const patterns = [
      `${districtName.toLowerCase()} район`,
      `${districtName.toLowerCase()}ский район`,
      `${districtName.toLowerCase()}ого района`
    ];
    
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        return districtCode;
      }
    }
  }
  
  return 'CENTRAL'; // По умолчанию
}

// Маппинг статусов
const statusMapping: { [key: string]: string } = {
  'активный': 'ACTIVE',
  'строительство': 'UNDER_CONSTRUCTION',
  'планируется': 'PLANNED',
  'завершен': 'COMPLETED'
};

async function loadParsedData() {
  try {
    console.log('🔄 Загрузка спарсенных данных...');

    // Путь к файлу с спарсенными данными
    const dataPath = path.join(__dirname, '../../../parser/data/output/final_full_objects_1748251911697.json');
    
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Файл с данными не найден:', dataPath);
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const parsedObjects: ParsedObject[] = JSON.parse(rawData);

    console.log(`📊 Найдено ${parsedObjects.length} объектов для загрузки`);

    let loaded = 0;
    let skipped = 0;

    for (const obj of parsedObjects) {
      try {
        // Проверяем существует ли объект с таким именем
        const existing = await prisma.object.findFirst({
          where: { name: obj.name }
        });

        if (existing) {
          console.log(`⏭️  Пропускаю существующий объект: ${obj.name}`);
          skipped++;
          continue;
        }

        // Определяем тип объекта
        const objectType = typeMapping[obj.type.toLowerCase()] || 'PARK';
        
        // Определяем район (сначала из поля district, потом из описания)
        let district = districtMapping[obj.district] || 'CENTRAL';
        if (obj.district === 'Не указан') {
          district = extractDistrictFromDescription(obj.description || '', obj.fullDescription || '');
        }
        
        // Определяем статус
        const status = statusMapping[obj.status.toLowerCase()] || 'ACTIVE';
        
        // Фильтруем фотографии (убираем недоступные ссылки)
        const validPhotos = (obj.photos || []).filter(photo => {
          // Убираем ссылки на volgograd.ru которые не работают
          return !photo.includes('volgograd.ru');
        });

        // Создаем новый объект
        await prisma.object.create({
          data: {
            name: obj.name,
            type: objectType,
            district: district,
            address: obj.address || 'Адрес не указан',
            description: obj.description || obj.fullDescription || 'Описание отсутствует',
            photos: JSON.stringify(validPhotos),
            yearBuilt: undefined, // В данных нет года постройки
            latitude: obj.coordinates?.lat || 48.7080, // Центр Волгограда по умолчанию
            longitude: obj.coordinates?.lng || 44.5133,
            status: status,
            source: `Парсер данных администрации Волгограда (объект №${obj.objectNumber})`
          }
        });

        console.log(`✅ Загружен: ${obj.name} (${objectType}, ${district})`);
        loaded++;
      } catch (error) {
        console.error(`❌ Ошибка при загрузке объекта "${obj.name}":`, error);
      }
    }

    console.log(`\n📈 Результат загрузки:`);
    console.log(`✅ Загружено: ${loaded} объектов`);
    console.log(`⏭️  Пропущено: ${skipped} объектов`);
    console.log(`📊 Всего в базе: ${await prisma.object.count()} объектов`);

  } catch (error) {
    console.error('❌ Ошибка при загрузке данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск если файл вызван напрямую
if (require.main === module) {
  loadParsedData();
}

export default loadParsedData; 