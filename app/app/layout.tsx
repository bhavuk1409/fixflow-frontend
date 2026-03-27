import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppStateProvider } from "@/lib/store";

function isBlockedDevice(userAgent: string) {
  const ua = userAgent.toLowerCase();

  const isTablet =
    /ipad|tablet|playbook|silk|kindle/.test(ua) ||
    (/android/.test(ua) && !/mobile/.test(ua));
  const isMobile = /iphone|ipod|android.*mobile|windows phone|blackberry|bb10|opera mini/.test(ua);
  const isTv =
    /smart-tv|hbbtv|appletv|googletv|crkey|tizen|webos|roku|bravia|viera|netcast|aftb/.test(ua);

  return isTablet || isMobile || isTv;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const ua = headers().get("user-agent") ?? "";
  const shouldBlockAccess = isBlockedDevice(ua);

  if (shouldBlockAccess) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16" style={{ background: "#0a1a0f" }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 15% 20%, rgba(16, 64, 28, 0.5), transparent 45%), radial-gradient(circle at 85% 80%, rgba(74, 222, 128, 0.22), transparent 40%)",
          }}
        />
        <div
          className="relative w-full max-w-2xl rounded-3xl border p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12"
          style={{ borderColor: "rgba(74,222,128,0.2)", background: "rgba(255,255,255,0.02)" }}
        >
          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
            This experience is available on desktop and laptop only
          </h1>
          <p className="mt-4 text-sm sm:text-base" style={{ color: "#8fa88f" }}>
            You are logged in. To continue, please sign in from a desktop or laptop browser for the full Fixflow
            experience.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppStateProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Ambient background glow — dark mode only */}
        <div
          className="pointer-events-none fixed inset-0 z-0 hidden dark:block"
          aria-hidden
        >
          <div
            className="absolute left-[15%] top-[-10%] h-[500px] w-[500px] rounded-full opacity-[0.035]"
            style={{
              background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute bottom-[-10%] right-[10%] h-[400px] w-[400px] rounded-full opacity-[0.025]"
            style={{
              background: "radial-gradient(circle, #22D3EE 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
        </div>

        {/* Desktop sidebar */}
        <Sidebar className="hidden lg:flex" />

        {/* Main content area */}
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AppStateProvider>
  );
}
