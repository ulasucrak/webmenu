# 🍽️ Dijital Menü SaaS — Proje Dökümanı

> Claude Code ile adım adım inşa edilecek çok kiracılı (multi-tenant) dijital menü platformu.

---

## 📌 Proje Özeti

Restoranlar için QR kod tabanlı dijital menü platformu. Tek domain üzerinden sınırsız restoran ve şube yönetimi. Her restoran kendi admin paneliyle ürün, fiyat ve görsellerini yönetir.

**Referans tasarım:** Foost (thefoost.com) — video arka planlı kategori kartları + AI asistan

---

## 🧱 Teknik Stack

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Veritabanı | Supabase (PostgreSQL) |
| Depolama | Supabase Storage |
| Auth | Supabase Auth |
| AI Asistan | Google Gemini API (gemini-2.0-flash) |
| Deploy | Vercel |
| Dil Desteği | Türkçe + İngilizce |

---

## 🗂️ Veritabanı Şeması

```sql
-- Restoranlar
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,          -- menusite.com/niyokki
  logo_url text,
  primary_color text default '#000000',
  created_at timestamptz default now()
);

-- Şubeler
create table branches (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name text not null,
  slug text not null,                 -- menusite.com/niyokki/elazig
  address text,
  phone text,
  is_active boolean default true,
  unique(restaurant_id, slug)
);

-- Kategoriler
create table categories (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name_tr text not null,
  name_en text,
  description_tr text,
  description_en text,
  cover_url text,                     -- video veya görsel
  cover_type text default 'image',    -- 'image' | 'video'
  display_order int default 0,
  is_active boolean default true
);

-- Alt Kategoriler
create table subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name_tr text not null,
  name_en text,
  display_order int default 0
);

-- Ürünler
create table products (
  id uuid primary key default gen_random_uuid(),
  subcategory_id uuid references subcategories(id) on delete cascade,
  external_id int,                    -- pardon app'ten gelen orijinal id
  name_tr text not null,
  name_en text,
  description_tr text,
  description_en text,
  price numeric(10,2) not null,
  currency text default '₺',
  image_url text,
  is_active boolean default true,
  is_featured boolean default false,
  display_order int default 0,
  tags text[] default '{}'            -- 'vejetaryen','glutensiz' vb.
);

-- Admin Kullanıcılar
create table admin_users (
  id uuid primary key references auth.users(id),
  restaurant_id uuid references restaurants(id),
  role text default 'manager'         -- 'superadmin' | 'manager'
);
```

---

## 📁 Proje Klasör Yapısı

```
/
├── app/
│   ├── [restaurant]/
│   │   ├── [branch]/
│   │   │   ├── page.tsx              # Menü ana sayfası (kategori kartları)
│   │   │   ├── [category]/
│   │   │   │   └── page.tsx          # Kategori ürün listesi
│   │   │   └── ai/
│   │   │       └── route.ts          # AI asistan API endpoint
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── layout.tsx                # Admin layout (sidebar)
│   │   ├── page.tsx                  # Dashboard
│   │   ├── branches/
│   │   │   └── page.tsx             # Şube yönetimi
│   │   ├── categories/
│   │   │   └── page.tsx             # Kategori yönetimi
│   │   ├── products/
│   │   │   └── page.tsx             # Ürün yönetimi
│   │   └── settings/
│   │       └── page.tsx             # Restoran ayarları
│   ├── api/
│   │   └── import/
│   │       └── route.ts             # JSON/CSV import endpoint
│   └── layout.tsx
├── components/
│   ├── menu/
│   │   ├── CategoryCard.tsx         # Video/görsel kategori kartı
│   │   ├── ProductCard.tsx          # Ürün kartı
│   │   ├── ProductList.tsx          # Ürün listesi
│   │   └── AiAssistant.tsx          # AI chat komponenti
│   └── admin/
│       ├── ProductForm.tsx          # Ürün ekle/düzenle formu
│       ├── ImageUpload.tsx          # Görsel yükleme
│       └── PriceEditor.tsx          # Toplu fiyat düzenleme
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── import/
│   │   └── parser.ts                # JSON/CSV → DB mapper
│   └── ai/
│       └── menuAssistant.ts         # Gemini API entegrasyonu
└── scripts/
    └── import-niyokki.ts            # İlk veri aktarım scripti
```

---

## 🎨 Menü Arayüzü (Foost Tarzı)

### Ana Sayfa — Kategori Kartları

```
Tasarım özellikleri:
- Siyah (#000) arka plan
- Her kategori = tam genişlik veya 2'li grid kart
- Kart içinde: autoplay loop video veya yüksek kalite görsel
- Üstünde: kategori adı (büyük, beyaz, bold) + açıklama
- Kart hover'da hafif zoom efekti
- Üstte: restoran logosu ortada, hamburger menü solda, arama sağda
```

### Kategori Sayfası — Ürün Listesi

```
- Üstte kategori görseli/videosu (küçültülmüş banner)
- Alt kategoriler yatay scroll tab
- Her ürün: görsel solda, isim + açıklama + fiyat sağda
- Siyah kart, beyaz metin
```

### AI Asistan

```
- Sağ alta chat balonu butonu
- Açıldığında overlay panel
- Altta hazır prompt butonları: "Vejetaryen göster", "En ucuz 5 ürün"
- Gemini API: menü verisi system prompt'a enjekte edilir
- Kullanıcı sorar → Gemini filtreler → ürün kartı render edilir
```

---

## 🤖 AI Asistan — Gemini API Entegrasyonu

