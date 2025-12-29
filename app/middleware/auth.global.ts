export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for auth routes
  if (to.path.startsWith("/auth") || to.path === "/confirm") {
    return;
  }

  const user = useSupabaseUser();

  // Wait for the user to be loaded
  // This is necessary because the user might not be available on initial load
  if (import.meta.server) {
    const supabase = useSupabaseClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return navigateTo("/auth/login");
    }
  } else {
    // On client, check if user is available
    if (!user.value) {
      return navigateTo("/auth/login");
    }
  }
});
