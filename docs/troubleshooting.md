# Руководство по устранению неполадок

## 🚨 Основные проблемы и решения

### ❌ Проблема: "TypeError: Missing parameter name at 1"

**Описание:** Ошибка в основном сервере при запуске `npm run dev`

```
TypeError: Missing parameter name at 1: https://git.new/pathToRegexpError
    at name (C:\Users\yakup\Documents\GitHub\digital-catalog\back\node_modules\path-to-regexp\src\index.ts:153:13)
```

**Причина:** Конфликт версий Express и path-to-regexp библиотеки

**Решение:**

```bash
# Используйте тестовый сервер вместо основного
cd back
npx ts-node src/test-server.ts
```

**Альтернативное решение:**

```bash
# Откат на Express 4.x
npm install express@^4.18.0 @types/express@^4.17.0
```

---

### ❌ Проблема: "Cannot find module '@prisma/client'"

**Описание:** Prisma Client не сгенерирован

**Решение:**

```bash
cd back
npm run db:generate
```

**Если проблема продолжается:**

```bash
npm install @prisma/client
npm run db:generate
```

---

### ❌ Проблема: "Environment variable not found: DATABASE_URL"

**Описание:** Отсутствует файл .env или неправильная конфигурация

**Решение:** Создайте файл `back/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your_super_secret_jwt_key_for_digital_catalog_volgograd_2024
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

### ❌ Проблема: "Cannot find module './routes/objectRoutes'"

**Описание:** Ошибки импорта в основном сервере

**Решение:** Используйте тестовый сервер:

```bash
cd back
npx ts-node src/test-server.ts
```

---

### ❌ Проблема: "Database is locked"

**Описание:** SQLite база заблокирована другим процессом

**Решение:**

```bash
# Windows
taskkill /f /im node.exe
# или просто Ctrl+C в терминале

# Linux/macOS
pkill -f "ts-node"

# Затем перезапустите
cd back
npx ts-node src/test-server.ts
```

---

### ❌ Проблема: "Cannot find module './test-server.ts'"

**Описание:** Неправильная директория для запуска

**Решение:**

```bash
# Убедитесь, что вы в папке back
cd back
npx ts-node src/test-server.ts
```

---

### ❌ Проблема: Ошибки TypeScript в контроллерах

**Описание:** Конфликт типов Express

**Решение:** Контроллеры уже исправлены с типом `Promise<void>`:

```typescript
export const getObjects = async (req: Request, res: Response): Promise<void> => {
  // ... код
};
```

---

### ❌ Проблема: "Parameter 'obj' implicitly has an 'any' type"

**Описание:** TypeScript ошибка в test-server.ts

**Решение:** Добавьте типизацию:

```typescript
const transformedObjects = objects.map((obj: any) => ({
  ...obj,
  photos: obj.photos ? JSON.parse(obj.photos) : [],
  coordinates: {
    lat: obj.latitude,
    lng: obj.longitude
  }
}));
```

---

## 🔧 Диагностика проблем

### Проверка состояния проекта

```bash
# 1. Проверьте, что вы в правильной директории
pwd
# Должно быть: /path/to/digital-catalog

# 2. Проверьте структуру папок
ls -la
# Должны быть: back/, front/, parser/, docs/

# 3. Проверьте зависимости бэкенда
cd back && npm list --depth=0

# 4. Проверьте файл .env
cat .env

# 5. Проверьте базу данных
ls -la dev.db
```

### Проверка базы данных

```bash
cd back

# Проверьте подключение к базе
npx prisma db pull

# Проверьте данные
sqlite3 dev.db "SELECT COUNT(*) FROM objects;"

# Откройте Prisma Studio
npm run db:studio
```

### Проверка сервера

```bash
cd back

# Тестовый сервер
npx ts-node src/test-server.ts

# В другом терминале проверьте API
curl http://localhost:5000
curl http://localhost:5000/api/objects
```

## 🚀 Пошаговое восстановление

### Если ничего не работает:

```bash
# 1. Остановите все процессы
pkill -f "ts-node" # Linux/macOS
# или Ctrl+C в Windows

# 2. Очистите node_modules
cd back
rm -rf node_modules package-lock.json
npm install

# 3. Пересоздайте базу данных
rm dev.db
npm run db:generate
npm run db:push
npx ts-node src/scripts/seed.ts

# 4. Запустите тестовый сервер
npx ts-node src/test-server.ts
```

## 📊 Проверка работоспособности

### Тесты API

```bash
# Базовый endpoint
curl http://localhost:5000
# Ожидаемый ответ: {"message": "Цифровой каталог...", "status": "OK"}

# Получение объектов
curl http://localhost:5000/api/objects
# Ожидаемый ответ: {"success": true, "data": [...], "count": 8}
```

### Проверка данных

```bash
# Подключитесь к базе
sqlite3 back/dev.db

# Проверьте таблицы
.tables
# Ожидаемый результат: objects users

# Проверьте данные
SELECT COUNT(*) FROM objects;
# Ожидаемый результат: 8

SELECT name FROM objects LIMIT 3;
# Ожидаемый результат: Парк Победы, Сквер имени Гагарина, ...

.exit
```

## 🔍 Логи и отладка

### Включение подробных логов

```bash
# Запуск с отладкой
DEBUG=* npx ts-node src/test-server.ts

# Или только Prisma логи
DATABASE_URL="file:./dev.db?connection_limit=1&socket_timeout=3" npx ts-node src/test-server.ts
```

### Проверка логов

Обращайте внимание на:

- ✅ "Подключение к SQLite базе данных успешно"
- ✅ "Тестовый сервер запущен на порту 5000"
- ❌ Любые ошибки с "Error:" или "TypeError:"

## 🛠️ Инструменты для диагностики

### Prisma Studio

```bash
cd back
npm run db:studio
# Откроется http://localhost:5555
```

### SQLite Browser

- Скачайте DB Browser for SQLite
- Откройте файл `back/dev.db`
- Просмотрите таблицы и данные

### Postman/Insomnia

Тестируйте API endpoints:

- GET http://localhost:5000
- GET http://localhost:5000/api/objects

## 📞 Получение помощи

### Информация для отчета о проблеме:

```bash
# Версии
node --version
npm --version

# Операционная система
uname -a  # Linux/macOS
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"  # Windows

# Структура проекта
find . -name "*.ts" -o -name "*.js" -o -name "package.json" | head -20

# Логи ошибок
# Скопируйте полный вывод ошибки из терминала
```

### Контрольный список:

- [ ] Файл `.env` создан в папке `back/`
- [ ] Зависимости установлены (`npm install`)
- [ ] Prisma Client сгенерирован (`npm run db:generate`)
- [ ] База данных создана (`npm run db:push`)
- [ ] Тестовые данные загружены (`npx ts-node src/scripts/seed.ts`)
- [ ] Используется тестовый сервер (`npx ts-node src/test-server.ts`)
- [ ] Порт 5000 свободен
- [ ] API отвечает на запросы

---

_Руководство по устранению неполадок: Декабрь 2024_
