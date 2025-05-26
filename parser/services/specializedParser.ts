import { PDFParser, ObjectData } from './pdfParser';

export class SpecializedParser extends PDFParser {
  
  /**
   * Специализированный парсинг для формата PDF volgograd.ru
   */
  parseObjectsFromText(text: string): ObjectData[] {
    const objects: ObjectData[] = [];
    
    try {
      console.log('🎯 Специализированный парсинг объектов из текста...');
      
      // Разбиваем текст на строки и очищаем
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Ищем начало данных (после заголовков)
      let startIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Общественная территория') && lines[i + 1] && lines[i + 1].includes('г.Волгоград')) {
          startIndex = i;
          break;
        }
      }

      if (startIndex === -1) {
        console.log('⚠️ Не найдено начало данных');
        return [];
      }

      console.log(`📍 Начало данных найдено на строке ${startIndex + 1}`);

      // Парсим объекты начиная с найденной позиции
      let currentIndex = startIndex;
      let objectNumber = 1;

      while (currentIndex < lines.length - 10) {
        const objectData = this.parseObjectBlock(lines, currentIndex, objectNumber);
        
        if (objectData.object) {
          objects.push(objectData.object);
          console.log(`✅ Объект ${objectNumber}: ${objectData.object.name}`);
        }
        
        if (objectData.nextIndex > currentIndex) {
          currentIndex = objectData.nextIndex;
          objectNumber++;
        } else {
          currentIndex++;
        }

        // Защита от бесконечного цикла
        if (objectNumber > 100) {
          console.log('⚠️ Достигнут лимит объектов (100)');
          break;
        }
      }

