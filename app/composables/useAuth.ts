import { createSharedComposable } from "@vueuse/core";

const _useAuth = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  const loading = ref(false);
  const error = ref<string | null>(null);

  const signIn = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        error.value = signInError.message;
        return false;
      }

      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "An error occurred";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email,
          },
        },
      });

      if (signUpError) {
        error.value = signUpError.message;
        return false;
      }

      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "An error occurred";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const signOut = async () => {
    loading.value = true;
    error.value = null;

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        error.value = signOutError.message;
        return false;
      }

      await navigateTo("/auth/login");
      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "An error occurred";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const resetPassword = async (email: string) => {
    loading.value = true;
    error.value = null;

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetError) {
        error.value = resetError.message;
        return false;
      }

      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "An error occurred";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const updatePassword = async (newPassword: string) => {
    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        error.value = updateError.message;
        return false;
      }

      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "An error occurred";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const isAuthenticated = computed(() => !!user.value);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };
};

export const useAuth = createSharedComposable(_useAuth);
