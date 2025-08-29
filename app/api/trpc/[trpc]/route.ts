import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/app";
import { createContext } from "@/server/context";

const handler = async (req: Request) => {
  console.log("=== tRPC HANDLER START ===");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));

  // Request body'yi kontrol et
  if (req.method === "POST") {
    try {
      const clonedRequest = req.clone();
      const body = await clonedRequest.text();
      console.log("Request body:", body);
      console.log("Request body parsed:", JSON.parse(body));
    } catch (error) {
      console.error("Error reading request body:", error);
    }
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      console.log("=== CREATING CONTEXT FOR tRPC ===");
      const context = await createContext();
      console.log("Context created, user:", context.user?.id);
      return context;
    },
  });
};

export { handler as GET, handler as POST };
