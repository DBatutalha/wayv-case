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
      .where(eq(influencers.user_id, ctx.user.id as string));
  }),

  create: publicProcedure
    .input(
      z.any().transform((data) => {
        const actualInput = data.input || data;

        try {
          const result = influencerInput.parse(actualInput);
          return result;
        } catch (error) {
          console.error("Influencer Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      try {
        const [row] = await db
          .insert(influencers)
          .values({
            user_id: ctx.user.id as string,
            name: input.name,
            followerCount: input.followerCount,
            engagementRate: String(input.engagementRate),
          })
          .returning();

        return row;
      } catch (error) {
        console.error("Database error creating influencer:", error);
        throw error;
      }
    }),

  assignToCampaign: publicProcedure
    .input(
      z.any().transform((data) => {
        const actualInput = data.input || data;

        const assignSchema = z.object({
          influencerId: z.number(),
          campaignId: z.number(),
        });
        try {
          const result = assignSchema.parse(actualInput);
          return result;
        } catch (error) {
          console.error("Assign Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      try {
        const [row] = await db
          .insert(campaignInfluencers)
          .values({
            influencerId: input.influencerId,
            campaignId: input.campaignId,
          })
          .returning();

        return row;
      } catch (error) {
        console.error("Database error assigning influencer:", error);
        throw error;
      }
    }),

  unassignFromCampaign: publicProcedure
    .input(
      z.any().transform((data) => {
        // Input wrapper'ı çıkar
        const actualInput = data.input || data;

        // Zod schema ile validate et
        const unassignSchema = z.object({
          influencerId: z.number(),
          campaignId: z.number(),
        });
        try {
          const result = unassignSchema.parse(actualInput);
          return result;
        } catch (error) {
          console.error("Unassign Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      try {
        const [row] = await db
          .delete(campaignInfluencers)
          .where(
            and(
              eq(campaignInfluencers.influencerId, input.influencerId),
              eq(campaignInfluencers.campaignId, input.campaignId)
            )
          )
          .returning();

        return row;
      } catch (error) {
        console.error("Database error unassigning influencer:", error);
        throw error;
      }
    }),

  byCampaign: publicProcedure
    .input(
      z.any().transform((data) => {
        // Input wrapper'ı çıkar
        const actualInput = data.input || data;

        // Zod schema ile validate et
        const byCampaignSchema = z.object({ campaignId: z.number() });
        try {
          const result = byCampaignSchema.parse(actualInput);
          return result;
        } catch (error) {
          console.error("ByCampaign Zod validation failed:", error);
          throw error;
        }
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await db
          .select()
          .from(campaignInfluencers)
          .where(eq(campaignInfluencers.campaignId, input.campaignId));

        return result;
      } catch (error) {
        console.error("Database error in byCampaign:", error);
        throw error;
      }
    }),

  update: publicProcedure
    .input(
      z.any().transform((data) => {
        const actualInput = data.input || data;

        const updateSchema = influencerInput.extend({ id: z.number() });
        try {
          const result = updateSchema.parse(actualInput);
          return result;
        } catch (error) {
          console.error("Influencer Update Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      try {
        const updateData = {
          name: input.name,
          followerCount: input.followerCount,
          engagementRate: String(input.engagementRate),
        };

        const [row] = await db
          .update(influencers)
          .set(updateData)
          .where(
            and(
              eq(influencers.id, input.id),
              eq(influencers.user_id, ctx.user.id as string)
            )
          )
          .returning();

        return row;
      } catch (error) {
        console.error("Database error updating influencer:", error);
        throw error;
      }
    }),

  delete: publicProcedure
    .input(
      z.any().transform((data) => {
        const actualInput = data.input || data;

        const deleteSchema = z.object({ id: z.number() });
        try {
          const result = deleteSchema.parse(actualInput);
          return result;
        } catch (error) {
          console.error("Influencer Delete Zod validation failed:", error);
          throw error;
        }
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      try {
        const [row] = await db
          .delete(influencers)
          .where(
            and(
              eq(influencers.id, input.id),
              eq(influencers.user_id, ctx.user.id as string)
            )
          )
          .returning();

        return row;
      } catch (error) {
        console.error("Database error deleting influencer:", error);
        throw error;
      }
    }),
});
