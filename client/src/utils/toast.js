import { toast } from 'sonner';

// Utility functions for consistent toast messages across the app
export const showToast = {
  success: (message, options = {}) => {
    toast.success(message, { duration: 3000, ...options });
  },

  error: (message, options = {}) => {
    toast.error(message, { duration: 4000, ...options });
  },

  warning: (message, options = {}) => {
    toast.warning(message, { duration: 3500, ...options });
  },

  info: (message, options = {}) => {
    toast.info(message, { duration: 3000, ...options });
  },

  loading: (message) => {
    return toast.loading(message);
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
  }
};
