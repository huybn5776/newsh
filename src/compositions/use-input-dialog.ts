import { ref, h, watch, RendererElement, RendererNode, VNode } from 'vue';

import { useDialog, DialogReactive, DialogOptions, NInput, InputProps } from 'naive-ui';
import { takeUntil, Subject } from 'rxjs';

import { useHotkey } from '@/compositions/use-hotkey';
import { wrapOnDialogCloseEvents } from '@/utils/dialog-utils';

export function useInputDialog(): {
  open: (
    options: {
      placeholder: string;
      value: string;
      inputType?: 'text' | 'textarea';
      minRows?: number;
      beforeClose?: (value: string) => (boolean | undefined) | Promise<boolean | undefined>;
      onValue?: (value: string) => void;
    } & DialogOptions,
  ) => DialogReactive;
  onConfirm?: (value: string) => void;
} {
  const dialog = useDialog();
  const { listenForKey } = useHotkey();

  const dialogRef = ref<DialogReactive>();
  const inputValue = ref<string>('');
  const loading = ref(false);
  const isInvalid = ref(false);

  const dialogClosed$$ = new Subject<void>();

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

      const beforeSubmitCheck = async (): Promise<boolean | undefined> => {
        const beforeCloseResult = beforeClose?.(inputValue.value);
        let canClose: boolean | undefined;
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
        unsubscribeHotkeys();
        onValue?.(inputValue.value);
        dialogRef.value?.destroy();
        return true;
      };

      listenForKey(
        (event) => event.key === 'Enter' && (inputType === 'textarea' ? event.metaKey || event.ctrlKey : true),
      )
        .pipe(takeUntil(dialogClosed$$))
        .subscribe((event) => {
          event.preventDefault();
          submit();
        });

      function unsubscribeHotkeys(): void {
        dialogClosed$$.next(undefined);
      }

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
            status: isInvalid.value ? 'error' : undefined,
          }),
        negativeText: 'Close',
        positiveText: 'Ok',
        onPositiveClick: submit,
        ...options,
      });
      wrapOnDialogCloseEvents(dialogRef.value, unsubscribeHotkeys);
      return dialogRef.value;
    },
  };
}
