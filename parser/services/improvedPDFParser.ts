import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import pdf from 'pdf-parse';
import { ObjectData } from './pdfParser';

export class ImprovedPDFParser {
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

      const fileName = filename || `improved_objects_${Date.now()}.pdf`;
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
   * Улучшенный парсинг объектов благоустройства из табличного формата
   */
  parseObjectsFromText(text: string): ObjectData[] {
    const objects: ObjectData[] = [];
    
    try {
      console.log('🔍 Улучшенный парсинг объектов из текста...');
      
      // Разбиваем текст на строки и очищаем
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Ищем табличные данные
      const tableRows = this.extractTableRows(lines);
      
      for (const row of tableRows) {
        const object = this.parseTableRow(row);
        if (object && this.isValidObject(object)) {
          objects.push(object);
        }
      }

      // Дополнительный парсинг для объектов, не попавших в таблицу
      const additionalObjects = this.parseNonTableObjects(lines);
      objects.push(...additionalObjects);

      console.log(`✅ Найдено объектов: ${objects.length}`);
      return objects;
      
    } catch (error) {
      console.error('❌ Ошибка парсинга объектов:', error);
      return [];
    }
  }

  /**
   * Извлекает строки таблицы из текста
   */
  private extractTableRows(lines: string[]): string[] {
    const tableRows: string[] = [];
    let inTable = false;
    let currentRow = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Определяем начало таблицы
      if (this.isTableHeader(line)) {
        inTable = true;
        continue;
      }

      // Определяем конец таблицы
      if (inTable && this.isTableEnd(line)) {
        if (currentRow.trim()) {
          tableRows.push(currentRow.trim());
        }
        inTable = false;
        currentRow = '';
        continue;
      }

      if (inTable) {
        // Если строка начинается с номера, это новая строка таблицы
        if (this.isNewTableRow(line)) {
          if (currentRow.trim()) {
            tableRows.push(currentRow.trim());
          }
          currentRow = line;
        } else {
          // Продолжение текущей строки
          currentRow += ' ' + line;
        }
      }
    }

    // Добавляем последнюю строку если есть
    if (currentRow.trim()) {
      tableRows.push(currentRow.trim());
    }

