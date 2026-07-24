# Деплой Pro AutoHub на Hostinger VPS

Боевой запуск: Ubuntu VPS + Node 22 + приложение под **systemd** + **nginx** (reverse-proxy) + бесплатный **HTTPS** (Let's Encrypt). Домен `pro-autohub.com` (name.com) → IP VPS.

- **Домен:** pro-autohub.com (регистратор name.com)
- **VPS IP:** 2.24.101.60
- Готовые конфиги лежат в папке [`deploy/`](../deploy): systemd-юнит, nginx-конфиг, `deploy.sh`, шаблон `.env`.

> Все команды на сервере — под Ubuntu (Hostinger VPS по умолчанию Ubuntu). Если образ другой — скажи, поправим.

### Быстрый путь (один скрипт)

После шага 1 (DNS) можно развернуть всё одной командой на сервере — [`deploy/bootstrap.sh`](../deploy/bootstrap.sh) делает шаги 2–8 автоматически (пакеты, Node, firewall, клон, `.env` с генерацией `JWT_SECRET`, сборка, импорт каталога, systemd, nginx, HTTPS):

```bash
ssh root@2.24.101.60
# ОДНОЙ строкой (подставь свой пароль админки и email для Let's Encrypt):
curl -fsSL https://raw.githubusercontent.com/Kiboiko/USA_CARS/main/deploy/bootstrap.sh -o bootstrap.sh
ADMIN_PASS='ПридумайСильныйПароль' LE_EMAIL='you@example.com' bash bootstrap.sh
```

Ниже — те же шаги вручную, если нужен контроль по одному.

---

## 0. Предпосылки (сделать один раз до деплоя)

1. **Код в git-remote.** Закоммитить и запушить всё в `origin/main` (иначе на сервере нечего клонировать). Фото машин и БД в git не входят (они в `.gitignore`) — их перенесём отдельно (шаг 5).
2. **Секреты готовы:** `JWT_SECRET` (сгенерим), пароль админа, и — когда будут от клиента — Google Sheets и Resend (по [SETUP_CLIENT.md](SETUP_CLIENT.md)). Без них сайт тоже запустится (заявки в БД, без письма/таблицы).

---

## 1. DNS в name.com

В панели name.com → домен pro-autohub.com → **DNS Records**:

| Type | Host | Answer / Value | TTL |
|---|---|---|---|
| A | `@` | `2.24.101.60` | 300 |
| A | `www` | `2.24.101.60` | 300 |

Сохранить. Распространение — от нескольких минут до пары часов. Проверить: `ping pro-autohub.com` должен показать `2.24.101.60`.

---

## 2. Первичная настройка сервера

```bash
ssh root@2.24.101.60

# система
apt update && apt upgrade -y

# Node.js 22 (нужен для встроенного node:sqlite)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git nginx

# проверка
node -v   # должно быть v22.x или выше

# файрвол: пускаем SSH + HTTP + HTTPS
apt install -y ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

---

## 3. Забрать код

```bash
mkdir -p /var/www
cd /var/www
git clone <URL_РЕПОЗИТОРИЯ> pro-autohub
cd pro-autohub

# права для сервисного пользователя
chown -R www-data:www-data /var/www/pro-autohub
```

> `<URL_РЕПОЗИТОРИЯ>` — адрес вашего git-remote. Если репозиторий приватный, настройте deploy-ключ или клонируйте по HTTPS с токеном.

---

## 4. Переменные окружения

```bash
cd /var/www/pro-autohub
cp deploy/env.production.example .env
# сгенерировать секрет для JWT:
openssl rand -hex 32
nano .env
```

Заполнить в `.env`:
- `JWT_SECRET=` — вставить сгенерированную строку;
- `ADMIN1_PASSWORD=` — надёжный пароль для входа в админку;
- `NEXT_PUBLIC_SITE_URL=https://pro-autohub.com` (уже стоит);
- Google Sheets и Resend — когда будут креды клиента (можно позже).

> ⚠️ `NEXT_PUBLIC_SITE_URL` «вшивается» на этапе сборки — поэтому `.env` заполняем **до** `npm run build`.

---

## 5. Данные каталога (машины + фото)

Каталог (6 машин) и фото не в git. Два способа:

**Вариант A — перенести с локальной машины (быстрее всего).** На своём компьютере:
```bash
# из папки проекта локально
rsync -avz public/uploads/ root@2.24.101.60:/var/www/pro-autohub/public/uploads/
rsync -avz data/app.db      root@2.24.101.60:/var/www/pro-autohub/data/app.db
```

**Вариант B — импорт на сервере.** Перенести папку `3feed` на сервер и выполнить:
```bash
rsync -avz 3feed/ root@2.24.101.60:/var/www/pro-autohub/3feed/
# затем на сервере:
cd /var/www/pro-autohub && npm run import:feed
```

После переноса вернуть права: `chown -R www-data:www-data /var/www/pro-autohub`.

---

## 6. Сборка и первый запуск

```bash
cd /var/www/pro-autohub
npm ci
npm run build
npm run db:migrate          # применить схему (идемпотентно)
npm run db:seed             # создать логины админа из .env (машины уже перенесены на шаге 5)

# сервис systemd
sudo cp deploy/pro-autohub.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now pro-autohub
sudo systemctl status pro-autohub          # должно быть active (running)

# локальная проверка
curl http://127.0.0.1:3000/api/health      # {"ok":true,...}
```

---

## 7. nginx + HTTPS

```bash
sudo cp deploy/nginx-pro-autohub.conf /etc/nginx/sites-available/pro-autohub
sudo ln -s /etc/nginx/sites-available/pro-autohub /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# HTTPS-сертификат (после того как DNS уже указывает на сервер!)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pro-autohub.com -d www.pro-autohub.com
# выбрать редирект HTTP -> HTTPS
```

Certbot сам продлевает сертификат (таймер systemd). Проверить: открыть **https://pro-autohub.com**.

---

## 8. Проверка боевого сайта

- [ ] https://pro-autohub.com открывается, замок HTTPS зелёный
- [ ] Каталог показывает 6 машин с фото
- [ ] Страница машины, фильтры, форма заявки работают
- [ ] `/admin/login` — вход под ADMIN1
- [ ] Отправить тестовую заявку → появилась в админке (и в таблице/на почте, если настроены)

---

## Обновление сайта (после правок в коде)

Запушить изменения в `origin/main`, затем на сервере:
```bash
cd /var/www/pro-autohub && ./deploy.sh
```
(`deploy.sh` делает `git pull` → `npm ci` → `build` → миграции → перезапуск сервиса + health-check.)

---

## Безопасность (важно — сделать после запуска)

- **Сменить root-пароль** и пароли домена/хостинга, которые светились в переписке.
- Настроить **SSH-ключ** и отключить парольный вход:
  `PasswordAuthentication no` в `/etc/ssh/sshd_config` → `systemctl restart ssh`.
- Файрвол `ufw` уже включён (шаг 2): наружу открыты только 22/80/443.
- `.env`, JSON-ключ Google и т.п. — **только на сервере**, в git не коммитить.
- Регулярно `apt upgrade`.

---

## Заметки

- **Порт 3000** слушает только localhost, наружу ходит nginx (80/443). Менять порт — через `PORT` в `.env` и в `deploy/pro-autohub.service`.
- **Бэкапы:** периодически копировать `data/app.db` и `public/uploads/` (там вся БД заявок/машин и фото). Пример: `rsync` по крону на другой хост.
- **SMTP заблокирован у многих хостеров** — поэтому почта у нас через Resend (HTTPS), это работает и на VPS.
- Если Hostinger VPS идёт с панелью (напр. с предустановленным другим веб-сервером) — скажи, подстроим (возможно, порт 80 занят).
