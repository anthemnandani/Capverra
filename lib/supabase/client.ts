import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      "[Supabase] Missing environment variables. Using stub client.",
      {
        hasUrl: !!url,
        hasKey: !!key,
      }
    );
    // Return a stub client that won't crash - this will be caught by error boundaries
    return createBrowserClient(
      url || "https://stub.supabase.co",
      key || "stub-key"
    );
  }

  return createBrowserClient(url, key);
}
