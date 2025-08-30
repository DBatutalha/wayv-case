// Test script: User creation işlemini test et
// Bu script'i çalıştırmak için: node scripts/test-user-creation.js

const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");

// Environment variables'ları kontrol et
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable eksik!");
  process.exit(1);
}

// Database connection
const sql = postgres(databaseUrl);
const db = drizzle(sql);

async function testUserCreation() {
  try {
    console.log("🧪 User creation test başlatılıyor...");

    // 1. Mevcut kullanıcıları listele
    console.log("📋 Mevcut kullanıcılar:");
    const existingUsers =
      await sql`SELECT id, email, created_at, updated_at, is_active FROM users ORDER BY created_at`;

    if (existingUsers.length === 0) {
      console.log("   Hiç kullanıcı bulunamadı");
    } else {
      existingUsers.forEach((user, index) => {
        console.log(
          `   ${index + 1}. ${user.email} (${user.id}) - Created: ${
            user.created_at
          } - Active: ${user.is_active}`
        );
      });
    }

    // 2. Test kullanıcısı oluştur
    console.log("\n📝 Test kullanıcısı oluşturuluyor...");
    const testUserId = "00000000-0000-0000-0000-000000000000";
    const testEmail = `test-${Date.now()}@example.com`;

    const [newUser] = await sql`
      INSERT INTO users (id, email, created_at, updated_at, is_active)
      VALUES (${testUserId}, ${testEmail}, ${new Date().toISOString()}, ${new Date().toISOString()}, ${true})
      RETURNING id, email, created_at, updated_at, is_active
    `;

    console.log(
      `✅ Test kullanıcısı oluşturuldu: ${newUser.email} (${newUser.id})`
    );

    // 3. Test kullanıcısını sil
    console.log("\n🗑️ Test kullanıcısı siliniyor...");
    await sql`DELETE FROM users WHERE id = ${testUserId}`;
    console.log("✅ Test kullanıcısı silindi");

    // 4. Final durumu göster
    console.log("\n📊 Final durum:");
    const finalUsers = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`   Toplam kullanıcı sayısı: ${finalUsers[0].count}`);

    console.log("\n🎉 Test başarıyla tamamlandı!");
  } catch (error) {
    console.error("❌ Test hatası:", error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log("🔌 Database bağlantısı kapatıldı");
  }
}

// Test'i çalıştır
testUserCreation().catch(console.error);
