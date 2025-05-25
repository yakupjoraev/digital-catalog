import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Базовый роут
app.get('/', (req, res) => {
  res.json({
    message: 'Цифровой каталог объектов благоустройства Волгограда',
    version: '1.0.0',
    database: 'SQLite',
    status: 'OK'
  });
});

// Тестовый роут для получения объектов
app.get('/api/objects', async (req, res) => {
  try {
    const objects = await prisma.object.findMany({
      take: 10
    });

    // Преобразование для отображения
    const transformedObjects = objects.map((obj: any) => ({
      ...obj,
      photos: obj.photos ? JSON.parse(obj.photos) : [],
      coordinates: {
        lat: obj.latitude,
        lng: obj.longitude
      }
    }));

    res.json({
      success: true,
      data: transformedObjects,
      count: objects.length
    });
  } catch (error) {
    console.error('Ошибка получения объектов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения объектов'
    });
  }
});

// Запуск сервера
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Подключение к SQLite базе данных успешно');
    
    app.listen(PORT, () => {
      console.log(`🚀 Тестовый сервер запущен на порту ${PORT}`);
      console.log(`📍 API доступно по адресу: http://localhost:${PORT}`);
      console.log(`🗄️ База данных: SQLite (${process.env.DATABASE_URL})`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

startServer(); 