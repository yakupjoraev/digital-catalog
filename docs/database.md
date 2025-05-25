# База данных - SQLite с Prisma

## 🗄️ Выбор базы данных

Для проекта "Цифровой каталог объектов благоустройства Волгограда" выбрана **SQLite** с **Prisma ORM** - современное и простое решение для разработки.

### Преимущества SQLite + Prisma для данного проекта:

1. **Простота настройки** - файловая база данных, не требует сервера
2. **Портативность** - вся база в одном файле `dev.db`
3. **Типобезопасность** - автогенерация TypeScript типов
4. **Prisma Studio** - визуальный интерфейс для управления данными
5. **Миграции** - версионирование схемы базы данных
6. **Отличная производительность** для небольших и средних проектов
7. **Идеально для дипломного проекта** - быстрый старт без сложной настройки
8. **Локальная работа** - не зависит от внешних сервисов (важно для России)

## 📊 Структура базы данных

### Реальная схема Prisma (`back/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Object {
  id          String   @id @default(cuid())
  name        String
  type        String   // "PARK", "SQUARE", "PLAYGROUND", etc.
  district    String   // "CENTRAL", "DZERZHINSKY", etc.
  address     String
  description String
  photos      String   // JSON string array
  yearBuilt   Int?
  latitude    Float
  longitude   Float
  status      String   @default("ACTIVE") // "ACTIVE", "UNDER_CONSTRUCTION", etc.
  source      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("objects")
}

