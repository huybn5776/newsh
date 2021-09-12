import { ref, h } from 'vue';

import { useDialog, DialogReactive, DialogOptions, NInput } from 'naive-ui';

import { listenForKeyOnce } from '@utils/keyboard-event-utils';

export function useInputDialog(): {
  open: (
    options: { placeholder: string; value: string; onValue: (value: string | undefined) => void } & DialogOptions,
  ) => DialogReactive;
  onConfirm?: (value: string) => void;
} {
  const dialog = useDialog();
  const dialogRef = ref<DialogReactive>();
  const inputValue = ref<string>();

  return {
    open: ({ placeholder, value, onValue, ...options }) => {
      inputValue.value = value;

      const removeEnterListener = listenForKeyOnce('Enter', () => {
        onValue(inputValue.value);
        dialogRef.value?.destroy();
      });
      const removeEscapeListener = listenForKeyOnce('Escape', () => dialogRef.value?.destroy());
      const removeKeydownListeners = (): void => {
        removeEnterListener();
        removeEscapeListener();
      };

      dialogRef.value = dialog.info({
        content: () =>
          h(NInput, {
            placeholder,
            value: inputValue.value,
            'onUpdate-value': (newValue: string) => (inputValue.value = newValue),
            style: { marginTop: '8px' },
          }),
        negativeText: 'Close',
        positiveText: 'Add',
        onPositiveClick: () => {
          removeKeydownListeners();
          onValue(inputValue.value);
        },
        onNegativeClick: () => removeKeydownListeners(),
        onMaskClick: () => removeKeydownListeners(),
        onClose: () => removeKeydownListeners(),
        ...options,
      });
      return dialogRef.value;
    },
  };
}
