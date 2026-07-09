# debet2 — Результаты деятельности

Мобильное приложение на Expo / React Native для учёта доходов и расходов в разрезе проектов.

## Требования

- Node.js 18+
- npm (устанавливается вместе с Node.js)
- [Expo Go](https://expo.dev/go) на телефоне или Android Studio / Xcode для эмулятора

## Установка

```powershell
cd d:\20260707_work\debet2
npm install
```

## Запуск

```powershell
# Dev-сервер (QR-код для Expo Go)
npx expo start

# Android-эмулятор
npx expo start --android

# iOS-симулятор (только macOS)
npx expo start --ios
```

## Разработка

```powershell
# Проверка линтером
npm run lint

# Форматирование кода
npm run format
```

## Структура

- `app/` — экраны (Expo Router)
- `src/db/` — SQLite
- `src/domain/` — бизнес-логика
- `src/components/` — UI-компоненты
- `src/hooks/` — хуки данных
- `src/types/` — типы
- `src/utils/` — утилиты

Подробный план разработки — в [plan.md](./plan.md).

## Сборка (EAS)

```powershell
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```
