import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TestAdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  console.log('TestAdminPage Debug:', { user, isAdmin, userRole: user?.role });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Ошибка:</strong> Пользователь не авторизован
          <br />
          <button 
            onClick={() => navigate('/auth')}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Войти в систему
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <strong>Доступ запрещен:</strong> Требуются права администратора
          <br />
          <p>Ваша роль: {user.role}</p>
          <p>Требуется роль: ADMIN</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
        <strong>✅ Успешно!</strong> Вы вошли в админ-панель
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">🛠️ Тестовая админ-панель</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">👤 Информация о пользователе:</h3>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>isAdmin:</strong> {isAdmin ? 'Да' : 'Нет'}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold mb-2">🔧 Доступные функции:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Просмотр всех объектов</li>
              <li>Добавление новых объектов</li>
              <li>Редактирование объектов</li>
              <li>Удаление объектов</li>
              <li>Просмотр статистики</li>
            </ul>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/admin')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            🏛️ Полная админ-панель
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
          >
            🏠 На главную
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestAdminPage; 