      console.log(`✅ Найдено объектов: ${objects.length}`);
      return objects;
      
    } catch (error) {
      console.error('❌ Ошибка специализированного парсинга:', error);
      return [];
    }
  }

  /**
   * Парсит блок данных одного объекта
   */
  private parseObjectBlock(lines: string[], startIndex: number, objectNumber: number): { object: ObjectData | null; nextIndex: number } {
    try {
      let currentIndex = startIndex;
      const objectLines: string[] = [];

      // Собираем строки до следующего объекта или конца
      while (currentIndex < lines.length) {
        const line = lines[currentIndex];
        
        // Проверяем, не начался ли следующий объект
        if (currentIndex > startIndex && 
            line.includes('Общественная территория') && 
            lines[currentIndex + 1] && 
            lines[currentIndex + 1].includes('г.Волгоград')) {
          break;
        }

        objectLines.push(line);
        currentIndex++;

        // Ограничиваем размер блока
        if (objectLines.length > 30) {
          break;
        }
      }

      // Парсим собранные строки
      const object = this.parseObjectFromLines(objectLines, objectNumber);
      
      return {
        object: object,
        nextIndex: currentIndex
      };

    } catch (error) {
      console.error(`❌ Ошибка парсинга блока объекта ${objectNumber}:`, error);
      return { object: null, nextIndex: startIndex + 1 };
    }
  }

  /**
   * Парсит объект из массива строк
   */
  private parseObjectFromLines(lines: string[], objectNumber: number): ObjectData | null {
    try {
      if (lines.length < 5) {
        return null;
      }

      // Извлекаем данные
      const name = this.extractObjectName(lines);
      const address = this.extractObjectAddress(lines);
      const district = this.extractObjectDistrict(lines);
             const type = this.extractObjectTypeFromLines(lines);
      const description = this.extractObjectDescription(lines);
      const budget = this.extractObjectBudget(lines);
      const completionDate = this.extractObjectCompletionDate(lines);
      const contractor = this.extractContractor(lines);

      // Создаем объект
      const object: ObjectData = {
        name: name || `Объект благоустройства №${objectNumber}`,
        address: address || 'Адрес не указан',
        district: district || 'Не указан',
        type: type || 'другое',
        status: 'активный',
        description: description,
        coordinates: this.getDistrictCoordinates(district),
        photos: [],
        budget: budget,
        completionDate: completionDate
      };

      // Добавляем информацию о подрядчике в описание
      if (contractor) {
        object.description = (object.description || '') + ` Подрядчик: ${contractor}`;
      }

      return object;

    } catch (error) {
      console.error(`❌ Ошибка создания объекта ${objectNumber}:`, error);
      return null;
    }
  }

  /**
   * Извлекает название объекта
   */
  private extractObjectName(lines: string[]): string {
    // Ищем осмысленное название
    for (const line of lines) {
      // Пропускаем служебные строки
      if (line.includes('Общественная территория') ||
          line.includes('г.Волгоград') ||
          line.includes('район') ||
          line.includes('МБУ') ||
          line.includes('ООО') ||
          /^\d+$/.test(line) ||
          line.includes('СМР')) {
        continue;
      }

      // Ищем строки с описанием объекта
      if (line.includes('благоустройство') ||
          line.includes('территория') ||
          line.includes('сквер') ||
          line.includes('парк') ||
          line.includes('площадка') ||
          line.includes('по ул.') ||
          line.includes('по пр.') ||
          line.length > 15) {
        
        let name = line;
        
        // Очищаем название
        name = name.replace(/^территория,?\s*/i, '');
        name = name.replace(/прилегающая к/i, '');
        name = name.trim();
        
        if (name.length > 5) {
          return name;
        }
      }
    }

    return '';
  }

  /**
   * Извлекает адрес объекта
   */
  private extractObjectAddress(lines: string[]): string {
    for (const line of lines) {
      if (this.isAddressLine(line)) {
        return this.cleanAddressLine(line);
      }
    }

    // Ищем адрес в составных строках
    const fullText = lines.join(' ');
    const addressMatch = fullText.match(/(по\s+(?:ул\.|пр\.|пер\.|б-р|наб\.|пл\.)[^,]*)/i);
    if (addressMatch) {
      return addressMatch[1].trim();
    }

    return '';
  }

  /**
   * Проверяет, содержит ли строка адрес
   */
  private isAddressLine(line: string): boolean {
    const addressPatterns = [
      /ул\./i, /улица/i, /пр\./i, /проспект/i, /пер\./i, /переулок/i,
      /б-р/i, /бульвар/i, /наб\./i, /набережная/i, /пл\./i, /площадь/i,
      /в районе/i, /по ул\./i, /до ул\./i
    ];
    
    return addressPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Очищает адрес
   */
  private cleanAddressLine(address: string): string {
    return address
      .replace(/^(адрес:?\s*)/i, '')
      .replace(/Общественная территория/gi, '')
      .trim();
  }

  /**
   * Извлекает район
   */
  private extractObjectDistrict(lines: string[]): string {
    for (const line of lines) {
      if (line.includes('район')) {
        const districts = [
          'Центральный', 'Дзержинский', 'Ворошиловский', 'Советский',
          'Тракторозаводский', 'Красноармейский', 'Кировский', 'Краснооктябрьский'
        ];
        
        for (const district of districts) {
          if (line.includes(district)) {
            return district;
          }
        }
      }
    }
    return '';
  }

  /**
   * Извлекает тип объекта из массива строк
   */
  private extractObjectTypeFromLines(lines: string[]): string {
    const fullText = lines.join(' ').toLowerCase();
    
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
      'озеленения': 'парк',
      'благоустройство': 'другое'
    };

    for (const [key, value] of Object.entries(typeMap)) {
      if (fullText.includes(key)) {
        return value;
      }
    }

    return 'другое';
  }

  /**
   * Извлекает описание
   */
  private extractObjectDescription(lines: string[]): string | undefined {
    const relevantLines = lines.filter(line => 
      !line.includes('г.Волгоград') &&
      !line.includes('МБУ') &&
      !line.includes('ООО') &&
      !line.includes('СМР') &&
      !/^\d+$/.test(line) &&
      !/^\d{2}\.\d{2}\.\d{4}/.test(line) &&
      line.length > 10
    );

    if (relevantLines.length > 0) {
      return relevantLines.join(' ').trim();
    }

    return undefined;
  }

  /**
   * Извлекает бюджет
   */
  private extractObjectBudget(lines: string[]): number | undefined {
    for (const line of lines) {
      // Ищем числа с запятой (возможно бюджет в млн)
      const budgetMatch = line.match(/(\d+),(\d+)/);
      if (budgetMatch) {
        const value = parseFloat(`${budgetMatch[1]}.${budgetMatch[2]}`);
        // Предполагаем, что это млн рублей
        return value * 1000000;
      }
    }
    return undefined;
  }

  /**
   * Извлекает дату завершения
   */
  private extractObjectCompletionDate(lines: string[]): string | undefined {
    for (const line of lines) {
      const dateMatch = line.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (dateMatch) {
        return `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      }
    }
    return undefined;
  }

  /**
   * Извлекает подрядчика
   */
  private extractContractor(lines: string[]): string | undefined {
    for (const line of lines) {
      if (line.includes('ООО') || line.includes('ИП') || line.includes('АО')) {
        return line.trim();
      }
    }
    return undefined;
  }

  /**
   * Получает координаты района
   */
  private getDistrictCoordinates(district: string): { lat: number; lng: number } {
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
} 