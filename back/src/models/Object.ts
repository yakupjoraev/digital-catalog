import mongoose, { Document, Schema } from 'mongoose';

// Интерфейс для объекта благоустройства
export interface IObject extends Document {
  name: string;
  type: string;
  district: string;
  address: string;
  description: string;
  photos: string[];
  yearBuilt?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: 'активный' | 'на реконструкции' | 'планируется' | 'закрыт';
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

// Схема объекта благоустройства
const ObjectSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Название объекта обязательно'],
    trim: true,
    maxlength: [200, 'Название не может быть длиннее 200 символов']
  },
  type: {
    type: String,
    required: [true, 'Тип объекта обязателен'],
    enum: [
      'парк',
      'сквер', 
      'детская площадка',
      'спортивная площадка',
      'набережная',
      'бульвар',
      'площадь',
      'фонтан',
      'памятник',
      'остановка',
      'другое'
    ]
  },
  district: {
    type: String,
    required: [true, 'Район обязателен'],
    enum: [
      'Центральный',
      'Дзержинский', 
      'Ворошиловский',
      'Советский',
      'Тракторозаводский',
      'Красноармейский',
      'Кировский',
      'Краснооктябрьский'
    ]
  },
  address: {
    type: String,
    required: [true, 'Адрес обязателен'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Описание обязательно'],
    maxlength: [2000, 'Описание не может быть длиннее 2000 символов']
  },
  photos: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(v);
      },
      message: 'Некорректный URL изображения'
    }
  }],
  yearBuilt: {
    type: Number,
    min: [1900, 'Год не может быть раньше 1900'],
    max: [new Date().getFullYear() + 5, 'Год не может быть в далеком будущем']
  },
  coordinates: {
    lat: {
      type: Number,
      required: [true, 'Широта обязательна'],
      min: [-90, 'Широта должна быть между -90 и 90'],
      max: [90, 'Широта должна быть между -90 и 90']
    },
    lng: {
      type: Number,
      required: [true, 'Долгота обязательна'],
      min: [-180, 'Долгота должна быть между -180 и 180'],
      max: [180, 'Долгота должна быть между -180 и 180']
    }
  },
  status: {
    type: String,
    required: [true, 'Статус обязателен'],
    enum: ['активный', 'на реконструкции', 'планируется', 'закрыт'],
    default: 'активный'
  },
  source: {
    type: String,
    required: [true, 'Источник данных обязателен'],
    trim: true
  }
}, {
  timestamps: true, // автоматически добавляет createdAt и updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Индексы для оптимизации поиска
ObjectSchema.index({ district: 1 });
ObjectSchema.index({ type: 1 });
ObjectSchema.index({ name: 'text', description: 'text' });
ObjectSchema.index({ coordinates: '2dsphere' }); // для геопространственных запросов

// Виртуальные поля
ObjectSchema.virtual('fullAddress').get(function() {
  return `г. Волгоград, ${this.district} район, ${this.address}`;
});

// Middleware для обновления updatedAt
ObjectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IObject>('Object', ObjectSchema); 