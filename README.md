# debet2 — Результаты деятельности

Мобильное приложение на **Expo SDK 57** / React Native для учёта доходов и расходов в разрезе проектов с распределением постоянных и долгоиграющих расходов.

## Возможности

- Учёт доходов и прямых расходов по проектам
- Постоянные и долгоиграющие расходы с правилами распределения
- Отчёт «Результаты деятельности» за месяц / квартал / произвольный период
- Экспорт отчёта в CSV (UTF-8, для Excel)
- Локальное хранение в SQLite на устройстве
- Настройки отображения: валюта, формат даты

## Требования

- Node.js 18+
- npm
- **Expo Go SDK 57** — [expo.dev/go](https://expo.dev/go) (для разработки)
- **EAS CLI** — для облачной сборки установочных файлов

## Установка

```powershell
cd d:\20260707_work\debet2
npm install
```

## Запуск (разработка)

```powershell
# Dev-сервер (QR-код для Expo Go)
npx expo start

# Очистка кэша при проблемах
npx expo start --clear

# Туннель, если телефон не видит ПК по Wi‑Fi
npm run start:tunnel

# Android-эмулятор
npx expo start --android

# iOS-симулятор (только macOS)
npx expo start --ios
```

## Проверка качества

```powershell
npm test          # unit-тесты (22 теста)
npm run typecheck # проверка TypeScript
npm run lint      # ESLint
npm run doctor    # expo-doctor
```

Ручной чеклист перед релизом — в [TESTING.md](./TESTING.md).

## Структура проекта

| Каталог | Назначение |
|---------|------------|
| `app/` | Экраны (Expo Router) |
| `src/db/` | SQLite: схема, миграции, репозитории |
| `src/domain/` | Бизнес-логика: распределение, отчёты |
| `src/components/` | UI-компоненты |
| `src/hooks/` | Хуки данных |
| `src/types/` | TypeScript-типы |
| `src/utils/` | Форматирование, CSV, настройки |
| `assets/images/` | Иконка, splash, adaptive icon |

Подробный план разработки — [plan.md](./plan.md).  
Техническое задание — [project.md](./project.md).

## Сборка (EAS Build)

### Подготовка (один раз)

```powershell
npm install -g eas-cli
eas login
eas build:configure
```

Команда `eas build:configure` создаст проект на expo.dev и добавит `extra.eas.projectId` в `app.json`, если его ещё нет.

### Профили сборки

| Профиль | Назначение | Android | iOS |
|---------|------------|---------|-----|
| `preview` | Тестовая установка (APK, internal) | APK | IPA (internal) |
| `production` | Публикация в магазины | AAB | IPA |

### Команды

```powershell
# Android — тестовый APK (удобно для установки вручную)
npm run build:android:preview

# Android — AAB для Google Play
npm run build:android:production

# iOS — тестовая сборка
npm run build:ios:preview

# iOS — production
npm run build:ios:production
```

После сборки ссылка на скачивание появится в терминале и на [expo.dev](https://expo.dev).

### Версии приложения

- `app.json` → `version` — пользовательская версия (1.0.0)
- `android.versionCode` / `ios.buildNumber` — номера сборки
- Профиль `production` в `eas.json` использует `autoIncrement` для автоматического увеличения

## Иконка и splash screen

Настроены в `app.json`:

- **Иконка:** `assets/images/icon.png`
- **Adaptive icon (Android):** `assets/images/adaptive-icon.png`, фон `#1a56db`
- **Splash:** `assets/images/splash-icon.png`, фон `#1a56db`

Для замены — перезапишите PNG в `assets/images/` (рекомендуемый размер иконки 1024×1024).

## Вкладки приложения

1. **Главная** — сводка месяца, карточки проектов, быстрый ввод
2. **Операции** — список доходов и расходов с фильтрами
3. **Проекты** — CRUD проектов
4. **Расходы** — постоянные, долгоиграющие, правила распределения
5. **Отчёт** — результаты деятельности, экспорт CSV

## Важно

- Данные хранятся **только на устройстве**. При удалении приложения данные теряются.
- Рекомендуется периодически экспортировать отчёт в CSV как резервную копию сводки.

## Лицензия

См. [LICENSE](./LICENSE).
