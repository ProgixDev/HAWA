type Toast = { title: string; message: string } | null;
let toast: Toast = null;
const listeners = new Set<() => void>();
export const showPostpartumSuccessToast = (next: Exclude<Toast, null>) => {
  toast = next;
  listeners.forEach(listener => listener());
};
export const getPostpartumSuccessToast = () => toast;
export const clearPostpartumSuccessToast = () => {
  toast = null;
  listeners.forEach(listener => listener());
};
export const subscribePostpartumSuccessToast = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
