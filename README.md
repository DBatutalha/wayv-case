# 🚀 Campaign Management App

Modern, full-stack kampanya ve influencer yönetim sistemi. Next.js 15, tRPC, Supabase ve Drizzle ORM kullanılarak geliştirilmiştir.

## ✨ Özellikler

### 🎯 **Kampanya Yönetimi**

- ✅ Kampanya oluşturma, düzenleme ve silme
- ✅ Detaylı kampanya bilgileri (başlık, açıklama, bütçe, tarihler)
- ✅ Kampanyalara influencer atama
- ✅ Atanmış influencer'ları görüntüleme

### 👥 **Influencer Yönetimi**

- ✅ Influencer ekleme, düzenleme ve silme
- ✅ Follower sayısı ve engagement oranı takibi
- ✅ Kampanya atama sistemi
- ✅ Detaylı influencer profilleri

### 🔐 **Kimlik Doğrulama**

- ✅ Supabase Auth ile güvenli giriş/kayıt
- ✅ Session yönetimi
- ✅ Kullanıcı bazlı veri izolasyonu

### 🎨 **Modern UI/UX**

- ✅ React Hot Toast bildirimleri
- ✅ React Hook Form ile form yönetimi
- ✅ Tailwind CSS ile responsive tasarım
- ✅ Modern modal ve dropdown'lar

## 🛠️ Teknoloji Yığını

### **Frontend**

- **Next.js 15** - App Router ile
- **React 19** - Modern React özellikleri
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **React Hook Form** - Form yönetimi
- **React Hot Toast** - Bildirimler

### **Backend**

- **tRPC** - Type-safe API
- **Zod** - Schema validation
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database

### **Authentication & Database**

- **Supabase** - Auth ve Database hosting
- **Session Pooler** - Production database connection

## 🚀 Kurulum

### **1. Repository'yi Clone Edin**

```bash
git clone https://github.com/DBatutalha/wayv-case.git
cd wayv-case
```

### **2. Dependencies Yükleyin**

```bash
npm install
```

### **3. Environment Variables**

`.env.local` dosyası oluşturun:

```env


# Database Connection
DATABASE_URL=your-postgresql-connection-string
```

### **4. Database Schema**

```bash
npx drizzle-kit push
```

### **5. Mevcut Kullanıcıları Migrate Et (Opsiyonel)**

Eğer Supabase Auth'ta mevcut kullanıcılarınız varsa, bunları users tablosuna kaydetmek için:

```bash
# Environment variables'ları ayarlayın
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Migration script'ini çalıştırın
npm run migrate-users
```

**Not:** Bu script için `SUPABASE_SERVICE_ROLE_KEY` gereklidir. Supabase Dashboard > Settings > API > Service Role Key'den alabilirsiniz.

### **6. User Creation Test (Opsiyonel)**

User creation işleminin çalıştığını test etmek için:

```bash
npm run test-users
```

### **7. Development Server**

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 📁 Proje Yapısı

```
├── app/                    # Next.js App Router
│   ├── api/trpc/          # tRPC API routes
│   ├── dashboard/         # Ana dashboard
│   ├── login/             # Giriş sayfası
│   └── signup/            # Kayıt sayfası
├── server/                # Backend logic
│   ├── routers/           # tRPC routers
│   ├── context.ts         # tRPC context
│   └── trpc.ts            # tRPC setup
├── drizzle/               # Database schema
├── lib/                   # Utility functions
└── public/                # Static assets
```

## 🌐 Deployment

### **Netlify Deployment**

1. Repository'yi Netlify'a bağlayın
2. Build ayarları:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next/standalone`
3. Environment variables'ları ekleyin
4. Deploy edin

### **Environment Variables (Production)**

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
DATABASE_URL=your-production-database-url
```

## 🎯 Kullanım

### **1. Hesap Oluşturun**

- `/signup` sayfasından kayıt olun
- Email doğrulaması yapın

### **2. Dashboard'a Gidin**

- `/dashboard` sayfasından kampanyalarınızı yönetin
- Influencer'larınızı ekleyin ve yönetin

### **3. Kampanya Oluşturun**

- "Create Campaign" butonuna tıklayın
- Kampanya detaylarını doldurun
- Kaydedin

### **4. Influencer Ekleyin**

- "Add Influencer" butonuna tıklayın
- Influencer bilgilerini girin
- Kaydedin

### **5. Atama Yapın**

- Kampanya kartında "Assign Influencers" butonuna tıklayın
- İstediğiniz influencer'ları seçin
- Atamaları kaydedin

## 🔧 Geliştirme

### **Database Değişiklikleri**

```bash
# Schema değişikliklerini uygula
npx drizzle-kit push

# Database'i sıfırla
npx drizzle-kit drop
```

### **Build & Test**

```bash
# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📊 Özellikler

- [x] **Campaign CRUD** - Tam CRUD operasyonları
- [x] **Influencer CRUD** - Tam CRUD operasyonları
- [x] **Assignment System** - Kampanya-Influencer eşleştirme
- [x] **Authentication** - Supabase Auth
- [x] **Form Validation** - React Hook Form + Zod
- [x] **Toast Notifications** - React Hot Toast
- [x] **Responsive Design** - Mobile-first
- [x] **Type Safety** - Full TypeScript
- [x] **Database ORM** - Drizzle ORM
- [x] **Production Ready** - Netlify deployment

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👨‍💻 Geliştirici

**Batuhan Talha** - [@DBatutalha](https://github.com/DBatutalha)

---

⭐ Bu projeyi beğendiyseniz star vermeyi unutmayın!
