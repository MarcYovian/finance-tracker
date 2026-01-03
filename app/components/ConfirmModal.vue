<script setup lang="ts">
const { isOpen, modalOptions, handleConfirm, handleCancel } = useConfirmModal()
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-full bg-error/10">
              <UIcon
                name="i-lucide-alert-triangle"
                class="size-5 text-error"
              />
            </div>
            <h3 class="text-lg font-semibold text-highlighted">
              {{ modalOptions.title }}
            </h3>
          </div>
        </template>

        <p class="text-muted">
          {{ modalOptions.message }}
        </p>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="handleCancel"
            >
              {{ modalOptions.cancelText }}
            </UButton>
            <UButton
              :color="modalOptions.confirmColor"
              @click="handleConfirm"
            >
              {{ modalOptions.confirmText }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
