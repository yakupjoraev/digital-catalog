// Типы данных для объектов благоустройства
export interface ObjectData {
  id: string;
  name: string;
  type: ObjectType;
  district: District;
  address: string;
  description: string;
  photos: string[];
  yearBuilt?: number;
  latitude: number;
  longitude: number;
  status: ObjectStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Типы объектов
export type ObjectType = 
  | 'PARK'
  | 'SQUARE'
  | 'PLAYGROUND'
  | 'SPORTS_GROUND'
  | 'EMBANKMENT'
  | 'BOULEVARD'
  | 'PLAZA'
  | 'FOUNTAIN'
  | 'MONUMENT'
  | 'BUS_STOP'
  | 'OTHER';

// Районы Волгограда
export type District = 
  | 'CENTRAL'
  | 'DZERZHINSKY'
  | 'VOROSHILOVSKY'
  | 'SOVETSKY'
  | 'TRAKTOROZAVODSKY'
  | 'KRASNOARMEYSKY'
  | 'KIROVSKY'
  | 'KRASNOOKTYABRSKY';

// Статусы объектов
export type ObjectStatus = 
  | 'ACTIVE'
  | 'UNDER_CONSTRUCTION'
  | 'PLANNED'
  | 'CLOSED';

// Пользователи
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'USER';

// API ответы
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}

// Фильтры
export interface Filters {
  district: string;
  type: string;
  search: string;
  status?: string;
}

// Статистика
export interface Stats {
  total: number;
  byDistrict: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

// Координаты
export interface Coordinates {
  lat: number;
  lng: number;
}

// Параметры поиска рядом
export interface NearbySearchParams {
  lat: number;
  lng: number;
  radius?: number;
}

// Константы для отображения
export const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
  'PARK': '🌳 Парк',
  'SQUARE': '🌿 Сквер',
  'PLAYGROUND': '🎠 Детская площадка',
  'SPORTS_GROUND': '⚽ Спортивная площадка',
  'EMBANKMENT': '🌊 Набережная',
  'BOULEVARD': '🛣️ Бульвар',
  'PLAZA': '🏛️ Площадь',
  'FOUNTAIN': '⛲ Фонтан',
  'MONUMENT': '🗿 Памятник',
  'BUS_STOP': '🚌 Остановка',
  'OTHER': '📍 Другое',
};

export const DISTRICT_LABELS: Record<District, string> = {
  'CENTRAL': 'Центральный',
  'DZERZHINSKY': 'Дзержинский',
  'VOROSHILOVSKY': 'Ворошиловский',
  'SOVETSKY': 'Советский',
  'TRAKTOROZAVODSKY': 'Тракторозаводский',
  'KRASNOARMEYSKY': 'Красноармейский',
  'KIROVSKY': 'Кировский',
  'KRASNOOKTYABRSKY': 'Краснооктябрьский',
};

export const STATUS_LABELS: Record<ObjectStatus, { label: string; color: string }> = {
  'ACTIVE': { label: '✅ Активный', color: 'text-green-600' },
  'UNDER_CONSTRUCTION': { label: '🚧 На реконструкции', color: 'text-yellow-600' },
  'PLANNED': { label: '📋 Планируется', color: 'text-blue-600' },
  'CLOSED': { label: '❌ Закрыт', color: 'text-red-600' },
}; 