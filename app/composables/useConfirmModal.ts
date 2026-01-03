// Confirm modal composable for replacing native browser confirm()
const isOpen = ref(false)
const resolveCallback = ref<((value: boolean) => void) | null>(null)
const modalOptions = ref({
  title: 'Konfirmasi',
  message: 'Apakah Anda yakin?',
  confirmText: 'Ya',
  cancelText: 'Batal',
  confirmColor: 'error' as 'error' | 'primary' | 'warning'
})

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'error' | 'primary' | 'warning'
}

export const useConfirmModal = () => {
  const confirm = (options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof options === 'string') {
        modalOptions.value = {
          title: 'Konfirmasi',
          message: options,
          confirmText: 'Ya',
          cancelText: 'Batal',
          confirmColor: 'error'
        }
      } else {
        modalOptions.value = {
          title: options.title || 'Konfirmasi',
          message: options.message,
          confirmText: options.confirmText || 'Ya',
          cancelText: options.cancelText || 'Batal',
          confirmColor: options.confirmColor || 'error'
        }
      }

      resolveCallback.value = resolve
      isOpen.value = true
    })
  }

  const handleConfirm = () => {
    isOpen.value = false
    resolveCallback.value?.(true)
    resolveCallback.value = null
  }

  const handleCancel = () => {
    isOpen.value = false
    resolveCallback.value?.(false)
    resolveCallback.value = null
  }

  return {
    isOpen,
    modalOptions,
    confirm,
    handleConfirm,
    handleCancel
  }
}
