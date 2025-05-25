# Инструкция по настройке проекта (SQLite + Prisma)

## 🚀 Быстрый старт

### 1. Клонирование и установка зависимостей

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd digital-catalog

# Установка зависимостей бэкенда
cd back
npm install

# Установка зависимостей фронтенда
cd ../front
npm install axios react-router-dom @types/react-router-dom

# Установка зависимостей парсера
cd ../parser
npm install
```

### 2. Настройка переменных окружения

Создайте файл `back/.env`:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET=your_super_secret_jwt_key_for_digital_catalog_volgograd_2024
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Настройка базы данных SQLite

```bash
cd back

# Генерация Prisma Client
npm run db:generate

# Создание базы данных и применение схемы
npm run db:push

# Заполнение базы тестовыми данными
npx ts-node src/scripts/seed.ts
```

### 4. Запуск проекта

#### Вариант A: Тестовый сервер (рекомендуется для начала)

```bash
cd back
npx ts-node src/test-server.ts
```

#### Вариант B: Полный сервер (после исправления проблем с роутами)

```bash
cd back
npm run dev
```

#### Фронтенд:

```bash
cd front
npm run dev
```

### 5. Проверка работы

- **Тестовый сервер**: http://localhost:5000
- **API объектов**: http://localhost:5000/api/objects
- **Фронтенд**: http://localhost:5173
- **Prisma Studio**: `npm run db:studio` (в папке back)

## 📋 Структура проекта

```
digital-catalog/
├── front/                  # React фронтенд
│   ├── src/
│   │   ├── components/     # Компоненты
│   │   ├── pages/         # Страницы
│   │   ├── api/           # API запросы
│   │   ├── types/         # TypeScript типы
│   │   └── utils/         # Утилиты
│   ├── public/
│   └── package.json
├── back/                   # Node.js бэкенд
│   ├── src/
│   │   ├── controllers/   # Контроллеры API
│   │   ├── routes/        # Роуты API
│   │   ├── scripts/       # Скрипты (seed.ts)
│   │   ├── app.ts         # Express приложение
│   │   ├── index.ts       # Основной сервер
│   │   └── test-server.ts # Тестовый сервер
│   ├── prisma/
│   │   └── schema.prisma  # Схема базы данных
│   ├── dev.db            # SQLite база данных
│   ├── .env              # Переменные окружения
│   └── package.json
├── parser/                # Парсер данных
│   ├── services/
│   ├── utils/
│   ├── data/
│   └── package.json
└── docs/                  # Документация
```

## 🔧 Команды для разработки

### Бэкенд

```bash
# Разработка
npm run dev          # Запуск с hot reload (может быть проблема с роутами)
npx ts-node src/test-server.ts  # Тестовый сервер (работает стабильно)

# Сборка
npm run build        # Компиляция TypeScript
npm run start        # Запуск продакшен версии

# База данных
npm run db:generate  # Генерация Prisma Client
npm run db:push      # Применение изменений схемы
npm run db:migrate   # Создание и применение миграций
npm run db:studio    # Открытие Prisma Studio
```

### Фронтенд

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для продакшена
npm run preview      # Предпросмотр сборки
npm run lint         # Проверка кода
```

### Парсер

```bash
npm run parse        # Запуск парсера
npm run parse:dev    # Запуск в режиме разработки
```

## 🧪 Тестирование API

### Примеры запросов:

#### Получить информацию о сервере:

```bash
curl http://localhost:5000
```

**Ответ:**

```json
{
  "message": "Цифровой каталог объектов благоустройства Волгограда",
  "version": "1.0.0",
  "database": "SQLite",
  "status": "OK"
}
```

#### Получить все объекты:

```bash
curl "http://localhost:5000/api/objects"
```

#### Получить объекты по району (когда полные роуты будут работать):

```bash
curl "http://localhost:5000/api/objects?district=Центральный"
```

#### Получить статистику (когда полные роуты будут работать):

```bash
curl "http://localhost:5000/api/objects/stats"
```

## 🗄️ Работа с базой данных

### Prisma Studio

Для визуального управления базой данных:

```bash
cd back
npm run db:studio
```

Откроется веб-интерфейс по адресу http://localhost:5555

### Изменение схемы базы данных

1. Отредактируйте `back/prisma/schema.prisma`
2. Примените изменения:

```bash
npm run db:push
# или создайте миграцию:
npm run db:migrate
```

### Сброс базы данных

```bash
# Удалить базу данных и пересоздать
rm back/dev.db
npm run db:push
npx ts-node src/scripts/seed.ts
```

### Просмотр данных через SQLite CLI

```bash
# Установите sqlite3 если нужно
# Windows: скачайте с https://sqlite.org/download.html
# macOS: brew install sqlite
# Linux: sudo apt-get install sqlite3

# Просмотр данных
sqlite3 back/dev.db
.tables
SELECT * FROM objects;
.exit
```

## 🐛 Решение проблем

### ❌ Проблема: "Cannot find module '@prisma/client'"

**Решение:**

