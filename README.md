# 🏛️ Цифровой каталог объектов благоустройства Волгограда

Дипломный проект - веб-приложение для каталогизации и поиска объектов благоустройства общественных пространств города Волгограда.

## 📋 Описание проекта

Система предназначена для:

- Каталогизации объектов благоустройства (парки, скверы, площадки, набережные и др.)
- Отображения объектов на интерактивной карте
- Поиска и фильтрации по районам, типам и статусам
- Управления данными через административную панель
- Парсинга данных из внешних источников

## 🏗️ Архитектура

```
digital-catalog/
├── front/          # React фронтенд
├── back/           # Node.js бэкенд с Express
├── parser/         # Парсер данных
└── docs/           # Документация
```

## 🚀 Технологический стек

### Frontend

- **React 19** + TypeScript
- **Tailwind CSS** для стилизации
- **Vite** как сборщик
- **React Router** для маршрутизации

### Backend

- **Node.js** + Express + TypeScript
- **Prisma ORM** для работы с БД
- **SQLite** как база данных
- **CORS** для кросс-доменных запросов

### База данных

- **SQLite** - легковесная встроенная БД
- **Prisma** - современная ORM с типизацией

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- npm или yarn
- Git

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-username/digital-catalog.git
cd digital-catalog
```

### 2. Запуск бэкенда

```bash
cd back
npm install
npm run db:generate
npm run db:migrate
npx ts-node src/scripts/seed.ts
npm run dev
```

Бэкенд будет доступен на: http://localhost:5000

### 3. Запуск фронтенда

```bash
cd front
npm install
npm run dev
```

Фронтенд будет доступен на: http://localhost:5174

### 4. Проверка работы

- Откройте http://localhost:5174 в браузере
- Вы должны увидеть каталог с 8 тестовыми объектами
- Попробуйте фильтры и поиск

## 📊 Данные

### Типы объектов

- 🌳 Парки
- 🌿 Скверы
- 🎠 Детские площадки
- ⚽ Спортивные площадки
- 🌊 Набережные
- ⛲ Фонтаны
- 🏛️ Площади
- 🗿 Памятники

### Районы Волгограда

- Центральный
- Дзержинский
- Ворошиловский
- Советский
- Тракторозаводский
- Красноармейский
- Кировский
- Краснооктябрьский

### Статусы объектов

- ✅ Активный
- 🚧 На реконструкции
- 📋 Планируется
- ❌ Закрыт

## 🔧 API Endpoints

### Объекты

- `GET /api/objects` - список всех объектов
- `GET /api/objects/:id` - объект по ID
- `POST /api/objects` - создание объекта (админ)
- `PUT /api/objects/:id` - обновление объекта (админ)
- `DELETE /api/objects/:id` - удаление объекта (админ)
- `GET /api/objects/stats` - статистика
- `GET /api/objects/nearby` - поиск рядом с координатами

### Фильтрация и поиск

```
GET /api/objects?district=CENTRAL&type=PARK&search=парк&status=ACTIVE
```

## 🗄️ База данных

### Схема данных

```sql
-- Объекты благоустройства
CREATE TABLE Object (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type ObjectType NOT NULL,
  district District NOT NULL,
  address TEXT NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[],
  yearBuilt INTEGER,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  status ObjectStatus NOT NULL,
  source TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Пользователи
CREATE TABLE User (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role UserRole DEFAULT 'USER',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📁 Структура проекта

```
digital-catalog/
├── back/                   # Бэкенд
│   ├── src/
│   │   ├── controllers/    # Контроллеры API
│   │   ├── routes/         # Маршруты
│   │   ├── middleware/     # Промежуточное ПО
│   │   ├── scripts/        # Скрипты (seed, migrate)
│   │   └── server.ts       # Главный файл сервера
│   ├── prisma/
│   │   ├── schema.prisma   # Схема БД
│   │   └── migrations/     # Миграции
│   └── package.json
├── front/                  # Фронтенд
│   ├── src/
│   │   ├── api/           # API клиенты
│   │   ├── components/    # React компоненты
│   │   ├── types/         # TypeScript типы
│   │   ├── App.tsx        # Главный компонент
│   │   └── main.tsx       # Точка входа
│   └── package.json
├── parser/                 # Парсер данных
│   ├── src/
│   │   ├── parsers/       # Парсеры сайтов
│   │   ├── utils/         # Утилиты
│   │   └── index.ts       # Главный файл
│   └── package.json
├── docs/                   # Документация
│   ├── database.md        # Документация БД
│   ├── setup.md           # Инструкции по настройке
│   └── diploma.md         # Структура диплома
└── README.md              # Этот файл
```

## 🧪 Тестирование

### Тестовые данные

В базе данных создается 8 тестовых объектов:

1. Парк Победы (Центральный район)
2. Сквер имени Гагарина (Дзержинский район)
3. Детская площадка "Солнышко" (Ворошиловский район)
4. Набережная 62-й Армии (Центральный район)
5. Спортивная площадка "Олимп" (Советский район)
6. Площадь Павших Борцов (Центральный район)
7. Фонтан "Искусство" (Центральный район)
8. Сквер Металлургов (Красноармейский район)

### Проверка API

```bash
# Получить все объекты
curl http://localhost:5000/api/objects

# Получить статистику
curl http://localhost:5000/api/objects/stats

# Фильтрация по району
curl "http://localhost:5000/api/objects?district=CENTRAL"

# Поиск по названию
curl "http://localhost:5000/api/objects?search=парк"
```

## 🚀 Развертывание

### Локальное развертывание

1. Клонируйте репозиторий
2. Установите зависимости для бэкенда и фронтенда
3. Запустите миграции БД и заполните тестовыми данными
4. Запустите бэкенд и фронтенд

### Продакшен

1. **Бэкенд**: можно развернуть на Heroku, Railway, или VPS
2. **Фронтенд**: можно развернуть на Vercel, Netlify, или GitHub Pages
3. **База данных**: для продакшена рекомендуется PostgreSQL

## 📚 Документация

- [Настройка проекта](docs/setup.md)
- [Документация БД](docs/database.md)
- [Структура диплома](docs/diploma.md)

## 🎯 Особенности реализации

### Почему SQLite?

- **Простота**: не требует установки отдельного сервера БД
- **Портативность**: база данных в одном файле
- **Производительность**: достаточна для дипломного проекта
- **Совместимость**: легко мигрировать на PostgreSQL при необходимости

### Архитектурные решения

- **Prisma ORM**: типобезопасность и удобство работы с БД
- **TypeScript**: полная типизация фронтенда и бэкенда
- **Модульная структура**: легко расширять и поддерживать
- **REST API**: стандартный подход для веб-приложений

## 🔧 Разработка

### Добавление новых типов объектов

1. Обновите enum `ObjectType` в `back/prisma/schema.prisma`
2. Создайте миграцию: `npx prisma migrate dev`
3. Обновите типы в `front/src/types/index.ts`
4. Добавьте лейблы в `OBJECT_TYPE_LABELS`

### Добавление новых районов

1. Обновите enum `District` в схеме Prisma
2. Создайте миграцию
3. Обновите типы и лейблы во фронтенде

## 📄 Лицензия

Дипломный проект - 2024

## 👨‍💻 Автор

Дипломный проект по специальности "Информационные системы и технологии"

---

**Статус проекта**: ✅ Готов к защите

**Последнее обновление**: 25 мая 2024