```typescript
// lib/ai/menuAssistant.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export async function askMenuAssistant(
  userMessage: string,
  menuData: any[],
  restaurantName: string
) {
  const systemPrompt = `
Sen ${restaurantName} restoranının dijital menü asistanısın.
Müşterilerin menüden ürün bulmasına yardım ediyorsun.

MENÜ VERİSİ:
${JSON.stringify(menuData)}

KURALLAR:
- Sadece menüde olan ürünleri öner
- Fiyatları doğru söyle
- Cevabı SADECE JSON formatında ver, başka hiçbir şey yazma:
  { "products": [...], "message": "..." }
- products dizisindeki her ürün: { id, name_tr, price, image_url }
- Türkçe konuş
- Maksimum 3 ürün öner
`

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'Anladım, menü asistanınım. Sorularınızı bekliyorum.' }],
      },
    ],
  })

  const result = await chat.sendMessage(userMessage)
  const text = result.response.text()

  // JSON parse
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
```

```typescript
// app/[restaurant]/[branch]/ai/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { askMenuAssistant } from '@/lib/ai/menuAssistant'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { message, branchId, restaurantName } = await req.json()

  const supabase = createServerSupabaseClient()
  const { data: menuData } = await supabase
    .from('products')
    .select('id, name_tr, price, image_url, tags, subcategory_id')
    .eq('is_active', true)

  const response = await askMenuAssistant(message, menuData, restaurantName)
  return NextResponse.json(response)
}
```

---

## 📦 Veri Import Scripti (Niyokki için)

```typescript
// scripts/import-niyokki.ts
// Kullanım: npx ts-node scripts/import-niyokki.ts

import menuTR from '../data/pardon_menu_niyokki-elazig_tr.json'
import menuEN from '../data/pardon_menu_niyokki-elazig_en.json'

// 1. Restaurant oluştur
// 2. Branch oluştur (Elazığ şubesi)
// 3. Kategorileri çek ve ekle
// 4. Alt kategorileri ekle
// 5. Ürünleri TR+EN eşleştirerek ekle
// 6. Görsel URL'leri kaydet (CDN'den direkt)
```

---

## 🛠️ Admin Panel Özellikleri

| Özellik | Açıklama |
|---|---|
| Şube seçimi | Dropdown ile şube geçişi |
| Ürün listesi | Arama, filtre, sıralama |
| Ürün düzenle | İsim, fiyat, açıklama, görsel |
| Toplu fiyat | Kategoriye % zam/indirim |
| Görsel yükle | Drag & drop, Supabase Storage'a |
| Aktif/Pasif | Ürünü menüden gizle |
| Öne çıkan | Ana sayfada featured ürün |
| Kategori sıralama | Drag & drop sıralama |

---

## 🚀 Geliştirme Sırası (Claude Code ile)

### Faz 1 — Temel Altyapı
```
1. Next.js projesi kur
2. Supabase bağlantısı
3. Veritabanı tablolarını oluştur (yukarıdaki SQL)
4. Niyokki verisini import et
```

### Faz 2 — Menü Arayüzü
```
5. [restaurant]/[branch]/page.tsx — kategori kartları
6. CategoryCard komponenti (video + görsel desteği)
7. Kategori sayfası — ürün listesi
8. Mobil responsive tasarım
```

### Faz 3 — AI Asistan
```
9. Gemini API entegrasyonu: npm install @google/generative-ai
10. lib/ai/menuAssistant.ts — sistem prompt + JSON parse
11. AiAssistant.tsx komponenti (chat UI)
12. /ai/route.ts endpoint
13. Hazır prompt butonları
```

### Faz 4 — Admin Panel
```
13. Supabase Auth kurulumu
14. Admin layout + sidebar
15. Ürün CRUD sayfaları
16. Görsel yükleme
17. Toplu fiyat düzenleme
```

### Faz 5 — Çok Restoran Desteği
```
18. Superadmin paneli
19. Yeni restoran ekleme
20. Şube yönetimi
```

---

## 🔑 Ortam Değişkenleri (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_SITE_URL=https://menusite.com
```

---

## 💡 Claude Code Kullanım İpuçları

```bash
# Projeyi başlat
claude "Next.js 14 projesi kur, Supabase ve Tailwind entegre et"

# Veritabanı
claude "supabase/migrations klasörüne schema.sql oluştur, şu tabloları ekle: [tabloları yapıştır]"

# Veri import
claude "scripts/import-niyokki.ts dosyasını yaz, TR ve EN JSON dosyalarını birleştirip Supabase'e aktarsın"

# UI geliştirme
claude "CategoryCard komponenti yaz, video ve görsel desteği olsun, Foost tarzı dark tasarım"

# AI asistan
claude "Gemini API kullanarak menü asistanı yaz (@google/generative-ai paketi), sistem promptuna menü verisini JSON olarak ekle, cevabı JSON parse et"
```

---

## 📊 İş Modeli

| | Miktar |
|---|---|
| İlk kurulum ücreti | 15.000 - 25.000 ₺ |
| Aylık bakım | 500 - 1.500 ₺ |
| Başlangıç altyapı maliyeti | ~150 ₺/yıl (sadece domain) |
| Supabase free limit | 10+ restoran'a kadar yeterli |

---

## 📎 Referanslar

- **Tasarım referansı:** https://thefoost.com/haw/
- **Supabase docs:** https://supabase.com/docs
- **Next.js App Router:** https://nextjs.org/docs/app
- **Gemini API:** https://ai.google.dev/gemini-api/docs
- **@google/generative-ai:** https://www.npmjs.com/package/@google/generative-ai
- **Claude Code:** https://docs.anthropic.com/en/docs/claude-code/overview
