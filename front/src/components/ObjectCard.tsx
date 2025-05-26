import React, { useState } from 'react';
import type { ObjectData } from '../types';

// Компонент слайдера фотографий
const PhotoSlider: React.FC<{ photos: string[]; objectName: string }> = ({ photos, objectName }) => {
  const [currentPhoto, setCurrentPhoto] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📷</div>
          <div className="text-sm">Фотографии отсутствуют</div>
        </div>
      </div>
    );
  }

  const nextPhoto = () => {
    setCurrentPhoto((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
      <img
        src={photos[currentPhoto]}
        alt={`${objectName} - фото ${currentPhoto + 1}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Если фото не загрузилось, показываем заглушку
          const target = e.target as HTMLImageElement;
          target.src = `data:image/svg+xml;base64,${btoa(`
            <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#f3f4f6"/>
              <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="Arial" font-size="16">
                📷 Фото недоступно
              </text>
            </svg>
          `)}`;
        }}
      />
      
      {photos.length > 1 && (
        <>
          {/* Кнопки навигации */}
          <button
            onClick={prevPhoto}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-all"
          >
            ←
          </button>
          <button
            onClick={nextPhoto}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-all"
          >
            →
          </button>
          
          {/* Индикаторы */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPhoto(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentPhoto ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
          
          {/* Счетчик фотографий */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {currentPhoto + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
};

// Основной компонент карточки объекта
interface ExtendedObjectData extends ObjectData {
  customer?: string;
  contractor?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  budgetMillion?: number;
  status_detailed?: string;
  region?: string;
}

const ObjectCard: React.FC<{ object: ExtendedObjectData }> = ({ object }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    } catch {
      return dateString;
    }
  };

  const formatBudget = (budget: number) => {
    if (!budget) return null;
    return budget.toLocaleString('ru-RU') + ' руб.';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Слайдер фотографий */}
      <PhotoSlider photos={object.photos || []} objectName={object.name} />
      
      <div className="p-6">
        {/* Заголовок и статус */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-800 flex-1 mr-2">{object.name}</h3>
          <span className="text-sm font-medium text-green-600 whitespace-nowrap">
            {object.status}
          </span>
        </div>
        
        {/* Основная информация */}
        <div className="space-y-2 mb-4">
          <p className="text-blue-600 font-medium">{object.type}</p>
          <p className="text-gray-600">🏘️ {object.district} район</p>
          {object.region && (
            <p className="text-gray-600">🌍 {object.region}</p>
          )}
          <p className="text-gray-600">📍 {object.address}</p>
        </div>

        {/* Описание */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {object.description}
        </p>

        {/* Дополнительная информация (сворачиваемая) */}
        {isExpanded && (
          <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
            {object.customer && (
              <div>
                <span className="font-medium text-gray-700">👤 Заказчик:</span>
                <p className="text-gray-600 text-sm mt-1">{object.customer}</p>
              </div>
            )}
            
            {object.contractor && (
              <div>
                <span className="font-medium text-gray-700">🏢 Подрядчик:</span>
                <p className="text-gray-600 text-sm mt-1">{object.contractor}</p>
              </div>
            )}
            
            {(object.startDate || object.endDate) && (
              <div>
                <span className="font-medium text-gray-700">📅 Сроки:</span>
                <div className="text-gray-600 text-sm mt-1">
                  {object.startDate && <p>Начало: {formatDate(object.startDate)}</p>}
                  {object.endDate && <p>Завершение: {formatDate(object.endDate)}</p>}
                </div>
              </div>
            )}
            
            {(object.budget || object.budgetMillion) && (
              <div>
                <span className="font-medium text-gray-700">💰 Бюджет:</span>
                <p className="text-gray-600 text-sm mt-1">
                  {object.budgetMillion && `${object.budgetMillion} млн руб.`}
                  {object.budget && ` (${formatBudget(object.budget)})`}
                </p>
              </div>
            )}
            
            {object.status_detailed && (
              <div>
                <span className="font-medium text-gray-700">📊 Детальный статус:</span>
                <p className="text-gray-600 text-sm mt-1">{object.status_detailed}</p>
              </div>
            )}
            
            {object.yearBuilt && (
              <div>
                <span className="font-medium text-gray-700">🏗️ Год постройки:</span>
                <p className="text-gray-600 text-sm mt-1">{object.yearBuilt}</p>
              </div>
            )}
          </div>
        )}

        {/* Нижняя панель */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            {isExpanded ? '🔼 Свернуть' : '🔽 Подробнее'}
          </button>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {object.photos && object.photos.length > 0 && (
              <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">
                📸 {object.photos.length}
              </span>
            )}
            <span className="bg-gray-100 px-2 py-1 rounded">
              {object.source || 'Каталог'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectCard; 