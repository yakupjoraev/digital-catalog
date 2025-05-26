import { ObjectData } from './services/pdfParser';

export const testObjects: ObjectData[] = [
  {
    name: "Парк Победы",
    address: "ул. Маршала Чуйкова, 47",
    district: "Центральный",
    type: "парк",
    status: "активный",
    description: "Благоустройство центральной части парка с установкой новых скамеек, фонтанов и детских площадок",
    coordinates: {
      lat: 48.7194,
      lng: 44.5018
    },
    photos: [],
    area: 15000,
    budget: 25000000,
    completionDate: "2024"
  },
  {
    name: "Сквер имени Гагарина",
    address: "пр. Ленина, 15",
    district: "Дзержинский",
    type: "сквер",
    status: "на реконструкции",
    description: "Реконструкция сквера с обновлением дорожек и озеленением",
    coordinates: {
      lat: 48.7080,
      lng: 44.5133
    },
    photos: [],
    area: 8500,
    budget: 12000000,
    completionDate: "2025"
  },
  {
    name: "Детская площадка на ул. Мира",
    address: "ул. Мира, 32",
    district: "Ворошиловский",
    type: "детская площадка",
    status: "активный",
    description: "Современная детская площадка с безопасным покрытием и новым игровым оборудованием",
    coordinates: {
      lat: 48.7342,
      lng: 44.5456
    },
    photos: [],
    area: 1200,
    budget: 3500000,
    completionDate: "2024"
  },
  {
    name: "Спортивная площадка Школы №85",
    address: "ул. Советская, 78",
    district: "Советский",
    type: "спортивная площадка",
    status: "планируется",
    description: "Строительство многофункциональной спортивной площадки для школы",
    coordinates: {
      lat: 48.6987,
      lng: 44.4821
    },
    photos: [],
    area: 2800,
    budget: 8000000,
    completionDate: "2025"
  },
  {
    name: "Набережная Волги (участок 3)",
    address: "Набережная 62-й Армии",
    district: "Центральный",
    type: "набережная",
    status: "активный",
    description: "Благоустройство участка набережной с установкой освещения и малых архитектурных форм",
    coordinates: {
      lat: 48.7156,
      lng: 44.4987
    },
    photos: [],
    area: 25000,
    budget: 45000000,
    completionDate: "2024"
  },
  {
    name: "Бульвар Энгельса",
    address: "ул. Энгельса",
    district: "Красноармейский",
    type: "бульвар",
    status: "на реконструкции",
    description: "Реконструкция бульвара с обновлением пешеходных дорожек и зеленых насаждений",
    coordinates: {
      lat: 48.7234,
      lng: 44.5234
    },
    photos: [],
    area: 12000,
    budget: 18000000,
    completionDate: "2025"
  },
  {
    name: "Площадь Павших Борцов",
    address: "пл. Павших Борцов",
    district: "Центральный",
    type: "площадь",
    status: "активный",
    description: "Благоустройство центральной площади города с обновлением мемориального комплекса",
    coordinates: {
      lat: 48.7081,
      lng: 44.5153
    },
    photos: [],
    area: 18000,
    budget: 35000000,
    completionDate: "2024"
  },
  {
    name: "Парк Металлургов",
    address: "ул. Металлургов, 5",
    district: "Краснооктябрьский",
    type: "парк",
    status: "планируется",
    description: "Создание нового парка в промышленном районе с зонами отдыха и спорта",
    coordinates: {
      lat: 48.7456,
      lng: 44.4567
    },
    photos: [],
    area: 22000,
    budget: 40000000,
    completionDate: "2026"
  },
  {
    name: "Сквер у ДК Тракторостроителей",
    address: "ул. Тракторостроителей, 15",
    district: "Тракторозаводский",
    type: "сквер",
    status: "активный",
    description: "Благоустройство сквера возле Дворца культуры с новыми клумбами и скамейками",
    coordinates: {
      lat: 48.7789,
      lng: 44.5678
    },
    photos: [],
    area: 6500,
    budget: 9500000,
    completionDate: "2024"
  },
  {
    name: "Детская площадка в микрорайоне Спартановка",
    address: "ул. Спартановская, 12",
    district: "Кировский",
    type: "детская площадка",
    status: "на реконструкции",
    description: "Модернизация детской площадки с установкой современного оборудования",
    coordinates: {
      lat: 48.6789,
      lng: 44.4123
    },
    photos: [],
    area: 1800,
    budget: 4200000,
    completionDate: "2025"
  }
];

export function saveTestData(): void {
  const fs = require('fs');
  const path = require('path');
  
  const outputDir = path.join(__dirname, 'data/output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filePath = path.join(outputDir, 'test_objects.json');
  fs.writeFileSync(filePath, JSON.stringify(testObjects, null, 2), 'utf8');
  
  console.log(`✅ Тестовые данные сохранены: ${filePath}`);
  console.log(`📊 Создано объектов: ${testObjects.length}`);
} 