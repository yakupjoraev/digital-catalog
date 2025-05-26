import axios from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';

export interface PDFLink {
  url: string;
  title: string;
  description?: string;
}

export class WebScraper {
  private baseUrl: string;
  private httpsAgent: https.Agent;

  constructor() {
    this.baseUrl = 'https://www.volgograd.ru';
    // Создаем HTTPS агент с игнорированием SSL ошибок
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
  }

  /**
   * Парсит главную страницу проектов и ищет ссылки на PDF с объектами благоустройства
   */
  async findPDFLinks(pageUrl: string): Promise<PDFLink[]> {
    try {
      console.log(`🔍 Парсинг страницы: ${pageUrl}`);
      
      const response = await axios.get(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        httpsAgent: this.httpsAgent,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const pdfLinks: PDFLink[] = [];

      // Ищем ссылки на PDF файлы
      $('a[href*=".pdf"], a[href*="PDF"]').each((index, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const title = $link.text().trim() || $link.attr('title') || '';
        
        if (href) {
          let fullUrl = href;
          
          // Если ссылка относительная, делаем её абсолютной
          if (href.startsWith('/')) {
            fullUrl = this.baseUrl + href;
          } else if (!href.startsWith('http')) {
            fullUrl = this.baseUrl + '/' + href;
          }

          // Фильтруем только PDF с объектами благоустройства
          if (this.isRelevantPDF(title, href)) {
            pdfLinks.push({
              url: fullUrl,
              title: title,
              description: this.extractDescription($link)
            });
          }
        }
      });

      // Также ищем ссылки в тексте, которые могут содержать "благоустройство"
      $('a').each((index, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const text = $link.text().toLowerCase();
        
        if (href && text.includes('благоустройство')) {
          let fullUrl = href;
          
          if (href.startsWith('/')) {
            fullUrl = this.baseUrl + href;
          } else if (!href.startsWith('http')) {
            fullUrl = this.baseUrl + '/' + href;
          }

          // Проверяем, не добавили ли мы уже эту ссылку
          const exists = pdfLinks.some(link => link.url === fullUrl);
          if (!exists) {
            pdfLinks.push({
              url: fullUrl,
              title: $link.text().trim(),
              description: this.extractDescription($link)
            });
          }
        }
      });

      console.log(`✅ Найдено PDF ссылок: ${pdfLinks.length}`);
      return pdfLinks;

    } catch (error) {
      console.error('❌ Ошибка парсинга веб-страницы:', error);
      return [];
    }
  }

  /**
   * Проверяет, относится ли PDF к объектам благоустройства
   */
  private isRelevantPDF(title: string, href: string): boolean {
    const keywords = [
      'благоустройство',
      'объекты благоустройства',
      'парк',
      'сквер',
      'площадка',
      'набережная',
      'бульвар'
    ];

    const text = (title + ' ' + href).toLowerCase();
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Извлекает описание из контекста ссылки
   */
  private extractDescription($link: any): string | undefined {
    // Ищем описание в родительских элементах
    const parent = $link.parent();
    const description = parent.text().trim();
    
    if (description && description.length > $link.text().trim().length) {
      return description;
    }

    return undefined;
  }

  /**
   * Получает прямую ссылку на PDF из страницы
   */
  async getDirectPDFUrl(pageUrl: string): Promise<string | null> {
    try {
      console.log(`🔗 Получаю прямую ссылку на PDF: ${pageUrl}`);
      
      // Если это уже прямая ссылка на PDF
      if (pageUrl.toLowerCase().endsWith('.pdf')) {
        return pageUrl;
      }

      const response = await axios.get(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        httpsAgent: this.httpsAgent,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Ищем первую ссылку на PDF
      const pdfLink = $('a[href*=".pdf"]').first();
      if (pdfLink.length > 0) {
        const href = pdfLink.attr('href');
        if (href) {
          if (href.startsWith('/')) {
            return this.baseUrl + href;
          } else if (!href.startsWith('http')) {
            return this.baseUrl + '/' + href;
          }
          return href;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Ошибка получения прямой ссылки на PDF:', error);
      return null;
    }
  }

  /**
   * Парсит конкретную страницу проекта для поиска актуальных PDF
   */
  async parseProjectPage(projectUrl: string): Promise<PDFLink[]> {
    try {
      console.log(`📄 Парсинг страницы проекта: ${projectUrl}`);
      
      const response = await axios.get(projectUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        httpsAgent: this.httpsAgent,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const pdfLinks: PDFLink[] = [];

      // Ищем все ссылки на PDF
      $('a[href*=".pdf"]').each((index, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const title = $link.text().trim();
        
        if (href) {
          let fullUrl = href;
          
          if (href.startsWith('/')) {
            fullUrl = this.baseUrl + href;
          } else if (!href.startsWith('http')) {
            fullUrl = this.baseUrl + '/' + href;
          }

          pdfLinks.push({
            url: fullUrl,
            title: title || 'PDF документ',
            description: this.extractDescription($link)
          });
        }
      });

      // Ищем ссылки в таблицах и списках
      $('table a, ul a, ol a').each((index, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const text = $link.text().toLowerCase();
        
        if (href && (text.includes('благоустройство') || text.includes('объект'))) {
          let fullUrl = href;
          
          if (href.startsWith('/')) {
            fullUrl = this.baseUrl + href;
          } else if (!href.startsWith('http')) {
            fullUrl = this.baseUrl + '/' + href;
          }

          const exists = pdfLinks.some(link => link.url === fullUrl);
          if (!exists) {
            pdfLinks.push({
              url: fullUrl,
              title: $link.text().trim(),
              description: this.extractDescription($link)
            });
          }
        }
      });

      console.log(`✅ Найдено ссылок на странице проекта: ${pdfLinks.length}`);
      return pdfLinks;

    } catch (error) {
      console.error('❌ Ошибка парсинга страницы проекта:', error);
      return [];
    }
  }
} 