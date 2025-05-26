import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import HomePage from './pages/HomePage';
import TestAdminPage from './pages/TestAdminPage';

// Компонент заголовка
const Header: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  
  // Отладочная информация (можно удалить позже)
  console.log('Header Debug:', { user, isAdmin, userRole: user?.role });

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <Link to="/" className="block hover:text-blue-200 transition-colors">
              <h1 className="text-3xl font-bold">
                🏛️ Цифровой каталог объектов благоустройства
              </h1>
              <p className="text-blue-100 mt-2">
                Волгоград • Парки • Скверы • Площадки • Набережные
              </p>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm">
                  👤 {user.username}
                  {isAdmin && <span className="ml-1 text-yellow-300">(Админ)</span>}
                </span>
                {isAdmin && (
                  <>
                    <Link
                      to="/test-admin"
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-600"
                    >
                      🧪 Информация
                    </Link>
                    <Link
                      to="/admin"
                      className="bg-yellow-500 text-black px-3 py-1 rounded text-sm font-medium hover:bg-yellow-400"
                    >
                      🛠️ Админ-панель
                    </Link>
                  </>
                )}
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                >
                  🚪 Выйти
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="bg-green-500 text-white px-4 py-2 rounded font-medium hover:bg-green-600"
              >
                🔐 Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Основной компонент приложения
const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/test-admin" element={<TestAdminPage />} />
      </Routes>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">
            🏛️ Цифровой каталог объектов благоустройства Волгограда
          </p>
          <p className="text-gray-400 text-sm">
            Дипломный проект • 2024 • SQLite + Prisma + React + TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
};

// Главный компонент с провайдерами
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