```bash
cd back
npm run db:generate
```

### ❌ Проблема: "Environment variable not found: DATABASE_URL"

**Решение:** Убедитесь, что файл `.env` создан в папке `back/` и содержит:

```env
DATABASE_URL="file:./dev.db"
```

### ❌ Проблема: "TypeError: Missing parameter name at 1"

**Описание:** Проблема с библиотекой path-to-regexp в основном сервере.

**Решение:** Используйте тестовый сервер:

```bash
cd back
npx ts-node src/test-server.ts
```

### ❌ Проблема: "Database is locked"

**Решение:**

```bash
# Остановите все процессы
pkill -f "ts-node"
# Или в Windows: Ctrl+C в терминале
npm run dev
```

### ❌ Проблема: Ошибки TypeScript в роутах

**Описание:** Конфликт типов Express 4.x и 5.x.

**Решение:** Проект настроен на Express 4.18.0. Если проблемы продолжаются:

```bash
npm install express@^4.18.0 @types/express@^4.17.0
```

### ❌ Проблема: "Cannot find module './test-server.ts'"

**Решение:** Убедитесь, что вы находитесь в папке `back`:

```bash
cd back
npx ts-node src/test-server.ts
```

## 📦 Полный список зависимостей

### Бэкенд (back/package.json)

```json
{
  "dependencies": {
    "@prisma/client": "^5.7.1",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^22.15.17",
    "@types/cors": "^2.8.17",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6",
    "prisma": "^5.7.1",
    "typescript": "^5.8.3",
    "ts-node-dev": "^2.0.0"
  }
}
```

## 🎯 Преимущества SQLite для дипломного проекта

✅ **Простота настройки** - не требует установки сервера базы данных  
✅ **Портативность** - база данных в одном файле  
✅ **Быстрая разработка** - мгновенный старт без конфигурации  
✅ **Prisma Studio** - удобный визуальный интерфейс  
✅ **Типобезопасность** - автогенерация TypeScript типов  
✅ **Миграции** - версионирование схемы базы данных  
✅ **Локальная работа** - не зависит от внешних сервисов

## 🚀 Тестовые данные

После выполнения seed скрипта в базе будет:

### Объекты (8 штук):

1. **Парк Победы** (Центральный район) - парк
2. **Сквер имени Гагарина** (Дзержинский район) - сквер
3. **Детская площадка "Солнышко"** (Ворошиловский район) - детская площадка
4. **Набережная 62-й Армии** (Центральный район) - набережная
5. **Спортивная площадка "Олимп"** (Советский район) - спортивная площадка
6. **Площадь Павших Борцов** (Центральный район) - площадь
7. **Фонтан "Искусство"** (Центральный район) - фонтан
8. **Сквер Металлургов** (Красноармейский район) - сквер

### Пользователи:

- **Администратор**: admin@volgograd.ru / admin123

### Структура данных объекта:

```json
{
  "id": "cmb3wkipt0000zjlm2yamr2s6",
  "name": "Парк Победы",
  "type": "PARK",
  "district": "CENTRAL",
  "address": "ул. Ленина, 1",
  "description": "Центральный парк города...",
  "photos": ["https://example.com/photo1.jpg"],
  "yearBuilt": 1975,
  "latitude": 48.708,
  "longitude": 44.5133,
  "status": "ACTIVE",
  "source": "Тестовые данные",
  "coordinates": {"lat": 48.708, "lng": 44.5133}
}
```

## 🎯 Следующие шаги

1. ✅ **Настройка базовой структуры**
2. ✅ **Создание схемы базы данных (Prisma)**
3. ✅ **Реализация базового API**
4. ✅ **Заполнение тестовыми данными**
5. ✅ **Тестовый сервер работает**
6. 🔄 **Исправление проблем с роутами в основном сервере**
7. 🔄 **Создание фронтенд компонентов**
8. 🔄 **Реализация парсера данных**
9. 🔄 **Добавление аутентификации**
10. 🔄 **Тестирование и отладка**
11. 🔄 **Развертывание**

## 🔍 Известные проблемы и их статус

### ⚠️ Проблема с основным сервером (src/index.ts)

- **Статус**: Не решена
- **Описание**: Ошибка "Missing parameter name" в path-to-regexp
- **Обходное решение**: Используйте тестовый сервер `src/test-server.ts`
- **Планы**: Исправить в следующих итерациях

### ✅ SQLite + Prisma

- **Статус**: Работает отлично
- **Функции**: CRUD операции, типобезопасность, Prisma Studio

### ✅ Тестовые данные

- **Статус**: Загружены и работают
- **Объем**: 8 объектов + 1 администратор

## 📞 Поддержка

Если возникают проблемы:

1. Проверьте, что все зависимости установлены
2. Убедитесь, что файл `.env` создан
3. Используйте тестовый сервер вместо основного
4. Проверьте логи в терминале
5. Используйте Prisma Studio для проверки данных

---

_Документация обновлена с учетом всех проблем и решений: Декабрь 2024_
