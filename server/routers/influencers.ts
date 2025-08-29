import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc";
import { db } from "@/lib/drizzle";
import { campaignInfluencers, influencers } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

const influencerInput = z.object({
  name: z.string().min(1),
  followerCount: z.number().int().nonnegative().default(0),
  engagementRate: z.number().min(0).max(100).default(0),
});

export const influencersRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    return db
      .select()
      .from(influencers)
      .where(eq(influencers.user_id, ctx.user.id as any));
  }),

  create: publicProcedure
    .input(
      z.any().transform((data) => {
        console.log("=== INFLUENCER INPUT TRANSFORM ===");
        console.log("Raw influencer input:", data);
        console.log("Input type:", typeof data);
        console.log("Input keys:", Object.keys(data || {}));

        // Input wrapper'ı çıkar
        const actualInput = data.input || data;
        console.log("Actual input after unwrapping:", actualInput);
        console.log("Actual input keys:", Object.keys(actualInput || {}));

        // Zod schema ile validate et
        try {
          const result = influencerInput.parse(actualInput);
          console.log("Influencer Zod validation successful:", result);
          return result;
        } catch (error) {
          console.error("Influencer Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("=== INFLUENCER CREATE START ===");
      console.log("Context user:", ctx.user?.id);
      console.log("Input data:", input);

      if (!ctx.user) throw new Error("Unauthorized");

      try {
        console.log("Inserting influencer with data:", {
          user_id: ctx.user.id,
          name: input.name,
          followerCount: input.followerCount,
          engagementRate: String(input.engagementRate),
        });

        const [row] = await db
          .insert(influencers)
          .values({
            user_id: ctx.user.id as any,
            name: input.name,
            followerCount: input.followerCount,
            engagementRate: String(input.engagementRate),
          } as any)
          .returning();

        console.log("Influencer created successfully:", row);
        return row;
      } catch (error) {
        console.error("Database error creating influencer:", error);
        throw error;
      }
    }),

  assignToCampaign: publicProcedure
    .input(
      z.any().transform((data) => {
        console.log("=== ASSIGN INFLUENCER INPUT TRANSFORM ===");
        console.log("Raw assign input:", data);

        // Input wrapper'ı çıkar
        const actualInput = data.input || data;
        console.log("Actual assign input:", actualInput);

        // Zod schema ile validate et
        const assignSchema = z.object({
          influencerId: z.number(),
          campaignId: z.number(),
        });
        try {
          const result = assignSchema.parse(actualInput);
          console.log("Assign Zod validation successful:", result);
          return result;
        } catch (error) {
          console.error("Assign Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("=== ASSIGN INFLUENCER START ===");
      console.log("Context user:", ctx.user?.id);
      console.log("Input data:", input);

      if (!ctx.user) throw new Error("Unauthorized");

      try {
        console.log("Assigning influencer with data:", {
          influencerId: input.influencerId,
          campaignId: input.campaignId,
        });

        const [row] = await db
          .insert(campaignInfluencers)
          .values({
            influencerId: input.influencerId,
            campaignId: input.campaignId,
          })
          .returning();

        console.log("Influencer assigned successfully:", row);
        return row;
      } catch (error) {
        console.error("Database error assigning influencer:", error);
        throw error;
      }
    }),

  byCampaign: publicProcedure
    .input(
      z.any().transform((data) => {
        console.log("=== BY CAMPAIGN INPUT TRANSFORM ===");
        console.log("Raw byCampaign input:", data);

        // Input wrapper'ı çıkar
        const actualInput = data.input || data;
        console.log("Actual byCampaign input:", actualInput);

        // Zod schema ile validate et
        const byCampaignSchema = z.object({ campaignId: z.number() });
        try {
          const result = byCampaignSchema.parse(actualInput);
          console.log("ByCampaign Zod validation successful:", result);
          return result;
        } catch (error) {
          console.error("ByCampaign Zod validation failed:", error);
          throw error;
        }
      })
    )
    .query(async ({ input }) => {
      console.log("=== BY CAMPAIGN QUERY START ===");
      console.log("Input data:", input);

      try {
        const result = await db
          .select()
          .from(campaignInfluencers)
          .where(eq(campaignInfluencers.campaignId, input.campaignId));

        console.log("ByCampaign query successful:", result);
        return result;
      } catch (error) {
        console.error("Database error in byCampaign:", error);
        throw error;
      }
    }),

  update: publicProcedure
    .input(
      z.any().transform((data) => {
        console.log("=== INFLUENCER UPDATE INPUT TRANSFORM ===");
        console.log("Raw update input:", data);

        // Input wrapper'ı çıkar
        const actualInput = data.input || data;
        console.log("Actual update input:", actualInput);

        // Zod schema ile validate et
        const updateSchema = influencerInput.extend({ id: z.number() });
        try {
          const result = updateSchema.parse(actualInput);
          console.log("Influencer Update Zod validation successful:", result);
          return result;
        } catch (error) {
          console.error("Influencer Update Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("=== INFLUENCER UPDATE START ===");
      console.log("Context user:", ctx.user?.id);
      console.log("Update input data:", input);

      if (!ctx.user) throw new Error("Unauthorized");

      try {
        const updateData = {
          name: input.name,
          followerCount: input.followerCount,
          engagementRate: String(input.engagementRate),
        };

        console.log("Updating influencer with data:", updateData);

        const [row] = await db
          .update(influencers)
          .set(updateData as any)
          .where(
            and(
              eq(influencers.id, input.id),
              eq(influencers.user_id, ctx.user.id as any)
            )
          )
          .returning();

        console.log("Influencer updated successfully:", row);
        return row;
      } catch (error) {
        console.error("Database error updating influencer:", error);
        throw error;
      }
    }),

  delete: publicProcedure
    .input(
      z.any().transform((data) => {
        console.log("=== INFLUENCER DELETE INPUT TRANSFORM ===");
        console.log("Raw delete input:", data);

        // Input wrapper'ı çıkar
        const actualInput = data.input || data;
        console.log("Actual delete input:", actualInput);

        // Zod schema ile validate et
        const deleteSchema = z.object({ id: z.number() });
        try {
          const result = deleteSchema.parse(actualInput);
          console.log("Influencer Delete Zod validation successful:", result);
          return result;
        } catch (error) {
          console.error("Influencer Delete Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("=== INFLUENCER DELETE START ===");
      console.log("Context user:", ctx.user?.id);
      console.log("Delete input data:", input);

      if (!ctx.user) throw new Error("Unauthorized");

      try {
        console.log("Deleting influencer ID:", input.id);

        const [row] = await db
          .delete(influencers)
          .where(
            and(
              eq(influencers.id, input.id),
              eq(influencers.user_id, ctx.user.id as any)
            )
          )
          .returning();

        console.log("Influencer deleted successfully:", row);
        return row;
      } catch (error) {
        console.error("Database error deleting influencer:", error);
        throw error;
      }
    }),
});
