import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import pdf from 'pdf-parse';

export interface ObjectData {
  name: string;
  address: string;
  district: string;
  type: string;
  status: string;
  description?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  photos?: string[];
  area?: number;
  budget?: number;
  completionDate?: string;
}

export class PDFParser {
  private downloadDir: string;
  private httpsAgent: https.Agent;

  constructor() {
    this.downloadDir = path.join(__dirname, '../data/downloads');
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
    this.ensureDownloadDir();
  }

  private ensureDownloadDir(): void {
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  /**
   * Скачивает PDF файл по URL
   */
  async downloadPDF(url: string, filename?: string): Promise<string> {
    try {
      console.log(`📥 Скачиваю PDF: ${url}`);
      
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        httpsAgent: this.httpsAgent,
        timeout: 30000
      });

      const fileName = filename || `objects_${Date.now()}.pdf`;
      const filePath = path.join(this.downloadDir, fileName);
      
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ PDF скачан: ${filePath}`);
          resolve(filePath);
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('❌ Ошибка скачивания PDF:', error);
      throw error;
    }
  }

  /**
   * Парсит текст из PDF файла
   */
  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      console.log(`📖 Извлекаю текст из PDF: ${filePath}`);
      
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      
      console.log(`✅ Извлечено ${data.text.length} символов`);
      return data.text;
    } catch (error) {
      console.error('❌ Ошибка извлечения текста из PDF:', error);
      throw error;
    }
  }

  /**
   * Парсит объекты благоустройства из текста PDF
   */
  parseObjectsFromText(text: string): ObjectData[] {
    const objects: ObjectData[] = [];
    
    try {
      console.log('🔍 Парсинг объектов из текста...');
      
      // Разбиваем текст на строки и очищаем
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      let currentObject: Partial<ObjectData> = {};
      let isParsingObject = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Определяем начало нового объекта
        if (this.isObjectStart(line)) {
          // Сохраняем предыдущий объект если он был
          if (isParsingObject && currentObject.name) {
            objects.push(this.finalizeObject(currentObject));
          }
          
          // Начинаем новый объект
          currentObject = {};
          isParsingObject = true;
          currentObject.name = this.cleanObjectName(line);
          continue;
        }

        if (isParsingObject) {
          // Парсим адрес
          if (this.isAddress(line)) {
            currentObject.address = this.cleanAddress(line);
          }
          
          // Парсим район
          else if (this.isDistrict(line)) {
            currentObject.district = this.extractDistrict(line);
          }
          
          // Парсим тип объекта
          else if (this.isObjectType(line)) {
            currentObject.type = this.extractObjectType(line);
          }
          
          // Парсим статус
          else if (this.isStatus(line)) {
            currentObject.status = this.extractStatus(line);
          }
          
          // Парсим площадь
          else if (this.isArea(line)) {
            currentObject.area = this.extractArea(line);
          }
          
          // Парсим бюджет
          else if (this.isBudget(line)) {
            currentObject.budget = this.extractBudget(line);
          }
          
          // Парсим дату завершения
          else if (this.isCompletionDate(line)) {
            currentObject.completionDate = this.extractCompletionDate(line);
          }
          
          // Парсим описание
          else if (this.isDescription(line)) {
            currentObject.description = (currentObject.description || '') + ' ' + line;
          }
        }
      }

      // Добавляем последний объект
      if (isParsingObject && currentObject.name) {
        objects.push(this.finalizeObject(currentObject));
      }

      console.log(`✅ Найдено объектов: ${objects.length}`);
      return objects;
      
    } catch (error) {
      console.error('❌ Ошибка парсинга объектов:', error);
      return [];
    }
  }

  private isObjectStart(line: string): boolean {
    // Ищем строки, которые могут быть названиями объектов
    const patterns = [
      /^\d+\.\s*(.+)/,  // Начинается с номера
      /^[А-ЯЁ][а-яё\s]+(?:парк|сквер|площадка|площадь|бульвар|набережная)/i,
      /^Благоустройство/i,
      /^Реконструкция/i,
      /^Строительство/i
    ];
    
    return patterns.some(pattern => pattern.test(line));
  }

  private cleanObjectName(line: string): string {
    // Убираем номер в начале и очищаем название
    return line.replace(/^\d+\.\s*/, '').trim();
  }

  private isAddress(line: string): boolean {
    const addressPatterns = [
      /ул\./i, /улица/i, /пр\./i, /проспект/i, /пер\./i, /переулок/i,
      /б-р/i, /бульвар/i, /наб\./i, /набережная/i, /пл\./i, /площадь/i,
      /д\.\s*\d+/i, /дом\s*\d+/i
    ];
    
    return addressPatterns.some(pattern => pattern.test(line));
  }

  private cleanAddress(line: string): string {
    return line.replace(/^(адрес:?\s*)/i, '').trim();
  }

  private isDistrict(line: string): boolean {
    const districts = [
      'Центральный', 'Дзержинский', 'Ворошиловский', 'Советский',
      'Тракторозаводский', 'Красноармейский', 'Кировский', 'Краснооктябрьский'
    ];
    
    return districts.some(district => 
      line.toLowerCase().includes(district.toLowerCase())
    );
  }

  private extractDistrict(line: string): string {
    const districts = [
      'Центральный', 'Дзержинский', 'Ворошиловский', 'Советский',
      'Тракторозаводский', 'Красноармейский', 'Кировский', 'Краснооктябрьский'
    ];
    
    for (const district of districts) {
      if (line.toLowerCase().includes(district.toLowerCase())) {
        return district;
      }
    }
    
    return 'Не указан';
  }

  private isObjectType(line: string): boolean {
    const types = [
      'парк', 'сквер', 'площадка', 'площадь', 'бульвар', 'набережная',
      'фонтан', 'памятник', 'остановка', 'детская', 'спортивная'
    ];
    
    return types.some(type => line.toLowerCase().includes(type));
  }

  private extractObjectType(line: string): string {
    const typeMap: Record<string, string> = {
      'парк': 'парк',
      'сквер': 'сквер',
      'детская площадка': 'детская площадка',
      'спортивная площадка': 'спортивная площадка',
      'набережная': 'набережная',
      'бульвар': 'бульвар',
      'площадь': 'площадь',
      'фонтан': 'фонтан',
      'памятник': 'памятник',
      'остановка': 'остановка'
    };

    for (const [key, value] of Object.entries(typeMap)) {
      if (line.toLowerCase().includes(key)) {
        return value;
      }
    }

    return 'другое';
  }

  private isStatus(line: string): boolean {
    const statuses = ['завершен', 'выполнен', 'строительство', 'реконструкция', 'планируется'];
    return statuses.some(status => line.toLowerCase().includes(status));
  }

  private extractStatus(line: string): string {
    const statusMap: Record<string, string> = {
      'завершен': 'активный',
      'выполнен': 'активный',
      'строительство': 'на реконструкции',
      'реконструкция': 'на реконструкции',
      'планируется': 'планируется'
    };

    for (const [key, value] of Object.entries(statusMap)) {
      if (line.toLowerCase().includes(key)) {
        return value;
      }
    }

    return 'активный';
  }

  private isArea(line: string): boolean {
    return /\d+[\s,]*(?:м²|кв\.?\s*м|га|гектар)/i.test(line);
  }

  private extractArea(line: string): number | undefined {
    const match = line.match(/(\d+(?:[,\.]\d+)?)[\s,]*(?:м²|кв\.?\s*м|га|гектар)/i);
    if (match) {
      const value = parseFloat(match[1].replace(',', '.'));
      // Если в гектарах, переводим в м²
      if (/га|гектар/i.test(line)) {
        return value * 10000;
      }
      return value;
    }
    return undefined;
  }

  private isBudget(line: string): boolean {
    return /\d+[\s,]*(?:млн|тыс|руб|₽)/i.test(line);
  }

  private extractBudget(line: string): number | undefined {
    const match = line.match(/(\d+(?:[,\.]\d+)?)[\s,]*(?:млн|тыс|руб|₽)/i);
    if (match) {
      const value = parseFloat(match[1].replace(',', '.'));
      if (/млн/i.test(line)) {
        return value * 1000000;
      } else if (/тыс/i.test(line)) {
        return value * 1000;
      }
      return value;
    }
    return undefined;
  }

  private isCompletionDate(line: string): boolean {
    return /\d{4}[\s-]*г\.?|\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{4}/i.test(line);
  }

  private extractCompletionDate(line: string): string | undefined {
    const yearMatch = line.match(/(\d{4})[\s-]*г\.?/);
    if (yearMatch) {
      return yearMatch[1];
    }
    
    const dateMatch = line.match(/(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{4})/);
    if (dateMatch) {
      return `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
    }
    
