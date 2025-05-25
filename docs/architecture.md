# Архитектура проекта

## 🏗️ Общая архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │◄──►│     Backend     │◄──►│    Database     │
│   React + TS    │    │  Node.js + TS   │    │  SQLite + Prisma│
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │                 │
                       │     Parser      │
                       │   Node.js + TS  │
                       │                 │
                       └─────────────────┘
```

## 📦 Компоненты системы

### Frontend (React + TypeScript)

- **Технологии**: React 18, TypeScript, Vite, Tailwind CSS
- **Назначение**: Пользовательский интерфейс
- **Порт**: 5173 (dev)

### Backend (Node.js + Express)

- **Технологии**: Node.js, Express, TypeScript, Prisma
- **Назначение**: API сервер, бизнес-логика
- **Порт**: 5000

### Database (SQLite + Prisma)

- **Технологии**: SQLite, Prisma ORM
- **Назначение**: Хранение данных
- **Файл**: `back/dev.db`

### Parser (Node.js)

- **Технологии**: Node.js, TypeScript, Cheerio
- **Назначение**: Сбор данных из внешних источников

## 🗂️ Структура файлов

```
digital-catalog/
├── back/                           # Backend сервер
│   ├── src/
│   │   ├── controllers/            # Контроллеры API
│   │   │   └── objectController.ts # CRUD операции объектов
│   │   ├── routes/                 # Роуты API
│   │   │   ├── objectRoutes.ts     # Роуты объектов
│   │   │   └── authRoutes.ts       # Роуты аутентификации
│   │   ├── scripts/                # Утилиты и скрипты
│   │   │   └── seed.ts             # Заполнение БД тестовыми данными
│   │   ├── app.ts                  # Express приложение
│   │   ├── index.ts                # Основной сервер (проблемы с роутами)
│   │   └── test-server.ts          # Тестовый сервер (работает)
│   ├── prisma/
│   │   └── schema.prisma           # Схема базы данных
│   ├── dev.db                      # SQLite база данных
│   ├── .env                        # Переменные окружения
│   └── package.json                # Зависимости backend
├── front/                          # Frontend приложение
│   ├── src/
│   │   ├── components/             # React компоненты
│   │   ├── pages/                  # Страницы приложения
│   │   ├── api/                    # API клиент
│   │   ├── types/                  # TypeScript типы
│   │   └── utils/                  # Утилиты
│   ├── public/                     # Статические файлы
│   └── package.json                # Зависимости frontend
├── parser/                         # Парсер данных
│   ├── src/
│   │   ├── services/               # Сервисы парсинга
│   │   ├── utils/                  # Утилиты парсера
│   │   └── data/                   # Собранные данные
│   └── package.json                # Зависимости парсера
└── docs/                           # Документация
    ├── setup.md                    # Инструкция по настройке
    ├── database.md                 # Документация БД
    ├── troubleshooting.md          # Устранение неполадок
    └── architecture.md             # Архитектура (этот файл)
```

## 🔄 Поток данных

### 1. Пользовательские запросы

```
User → Frontend → API Request → Backend → Database → Response → Frontend → User
```

### 2. Административные операции

```
Admin → Frontend → Auth → Backend → Validation → Database → Response
```

### 3. Парсинг данных

```
External Sources → Parser → Data Processing → Backend API → Database
```

## 🗄️ Модель данных

### Object (Объекты благоустройства)

```typescript
{
  id: string;           // Уникальный идентификатор
  name: string;         // Название объекта
  type: string;         // Тип (PARK, SQUARE, PLAYGROUND, etc.)
  district: string;     // Район (CENTRAL, DZERZHINSKY, etc.)
  address: string;      // Адрес
  description: string;  // Описание
  photos: string;       // JSON массив URL фотографий
  yearBuilt?: number;   // Год постройки
  latitude: number;     // Широта
  longitude: number;    // Долгота
  status: string;       // Статус (ACTIVE, UNDER_CONSTRUCTION, etc.)
  source: string;       // Источник данных
  createdAt: Date;      // Дата создания
  updatedAt: Date;      // Дата обновления
}
```

### User (Пользователи)

```typescript
{
  id: string;           // Уникальный идентификатор
  username: string;     // Имя пользователя
  email: string;        // Email
  password: string;     // Хешированный пароль
  role: string;         // Роль (ADMIN, USER)
  createdAt: Date;      // Дата создания
  updatedAt: Date;      // Дата обновления
}
```

## 🔌 API Endpoints

### Объекты благоустройства

- `GET /api/objects` - Получить все объекты (с фильтрацией)
- `GET /api/objects/:id` - Получить объект по ID
- `POST /api/objects` - Создать объект (только админ)
- `PUT /api/objects/:id` - Обновить объект (только админ)
- `DELETE /api/objects/:id` - Удалить объект (только админ)
- `GET /api/objects/stats` - Статистика объектов
- `GET /api/objects/nearby` - Поиск объектов рядом

### Аутентификация

- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация
- `GET /api/auth/profile` - Профиль пользователя

## 🔧 Технические решения

### Почему SQLite?

1. **Простота развертывания** - один файл базы данных
2. **Локальная работа** - не зависит от внешних сервисов
3. **Быстрая разработка** - мгновенный старт
4. **Портативность** - легко переносить между средами

### Почему Prisma?

1. **Типобезопасность** - автогенерация TypeScript типов
2. **Миграции** - версионирование схемы БД
3. **Prisma Studio** - визуальный интерфейс для БД
4. **Современный ORM** - удобный API для работы с данными

### Почему тестовый сервер?

1. **Обход проблем** - основной сервер имеет проблемы с роутами
2. **Быстрый старт** - минимальная настройка
3. **Стабильность** - работает без ошибок
4. **Простота** - легко понять и модифицировать

## 🚀 Развертывание

### Development

```bash
# Backend
cd back && npx ts-node src/test-server.ts

# Frontend
cd front && npm run dev

# Database
cd back && npm run db:studio
```

### Production

```bash
# Backend
cd back && npm run build && npm start

# Frontend
cd front && npm run build

# Database
# Миграция на PostgreSQL (опционально)
```

## 🔍 Мониторинг и отладка

### Логирование

- Console.log в development
- Структурированные логи в production

### Инструменты отладки

- **Prisma Studio** - визуальная работа с БД
- **SQLite Browser** - просмотр данных
- **Postman/Insomnia** - тестирование API

### Метрики

- Количество объектов в БД
- Время ответа API
- Ошибки сервера

## 🔒 Безопасность

### Аутентификация

- JWT токены
- Хеширование паролей (bcrypt)
- Роли пользователей (ADMIN, USER)

### Валидация

- Проверка входных данных
- Санитизация SQL запросов (Prisma)
- CORS настройки

## 📈 Масштабирование

### Горизонтальное масштабирование

- Несколько инстансов backend
- Load balancer
- CDN для статических файлов

### Вертикальное масштабирование

- Увеличение ресурсов сервера
- Оптимизация запросов к БД
- Кеширование (Redis)

### Миграция БД

```prisma
// Переход на PostgreSQL
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

_Документация по архитектуре: Декабрь 2024_
