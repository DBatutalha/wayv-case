// Migration script: Supabase Auth'taki mevcut kullanıcıları users tablosuna kaydet
// Bu script'i çalıştırmak için: node scripts/migrate-users.js

/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require("@supabase/supabase-js");
const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");

// Environment variables'ları kontrol et
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
  console.error("Gerekli environment variables eksik:");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  console.error("DATABASE_URL:", !!databaseUrl);
  process.exit(1);
}

// Supabase client oluştur (service role key ile)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Database connection
const sql = postgres(databaseUrl);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const db = drizzle(sql);

async function migrateUsers() {
  try {
    console.log("🚀 Kullanıcı migration başlatılıyor...");

    // 1. Supabase Auth'taki tüm kullanıcıları al
    console.log("📋 Supabase Auth kullanıcıları alınıyor...");
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      throw new Error(`Auth kullanıcıları alınamadı: ${authError.message}`);
    }

    console.log(`✅ ${authUsers.users.length} kullanıcı bulundu`);

    // 2. Users tablosundaki mevcut kullanıcıları al (raw SQL ile)
    console.log("📋 Database users tablosu kontrol ediliyor...");
    const existingUsers =
      await sql`SELECT id, email, created_at, updated_at, is_active FROM users`;
    const existingUserIds = new Set(existingUsers.map((u) => u.id));

    console.log(`✅ Database'de ${existingUsers.length} kullanıcı mevcut`);

    // 3. Yeni kullanıcıları bul
    const newUsers = authUsers.users.filter(
      (authUser) =>
        !existingUserIds.has(authUser.id) &&
        authUser.email &&
        authUser.email_confirmed_at // Email onaylanmış kullanıcılar
    );

    console.log(`📝 ${newUsers.length} yeni kullanıcı kaydedilecek`);

    if (newUsers.length === 0) {
      console.log("✨ Tüm kullanıcılar zaten kayıtlı!");
      return;
    }

    // 4. Yeni kullanıcıları users tablosuna ekle (raw SQL ile)
    console.log("💾 Yeni kullanıcılar kaydediliyor...");

    for (const authUser of newUsers) {
      try {
        const [newUser] = await sql`
          INSERT INTO users (id, email, created_at, updated_at, is_active)
          VALUES (${authUser.id}, ${authUser.email}, ${new Date(
          authUser.created_at
        ).toISOString()}, ${new Date().toISOString()}, ${true})
          RETURNING id, email, created_at, updated_at, is_active
        `;

        console.log(
          `✅ Kullanıcı kaydedildi: ${newUser.email} (${newUser.id})`
        );
      } catch (error) {
        console.error(
          `❌ Kullanıcı kaydedilemedi ${authUser.email}:`,
          error.message
        );
      }
    }

    // 5. Sonuçları göster
    const finalUsers = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`\n🎉 Migration tamamlandı!`);
    console.log(`📊 Toplam kullanıcı sayısı: ${finalUsers[0].count}`);
    console.log(`📈 Yeni eklenen: ${newUsers.length}`);
  } catch (error) {
    console.error("❌ Migration hatası:", error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log("🔌 Database bağlantısı kapatıldı");
  }
}

// Script'i çalıştır
migrateUsers().catch(console.error);
