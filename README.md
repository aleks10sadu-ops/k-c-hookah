# Kucher&Conga - Telegram Mini App для управления табаком

Telegram Mini App для учёта табака и миксов в кальянной ресторана Kucher&Conga.

## Технологический стек

- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **База данных**: Supabase (PostgreSQL)
- **Аутентификация**: Telegram Mini App authentication
- **Real-time**: Supabase Realtime
- **Хостинг**: Vercel

## Функциональность

### 🗂️ Модуль "Табаки"
- Просмотр всех табаков с изображениями
- Добавление и редактирование табаков
- Управление остатками (граммы)
- Real-time синхронизация изменений

### 🎨 Модуль "Микс"
- Создание миксов из нескольких табаков
- Два режима ввода: граммы и проценты
- Автоматический пересчёт между режимами
- Проверка достаточности табака на складе
- Сохранение миксов как шаблонов
- Автоматическое вычитание табака из остатков

### 📊 Модуль "Статистика"
- Статистика по кальянщикам (сегодня, неделя, месяц, всего)
- Статистика по табакам (использование, остатки, популярность)
- Визуализация топ-5 используемых табаков
- Фильтрация по периодам
- Сортировка по любой колонке

## Установка и настройка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd k-c-hookah
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

Создайте файл `.env.local` на основе `.env.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
```

### 4. Настройка Supabase

1. Создайте проект в [Supabase](https://supabase.com)
2. Выполните SQL скрипт из `supabase/schema.sql` в SQL Editor
3. Скопируйте URL и Anon Key в `.env.local`

### 5. Настройка Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Настройте Mini App:
   - Используйте команду `/newapp` в BotFather
   - Укажите URL вашего приложения (после деплоя на Vercel)
4. Добавьте токен в `.env.local`

### 6. Запуск в режиме разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Деплой на Vercel

1. Подключите репозиторий к Vercel
2. Добавьте переменные окружения в настройках проекта
3. Деплой произойдёт автоматически

## Структура проекта

```
/app
  /api          # API routes
  /tobacco      # Страница табаков
  /mix          # Страница создания микса
  /statistics   # Страница статистики
/components
  /tobacco      # Компоненты модуля табаков
  /mix          # Компоненты модуля миксов
  /statistics   # Компоненты модуля статистики
  /ui           # Базовые UI компоненты
/lib
  /supabase     # Supabase клиенты
  telegram.ts   # Telegram утилиты
/types          # TypeScript типы
```

## API Endpoints

### Аутентификация
- `POST /api/auth/telegram` - Аутентификация через Telegram

### Табаки
- `GET /api/tobacco` - Получить все табаки
- `POST /api/tobacco` - Создать табак
- `PATCH /api/tobacco` - Обновить табак
- `DELETE /api/tobacco?id={id}` - Удалить табак

### Миксы
- `GET /api/mixes?template=true` - Получить миксы (с фильтрацией шаблонов)
- `POST /api/mixes` - Создать микс

### Статистика
- `GET /api/statistics/hookahs?period={period}` - Статистика по кальянщикам
- `GET /api/statistics/tobacco?period={period}` - Статистика по табакам

## Безопасность

- Row Level Security (RLS) настроен для всех таблиц
- Валидация Telegram initData на сервере
- Валидация всех входных данных через Zod
- Проверка достаточности табака перед созданием микса

## Разработка

### Проверка типов

```bash
npm run type-check
```

### Линтинг

```bash
npm run lint
```

## Лицензия

MIT