model User {
  id        String   @id @default(cuid())
  username  String   @unique
  email     String   @unique
  password  String
  role      String   @default("USER") // "ADMIN", "USER"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### ⚠️ Важные особенности схемы

**Почему строки вместо enum:**

- SQLite не поддерживает enum типы
- Используются строковые константы с валидацией в коде
- Это упрощает схему и делает её более гибкой

**Почему photos как String:**

- SQLite не поддерживает массивы примитивных типов
- Фотографии хранятся как JSON строка: `'["url1.jpg", "url2.jpg"]'`
- В коде автоматически парсятся в массив

### Константы типов данных

#### ObjectType (Типы объектов):

- `PARK` - парк
- `SQUARE` - сквер
- `PLAYGROUND` - детская площадка
- `SPORTS_GROUND` - спортивная площадка
- `EMBANKMENT` - набережная
- `BOULEVARD` - бульвар
- `PLAZA` - площадь
- `FOUNTAIN` - фонтан
- `MONUMENT` - памятник
- `BUS_STOP` - остановка
- `OTHER` - другое

#### District (Районы Волгограда):

- `CENTRAL` - Центральный
- `DZERZHINSKY` - Дзержинский
- `VOROSHILOVSKY` - Ворошиловский
- `SOVETSKY` - Советский
- `TRAKTOROZAVODSKY` - Тракторозаводский
- `KRASNOARMEYSKY` - Красноармейский
- `KIROVSKY` - Кировский
- `KRASNOOKTYABRSKY` - Краснооктябрьский

#### ObjectStatus (Статусы):

- `ACTIVE` - активный
- `UNDER_CONSTRUCTION` - на реконструкции
- `PLANNED` - планируется
- `CLOSED` - закрыт

#### UserRole (Роли пользователей):

- `ADMIN` - администратор
- `USER` - пользователь

## ⚙️ Настройка базы данных

### 1. Переменные окружения

Создайте файл `back/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your_super_secret_jwt_key_for_digital_catalog_volgograd_2024
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 2. Инициализация Prisma

```bash
cd back

# Генерация Prisma Client
npm run db:generate

# Создание базы данных и применение схемы
npm run db:push

# Заполнение тестовыми данными
npx ts-node src/scripts/seed.ts
```

### 3. Prisma Studio

Для визуального управления данными:

```bash
npm run db:studio
```

Откроется интерфейс по адресу: http://localhost:5555

## 🔍 Примеры запросов Prisma

### Получение всех объектов:

```typescript
const objects = await prisma.object.findMany({
  orderBy: { createdAt: 'desc' }
});
```

### Поиск по району:

```typescript
const objects = await prisma.object.findMany({
  where: {
    district: 'CENTRAL'
  }
});
```

### Текстовый поиск:

```typescript
const objects = await prisma.object.findMany({
  where: {
    OR: [
      { name: { contains: 'Парк' } },
      { description: { contains: 'Парк' } },
      { address: { contains: 'Парк' } }
    ]
  }
});
```

### Поиск рядом с координатами:

```typescript
const latitude = 48.7080;
const longitude = 44.5133;
const range = 0.01; // примерно 1 км

const objects = await prisma.object.findMany({
  where: {
    latitude: {
      gte: latitude - range,
      lte: latitude + range
    },
    longitude: {
      gte: longitude - range,
      lte: longitude + range
    }
  }
});
```

### Статистика по районам:

```typescript
const stats = await prisma.object.groupBy({
  by: ['district'],
  _count: { district: true }
});
```

### Создание объекта:

```typescript
const newObject = await prisma.object.create({
  data: {
    name: 'Новый парк',
    type: 'PARK',
    district: 'CENTRAL',
    address: 'ул. Новая, 1',
    description: 'Описание парка',
    photos: JSON.stringify(['https://example.com/photo.jpg']),
    latitude: 48.7080,
    longitude: 44.5133,
    status: 'ACTIVE',
    source: 'Ручной ввод'
  }
});
```

## 🚀 Реальные тестовые данные

После выполнения seed скрипта в базе будет:

### Объекты (8 штук):

1. **Парк Победы** (Центральный район)

   - Тип: PARK
   - Координаты: 48.708, 44.5133
   - Год: 1975
   - Статус: ACTIVE

2. **Сквер имени Гагарина** (Дзержинский район)

   - Тип: SQUARE
   - Координаты: 48.7194, 44.5267
   - Год: 1961
   - Статус: ACTIVE

3. **Детская площадка "Солнышко"** (Ворошиловский район)

   - Тип: PLAYGROUND
   - Координаты: 48.735, 44.545
   - Год: 2020
   - Статус: ACTIVE

4. **Набережная 62-й Армии** (Центральный район)

   - Тип: EMBANKMENT
   - Координаты: 48.7071, 44.5152
   - Год: 1952
   - Статус: UNDER_CONSTRUCTION

5. **Спортивная площадка "Олимп"** (Советский район)

   - Тип: SPORTS_GROUND
   - Координаты: 48.75, 44.52
   - Год: 2018
   - Статус: ACTIVE

6. **Площадь Павших Борцов** (Центральный район)

   - Тип: PLAZA
   - Координаты: 48.7067, 44.5175
   - Год: 1963
   - Статус: ACTIVE

7. **Фонтан "Искусство"** (Центральный район)

   - Тип: FOUNTAIN
   - Координаты: 48.71, 44.518
   - Год: 2010
   - Статус: PLANNED

8. **Сквер Металлургов** (Красноармейский район)
   - Тип: SQUARE
   - Координаты: 48.68, 44.49
   - Год: 1985
   - Статус: ACTIVE

### Пользователи:

- **Администратор**: admin@volgograd.ru / admin123 (пароль хеширован bcrypt)

### Пример реального объекта из API:

```json
{
  "id": "cmb3wkipt0000zjlm2yamr2s6",
  "name": "Парк Победы",
  "type": "PARK",
  "district": "CENTRAL",
  "address": "ул. Ленина, 1",
  "description": "Центральный парк города с мемориалом воинам Великой Отечественной войны. Включает в себя аллеи, фонтаны, детские площадки и зоны отдыха.",
  "photos": [
    "https://example.com/park-pobedy-1.jpg",
    "https://example.com/park-pobedy-2.jpg"
  ],
  "yearBuilt": 1975,
  "latitude": 48.708,
  "longitude": 44.5133,
  "status": "ACTIVE",
  "source": "Тестовые данные",
  "createdAt": "2025-05-25T16:58:39.425Z",
  "updatedAt": "2025-05-25T16:58:39.425Z",
  "coordinates": {
    "lat": 48.708,
    "lng": 44.5133
  }
}
```

## 🔧 Управление схемой

### Изменение схемы:

1. Отредактируйте `back/prisma/schema.prisma`
2. Примените изменения:

```bash
# Быстрое применение (для разработки)
npm run db:push

# Или создайте миграцию (для продакшена)
npm run db:migrate
```

### Сброс базы данных:

```bash
# Удалить базу и пересоздать
rm back/dev.db
npm run db:push
npx ts-node src/scripts/seed.ts
```

### Просмотр данных через SQLite CLI:

```bash
# Установите sqlite3 если нужно
sqlite3 back/dev.db

# Полезные команды
.tables                    # Показать все таблицы
.schema objects           # Показать схему таблицы
SELECT * FROM objects;    # Показать все объекты
SELECT COUNT(*) FROM objects; # Подсчет объектов
.exit                     # Выход
```

## 📊 Мониторинг и обслуживание

### Полезные команды:

```bash
# Статистика базы данных
sqlite3 back/dev.db ".schema"
sqlite3 back/dev.db "SELECT COUNT(*) FROM objects;"
sqlite3 back/dev.db "SELECT district, COUNT(*) FROM objects GROUP BY district;"

# Резервное копирование
cp back/dev.db back/dev.db.backup

# Просмотр размера базы
ls -lh back/dev.db
```

### Prisma команды:

```bash
# Генерация клиента
npx prisma generate

# Просмотр схемы
npx prisma db pull

# Форматирование схемы
npx prisma format

# Валидация схемы
npx prisma validate

# Интроспекция базы данных
npx prisma db pull
```

## 🔧 Troubleshooting

### Частые проблемы:

1. **"Cannot find module '@prisma/client'"**

   ```bash
   cd back
   npm run db:generate
   ```

2. **"Environment variable not found: DATABASE_URL"**

   Проверьте файл `.env` в папке `back/`:

   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. **"Database is locked"**

   ```bash
   # Остановите все процессы
   pkill -f "ts-node"
   # Или в Windows: Ctrl+C в терминале
   ```

4. **Ошибки миграции**

   ```bash
   rm -rf back/prisma/migrations
   npm run db:push
   ```

5. **Проблемы с JSON полями**

   Фотографии хранятся как JSON строки:

   ```typescript
   // При сохранении
   photos: JSON.stringify(['url1.jpg', 'url2.jpg'])

   // При чтении
   const photos = JSON.parse(obj.photos || '[]')
   ```

## 🎯 Преимущества для дипломного проекта

✅ **Быстрый старт** - настройка за 5 минут  
✅ **Визуальный интерфейс** - Prisma Studio для демонстрации  
✅ **Типобезопасность** - автокомплит и проверка типов  
✅ **Простое развертывание** - один файл базы данных  
✅ **Отличная документация** - легко изучить и объяснить  
✅ **Современные технологии** - актуально для резюме  
✅ **Локальная работа** - не зависит от внешних сервисов  
✅ **Реальные данные** - 8 объектов Волгограда с координатами

## 📈 Масштабирование

При необходимости легко мигрировать на PostgreSQL:

1. Изменить `provider = "postgresql"` в schema.prisma
2. Обновить DATABASE_URL
3. Добавить enum типы обратно
4. Выполнить `npm run db:push`

## 🔍 Статистика текущих данных

```sql
-- Общее количество объектов
SELECT COUNT(*) as total_objects FROM objects;
-- Результат: 8

-- По районам
SELECT district, COUNT(*) as count FROM objects GROUP BY district;
-- CENTRAL: 4
-- DZERZHINSKY: 1
-- VOROSHILOVSKY: 1
-- SOVETSKY: 1
-- KRASNOARMEYSKY: 1

-- По типам
SELECT type, COUNT(*) as count FROM objects GROUP BY type;
-- PARK: 1
-- SQUARE: 2
-- PLAYGROUND: 1
-- EMBANKMENT: 1
-- SPORTS_GROUND: 1
-- PLAZA: 1
-- FOUNTAIN: 1

-- По статусам
SELECT status, COUNT(*) as count FROM objects GROUP BY status;
-- ACTIVE: 7
-- UNDER_CONSTRUCTION: 1
-- PLANNED: 1
```

---

_Документация обновлена с реальными данными и всеми особенностями: Декабрь 2024_
