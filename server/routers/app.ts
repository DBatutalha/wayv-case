import { router } from "@/server/trpc";
import { campaignsRouter } from "@/server/routers/campaigns";
import { influencersRouter } from "@/server/routers/influencers";
import { usersRouter } from "@/server/routers/users";

export const appRouter = router({
  campaigns: campaignsRouter,
  influencers: influencersRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
