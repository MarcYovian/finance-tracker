<script setup lang="ts">
import { formatCurrencyInput, parseCurrencyInput } from '~/composables/useCurrencyInput'

const props = defineProps<{
    modelValue: number | undefined
    placeholder?: string
    disabled?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void
}>()

const displayValue = ref(formatCurrencyInput(props.modelValue))

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
    displayValue.value = formatCurrencyInput(newVal)
})

function handleInput(event: Event) {
    const input = event.target as HTMLInputElement
    const rawValue = input.value

    // Only allow digits and dots
    const cleaned = rawValue.replace(/[^\d]/g, '')
    const numericValue = parseInt(cleaned, 10) || 0

    // Update display with formatted value
    displayValue.value = formatCurrencyInput(numericValue)

    // Emit the numeric value
    emit('update:modelValue', numericValue)
}

function handleBlur() {
    // Ensure display is formatted on blur
    displayValue.value = formatCurrencyInput(props.modelValue)
}
</script>

<template>
    <UInput :model-value="displayValue" type="text" inputmode="numeric" :placeholder="placeholder || '0'"
        :disabled="disabled" class="w-full" @input="handleInput" @blur="handleBlur" />
</template>
