import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { app } from './app';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Инициализация Prisma Client
export const prisma = new PrismaClient();

// Подключение к базе данных
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Подключение к SQLite базе данных успешно');
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Запуск сервера
async function startServer() {
  await connectDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📍 API доступно по адресу: http://localhost:${PORT}/api`);
    console.log(`🗄️ База данных: SQLite (${process.env.DATABASE_URL})`);
  });
}

startServer().catch((error) => {
  console.error('❌ Ошибка запуска сервера:', error);
  process.exit(1);
});
