import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DATABASE_URL!;

console.log("=== DATABASE CONNECTION ===");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("CONNECTION STRING:", connectionString);

// Postgres istemcisini başlatıyoruz
const sql = postgres(connectionString);

// Drizzle ORM ile bağlantıyı oluşturuyoruz
export const db = drizzle(sql);