    return undefined;
  }

  private isDescription(line: string): boolean {
    // Простая эвристика для определения описания
    return line.length > 20 && 
           !this.isAddress(line) && 
           !this.isDistrict(line) && 
           !this.isObjectType(line) &&
           !this.isStatus(line) &&
           !this.isArea(line) &&
           !this.isBudget(line) &&
           !this.isCompletionDate(line);
  }

  private finalizeObject(obj: Partial<ObjectData>): ObjectData {
    return {
      name: obj.name || 'Без названия',
      address: obj.address || 'Адрес не указан',
      district: obj.district || 'Не указан',
      type: obj.type || 'другое',
      status: obj.status || 'активный',
      description: obj.description?.trim(),
      area: obj.area,
      budget: obj.budget,
      completionDate: obj.completionDate,
      coordinates: obj.coordinates,
      photos: obj.photos || []
    };
  }

  /**
   * Сохраняет распарсенные данные в JSON файл
   */
  async saveToJSON(objects: ObjectData[], filename: string = 'parsed_objects.json'): Promise<string> {
    const filePath = path.join(this.downloadDir, filename);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(objects, null, 2), 'utf8');
      console.log(`💾 Данные сохранены в: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('❌ Ошибка сохранения данных:', error);
      throw error;
    }
  }
} 