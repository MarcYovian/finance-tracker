import { createSharedComposable } from "@vueuse/core";

const _useDashboard = () => {
  const route = useRoute();
  const router = useRouter();
  const isNotificationsSlideoverOpen = ref(false);

  defineShortcuts({
    "g-h": () => router.push("/"),
    "g-t": () => router.push("/transactions"),
    "g-f": () => router.push("/fund-sources"),
    "g-b": () => router.push("/budgets"),
    "g-g": () => router.push("/goals"),
    "g-c": () => router.push("/categories"),
    "g-r": () => router.push("/recurring"),
    n: () =>
      (isNotificationsSlideoverOpen.value =
        !isNotificationsSlideoverOpen.value),
  });

  watch(
    () => route.fullPath,
    () => {
      isNotificationsSlideoverOpen.value = false;
    }
  );

  return {
    isNotificationsSlideoverOpen,
  };
};

export const useDashboard = createSharedComposable(_useDashboard);
