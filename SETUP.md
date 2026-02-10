# Инструкция по настройке проекта

## Шаг 1: Установка зависимостей

```bash
npm install
```

## Шаг 2: Настройка Supabase

1. Создайте аккаунт на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Перейдите в SQL Editor
4. Выполните SQL скрипт из файла `supabase/schema.sql`
5. Настройте Storage для изображений (см. `supabase/storage-setup-manual.md`):
   - Создайте bucket `tobacco-images` через веб-интерфейс (Storage → New bucket)
   - Настройте политики доступа через Dashboard
6. Скопируйте:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY` (из Settings → API)

## Шаг 3: Настройка Telegram Bot

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Создайте нового бота командой `/newbot`
3. Следуйте инструкциям и получите токен бота
4. Создайте Mini App командой `/newapp`
5. Укажите:
   - Название приложения
   - Описание
   - URL (после деплоя на Vercel)
   - Иконку (опционально)
6. Скопируйте токен бота → `TELEGRAM_BOT_TOKEN`
7. Скопируйте username бота → `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`

## Шаг 4: Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

TELEGRAM_BOT_TOKEN=your-bot-token
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
```

## Шаг 5: Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

**Примечание**: Для полноценной работы Telegram Mini App нужно запускать через Telegram. В браузере будет работать в режиме разработки с мок-данными.

## Шаг 6: Деплой на Vercel

1. Установите Vercel CLI: `npm i -g vercel`
2. Войдите в аккаунт: `vercel login`
3. Деплой: `vercel`
4. Добавьте переменные окружения в настройках проекта на Vercel
5. Обновите URL Mini App в BotFather

## Проверка работы

1. Откройте бота в Telegram
2. Нажмите на кнопку Mini App
3. Приложение должно открыться и работать

## Возможные проблемы

### Ошибка аутентификации
- Проверьте правильность `TELEGRAM_BOT_TOKEN`
- Убедитесь, что URL Mini App в BotFather совпадает с URL на Vercel

### Ошибки базы данных
- Проверьте выполнение SQL скрипта
- Убедитесь, что RLS политики созданы
- Проверьте правильность ключей Supabase

### Real-time не работает
- Убедитесь, что Realtime включен в настройках Supabase проекта
- Проверьте подписки на каналы в коде

### Ошибки загрузки изображений
- Убедитесь, что выполнен SQL скрипт `supabase/storage-setup.sql`
- Проверьте, что bucket `tobacco-images` создан в Storage
- Проверьте политики доступа к Storage (должны быть разрешены чтение и запись)

