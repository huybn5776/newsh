import { DialogReactive } from 'naive-ui';
import { DialogOptions } from 'naive-ui/lib/dialog/src/DialogProvider';

export function wrapOnDialogCloseEvents(dialogReactive: DialogReactive, callback: () => void): void {
  const originalProps = { ...dialogReactive };
  const conditionType = (key: 'onClose' | 'onPositiveClick' | 'onNegativeClick') => (e?: MouseEvent) => {
    const result = originalProps[key]?.(e!);
    if (result instanceof Promise) {
      return new Promise((resole) => {
        result.then((close) => {
          if (close !== false) {
            callback();
          }
          resole(close);
        });
      });
    }
    if (result !== false) {
      callback();
    }
    return result;
  };
  const newProps: Partial<DialogOptions> & { onEsc: () => void } = {
    onEsc: () => {
      (originalProps as unknown as DialogOptions & { onEsc: () => void }).onEsc?.();
      callback();
    },
    onMaskClick: (e) => {
      originalProps.onMaskClick?.(e);
      callback();
    },
    onClose: conditionType('onClose'),
    onPositiveClick: conditionType('onPositiveClick'),
    onNegativeClick: conditionType('onNegativeClick'),
  };
  Object.assign(dialogReactive, newProps);
}
