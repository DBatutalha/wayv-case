import { router } from "@/server/trpc";
import { campaignsRouter } from "@/server/routers/campaigns";
import { influencersRouter } from "@/server/routers/influencers";

export const appRouter = router({
  campaigns: campaignsRouter,
  influencers: influencersRouter,
});

export type AppRouter = typeof appRouter;
