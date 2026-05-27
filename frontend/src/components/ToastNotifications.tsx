import { Check, AlertCircle } from 'lucide-react';
import type { Toast } from '../types';

interface ToastNotificationsProps {
  toasts: Toast[];
}

export function ToastNotifications({ toasts }: ToastNotificationsProps) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-40">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {toast.type === 'success' && <Check size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
