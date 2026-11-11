# Instalasi

```bash
npm install
```

```sql
CREATE DATABASE kilas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kilas'@'localhost' IDENTIFIED BY 'PASSWORD_KAMU';
GRANT ALL PRIVILEGES ON *.* TO 'kilas'@'localhost';
FLUSH PRIVILEGES;
```

```bash
cp .env.example .env
```

```env
DATABASE_URL="mysql://kilas:PASSWORD_KAMU@localhost:3306/kilas_db"
JWT_SECRET=hasil_perintah_di_bawah
```

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

http://localhost:3000/api/health
