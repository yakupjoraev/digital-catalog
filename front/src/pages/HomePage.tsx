import React, { useState, useEffect } from 'react';
import type { ObjectData } from '../types';
import { objectsApi } from '../api/client';
import ObjectCard from '../components/ObjectCard';

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
            <option value="Центральный">Центральный</option>
            <option value="Дзержинский">Дзержинский</option>
            <option value="Ворошиловский">Ворошиловский</option>
            <option value="Советский">Советский</option>
            <option value="Тракторозаводский">Тракторозаводский</option>
            <option value="Красноармейский">Красноармейский</option>
            <option value="Кировский">Кировский</option>
            <option value="Краснооктябрьский">Краснооктябрьский</option>
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
            <option value="парк">🌳 Парк</option>
            <option value="сквер">🌿 Сквер</option>
            <option value="детская площадка">🎠 Детская площадка</option>
            <option value="спортивная площадка">⚽ Спортивная площадка</option>
            <option value="набережная">🌊 Набережная</option>
            <option value="фонтан">⛲ Фонтан</option>
            <option value="площадь">🏛️ Площадь</option>
            <option value="бульвар">🛣️ Бульвар</option>
            <option value="другое">📍 Другое</option>
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
          <div className="text-2xl font-bold text-green-600">{stats.byStatus['активный'] || 0}</div>
          <div className="text-sm text-gray-600">Активных</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.byStatus['на реконструкции'] || 0}</div>
          <div className="text-sm text-gray-600">На реконструкции</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.byStatus['планируется'] || 0}</div>
          <div className="text-sm text-gray-600">Планируется</div>
        </div>
      </div>
    </div>
  );
};

// Основной компонент главной страницы
const HomePage: React.FC = () => {
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка объектов благоустройства...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Ошибка:</strong> {error}
          <p className="mt-2">Убедитесь, что бэкенд сервер запущен на http://localhost:5000</p>
        </div>
      </div>
    );
  }

  return (
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
  );
};

export default HomePage; 