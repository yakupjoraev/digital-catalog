import express from 'express';

const router = express.Router();

// Базовые роуты аутентификации (заглушки)
router.post('/login', (req, res) => {
  res.json({
    success: false,
    message: 'Аутентификация пока не реализована'
  });
});

router.post('/register', (req, res) => {
  res.json({
    success: false,
    message: 'Регистрация пока не реализована'
  });
});

router.get('/profile', (req, res) => {
  res.json({ message: 'Profile endpoint - в разработке' });
});

export default router; 