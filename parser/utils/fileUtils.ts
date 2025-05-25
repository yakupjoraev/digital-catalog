import fs from 'fs/promises';
import path from 'path';

// Сохранение данных в JSON файл
export async function saveToFile(data: any, filePath: string): Promise<void> {
  try {
    // Создаем директорию если её нет
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Сохраняем данные в красивом формате
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf-8');
    
    console.log(`✅ Данные сохранены в ${filePath}`);
  } catch (error) {
    console.error(`❌ Ошибка сохранения в ${filePath}:`, error);
    throw error;
  }
}

// Чтение данных из JSON файла
export async function readFromFile(filePath: string): Promise<any> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Ошибка чтения ${filePath}:`, error);
    throw error;
  }
}

// Проверка существования файла
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Создание резервной копии файла
export async function createBackup(filePath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup.${timestamp}`;
  
  try {
    await fs.copyFile(filePath, backupPath);
    console.log(`📋 Создана резервная копия: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error(`❌ Ошибка создания резервной копии:`, error);
    throw error;
  }
} 