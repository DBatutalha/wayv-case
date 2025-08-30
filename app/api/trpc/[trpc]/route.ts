import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/app";
import { createContext } from "@/server/context";

const handler = async (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const context = await createContext();
      return context;
    },
    onError: ({ error, path, input, ctx, req, type }) => {
      console.error("tRPC Error:", {
        error: error.message,
        code: error.code,
        path,
        input,
        type,
        stack: error.stack,
      });
    },
  });
};

export { handler as GET, handler as POST };
