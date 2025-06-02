import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { ObjectData, ObjectType, District, ObjectStatus } from '../types';

const AdminPage: React.FC = () => {
  const { user, isAdmin, token } = useAuth();
  const navigate = useNavigate();
  const [objects, setObjects] = useState<ObjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingObject, setEditingObject] = useState<ObjectData | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Перенаправление если не админ
  useEffect(() => {
    if (!isAdmin) {
      navigate('/auth');
    }
  }, [isAdmin, navigate]);

  // Загрузка объектов
  useEffect(() => {
    const loadObjects = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/objects');
        const data = await response.json();
        if (data.success) {
          setObjects(data.data);
        }
      } catch (error) {
        console.error('Ошибка загрузки объектов:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadObjects();
  }, []);

  // Функция удаления объекта
  const handleDelete = async (objectId: string, objectName: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить объект "${objectName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/objects/${objectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Обновляем список объектов
        setObjects(objects.filter(obj => obj.id !== objectId));
        alert('Объект успешно удален!');
      } else {
        alert(`Ошибка удаления: ${data.message}`);
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
      console.error('Ошибка удаления:', error);
    }
  };

  // Функция начала редактирования
  const handleEdit = (object: ObjectData) => {
    setEditingObject(object);
    setShowEditForm(true);
    setShowAddForm(false);
  };

  // Функция отмены редактирования
  const handleCancelEdit = () => {
    setEditingObject(null);
    setShowEditForm(false);
  };

  // Функция успешного редактирования
  const handleEditSuccess = () => {
    setEditingObject(null);
    setShowEditForm(false);
    // Перезагрузка объектов
    window.location.reload();
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🛠️ Админ-панель
              </h1>
              <p className="text-gray-600">
                Управление объектами благоустройства
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                👤 {user?.username} ({user?.role})
              </span>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                К каталогу
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{objects.length}</div>
            <div className="text-sm text-gray-600">Всего объектов</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {objects.filter(obj => obj.status as string === 'активный').length}
            </div>
            <div className="text-sm text-gray-600">Активных</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {objects.filter(obj => obj.status as string === 'на реконструкции').length}
            </div>
            <div className="text-sm text-gray-600">На реконструкции</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">
              {objects.filter(obj => obj.status as string === 'планируется').length}
            </div>
            <div className="text-sm text-gray-600">Планируется</div>
          </div>
        </div>

        {/* Кнопка добавления */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-medium"
          >
            {showAddForm ? '❌ Отменить' : '➕ Добавить объект'}
          </button>
        </div>

        {/* Форма добавления */}
        {showAddForm && (
          <AddObjectForm
            token={token}
            onSuccess={() => {
              setShowAddForm(false);
              // Перезагрузка объектов
              window.location.reload();
            }}
          />
        )}

        {/* Форма редактирования */}
        {showEditForm && editingObject && (
          <EditObjectForm
            token={token}
            object={editingObject}
            onSuccess={handleEditSuccess}
            onCancel={handleCancelEdit}
          />
        )}

        {/* Список объектов */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">📋 Список объектов</h2>
          </div>
          
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Загрузка...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Район
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {objects.map((object) => (
                    <tr key={object.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {object.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {object.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {object.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {object.district}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          object.status as string === 'активный' ? 'bg-green-100 text-green-800' :
                          object.status as string === 'на реконструкции' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {object.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEdit(object)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          ✏️ Редактировать
                        </button>
                        <button 
                          onClick={() => handleDelete(object.id, object.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️ Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Компонент формы добавления объекта
const AddObjectForm: React.FC<{ token: string | null; onSuccess: () => void }> = ({ token, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'PARK' as ObjectType,
    district: 'CENTRAL' as District,
    address: '',
    description: '',
    status: 'ACTIVE' as ObjectStatus,
    yearBuilt: new Date().getFullYear(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/objects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          photos: [],
          latitude: 48.7081,
          longitude: 44.5153,
          source: 'Админ-панель'
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.message || 'Ошибка создания объекта');
      }
         } catch {
       setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">➕ Добавить новый объект</h3>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as ObjectType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PARK">Парк</option>
            <option value="SQUARE">Сквер</option>
            <option value="PLAYGROUND">Детская площадка</option>
            <option value="SPORTS_GROUND">Спортивная площадка</option>
            <option value="EMBANKMENT">Набережная</option>
            <option value="FOUNTAIN">Фонтан</option>
            <option value="PLAZA">Площадь</option>
            <option value="BOULEVARD">Бульвар</option>
            <option value="OTHER">Другое</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Район
          </label>
          <select
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value as District })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CENTRAL">Центральный</option>
            <option value="DZERZHINSKY">Дзержинский</option>
            <option value="VOROSHILOVSKY">Ворошиловский</option>
            <option value="SOVETSKY">Советский</option>
            <option value="TRAKTOROZAVODSKY">Тракторозаводский</option>
            <option value="KRASNOARMEYSKY">Красноармейский</option>
            <option value="KIROVSKY">Кировский</option>
            <option value="KRASNOOKTYABRSKY">Краснооктябрьский</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ObjectStatus })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ACTIVE">Активный</option>
            <option value="UNDER_CONSTRUCTION">На реконструкции</option>
            <option value="PLANNED">Планируется</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Адрес
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Год постройки
          </label>
          <input
            type="number"
            value={formData.yearBuilt}
            onChange={(e) => setFormData({ ...formData, yearBuilt: parseInt(e.target.value) })}
            min="1900"
            max="2030"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="md:col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isLoading ? 'Создание...' : 'Создать объект'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Компонент формы редактирования объекта
const EditObjectForm: React.FC<{ 
  token: string | null; 
  object: ObjectData; 
  onSuccess: () => void; 
  onCancel: () => void; 
}> = ({ token, object, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: object.name,
    type: object.type,
    district: object.district,
    address: object.address,
    description: object.description,
    status: object.status,
    yearBuilt: object.yearBuilt || new Date().getFullYear(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/objects/${object.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          photos: object.photos || [],
          latitude: object.latitude || 48.7081,
          longitude: object.longitude || 44.5153,
          source: object.source || 'Админ-панель'
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.message || 'Ошибка обновления объекта');
      }
    } catch {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8 border-2 border-blue-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">✏️ Редактировать объект</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as ObjectType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PARK">Парк</option>
            <option value="SQUARE">Сквер</option>
            <option value="PLAYGROUND">Детская площадка</option>
            <option value="SPORTS_GROUND">Спортивная площадка</option>
            <option value="EMBANKMENT">Набережная</option>
            <option value="FOUNTAIN">Фонтан</option>
            <option value="PLAZA">Площадь</option>
            <option value="BOULEVARD">Бульвар</option>
            <option value="OTHER">Другое</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Район
          </label>
          <select
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value as District })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CENTRAL">Центральный</option>
            <option value="DZERZHINSKY">Дзержинский</option>
            <option value="VOROSHILOVSKY">Ворошиловский</option>
            <option value="SOVETSKY">Советский</option>
            <option value="TRAKTOROZAVODSKY">Тракторозаводский</option>
            <option value="KRASNOARMEYSKY">Красноармейский</option>
            <option value="KIROVSKY">Кировский</option>
            <option value="KRASNOOKTYABRSKY">Краснооктябрьский</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ObjectStatus })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ACTIVE">Активный</option>
            <option value="UNDER_CONSTRUCTION">На реконструкции</option>
            <option value="PLANNED">Планируется</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Адрес
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Год постройки
          </label>
          <input
            type="number"
            value={formData.yearBuilt}
            onChange={(e) => setFormData({ ...formData, yearBuilt: parseInt(e.target.value) })}
            min="1900"
            max="2030"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="md:col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="md:col-span-2 flex space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Отменить
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPage; 