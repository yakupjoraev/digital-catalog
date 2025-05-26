import { WebScraper, PDFLink } from './webScraper';
import { PDFParser, ObjectData } from './pdfParser';
import * as fs from 'fs';
import * as path from 'path';

export class MainParser {
  private webScraper: WebScraper;
  private pdfParser: PDFParser;
  private outputDir: string;

  constructor() {
    this.webScraper = new WebScraper();
    this.pdfParser = new PDFParser();
    this.outputDir = path.join(__dirname, '../data/output');
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Основной метод парсинга - парсит сайт и извлекает данные из PDF
   */
  async parseVolgogradObjects(): Promise<ObjectData[]> {
    console.log('🚀 Начинаю парсинг объектов благоустройства Волгограда...');
    
    try {
      // 1. Парсим главную страницу проектов
      const mainPageUrl = 'https://www.volgograd.ru/vo-project/obekty-stroitelstva-natsionalnykh-proektov/';
      console.log(`📄 Парсинг главной страницы: ${mainPageUrl}`);
      
      const pdfLinks = await this.webScraper.findPDFLinks(mainPageUrl);
      
      if (pdfLinks.length === 0) {
        console.log('⚠️ PDF ссылки не найдены на главной странице, пробуем альтернативные методы...');
        return await this.parseAlternativeUrls();
      }

      // 2. Обрабатываем найденные PDF ссылки
      const allObjects: ObjectData[] = [];
      
      for (const pdfLink of pdfLinks) {
        console.log(`\n📋 Обрабатываю: ${pdfLink.title}`);
        
        try {
          // Получаем прямую ссылку на PDF если нужно
          let pdfUrl = pdfLink.url;
          if (!pdfUrl.toLowerCase().endsWith('.pdf')) {
            const directUrl = await this.webScraper.getDirectPDFUrl(pdfUrl);
            if (directUrl) {
              pdfUrl = directUrl;
            } else {
              console.log(`⚠️ Не удалось получить прямую ссылку на PDF: ${pdfLink.title}`);
              continue;
            }
          }

          // Скачиваем PDF
          const fileName = this.generateFileName(pdfLink.title);
          const filePath = await this.pdfParser.downloadPDF(pdfUrl, fileName);
          
          // Извлекаем текст
          const text = await this.pdfParser.extractTextFromPDF(filePath);
          
          // Парсим объекты
          const objects = this.pdfParser.parseObjectsFromText(text);
          
          if (objects.length > 0) {
            allObjects.push(...objects);
            console.log(`✅ Извлечено объектов: ${objects.length}`);
          } else {
            console.log(`⚠️ Объекты не найдены в PDF: ${pdfLink.title}`);
          }
          
        } catch (error) {
          console.error(`❌ Ошибка обработки PDF ${pdfLink.title}:`, error);
          continue;
        }
      }

      // 3. Сохраняем результаты
      if (allObjects.length > 0) {
        await this.saveResults(allObjects);
        console.log(`\n🎉 Парсинг завершен! Всего найдено объектов: ${allObjects.length}`);
      } else {
        console.log('\n⚠️ Объекты не найдены');
      }

      return allObjects;

    } catch (error) {
      console.error('❌ Ошибка парсинга:', error);
      return [];
    }
  }

  /**
   * Альтернативный метод парсинга с прямыми ссылками
   */
  async parseAlternativeUrls(): Promise<ObjectData[]> {
    console.log('🔄 Пробуем альтернативные URL...');
    
    const alternativeUrls = [
      'https://www.volgograd.ru/vo-project/obekty-np-2025-2030/',
      'https://www.volgograd.ru/vo-project/obekty-np-2025-2030/!ОБЪЕКТЫ%20БЛАГОУСТРОЙСТВА%2022.05.2025.pdf'
    ];

    const allObjects: ObjectData[] = [];

    for (const url of alternativeUrls) {
      try {
        console.log(`📄 Проверяю URL: ${url}`);
        
        if (url.toLowerCase().endsWith('.pdf')) {
          // Прямая ссылка на PDF
          const fileName = 'objects_direct.pdf';
          const filePath = await this.pdfParser.downloadPDF(url, fileName);
          const text = await this.pdfParser.extractTextFromPDF(filePath);
          const objects = this.pdfParser.parseObjectsFromText(text);
          
          if (objects.length > 0) {
            allObjects.push(...objects);
            console.log(`✅ Извлечено объектов из прямой ссылки: ${objects.length}`);
          }
        } else {
          // Страница с возможными ссылками на PDF
          const pdfLinks = await this.webScraper.parseProjectPage(url);
          
          for (const pdfLink of pdfLinks) {
            try {
              let pdfUrl = pdfLink.url;
              if (!pdfUrl.toLowerCase().endsWith('.pdf')) {
                const directUrl = await this.webScraper.getDirectPDFUrl(pdfUrl);
                if (directUrl) {
                  pdfUrl = directUrl;
                } else {
                  continue;
                }
              }

              const fileName = this.generateFileName(pdfLink.title);
              const filePath = await this.pdfParser.downloadPDF(pdfUrl, fileName);
              const text = await this.pdfParser.extractTextFromPDF(filePath);
              const objects = this.pdfParser.parseObjectsFromText(text);
              
              if (objects.length > 0) {
                allObjects.push(...objects);
                console.log(`✅ Извлечено объектов: ${objects.length}`);
              }
              
            } catch (error) {
              console.error(`❌ Ошибка обработки PDF ${pdfLink.title}:`, error);
              continue;
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Ошибка обработки URL ${url}:`, error);
        continue;
      }
    }

    return allObjects;
  }

  /**
   * Парсит конкретный PDF файл по URL
   */
  async parsePDFByUrl(pdfUrl: string, title?: string): Promise<ObjectData[]> {
    try {
      console.log(`📄 Парсинг PDF: ${pdfUrl}`);
      
      const fileName = this.generateFileName(title || 'manual_pdf');
      const filePath = await this.pdfParser.downloadPDF(pdfUrl, fileName);
      const text = await this.pdfParser.extractTextFromPDF(filePath);
      const objects = this.pdfParser.parseObjectsFromText(text);
      
      if (objects.length > 0) {
        await this.saveResults(objects, `manual_${Date.now()}.json`);
        console.log(`✅ Извлечено объектов: ${objects.length}`);
      }

      return objects;
      
    } catch (error) {
      console.error('❌ Ошибка парсинга PDF:', error);
      return [];
    }
  }

  /**
   * Сохраняет результаты парсинга
   */
  private async saveResults(objects: ObjectData[], filename?: string): Promise<void> {
    try {
      // Сохраняем в JSON
      const jsonFileName = filename || `volgograd_objects_${new Date().toISOString().split('T')[0]}.json`;
      const jsonPath = path.join(this.outputDir, jsonFileName);
      fs.writeFileSync(jsonPath, JSON.stringify(objects, null, 2), 'utf8');
      console.log(`💾 Данные сохранены в JSON: ${jsonPath}`);

      // Сохраняем в CSV для удобства
      const csvFileName = jsonFileName.replace('.json', '.csv');
      const csvPath = path.join(this.outputDir, csvFileName);
      await this.saveToCSV(objects, csvPath);
      console.log(`💾 Данные сохранены в CSV: ${csvPath}`);

      // Создаем отчет
      const reportFileName = jsonFileName.replace('.json', '_report.txt');
      const reportPath = path.join(this.outputDir, reportFileName);
      await this.generateReport(objects, reportPath);
      console.log(`📊 Отчет создан: ${reportPath}`);

    } catch (error) {
      console.error('❌ Ошибка сохранения результатов:', error);
    }
  }

  /**
   * Сохраняет данные в CSV формате
   */
  private async saveToCSV(objects: ObjectData[], filePath: string): Promise<void> {
    const headers = [
      'Название',
      'Адрес', 
      'Район',
      'Тип',
      'Статус',
      'Описание',
      'Площадь',
      'Бюджет',
      'Дата завершения',
      'Широта',
      'Долгота'
    ];

    const csvLines = [headers.join(';')];
    
    for (const obj of objects) {
      const line = [
        this.escapeCsvValue(obj.name),
        this.escapeCsvValue(obj.address),
        this.escapeCsvValue(obj.district),
        this.escapeCsvValue(obj.type),
        this.escapeCsvValue(obj.status),
        this.escapeCsvValue(obj.description || ''),
        obj.area || '',
        obj.budget || '',
        obj.completionDate || '',
        obj.coordinates?.lat || '',
        obj.coordinates?.lng || ''
      ];
      csvLines.push(line.join(';'));
    }

    fs.writeFileSync(filePath, csvLines.join('\n'), 'utf8');
  }

  /**
   * Экранирует значения для CSV
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(';') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Генерирует отчет о парсинге
   */
  private async generateReport(objects: ObjectData[], filePath: string): Promise<void> {
    const report = [
      '=== ОТЧЕТ О ПАРСИНГЕ ОБЪЕКТОВ БЛАГОУСТРОЙСТВА ВОЛГОГРАДА ===',
      `Дата: ${new Date().toLocaleString('ru-RU')}`,
      `Всего объектов: ${objects.length}`,
      '',
      '=== СТАТИСТИКА ПО РАЙОНАМ ===',
    ];

    // Статистика по районам
    const districtStats = objects.reduce((acc, obj) => {
      acc[obj.district] = (acc[obj.district] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [district, count] of Object.entries(districtStats)) {
      report.push(`${district}: ${count} объектов`);
    }

    report.push('', '=== СТАТИСТИКА ПО ТИПАМ ===');

    // Статистика по типам
    const typeStats = objects.reduce((acc, obj) => {
      acc[obj.type] = (acc[obj.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [type, count] of Object.entries(typeStats)) {
      report.push(`${type}: ${count} объектов`);
    }

    report.push('', '=== СТАТИСТИКА ПО СТАТУСАМ ===');

    // Статистика по статусам
    const statusStats = objects.reduce((acc, obj) => {
      acc[obj.status] = (acc[obj.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [status, count] of Object.entries(statusStats)) {
      report.push(`${status}: ${count} объектов`);
    }

    fs.writeFileSync(filePath, report.join('\n'), 'utf8');
  }

  /**
   * Генерирует имя файла из заголовка
   */
  private generateFileName(title: string): string {
    const cleanTitle = title
      .replace(/[^а-яё\w\s]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
    
    return `${cleanTitle}_${Date.now()}.pdf`;
  }

  /**
   * Получает статистику по распарсенным объектам
   */
  getStatistics(objects: ObjectData[]): any {
    return {
      total: objects.length,
      byDistrict: objects.reduce((acc, obj) => {
        acc[obj.district] = (acc[obj.district] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: objects.reduce((acc, obj) => {
        acc[obj.type] = (acc[obj.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: objects.reduce((acc, obj) => {
        acc[obj.status] = (acc[obj.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      withCoordinates: objects.filter(obj => obj.coordinates).length,
      withPhotos: objects.filter(obj => obj.photos && obj.photos.length > 0).length,
      withBudget: objects.filter(obj => obj.budget).length,
      withArea: objects.filter(obj => obj.area).length
    };
  }
} 