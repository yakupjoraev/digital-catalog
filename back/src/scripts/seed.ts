import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const testObjects = [
  {
    name: 'Парк Победы',
    type: 'PARK',
    district: 'CENTRAL',
    address: 'ул. Ленина, 1',
    description: 'Центральный парк города с мемориалом воинам Великой Отечественной войны. Включает в себя аллеи, фонтаны, детские площадки и зоны отдыха.',
    photos: JSON.stringify([
      'https://example.com/park-pobedy-1.jpg',
      'https://example.com/park-pobedy-2.jpg'
    ]),
    yearBuilt: 1975,
    latitude: 48.7080,
    longitude: 44.5133,
    status: 'ACTIVE',
    source: 'Тестовые данные'
  },
  {
    name: 'Сквер имени Гагарина',
    type: 'SQUARE',
    district: 'DZERZHINSKY',
    address: 'пр. Ленина, 45',
    description: 'Небольшой уютный сквер с памятником первому космонавту. Популярное место для прогулок и отдыха жителей района.',
    photos: JSON.stringify([
      'https://example.com/gagarin-square-1.jpg'
    ]),
    yearBuilt: 1961,
    latitude: 48.7194,
    longitude: 44.5267,
    status: 'ACTIVE',
    source: 'Тестовые данные'
  },
  {
    name: 'Детская площадка "Солнышко"',
    type: 'PLAYGROUND',
    district: 'VOROSHILOVSKY',
    address: 'ул. Мира, 12',
    description: 'Современная детская площадка с безопасным покрытием, качелями, горками и спортивными элементами для детей разных возрастов.',
    photos: JSON.stringify([
      'https://example.com/playground-solnyshko-1.jpg',
      'https://example.com/playground-solnyshko-2.jpg'
    ]),
    yearBuilt: 2020,
    latitude: 48.7350,
    longitude: 44.5450,
    status: 'ACTIVE',
    source: 'Тестовые данные'
  },
  {
    name: 'Набережная 62-й Армии',
    type: 'EMBANKMENT',
    district: 'CENTRAL',
    address: 'Набережная 62-й Армии',
    description: 'Центральная набережная Волгограда протяженностью более 3 км. Место проведения городских праздников и прогулок горожан.',
    photos: JSON.stringify([
      'https://example.com/naberezhnaya-1.jpg',
      'https://example.com/naberezhnaya-2.jpg',
      'https://example.com/naberezhnaya-3.jpg'
    ]),
    yearBuilt: 1952,
    latitude: 48.7071,
    longitude: 44.5152,
    status: 'UNDER_CONSTRUCTION',
    source: 'Тестовые данные'
  },
  {
    name: 'Спортивная площадка "Олимп"',
    type: 'SPORTS_GROUND',
    district: 'SOVETSKY',
    address: 'ул. Советская, 78',
    description: 'Многофункциональная спортивная площадка с футбольным полем, баскетбольной площадкой и тренажерами под открытым небом.',
    photos: JSON.stringify([
      'https://example.com/sport-olimp-1.jpg'
    ]),
    yearBuilt: 2018,
    latitude: 48.7500,
    longitude: 44.5200,
    status: 'ACTIVE',
    source: 'Тестовые данные'
  },
  {
    name: 'Площадь Павших Борцов',
    type: 'PLAZA',
    district: 'CENTRAL',
    address: 'пл. Павших Борцов',
    description: 'Главная площадь Волгограда с Вечным огнем и мемориальными плитами. Место проведения торжественных мероприятий.',
    photos: JSON.stringify([
      'https://example.com/square-fighters-1.jpg',
      'https://example.com/square-fighters-2.jpg'
    ]),
    yearBuilt: 1963,
    latitude: 48.7067,
    longitude: 44.5175,
    status: 'ACTIVE',
    source: 'Тестовые данные'
  },
  {
    name: 'Фонтан "Искусство"',
    type: 'FOUNTAIN',
    district: 'CENTRAL',
    address: 'ул. Мира, 5',
    description: 'Декоративный фонтан с подсветкой и музыкальным сопровождением. Работает в летний период.',
    photos: JSON.stringify([
      'https://example.com/fountain-art-1.jpg'
    ]),
    yearBuilt: 2010,
    latitude: 48.7100,
    longitude: 44.5180,
    status: 'PLANNED',
    source: 'Тестовые данные'
  },
  {
    name: 'Сквер Металлургов',
    type: 'SQUARE',
    district: 'KRASNOARMEYSKY',
    address: 'ул. Металлургов, 25',
    description: 'Зеленая зона отдыха для жителей промышленного района с аллеями, скамейками и детской площадкой.',
    photos: JSON.stringify([]),
    yearBuilt: 1985,
    latitude: 48.6800,
    longitude: 44.4900,
    status: 'ACTIVE',
    source: 'Тестовые данные'
  }
];

async function seed() {
  console.log('🌱 Начинаем заполнение базы данных...');

  try {
    // Очистка существующих данных
    await prisma.object.deleteMany();
    await prisma.user.deleteMany();
    console.log('🗑️ Очистили существующие данные');

    // Добавление тестовых объектов
    for (const objectData of testObjects) {
      await prisma.object.create({
        data: objectData
      });
    }

    console.log(`✅ Добавлено ${testObjects.length} тестовых объектов`);

    // Создание тестового администратора
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);

    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@volgograd.ru',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('👤 Создан тестовый администратор (admin@volgograd.ru / admin123)');

    // Статистика
    const totalObjects = await prisma.object.count();
    const totalUsers = await prisma.user.count();

    console.log('📊 Статистика базы данных:');
    console.log(`   Объектов: ${totalObjects}`);
    console.log(`   Пользователей: ${totalUsers}`);

    // Статистика по районам
    const districtStats = await prisma.object.groupBy({
      by: ['district'],
      _count: { district: true }
    });

    console.log('📍 По районам:');
    districtStats.forEach((stat: any) => {
      console.log(`   ${stat.district}: ${stat._count.district}`);
    });

  } catch (error) {
    console.error('❌ Ошибка заполнения базы данных:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск скрипта
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 База данных успешно заполнена!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Ошибка:', error);
      process.exit(1);
    });
}

export { seed }; 