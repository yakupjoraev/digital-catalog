import axios from 'axios';
import * as https from 'https';
import { ObjectData } from './pdfParser';

export interface DatabaseConfig {
  backendUrl: string;
  apiKey?: string;
}

export class DatabaseIntegration {
  private config: DatabaseConfig;
  private httpsAgent: https.Agent;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
  }

  /**
   * Отправляет распарсенные объекты в backend API
   */
  async uploadObjects(objects: ObjectData[]): Promise<{ success: number; errors: number; details: any[] }> {
    console.log(`📤 Загружаю ${objects.length} объектов в базу данных...`);
    
    const results = {
      success: 0,
      errors: 0,
      details: [] as any[]
    };

    for (const [index, object] of objects.entries()) {
      try {
        console.log(`📋 Загружаю объект ${index + 1}/${objects.length}: ${object.name}`);
        
        const response = await this.createObject(object);
        
        if (response.success) {
          results.success++;
          results.details.push({
            object: object.name,
            status: 'success',
            id: response.data?.id
          });
          console.log(`✅ Объект загружен: ${object.name}`);
        } else {
          results.errors++;
          results.details.push({
            object: object.name,
            status: 'error',
            error: response.error
          });
          console.log(`❌ Ошибка загрузки объекта: ${object.name} - ${response.error}`);
        }
        
      } catch (error) {
        results.errors++;
        results.details.push({
          object: object.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ Ошибка загрузки объекта ${object.name}:`, error);
      }

      // Небольшая задержка между запросами
      await this.delay(100);
    }

    console.log(`\n📊 Результаты загрузки:`);
    console.log(`✅ Успешно: ${results.success}`);
    console.log(`❌ Ошибки: ${results.errors}`);

    return results;
  }

  /**
   * Создает объект в базе данных через API
   */
  private async createObject(object: ObjectData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const payload = this.transformObjectForAPI(object);
      
      const response = await axios.post(
        `${this.config.backendUrl}/api/objects`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
          },
          timeout: 10000,
          httpsAgent: this.httpsAgent
        }
      );

      return {
        success: true,
        data: response.data.data
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Преобразует объект парсера в формат API
   */
  private transformObjectForAPI(object: ObjectData): any {
    return {
      name: object.name,
      description: object.description || 'Описание не указано',
      address: object.address,
      district: object.district,
      type: object.type,
      status: object.status,
      coordinates: {
        lat: object.coordinates?.lat || 48.7080,  // Центр Волгограда по умолчанию
        lng: object.coordinates?.lng || 44.5133
      },
      photos: object.photos || [],
      yearBuilt: object.completionDate ? parseInt(object.completionDate) : null,
      source: 'Парсер PDF volgograd.ru'
    };
  }

  /**
   * Проверяет доступность backend API
   */
  async checkConnection(): Promise<boolean> {
    try {
      console.log(`🔗 Проверяю подключение к backend: ${this.config.backendUrl}`);
      
      const response = await axios.get(`${this.config.backendUrl}/`, {
        timeout: 5000,
        httpsAgent: this.httpsAgent
      });

      if (response.status === 200) {
        console.log('✅ Backend доступен');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ Backend недоступен:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Получает статистику объектов из базы данных
   */
  async getObjectsStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.config.backendUrl}/api/objects/stats`, {
        timeout: 5000,
        httpsAgent: this.httpsAgent
      });

      return response.data;
      
    } catch (error) {
      console.error('❌ Ошибка получения статистики:', error);
      return null;
    }
  }

  /**
   * Очищает все объекты в базе данных (осторожно!)
   */
  async clearAllObjects(): Promise<boolean> {
    try {
      console.log('⚠️ ВНИМАНИЕ: Очистка всех объектов в базе данных...');
      
      // Получаем все объекты
      const response = await axios.get(`${this.config.backendUrl}/api/objects?limit=1000`, {
        timeout: 10000,
        httpsAgent: this.httpsAgent
      });

      const objects = response.data.data || [];
      
      if (objects.length === 0) {
        console.log('ℹ️ База данных уже пуста');
        return true;
      }

      console.log(`🗑️ Удаляю ${objects.length} объектов...`);
      
      for (const object of objects) {
        try {
          await axios.delete(`${this.config.backendUrl}/api/objects/${object.id}`, {
            timeout: 5000,
            httpsAgent: this.httpsAgent
          });
          console.log(`🗑️ Удален объект: ${object.name}`);
        } catch (error) {
          console.error(`❌ Ошибка удаления объекта ${object.name}:`, error);
        }
        
        await this.delay(50);
      }

      console.log('✅ Очистка завершена');
      return true;
      
    } catch (error) {
      console.error('❌ Ошибка очистки базы данных:', error);
      return false;
    }
  }

  /**
   * Синхронизирует данные: очищает базу и загружает новые объекты
   */
  async syncObjects(objects: ObjectData[], clearFirst: boolean = false): Promise<any> {
    console.log('🔄 Начинаю синхронизацию объектов с базой данных...');
    
    try {
      // Проверяем подключение
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('Backend недоступен');
      }

      // Очищаем базу если нужно
      if (clearFirst) {
        console.log('🗑️ Очищаю существующие объекты...');
        await this.clearAllObjects();
      }

      // Загружаем новые объекты
      const results = await this.uploadObjects(objects);

      console.log('\n🎉 Синхронизация завершена!');
      return results;
      
    } catch (error) {
      console.error('❌ Ошибка синхронизации:', error);
      throw error;
    }
  }

  /**
   * Задержка в миллисекундах
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Проверяет, существует ли объект в базе данных
   */
  async objectExists(name: string, address: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.backendUrl}/api/objects`, {
        params: {
          search: name,
          limit: 10
        },
        timeout: 5000,
        httpsAgent: this.httpsAgent
      });

      const objects = response.data.data || [];
      
      return objects.some((obj: any) => 
        obj.name.toLowerCase() === name.toLowerCase() && 
        obj.address.toLowerCase() === address.toLowerCase()
      );
      
    } catch (error) {
      console.error('❌ Ошибка проверки существования объекта:', error);
      return false;
    }
  }

  /**
   * Загружает только новые объекты (которых нет в базе)
   */
  async uploadNewObjects(objects: ObjectData[]): Promise<any> {
    console.log('🔍 Проверяю новые объекты для загрузки...');
    
    const newObjects: ObjectData[] = [];
    
    for (const object of objects) {
      const exists = await this.objectExists(object.name, object.address);
      if (!exists) {
        newObjects.push(object);
      } else {
        console.log(`⏭️ Объект уже существует: ${object.name}`);
      }
      
      await this.delay(50);
    }

    console.log(`📤 Найдено новых объектов для загрузки: ${newObjects.length}`);
    
    if (newObjects.length > 0) {
      return await this.uploadObjects(newObjects);
    }
    
    return {
      success: 0,
      errors: 0,
      details: []
    };
  }
} 