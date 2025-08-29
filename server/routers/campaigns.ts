import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc";
import { db } from "@/lib/drizzle";
import { campaigns } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

const campaignInput = z.object({
  title: z
    .string()
    .min(1, "Title is required and must be at least 1 character"),
  description: z.string().optional(),
  budget: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const campaignsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    return db
      .select()
      .from(campaigns)
      .where(eq(campaigns.user_id, ctx.user.id as unknown as string));
  }),

  create: publicProcedure
    .input(
      z.any().transform((data) => {
        // Input wrapper'ı çıkar
        const actualInput = data.input || data;

        // Zod schema ile validate et
        try {
          const result = campaignInput.parse(actualInput);
          return result;
        } catch (error) {
          console.error("Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input) {
        throw new Error("No input data received");
      }

      if (!ctx.user) {
        throw new Error("Unauthorized - No user found");
      }

      try {
        const campaignData = {
          user_id: ctx.user.id as unknown as string,
          title: input.title,
          description: input.description,
          budget: input.budget,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
        };

        const [row] = await db
          .insert(campaigns)
          .values(campaignData as any)
          .returning();

        return row;
      } catch (error) {
        console.error("Database error creating campaign:", error);
        if (error instanceof Error) {
          throw new Error(`Database error: ${error.message}`);
        } else {
          throw new Error(`Unknown database error: ${String(error)}`);
        }
      }
    }),

  update: publicProcedure
    .input(
      z.any().transform((data) => {
        // Input wrapper'ı çıkar
        const actualInput = data.input || data;

        // Zod schema ile validate et
        const updateSchema = campaignInput.extend({ id: z.number() });
        try {
          const result = updateSchema.parse(actualInput);
          return result;
        } catch (error) {
          console.error("Update Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      try {
        const updateData = {
          title: input.title,
          description: input.description,
          budget: input.budget,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
        };

        const [row] = await db
          .update(campaigns)
          .set(updateData as any)
          .where(
            and(
              eq(campaigns.id, input.id),
              eq(campaigns.user_id, ctx.user.id as any)
            )
          )
          .returning();

        return row;
      } catch (error) {
        console.error("Database error updating campaign:", error);
        throw error;
      }
    }),

  delete: publicProcedure
    .input(
      z.any().transform((data) => {
        // Input wrapper'ı çıkar
        const actualInput = data.input || data;

        // Zod schema ile validate et
        const deleteSchema = z.object({ id: z.number() });
        try {
          const result = deleteSchema.parse(actualInput);
          return result;
        } catch (error) {
          console.error("Delete Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      try {
        const [row] = await db
          .delete(campaigns)
          .where(
            and(
              eq(campaigns.id, input.id),
              eq(campaigns.user_id, ctx.user.id as any)
            )
          )
          .returning();

        return row;
      } catch (error) {
        console.error("Database error deleting campaign:", error);
        throw error;
      }
    }),
});
