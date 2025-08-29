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

// Debug: Zod şemasını test et
console.log("=== ZOD SCHEMA LOADED ===");
console.log("Zod schema:", campaignInput);
console.log("Schema shape:", campaignInput.shape);
console.log("Title field:", campaignInput.shape.title);
console.log("Title field type:", typeof campaignInput.shape.title);

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
        console.log("=== tRPC INPUT TRANSFORM ===");
        console.log("Raw tRPC input:", data);
        console.log("Input type:", typeof data);
        console.log("Input keys:", Object.keys(data || {}));
        console.log("Input JSON:", JSON.stringify(data, null, 2));

        // Input wrapper'ı çıkar
        const actualInput = data.input || data;
        console.log("Actual input after unwrapping:", actualInput);
        console.log("Actual input keys:", Object.keys(actualInput || {}));

        // Zod schema ile validate et
        try {
          const result = campaignInput.parse(actualInput);
          console.log("Zod validation successful:", result);
          return result;
        } catch (error) {
          console.error("Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("=== CAMPAIGN CREATE START ===");
      console.log("=== INPUT VALIDATION START ===");
      console.log("Raw input received:", input);
      console.log("Input type:", typeof input);
      console.log("Input keys:", Object.keys(input || {}));
      console.log("Input JSON:", JSON.stringify(input, null, 2));

      if (!input) {
        console.error("Input is null or undefined!");
        throw new Error("No input data received");
      }

      console.log("=== CONTEXT CHECK ===");
      console.log("Full context:", ctx);
      console.log("Context user:", ctx.user);
      console.log("Context user type:", typeof ctx.user);
      console.log("Context user ID:", ctx.user?.id);

      console.log("=== INPUT FIELD CHECK ===");
      console.log("Input title:", input.title);
      console.log("Input title type:", typeof input.title);
      console.log("Input title === undefined:", input.title === undefined);
      console.log("Input title === null:", input.title === null);
      console.log("Input title === '':", input.title === "");
      console.log("Input title length:", input.title?.length);

      if (!ctx.user) {
        console.error("No user in context");
        console.error("Context object:", JSON.stringify(ctx, null, 2));
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

        console.log("Inserting campaign with data:", campaignData);

        const [row] = await db
          .insert(campaigns)
          .values(campaignData as any)
          .returning();

        console.log("Campaign created successfully:", row);
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
        console.log("=== CAMPAIGN UPDATE INPUT TRANSFORM ===");
        console.log("Raw update input:", data);

        // Input wrapper'ı çıkar
        const actualInput = data.input || data;
        console.log("Actual update input:", actualInput);

        // Zod schema ile validate et
        const updateSchema = campaignInput.extend({ id: z.number() });
        try {
          const result = updateSchema.parse(actualInput);
          console.log("Update Zod validation successful:", result);
          return result;
        } catch (error) {
          console.error("Update Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("=== CAMPAIGN UPDATE START ===");
      console.log("Context user:", ctx.user?.id);
      console.log("Update input data:", input);

      if (!ctx.user) throw new Error("Unauthorized");

      try {
        const updateData = {
          title: input.title,
          description: input.description,
          budget: input.budget,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
        };

        console.log("Updating campaign with data:", updateData);

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

        console.log("Campaign updated successfully:", row);
        return row;
      } catch (error) {
        console.error("Database error updating campaign:", error);
        throw error;
      }
    }),

  delete: publicProcedure
    .input(
      z.any().transform((data) => {
        console.log("=== CAMPAIGN DELETE INPUT TRANSFORM ===");
        console.log("Raw delete input:", data);

        // Input wrapper'ı çıkar
        const actualInput = data.input || data;
        console.log("Actual delete input:", actualInput);

        // Zod schema ile validate et
        const deleteSchema = z.object({ id: z.number() });
        try {
          const result = deleteSchema.parse(actualInput);
          console.log("Delete Zod validation successful:", result);
          return result;
        } catch (error) {
          console.error("Delete Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("=== CAMPAIGN DELETE START ===");
      console.log("Context user:", ctx.user?.id);
      console.log("Delete input data:", input);

      if (!ctx.user) throw new Error("Unauthorized");

      try {
        console.log("Deleting campaign ID:", input.id);

        const [row] = await db
          .delete(campaigns)
          .where(
            and(
              eq(campaigns.id, input.id),
              eq(campaigns.user_id, ctx.user.id as any)
            )
          )
          .returning();

        console.log("Campaign deleted successfully:", row);
        return row;
      } catch (error) {
        console.error("Database error deleting campaign:", error);
        throw error;
      }
    }),
});
