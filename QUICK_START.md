# ⚡ QUICK START - 5 Минут к деплою на Render

## 1️⃣ Локальная установка (2 мин)
```bash
cd c:\Users\user\Desktop\sityarch
npm install --legacy-peer-deps
```

## 2️⃣ Настройка переменных окружения (1 мин)
```bash
# Откройте .env.local и добавьте:
GEMINI_API_KEY=your_actual_key_from_https://ai.studio/
```

## 3️⃣ Локальное тестирование (1 мин)
```bash
npm run dev
# Откройте http://localhost:5173 в браузере
```

## 4️⃣ Build для продакшена (30 сек)
```bash
npm run build
npm run start
# Проверьте http://localhost:3000
```

## 5️⃣ Деплой на Render (1 мин)

### Шаг A: Push в GitHub
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### Шаг B: Создать Web Service на Render
1. Откройте https://render.com/dashboard
2. Нажмите "New" → "Web Service"
3. Выберите ваш GitHub репозиторий
4. Заполните:
   - **Name**: sityarch
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Node Version**: 18

### Шаг C: Добавить Environment Variables
В Render Dashboard → Environment → Add:
```
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=your_key
CORS_ORIGIN=https://sityarch.onrender.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Шаг D: Развернуть
Нажмите "Create Web Service" → Ждите 5-10 минут → Готово! 🎉

---

## ✅ Проверка после деплоя

```bash
curl https://sityarch.onrender.com/health
# Должно вернуть: {"status":"ok","timestamp":"..."}
```

---

## 📚 Важные документы для прочтения:

| Документ | Для кого | Время |
|----------|----------|-------|
| [SECURITY.md](SECURITY.md) | Разработчики | 10 мин |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Деплоя | 15 мин |
| [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) | QA проверка | 5 мин |
| [COMPLETION_REPORT.md](COMPLETION_REPORT.md) | Менеджеры | 5 мин |

---

## 🔒 Что было сделано для безопасности:

✅ API ключи защищены (только backend)  
✅ Path traversal защита  
✅ CORS validation  
✅ Rate limiting (100 req/15min)  
✅ Helmet security headers  
✅ Input sanitization  
✅ Strict TypeScript mode  

---

## 🆘 Проблемы?

### Port 3000 занят:
```bash
PORT=3001 npm run start
```

### CORS ошибка:
Убедитесь что CORS_ORIGIN в .env.production совпадает с вашим Render URL

### 404 на музыку:
Добавьте файлы в `public/music/` или используйте только изначально поддерживаемые форматы

---

**Status**: ✅ Ready  
**Secure**: 🔒 YES  
**Production**: 🚀 GO  

Вперед к деплою! 🎯
