<script setup lang="ts">
const cardRef = useTemplateRef<HTMLElement | null>('cardRef')
const { width } = useElementSize(cardRef)
</script>

<template>
    <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: 'px-0! pt-0! pb-3!' }">"
        <template #header>
            <p class="text-xs text-muted uppercase mb-1.5">
                Pemasukan vs Pengeluaran
            </p>
        </template>

        <div class="h-96 flex items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-muted" />
        </div>
    </UCard>
</template>
