/**
 * Composable for handling currency input formatting
 * Formats numbers to Indonesian Rupiah format (x.xxx.xxx)
 */
export const useCurrencyInput = (initialValue: number = 0) => {
  const numericValue = ref(initialValue);
  const displayValue = ref(formatToDisplay(initialValue));

  // Format number to display string (x.xxx.xxx)
  function formatToDisplay(value: number): string {
    if (!value && value !== 0) return "";
    return new Intl.NumberFormat("id-ID").format(value);
  }

  // Parse display string back to number
  function parseToNumber(value: string): number {
    if (!value) return 0;
    // Remove all dots (thousand separators in ID format)
    const cleaned = value.replace(/\./g, "");
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Handle input event
  function onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cursorPos = input.selectionStart || 0;
    const oldLength = input.value.length;

    // Parse and reformat
    numericValue.value = parseToNumber(input.value);
    displayValue.value = formatToDisplay(numericValue.value);

    // Adjust cursor position after formatting
    nextTick(() => {
      const newLength = displayValue.value.length;
      const diff = newLength - oldLength;
      const newPos = Math.max(0, cursorPos + diff);
      input.setSelectionRange(newPos, newPos);
    });
  }

  // Set value programmatically
  function setValue(value: number) {
    numericValue.value = value;
    displayValue.value = formatToDisplay(value);
  }

  // Watch for external changes
  watch(numericValue, (newVal) => {
    displayValue.value = formatToDisplay(newVal);
  });

  return {
    numericValue,
    displayValue,
    onInput,
    setValue,
    formatToDisplay,
    parseToNumber,
  };
};

/**
 * Simple utility functions for currency formatting
 */
export const formatCurrencyInput = (value: number | undefined): string => {
  if (value === undefined || value === null) return "";
  if (!value && value !== 0) return "";
  return new Intl.NumberFormat("id-ID").format(value);
};

export const parseCurrencyInput = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/\./g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};