    return tableRows;
  }

  /**
   * Проверяет, является ли строка заголовком таблицы
   */
  private isTableHeader(line: string): boolean {
    const headerPatterns = [
      /№\s*п\/п/i,
      /объект.*адрес.*заказчик/i,
      /наименование.*местоположение/i,
      /благоустройство.*территории/i
    ];
    
    return headerPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Проверяет, является ли строка концом таблицы
   */
  private isTableEnd(line: string): boolean {
    const endPatterns = [
      /итого/i,
      /всего/i,
      /общая сумма/i,
      /примечание/i,
      /^[А-ЯЁ][А-ЯЁ\s]+$/  // Заголовок следующего раздела
    ];
    
    return endPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Проверяет, является ли строка началом новой строки таблицы
   */
  private isNewTableRow(line: string): boolean {
    // Строка начинается с номера
    return /^\d+[\.\s]/.test(line);
  }

  /**
   * Парсит строку таблицы в объект
   */
  private parseTableRow(row: string): ObjectData | null {
    try {
      // Разбиваем строку на части
      const parts = this.splitTableRow(row);
      
      if (parts.length < 3) {
        return null;
      }

      const name = this.extractName(parts);
      const address = this.extractAddress(parts);
      const district = this.extractDistrict(row);
      const type = this.extractType(row);
      const description = this.extractDescription(parts);
      const budget = this.extractBudget(row);
      const completionDate = this.extractCompletionDate(row);

      return {
        name: name || 'Объект благоустройства',
        address: address || 'Адрес не указан',
        district: district || 'Не указан',
        type: type || 'другое',
        status: 'активный',
        description: description,
        coordinates: this.getDefaultCoordinates(district),
        photos: [],
        budget: budget,
        completionDate: completionDate
      };

    } catch (error) {
      console.error('❌ Ошибка парсинга строки таблицы:', error);
      return null;
    }
  }

  /**
   * Разбивает строку таблицы на части
   */
  private splitTableRow(row: string): string[] {
    // Убираем номер в начале
    const withoutNumber = row.replace(/^\d+[\.\s]+/, '');
    
    // Разбиваем по ключевым словам и паттернам
    const parts: string[] = [];
    let currentPart = '';
    const words = withoutNumber.split(/\s+/);

    for (const word of words) {
      if (this.isPartSeparator(word)) {
        if (currentPart.trim()) {
          parts.push(currentPart.trim());
        }
        currentPart = word;
      } else {
        currentPart += ' ' + word;
      }
    }

    if (currentPart.trim()) {
      parts.push(currentPart.trim());
    }

    return parts;
  }

  /**
   * Проверяет, является ли слово разделителем частей
   */
  private isPartSeparator(word: string): boolean {
    const separators = [
      'Общественная',
      'территория',
      'МКУ',
      'МБУ',
      'Администрация',
      'Муниципальное',
      'Волгоградской',
      'области'
    ];
    
    return separators.some(sep => word.includes(sep));
  }

  /**
   * Извлекает название объекта
   */
  private extractName(parts: string[]): string {
    if (parts.length === 0) return '';
    
    let name = parts[0];
    
    // Очищаем название от лишних символов
    name = name.replace(/^[\d\.\s]+/, ''); // Убираем номера
    name = name.replace(/Общественная территория/gi, ''); // Убираем стандартные фразы
    name = name.trim();
    
    // Если название слишком короткое или содержит только даты/числа
    if (name.length < 3 || /^\d+[\.\d]*$/.test(name)) {
      // Ищем более осмысленное название в других частях
      for (const part of parts) {
        if (this.isValidObjectName(part)) {
          return part.trim();
        }
      }
      return 'Объект благоустройства';
    }
    
    return name;
  }

  /**
   * Проверяет, является ли строка валидным названием объекта
   */
  private isValidObjectName(text: string): boolean {
    const validPatterns = [
      /благоустройство/i,
      /парк/i,
      /сквер/i,
      /площадка/i,
      /набережная/i,
      /бульвар/i,
      /площадь/i,
      /аллея/i,
      /территория.*ул\./i
    ];
    
    return validPatterns.some(pattern => pattern.test(text)) && 
           text.length > 10 && 
           !/^\d+[\.\d\s]*$/.test(text);
  }

  /**
   * Извлекает адрес
   */
  private extractAddress(parts: string[]): string {
    for (const part of parts) {
      if (this.isAddress(part)) {
        return this.cleanAddress(part);
      }
    }
    
    // Ищем адрес по ключевым словам
    const fullText = parts.join(' ');
    const addressMatch = fullText.match(/(ул\.|пр\.|пер\.|б-р|наб\.|пл\.)[^,]*/i);
    if (addressMatch) {
      return addressMatch[0].trim();
    }
    
    return 'Адрес не указан';
  }

  /**
   * Проверяет, содержит ли текст адрес
   */
  private isAddress(text: string): boolean {
    const addressPatterns = [
      /ул\./i, /улица/i, /пр\./i, /проспект/i, /пер\./i, /переулок/i,
      /б-р/i, /бульвар/i, /наб\./i, /набережная/i, /пл\./i, /площадь/i,
      /в районе/i, /по ул\./i, /до ул\./i
    ];
    
    return addressPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Очищает адрес
   */
  private cleanAddress(address: string): string {
    return address
      .replace(/^(адрес:?\s*)/i, '')
      .replace(/Общественная территория/gi, '')
      .trim();
  }

  /**
   * Извлекает район
   */
  private extractDistrict(text: string): string {
    const districts = [
      'Центральный', 'Дзержинский', 'Ворошиловский', 'Советский',
      'Тракторозаводский', 'Красноармейский', 'Кировский', 'Краснооктябрьский'
    ];
    
    for (const district of districts) {
      if (text.toLowerCase().includes(district.toLowerCase())) {
        return district;
      }
    }
    
    return 'Не указан';
  }

  /**
   * Извлекает тип объекта
   */
  private extractType(text: string): string {
    const typeMap: Record<string, string> = {
      'парк': 'парк',
      'сквер': 'сквер',
      'детская площадка': 'детская площадка',
      'спортивная площадка': 'спортивная площадка',
      'набережная': 'набережная',
      'бульвар': 'бульвар',
      'площадь': 'площадь',
      'фонтан': 'фонтан',
      'аллея': 'парк',
      'территория': 'другое'
    };

    for (const [key, value] of Object.entries(typeMap)) {
      if (text.toLowerCase().includes(key)) {
        return value;
      }
    }

    return 'другое';
  }

  /**
   * Извлекает описание
   */
  private extractDescription(parts: string[]): string | undefined {
    const description = parts.slice(1).join(' ');
    
    if (description.length > 20) {
      return description
        .replace(/Общественная территория/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return undefined;
  }

  /**
   * Извлекает бюджет
   */
  private extractBudget(text: string): number | undefined {
    const budgetMatch = text.match(/(\d+(?:[,\.]\d+)?)[\s,]*(?:млн|тыс|руб|₽)/i);
    if (budgetMatch) {
      const value = parseFloat(budgetMatch[1].replace(',', '.'));
      if (/млн/i.test(text)) {
        return value * 1000000;
      } else if (/тыс/i.test(text)) {
        return value * 1000;
      }
      return value;
    }
    return undefined;
  }

  /**
   * Извлекает дату завершения
   */
  private extractCompletionDate(text: string): string | undefined {
    const dateMatch = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (dateMatch) {
      return `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }
    
    const yearMatch = text.match(/(\d{4})/);
    if (yearMatch) {
      return yearMatch[1];
    }
    
    return undefined;
  }

  /**
   * Получает координаты по умолчанию для района
   */
  private getDefaultCoordinates(district: string): { lat: number; lng: number } {
    const districtCoordinates: Record<string, { lat: number; lng: number }> = {
      'Центральный': { lat: 48.7080, lng: 44.5133 },
      'Дзержинский': { lat: 48.7200, lng: 44.5400 },
      'Ворошиловский': { lat: 48.7342, lng: 44.5456 },
      'Советский': { lat: 48.6987, lng: 44.4821 },
      'Тракторозаводский': { lat: 48.7789, lng: 44.5678 },
      'Красноармейский': { lat: 48.7234, lng: 44.5234 },
      'Кировский': { lat: 48.6789, lng: 44.4123 },
      'Краснооктябрьский': { lat: 48.7456, lng: 44.4567 }
    };
    
    return districtCoordinates[district] || { lat: 48.7080, lng: 44.5133 };
  }

  /**
   * Проверяет валидность объекта
   */
  private isValidObject(object: ObjectData): boolean {
    return object.name.length > 2 && 
           object.name !== 'Объект благоустройства' &&
           !object.name.match(/^\d+[\.\d]*$/);
  }

  /**
   * Парсит объекты, не попавшие в таблицу
   */
  private parseNonTableObjects(lines: string[]): ObjectData[] {
    const objects: ObjectData[] = [];
    
    // Ищем отдельные упоминания объектов
    for (const line of lines) {
      if (this.isStandaloneObject(line)) {
        const object = this.parseStandaloneLine(line);
        if (object && this.isValidObject(object)) {
          objects.push(object);
        }
      }
    }
    
    return objects;
  }

  /**
   * Проверяет, является ли строка отдельным объектом
   */
  private isStandaloneObject(line: string): boolean {
    const patterns = [
      /благоустройство.*парк/i,
      /благоустройство.*сквер/i,
      /благоустройство.*площадка/i,
      /реконструкция.*парк/i,
      /строительство.*площадка/i
    ];
    
    return patterns.some(pattern => pattern.test(line)) && line.length > 20;
  }

  /**
   * Парсит отдельную строку в объект
   */
  private parseStandaloneLine(line: string): ObjectData | null {
    try {
      const name = this.extractStandaloneName(line);
      const address = this.extractAddress([line]);
      const district = this.extractDistrict(line);
      const type = this.extractType(line);

      return {
        name: name,
        address: address,
        district: district,
        type: type,
        status: 'активный',
        description: line.length > 50 ? line.substring(0, 200) : undefined,
        coordinates: this.getDefaultCoordinates(district),
        photos: []
      };

    } catch (error) {
      return null;
    }
  }

  /**
   * Извлекает название из отдельной строки
   */
  private extractStandaloneName(line: string): string {
    // Ищем осмысленную часть названия
    const nameMatch = line.match(/(благоустройство|реконструкция|строительство)[^,]*/i);
    if (nameMatch) {
      return nameMatch[0].trim();
    }
    
    return line.substring(0, 50).trim();
  }

  /**
   * Сохраняет распарсенные данные в JSON файл
   */
  async saveToJSON(objects: ObjectData[], filename: string = 'improved_objects.json'): Promise<string> {
    const filePath = path.join(this.downloadDir, '../output', filename);
    
    try {
      const outputDir = path.dirname(filePath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(objects, null, 2), 'utf8');
      console.log(`💾 Улучшенные данные сохранены в: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('❌ Ошибка сохранения данных:', error);
      throw error;
    }
  }
} 