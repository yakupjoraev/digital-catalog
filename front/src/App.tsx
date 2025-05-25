import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import type { ObjectData, ObjectType, District, ObjectStatus } from './types';
import { OBJECT_TYPE_LABELS, DISTRICT_LABELS, STATUS_LABELS } from './types';
import { objectsApi } from './api/client';

// Компонент заголовка
const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-center">
          🏛️ Цифровой каталог объектов благоустройства
        </h1>
        <p className="text-center text-blue-100 mt-2">
          Волгоград • Парки • Скверы • Площадки • Набережные
        </p>
      </div>
    </header>
  );
};

// Компонент карточки объекта
const ObjectCard: React.FC<{ object: ObjectData }> = ({ object }) => {
  const getTypeLabel = (type: ObjectType) => {
    return OBJECT_TYPE_LABELS[type] || type;
  };

  const getDistrictLabel = (district: District) => {
    return DISTRICT_LABELS[district] || district;
  };

  const getStatusLabel = (status: ObjectStatus) => {
    return STATUS_LABELS[status] || { label: status, color: 'text-gray-600' };
  };

  const statusInfo = getStatusLabel(object.status);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-800">{object.name}</h3>
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        
        <div className="space-y-2 mb-4">
          <p className="text-blue-600 font-medium">{getTypeLabel(object.type)}</p>
          <p className="text-gray-600">📍 {getDistrictLabel(object.district)} район</p>
          <p className="text-gray-600">🏠 {object.address}</p>
          {object.yearBuilt && (
            <p className="text-gray-600">📅 Год постройки: {object.yearBuilt}</p>
          )}
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {object.description}
        </p>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>📍 {object.coordinates.lat.toFixed(4)}, {object.coordinates.lng.toFixed(4)}</span>
          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
            {object.source}
          </span>
        </div>
      </div>
    </div>
  );
};

// Компонент фильтров
const Filters: React.FC<{
  onDistrictChange: (district: string) => void;
  onTypeChange: (type: string) => void;
  onSearch: (search: string) => void;
}> = ({ onDistrictChange, onTypeChange, onSearch }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">🔍 Фильтры и поиск</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Поиск по названию
          </label>
          <input
            type="text"
            placeholder="Введите название..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Район
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => onDistrictChange(e.target.value)}
          >
            <option value="">Все районы</option>
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
            Тип объекта
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="">Все типы</option>
            <option value="PARK">🌳 Парк</option>
            <option value="SQUARE">🌿 Сквер</option>
            <option value="PLAYGROUND">🎠 Детская площадка</option>
            <option value="SPORTS_GROUND">⚽ Спортивная площадка</option>
            <option value="EMBANKMENT">🌊 Набережная</option>
            <option value="FOUNTAIN">⛲ Фонтан</option>
            <option value="PLAZA">🏛️ Площадь</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Компонент статистики
const Stats: React.FC<{ objects: ObjectData[] }> = ({ objects }) => {
  const stats = {
    total: objects.length,
    byDistrict: objects.reduce((acc, obj) => {
      acc[obj.district] = (acc[obj.district] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number }),
    byType: objects.reduce((acc, obj) => {
      acc[obj.type] = (acc[obj.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number }),
    byStatus: objects.reduce((acc, obj) => {
      acc[obj.status] = (acc[obj.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number }),
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">📊 Статистика</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Всего объектов</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.byStatus.ACTIVE || 0}</div>
          <div className="text-sm text-gray-600">Активных</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.UNDER_CONSTRUCTION || 0}</div>
          <div className="text-sm text-gray-600">На реконструкции</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byDistrict).length}</div>
          <div className="text-sm text-gray-600">Районов</div>
        </div>
      </div>
    </div>
  );
};

// Основной компонент приложения
const App: React.FC = () => {
  const [objects, setObjects] = useState<ObjectData[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<ObjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    district: '',
    type: '',
    search: '',
  });

  // Загрузка данных
  useEffect(() => {
    const loadObjects = async () => {
      try {
        setLoading(true);
        const response = await objectsApi.getAll();
        if (response.success) {
          setObjects(response.data);
          setFilteredObjects(response.data);
        } else {
          setError('Ошибка загрузки данных');
        }
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadObjects();
  }, []);

  // Применение фильтров
  useEffect(() => {
    let filtered = objects;

    if (filters.district) {
      filtered = filtered.filter(obj => obj.district === filters.district);
    }

    if (filters.type) {
      filtered = filtered.filter(obj => obj.type === filters.type);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(obj =>
        obj.name.toLowerCase().includes(searchLower) ||
        obj.description.toLowerCase().includes(searchLower) ||
        obj.address.toLowerCase().includes(searchLower)
      );
    }

    setFilteredObjects(filtered);
  }, [objects, filters]);

  const handleDistrictChange = (district: string) => {
    setFilters(prev => ({ ...prev, district }));
  };

  const handleTypeChange = (type: string) => {
    setFilters(prev => ({ ...prev, type }));
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка объектов благоустройства...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Ошибка:</strong> {error}
            <p className="mt-2">Убедитесь, что бэкенд сервер запущен на http://localhost:5000</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <Stats objects={objects} />
          
          <Filters
            onDistrictChange={handleDistrictChange}
            onTypeChange={handleTypeChange}
            onSearch={handleSearch}
          />

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              📍 Объекты благоустройства ({filteredObjects.length})
            </h2>
            
            {filteredObjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {objects.length === 0 ? 'Объекты не найдены' : 'Нет объектов, соответствующих фильтрам'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredObjects.map((object) => (
                  <ObjectCard key={object.id} object={object} />
                ))}
              </div>
            )}
          </div>
        </main>

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
    </Router>
  );
};

export default App;
