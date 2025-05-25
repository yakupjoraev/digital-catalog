import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import objectRoutes from './routes/objectRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Роуты
app.use('/api/objects', objectRoutes);
app.use('/api/auth', authRoutes);

// Базовый роут
app.get('/', (req, res) => {
  res.json({
    message: 'Цифровой каталог объектов благоустройства Волгограда',
    version: '1.0.0',
    database: 'SQLite',
    endpoints: {
      objects: '/api/objects',
      auth: '/api/auth'
    }
  });
});

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint не найден'
  });
});

// Обработка ошибок
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Ошибка сервера:', error);
  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера'
  });
});

export { app };
