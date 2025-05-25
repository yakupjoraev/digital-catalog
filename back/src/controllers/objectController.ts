import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Маппинг русских названий в константы
const typeMapping: Record<string, string> = {
  'парк': 'PARK',
  'сквер': 'SQUARE',
  'детская площадка': 'PLAYGROUND',
  'спортивная площадка': 'SPORTS_GROUND',
  'набережная': 'EMBANKMENT',
  'бульвар': 'BOULEVARD',
  'площадь': 'PLAZA',
  'фонтан': 'FOUNTAIN',
  'памятник': 'MONUMENT',
  'остановка': 'BUS_STOP',
  'другое': 'OTHER'
};

const districtMapping: Record<string, string> = {
  'Центральный': 'CENTRAL',
  'Дзержинский': 'DZERZHINSKY',
  'Ворошиловский': 'VOROSHILOVSKY',
  'Советский': 'SOVETSKY',
  'Тракторозаводский': 'TRAKTOROZAVODSKY',
  'Красноармейский': 'KRASNOARMEYSKY',
  'Кировский': 'KIROVSKY',
  'Краснооктябрьский': 'KRASNOOKTYABRSKY'
};

const statusMapping: Record<string, string> = {
  'активный': 'ACTIVE',
  'на реконструкции': 'UNDER_CONSTRUCTION',
  'планируется': 'PLANNED',
  'закрыт': 'CLOSED'
};

// Обратный маппинг для отображения
const typeDisplayMapping: Record<string, string> = {
  'PARK': 'парк',
  'SQUARE': 'сквер',
  'PLAYGROUND': 'детская площадка',
  'SPORTS_GROUND': 'спортивная площадка',
  'EMBANKMENT': 'набережная',
  'BOULEVARD': 'бульвар',
  'PLAZA': 'площадь',
  'FOUNTAIN': 'фонтан',
  'MONUMENT': 'памятник',
  'BUS_STOP': 'остановка',
  'OTHER': 'другое'
};

const districtDisplayMapping: Record<string, string> = {
  'CENTRAL': 'Центральный',
  'DZERZHINSKY': 'Дзержинский',
  'VOROSHILOVSKY': 'Ворошиловский',
  'SOVETSKY': 'Советский',
  'TRAKTOROZAVODSKY': 'Тракторозаводский',
  'KRASNOARMEYSKY': 'Красноармейский',
  'KIROVSKY': 'Кировский',
  'KRASNOOKTYABRSKY': 'Краснооктябрьский'
};

const statusDisplayMapping: Record<string, string> = {
  'ACTIVE': 'активный',
  'UNDER_CONSTRUCTION': 'на реконструкции',
  'PLANNED': 'планируется',
  'CLOSED': 'закрыт'
};

// Функция для преобразования объекта для отображения
function transformObjectForDisplay(obj: any) {
  return {
    ...obj,
    type: typeDisplayMapping[obj.type] || obj.type,
    district: districtDisplayMapping[obj.district] || obj.district,
    status: statusDisplayMapping[obj.status] || obj.status,
    photos: obj.photos ? JSON.parse(obj.photos) : [],
    coordinates: {
      lat: obj.latitude,
      lng: obj.longitude
    }
  };
}

// Получить все объекты с фильтрацией и поиском
export const getObjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      district, 
      type, 
      status, 
      search, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Построение фильтра
    const where: any = {};
    
    if (district && districtMapping[district as string]) {
      where.district = districtMapping[district as string];
    }
    if (type && typeMapping[type as string]) {
      where.type = typeMapping[type as string];
    }
    if (status && statusMapping[status as string]) {
      where.status = statusMapping[status as string];
    }
    
    // Текстовый поиск
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
        { address: { contains: search as string } }
      ];
    }

    // Пагинация
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Сортировка
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder === 'asc' ? 'asc' : 'desc';

    // Выполнение запроса
    const objects = await prisma.object.findMany({
      where,
      orderBy,
      skip,
      take: limitNum
    });

    // Подсчет общего количества
    const total = await prisma.object.count({ where });

    // Преобразование для отображения
    const transformedObjects = objects.map(transformObjectForDisplay);

    res.json({
      success: true,
      data: transformedObjects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Ошибка получения объектов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения объектов'
    });
  }
};

// Получить объект по ID
export const getObjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const object = await prisma.object.findUnique({
      where: { id }
    });
    
    if (!object) {
      res.status(404).json({
        success: false,
        error: 'Объект не найден'
      });
      return;
    }

    const transformedObject = transformObjectForDisplay(object);

    res.json({
      success: true,
      data: transformedObject
    });
  } catch (error) {
    console.error('Ошибка получения объекта:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения объекта'
    });
  }
};

