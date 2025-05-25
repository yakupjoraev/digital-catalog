import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Интерфейс для пользователя
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Схема пользователя
const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: [true, 'Имя пользователя обязательно'],
    unique: true,
    trim: true,
    minlength: [3, 'Имя пользователя должно быть не менее 3 символов'],
    maxlength: [30, 'Имя пользователя не может быть длиннее 30 символов'],
    match: [/^[a-zA-Z0-9_]+$/, 'Имя пользователя может содержать только буквы, цифры и подчеркивания']
  },
  email: {
    type: String,
    required: [true, 'Email обязателен'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Некорректный формат email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Пароль обязателен'],
    minlength: [6, 'Пароль должен быть не менее 6 символов'],
    select: false // по умолчанию не включать пароль в запросы
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Индексы
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

// Middleware для хеширования пароля перед сохранением
UserSchema.pre('save', async function(next) {
  // Хешировать пароль только если он был изменен
  if (!this.isModified('password')) return next();
  
  try {
    // Хеширование пароля
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Метод для сравнения паролей
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Виртуальное поле для отображения роли на русском
UserSchema.virtual('roleRu').get(function() {
  return this.role === 'admin' ? 'Администратор' : 'Пользователь';
});

export default mongoose.model<IUser>('User', UserSchema); 