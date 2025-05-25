import type { ObjectData, ApiResponse, NearbySearchParams } from '../types';

const API_BASE = 'http://localhost:5000';

// Базовая функция для выполнения запросов
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// API для объектов благоустройства
export const objectsApi = {
  // Получить все объекты с фильтрацией
  getAll: async (params?: {
    district?: string;
    type?: string;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ObjectData[]>> => {
    const searchParams = new URLSearchParams();
    
    if (params?.district) searchParams.append('district', params.district);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    const endpoint = `/api/objects${query ? `?${query}` : ''}`;
    
    return apiRequest<ApiResponse<ObjectData[]>>(endpoint);
  },

  // Получить объект по ID
  getById: async (id: string): Promise<ApiResponse<ObjectData>> => {
    return apiRequest<ApiResponse<ObjectData>>(`/api/objects/${id}`);
  },

  // Создать новый объект (только для админов)
  create: async (data: Omit<ObjectData, 'id' | 'createdAt' | 'updatedAt' | 'coordinates'>): Promise<ApiResponse<ObjectData>> => {
    return apiRequest<ApiResponse<ObjectData>>('/api/objects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Обновить объект (только для админов)
  update: async (id: string, data: Partial<ObjectData>): Promise<ApiResponse<ObjectData>> => {
    return apiRequest<ApiResponse<ObjectData>>(`/api/objects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Удалить объект (только для админов)
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiRequest<ApiResponse<void>>(`/api/objects/${id}`, {
      method: 'DELETE',
    });
  },

  // Получить статистику
  getStats: async (): Promise<ApiResponse<{
    total: number;
    byDistrict: Record<string, number>;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }>> => {
    return apiRequest<ApiResponse<{
      total: number;
      byDistrict: Record<string, number>;
      byType: Record<string, number>;
      byStatus: Record<string, number>;
    }>>('/api/objects/stats');
  },

  // Поиск объектов рядом с координатами
  getNearby: async (params: NearbySearchParams): Promise<ApiResponse<ObjectData[]>> => {
    const searchParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
    });
    
    if (params.radius) {
      searchParams.append('radius', params.radius.toString());
    }

    return apiRequest<ApiResponse<ObjectData[]>>(`/api/objects/nearby?${searchParams.toString()}`);
  },
};

// API для аутентификации (для будущего использования)
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData: { username: string; email: string; password: string }) => {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getProfile: async () => {
    return apiRequest('/api/auth/profile');
  },
};

// Проверка состояния сервера
export const healthApi = {
  check: async (): Promise<{
    message: string;
    version: string;
    database: string;
    status: string;
  }> => {
    return apiRequest('/');
  },
};

// Экспорт всех API
export default {
  objects: objectsApi,
  auth: authApi,
  health: healthApi,
}; 