// Создать новый объект (только для админов)
export const createObject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, 
      type, 
      district, 
      address, 
      description, 
      photos = [], 
      yearBuilt, 
      coordinates, 
      status = 'активный', 
      source 
    } = req.body;

    // Валидация обязательных полей
    if (!name || !type || !district || !address || !description || !coordinates || !source) {
      res.status(400).json({
        success: false,
        error: 'Не все обязательные поля заполнены'
      });
      return;
    }

    // Преобразование в константы
    const objectType = typeMapping[type];
    const objectDistrict = districtMapping[district];
    const objectStatus = statusMapping[status];

    if (!objectType || !objectDistrict || !objectStatus) {
      res.status(400).json({
        success: false,
        error: 'Некорректные значения типа, района или статуса'
      });
      return;
    }

    const newObject = await prisma.object.create({
      data: {
        name,
        type: objectType,
        district: objectDistrict,
        address,
        description,
        photos: JSON.stringify(photos),
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
        latitude: parseFloat(coordinates.lat),
        longitude: parseFloat(coordinates.lng),
        status: objectStatus,
        source
      }
    });

    const transformedObject = transformObjectForDisplay(newObject);

    res.status(201).json({
      success: true,
      data: transformedObject,
      message: 'Объект успешно создан'
    });
  } catch (error: any) {
    console.error('Ошибка создания объекта:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка создания объекта'
    });
  }
};

// Обновить объект (только для админов)
export const updateObject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Преобразование данных если нужно
    if (updateData.type && typeMapping[updateData.type]) {
      updateData.type = typeMapping[updateData.type];
    }
    if (updateData.district && districtMapping[updateData.district]) {
      updateData.district = districtMapping[updateData.district];
    }
    if (updateData.status && statusMapping[updateData.status]) {
      updateData.status = statusMapping[updateData.status];
    }
    if (updateData.coordinates) {
      updateData.latitude = parseFloat(updateData.coordinates.lat);
      updateData.longitude = parseFloat(updateData.coordinates.lng);
      delete updateData.coordinates;
    }
    if (updateData.photos && Array.isArray(updateData.photos)) {
      updateData.photos = JSON.stringify(updateData.photos);
    }

    const object = await prisma.object.update({
      where: { id },
      data: updateData
    });

    const transformedObject = transformObjectForDisplay(object);

    res.json({
      success: true,
      data: transformedObject,
      message: 'Объект успешно обновлен'
    });
  } catch (error: any) {
    console.error('Ошибка обновления объекта:', error);
    
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Объект не найден'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Ошибка обновления объекта'
    });
  }
};

// Удалить объект (только для админов)
export const deleteObject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.object.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Объект успешно удален'
    });
  } catch (error: any) {
    console.error('Ошибка удаления объекта:', error);
    
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Объект не найден'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Ошибка удаления объекта'
    });
  }
};

// Получить статистику объектов
export const getObjectsStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalObjects = await prisma.object.count();
    
    // Статистика по районам
    const statsByDistrict = await prisma.object.groupBy({
      by: ['district'],
      _count: { district: true }
    });

    // Статистика по типам
    const statsByType = await prisma.object.groupBy({
      by: ['type'],
      _count: { type: true }
    });

    // Статистика по статусам
    const statsByStatus = await prisma.object.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    // Преобразование для отображения
    const transformedDistrictStats = statsByDistrict.map((stat: any) => ({
      _id: districtDisplayMapping[stat.district] || stat.district,
      count: stat._count.district
    }));

    const transformedTypeStats = statsByType.map((stat: any) => ({
      _id: typeDisplayMapping[stat.type] || stat.type,
      count: stat._count.type
    }));

    const transformedStatusStats = statsByStatus.map((stat: any) => ({
      _id: statusDisplayMapping[stat.status] || stat.status,
      count: stat._count.status
    }));

    res.json({
      success: true,
      data: {
        total: totalObjects,
        byDistrict: transformedDistrictStats,
        byType: transformedTypeStats,
        byStatus: transformedStatusStats
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения статистики'
    });
  }
};

// Поиск объектов рядом с координатами
export const getObjectsNearby = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, maxDistance = 1000 } = req.query;

    if (!lat || !lng) {
      res.status(400).json({
        success: false,
        error: 'Необходимо указать координаты (lat, lng)'
      });
      return;
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const distance = parseInt(maxDistance as string);

    // Простой расчет расстояния (для более точного нужна специальная функция)
    // Примерно 1 градус = 111 км
    const latRange = distance / 111000; // в градусах
    const lngRange = distance / (111000 * Math.cos(latitude * Math.PI / 180));

    const objects = await prisma.object.findMany({
      where: {
        latitude: {
          gte: latitude - latRange,
          lte: latitude + latRange
        },
        longitude: {
          gte: longitude - lngRange,
          lte: longitude + lngRange
        }
      }
    });

    const transformedObjects = objects.map(transformObjectForDisplay);

    res.json({
      success: true,
      data: transformedObjects
    });
  } catch (error) {
    console.error('Ошибка поиска объектов рядом:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка поиска объектов рядом'
    });
  }
}; 