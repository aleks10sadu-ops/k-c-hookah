# Ручная настройка Supabase Storage

Если SQL скрипт не работает из-за прав доступа, выполните настройку через веб-интерфейс:

## Шаг 1: Создание Bucket

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в **Storage** (в левом меню)
4. Нажмите **New bucket**
5. Заполните:
   - **Name**: `tobacco-images`
   - **Public bucket**: включите (галочка)
6. Нажмите **Create bucket**

## Шаг 2: Настройка политик (Policies)

1. Откройте созданный bucket `tobacco-images`
2. Перейдите на вкладку **Policies**
3. Нажмите **New Policy**

### Политика 1: Публичное чтение

- **Policy name**: `Public Access`
- **Allowed operation**: `SELECT`
- **Policy definition**:
```sql
(bucket_id = 'tobacco-images')
```

### Политика 2: Загрузка файлов

- **Policy name**: `Allow uploads`
- **Allowed operation**: `INSERT`
- **Policy definition**:
```sql
(bucket_id = 'tobacco-images')
```

### Политика 3: Обновление файлов

- **Policy name**: `Allow updates`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
```sql
(bucket_id = 'tobacco-images')
```

### Политика 4: Удаление файлов

- **Policy name**: `Allow deletes`
- **Allowed operation**: `DELETE`
- **Policy definition**:
```sql
(bucket_id = 'tobacco-images')
```

## Альтернатива: Использование SQL Editor с правильными правами

Если у вас есть доступ к SQL Editor с правами суперпользователя, выполните:

```sql
-- Создание bucket (если не создан через Dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tobacco-images', 'tobacco-images', true)
ON CONFLICT (id) DO NOTHING;

-- Политики (создаются автоматически или через Dashboard)
```

## Проверка

После настройки попробуйте загрузить изображение в приложении. Если ошибка сохраняется, проверьте:

1. Bucket создан и помечен как публичный
2. Все 4 политики созданы
3. `SUPABASE_SERVICE_ROLE_KEY` установлен в `.env.local`

