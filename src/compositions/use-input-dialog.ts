import { ref, h, watch, RendererElement, RendererNode, VNode } from 'vue';

import { useDialog, DialogReactive, DialogOptions, NInput, InputProps } from 'naive-ui';

import { listenForKeyOnce, listenForKey } from '@utils/keyboard-event-utils';

export function useInputDialog(): {
  open: (
    options: {
      placeholder: string;
      value: string;
      inputType?: 'text' | 'textarea';
      minRows?: number;
      beforeClose?: (value: string) => (boolean | void) | Promise<boolean | void>;
      onValue?: (value: string) => void;
    } & DialogOptions,
  ) => DialogReactive;
  onConfirm?: (value: string) => void;
} {
  const dialog = useDialog();
  const dialogRef = ref<DialogReactive>();
  const inputValue = ref<string>('');
  const loading = ref(false);
  const isInvalid = ref(false);

  let inputVNode: VNode<RendererNode, RendererElement, InputProps> | undefined;

  watch(
    () => loading.value,
    () => {
      if (dialogRef.value) {
        dialogRef.value.loading = loading.value;
      }
      if (inputVNode?.props) {
        inputVNode.props.loading = loading.value;
      }
    },
  );

  return {
    open: ({ placeholder, value, inputType, minRows, onValue, beforeClose, ...options }) => {
      inputValue.value = value;

      const beforeSubmitCheck = async (): Promise<boolean | void> => {
        const beforeCloseResult = beforeClose?.(inputValue.value);
        let canClose: boolean | void;
        if (beforeCloseResult instanceof Promise) {
          loading.value = true;
          canClose = await beforeCloseResult;
          loading.value = false;
        } else {
          canClose = beforeCloseResult;
        }
        return canClose;
      };

      const submit = async (): Promise<boolean> => {
        if ((await beforeSubmitCheck()) === false) {
          isInvalid.value = true;
          return false;
        }
        removeEnterListener();
        onValue?.(inputValue.value);
        dialogRef.value?.destroy();
        return true;
      };

      const removeEnterListener = listenForKey(
        (event) => event.key === 'Enter' && (inputType === 'textarea' ? event.metaKey || event.ctrlKey : true),
        (event) => {
          event.preventDefault();
          submit();
        },
      );
      const removeEscapeListener = listenForKeyOnce('Escape', () => {
        removeKeydownListeners();
        dialogRef.value?.destroy();
      });
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
            disabled: loading.value,
            status: isInvalid.value === true ? 'error' : undefined,
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
