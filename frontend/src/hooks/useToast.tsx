import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { ToastProps } from '../components/common/Toast';

interface ToastState {
    toasts: ToastProps[];
    addToast: (toast: Omit<ToastProps, 'id'>) => void;
    removeToast: (id: string) => void;
}

export const useToastState = create<ToastState>((set) => ({
    toasts: [],
    addToast: (toast) => set((state) => ({
        toasts: [...state.toasts, { ...toast, id: uuidv4() }],
    })),
    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

export const useToast = () => {
    const { addToast, removeToast } = useToastState();

    const showToast = (
        message: string,
        type: ToastProps['type'] = 'info',
        title?: string,
        duration?: number
    ) => {
        addToast({ message, type, title, duration });
    };

    return {
        showToast,
        removeToast,
        success: (message: string, title?: string) => showToast(message, 'success', title),
        error: (message: string, title?: string) => showToast(message, 'error', title),
        warning: (message: string, title?: string) => showToast(message, 'warning', title),
        info: (message: string, title?: string) => showToast(message, 'info', title),
    };
}; 