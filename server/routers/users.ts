import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc";
import { db } from "@/lib/drizzle";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const userInput = z.object({
  id: z.string().uuid(),
  email: z.string().email("Geçerli bir email adresi girin"),
});

export const usersRouter = router({
  // Email kontrolü - signup sırasında kullanılacak
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      try {
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        return {
          exists: existingUser.length > 0,
          message:
            existingUser.length > 0
              ? "Bu email adresi zaten kullanımda"
              : "Email adresi kullanılabilir",
        };
      } catch (error) {
        console.error("Email check error:", error);
        throw new Error("Email kontrolü sırasında hata oluştu");
      }
    }),

  // Yeni user oluştur - signup başarılı olduktan sonra
  create: publicProcedure.input(userInput).mutation(async ({ input }) => {
    try {
      // Input validation
      if (!input || typeof input !== "object") {
        throw new Error("Invalid input: input must be an object");
      }

      if (!input.id || typeof input.id !== "string") {
        throw new Error("Invalid input: id must be a string");
      }

      if (!input.email || typeof input.email !== "string") {
        throw new Error("Invalid input: email must be a string");
      }

      // UUID validation
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(input.id)) {
        throw new Error(`Invalid UUID format: ${input.id}`);
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        throw new Error(`Invalid email format: ${input.email}`);
      }

      // Email zaten var mı kontrol et
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("Bu email adresi zaten kullanımda");
      }

      // Yeni user oluştur
      const [newUser] = await db
        .insert(users)
        .values({
          id: input.id,
          email: input.email,
        })
        .returning();

      return newUser;
    } catch (error) {
      console.error("User creation error:", error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("User oluşturulurken hata oluştu");
    }
  }),

  // Login sırasında user'ı users tablosuna kaydet (eğer yoksa)
  ensure: publicProcedure.input(userInput).mutation(async ({ input }) => {
    try {
      // User zaten var mı kontrol et
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      if (existingUser.length > 0) {
        // User zaten var, güncelleme yap
        const [updatedUser] = await db
          .update(users)
          .set({
            email: input.email,
            updatedAt: new Date(),
            isActive: true,
          })
          .where(eq(users.id, input.id))
          .returning();

        return { user: updatedUser, action: "updated" };
      } else {
        // User yok, yeni oluştur
        const [newUser] = await db
          .insert(users)
          .values({
            id: input.id,
            email: input.email,
          })
          .returning();

        return { user: newUser, action: "created" };
      }
    } catch (error) {
      console.error("User ensure error:", error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("User kaydedilirken hata oluştu");
    }
  }),

  // User bilgilerini getir
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, input.id))
          .limit(1);

        return user[0] || null;
      } catch (error) {
        console.error("User fetch error:", error);
        throw new Error("User bilgileri alınırken hata oluştu");
      }
    }),

  // User'ı güncelle
  update: publicProcedure
    .input(userInput.partial().extend({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        const updateData: { email?: string; updatedAt: Date } = {
          updatedAt: new Date(),
        };

        if (input.email) {
          // Email güncelleniyorsa, yeni email'in başka bir user tarafından kullanılmadığından emin ol
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, input.email))
            .limit(1);

          if (existingUser.length > 0 && existingUser[0].id !== input.id) {
            throw new Error(
              "Bu email adresi başka bir kullanıcı tarafından kullanılıyor"
            );
          }

          updateData.email = input.email;
        }

        const [updatedUser] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, input.id))
          .returning();

        return updatedUser;
      } catch (error) {
        console.error("User update error:", error);
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error("User güncellenirken hata oluştu");
      }
    }),

  // User'ı deaktive et (soft delete)
  deactivate: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        const [deactivatedUser] = await db
          .update(users)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(users.id, input.id))
          .returning();

        return deactivatedUser;
      } catch (error) {
        console.error("User deactivation error:", error);
        throw new Error("User deaktive edilirken hata oluştu");
      }
    }),
});
