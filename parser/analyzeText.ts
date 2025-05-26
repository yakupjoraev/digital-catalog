#!/usr/bin/env node

import { PDFParser } from './services/pdfParser';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeText() {
  console.log('🔍 Анализ структуры текста PDF');
  console.log('=' .repeat(50));

  try {
    // Используем уже скачанный PDF файл
    const downloadsDir = path.join(__dirname, 'data/downloads');
    const files = fs.readdirSync(downloadsDir)
      .filter(file => file.endsWith('.pdf'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log('❌ PDF файлы не найдены');
      return;
    }

    const latestPDF = files[0];
    const pdfPath = path.join(downloadsDir, latestPDF);
    
    console.log(`📄 Анализируем PDF: ${latestPDF}`);

    const parser = new PDFParser();
    const text = await parser.extractTextFromPDF(pdfPath);

    console.log(`\n📊 Общая статистика:`);
    console.log(`Всего символов: ${text.length}`);
    
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    console.log(`Всего строк: ${lines.length}`);

    // Анализируем структуру
    console.log(`\n🔍 Анализ структуры:`);
    
    // Ищем заголовки
    const headers = lines.filter(line => 
      line.includes('ОБЪЕКТ') || 
      line.includes('БЛАГОУСТРОЙСТВ') ||
      line.includes('№') ||
      line.includes('Адрес') ||
      line.includes('Заказчик')
    );
    
    console.log(`Потенциальные заголовки: ${headers.length}`);
    headers.slice(0, 5).forEach((header, i) => {
      console.log(`  ${i + 1}. ${header.substring(0, 80)}...`);
    });

    // Ищем строки с датами
    const datesLines = lines.filter(line => 
      /\d{2}\.\d{2}\.\d{4}/.test(line) || 
      /\d{4}/.test(line)
    );
    
    console.log(`\nСтроки с датами: ${datesLines.length}`);
    datesLines.slice(0, 5).forEach((line, i) => {
      console.log(`  ${i + 1}. ${line.substring(0, 80)}...`);
    });

    // Ищем строки с адресами
    const addressLines = lines.filter(line => 
      /ул\.|пр\.|пер\.|б-р|наб\.|пл\./i.test(line)
    );
    
    console.log(`\nСтроки с адресами: ${addressLines.length}`);
    addressLines.slice(0, 5).forEach((line, i) => {
      console.log(`  ${i + 1}. ${line.substring(0, 80)}...`);
    });

    // Ищем строки с районами
    const districtLines = lines.filter(line => {
      const districts = ['Центральный', 'Дзержинский', 'Ворошиловский', 'Советский',
                        'Тракторозаводский', 'Красноармейский', 'Кировский', 'Краснооктябрьский'];
      return districts.some(district => line.includes(district));
    });
    
    console.log(`\nСтроки с районами: ${districtLines.length}`);
    districtLines.slice(0, 5).forEach((line, i) => {
      console.log(`  ${i + 1}. ${line.substring(0, 80)}...`);
    });

    // Ищем строки с числами (возможно бюджет)
    const numberLines = lines.filter(line => 
      /\d+[,\.]?\d*\s*(млн|тыс|руб)/i.test(line)
    );
    
    console.log(`\nСтроки с числами (бюджет): ${numberLines.length}`);
    numberLines.slice(0, 5).forEach((line, i) => {
      console.log(`  ${i + 1}. ${line.substring(0, 80)}...`);
    });

    // Показываем первые 20 строк для понимания структуры
    console.log(`\n📝 Первые 20 строк документа:`);
    lines.slice(0, 20).forEach((line, i) => {
      console.log(`${(i + 1).toString().padStart(2, '0')}. ${line.substring(0, 100)}`);
    });

    // Сохраняем анализ в файл
    const analysisPath = path.join(__dirname, 'data/output', 'text_analysis.txt');
    const analysisContent = [
      '=== АНАЛИЗ СТРУКТУРЫ PDF ТЕКСТА ===',
      `Файл: ${latestPDF}`,
      `Дата анализа: ${new Date().toLocaleString('ru-RU')}`,
      '',
      `Всего символов: ${text.length}`,
      `Всего строк: ${lines.length}`,
      '',
      '=== ЗАГОЛОВКИ ===',
      ...headers.slice(0, 10),
      '',
      '=== СТРОКИ С ДАТАМИ ===',
      ...datesLines.slice(0, 10),
      '',
      '=== СТРОКИ С АДРЕСАМИ ===',
      ...addressLines.slice(0, 10),
      '',
      '=== СТРОКИ С РАЙОНАМИ ===',
      ...districtLines.slice(0, 10),
      '',
      '=== ПЕРВЫЕ 50 СТРОК ===',
      ...lines.slice(0, 50).map((line, i) => `${(i + 1).toString().padStart(3, '0')}. ${line}`)
    ].join('\n');

    fs.writeFileSync(analysisPath, analysisContent, 'utf8');
    console.log(`\n💾 Анализ сохранен в: ${analysisPath}`);

  } catch (error) {
    console.error('❌ Ошибка анализа:', error);
  }
}

// Запуск
if (require.main === module) {
  analyzeText();
} 