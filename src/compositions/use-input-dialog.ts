import { ref, h } from 'vue';

import { useDialog, DialogReactive, DialogOptions, NInput } from 'naive-ui';

import { listenForKeyOnce, listenForKey } from '@utils/keyboard-event-utils';

export function useInputDialog(): {
  open: (
    options: {
      placeholder: string;
      value: string;
      inputType?: 'text' | 'textarea';
      minRows?: number;
      beforeClose?: (value: string) => boolean | void;
      onValue?: (value: string) => void;
    } & DialogOptions,
  ) => DialogReactive;
  onConfirm?: (value: string) => void;
} {
  const dialog = useDialog();
  const dialogRef = ref<DialogReactive>();
  const inputValue = ref<string>('');

  return {
    open: ({ placeholder, value, inputType, minRows, onValue, beforeClose, ...options }) => {
      inputValue.value = value;

      const submit = (): boolean => {
        if (beforeClose?.(inputValue.value) === false) {
          return false;
        }
        removeEnterListener();
        onValue?.(inputValue.value);
        dialogRef.value?.destroy();
        return true;
      };

      const removeEnterListener = listenForKey(
        (event) => event.key === 'Enter' && (inputType === 'textarea' ? event.metaKey || event.ctrlKey : true),
        submit,
      );
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
            style: { marginTop: '8px', maxHeight: `calc(90vh - ${16 + 28 + 8 + 16 + 28 + 20 + 10}px)` },
            type: inputType,
            autosize: inputType === 'textarea' ? { minRows } : false,
          }),
        negativeText: 'Close',
        positiveText: 'Ok',
        onPositiveClick: submit,
        onNegativeClick: () => removeKeydownListeners(),
        onMaskClick: () => removeKeydownListeners(),
        onClose: () => removeKeydownListeners(),
        ...options,
      });
      return dialogRef.value;
    },
  };
}
