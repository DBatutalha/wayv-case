import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc";
import { db } from "@/lib/drizzle";
import { campaigns, campaignInfluencers, influencers } from "@/drizzle/schema";
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

  listWithInfluencers: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];

    try {
      // Tüm kampanyaları al
      const campaignsData = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.user_id, ctx.user.id as unknown as string));

      // Tüm influencer'ları al
      const allInfluencers = await db
        .select()
        .from(influencers)
        .where(eq(influencers.user_id, ctx.user.id as unknown as string));

      // Tüm kampanya-influencer eşleştirmelerini al
      const campaignInfluencerMappings = await db
        .select()
        .from(campaignInfluencers);

      // Kampanyaları influencer'ları ile birleştir
      const campaignsWithInfluencers = campaignsData.map((campaign) => {
        const assignedInfluencerIds = campaignInfluencerMappings
          .filter((mapping) => mapping.campaignId === campaign.id)
          .map((mapping) => mapping.influencerId);

        const assignedInfluencers = allInfluencers.filter((influencer) =>
          assignedInfluencerIds.includes(influencer.id)
        );

        return {
          ...campaign,
          assignedInfluencers,
        };
      });

      return {
        campaigns: campaignsWithInfluencers,
        allInfluencers: allInfluencers,
      };
    } catch (error) {
      console.error("Error fetching campaigns with influencers:", error);
      throw error;
    }
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
          user_id: ctx.user.id as string,
          title: input.title,
          description: input.description,
          budget: input.budget,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
        };

        const [row] = await db
          .insert(campaigns)
          .values(campaignData)
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
          .set(updateData)
          .where(
            and(
              eq(campaigns.id, input.id),
              eq(campaigns.user_id, ctx.user.id as string)
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
              eq(campaigns.user_id, ctx.user.id as string)
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
