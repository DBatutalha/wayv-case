import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DATABASE_URL!;

// Postgres istemcisini başlatıyoruz
const sql = postgres(connectionString);

// Drizzle ORM ile bağlantıyı oluşturuyoruz
export const db = drizzle(sql);
