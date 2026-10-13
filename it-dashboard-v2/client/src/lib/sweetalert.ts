import Swal, { SweetAlertOptions } from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Helper to determine if current theme is dark
const isDark = () => {
  if (typeof document === 'undefined') return true;
  return document.documentElement.classList.contains('dark');
};

const getBaseOptions = (): SweetAlertOptions => {
  const dark = isDark();
  return {
    background: dark ? '#0f172a' : '#ffffff',
    color: dark ? '#f8fafc' : '#0f172a',
    backdrop: `rgba(0, 0, 0, ${dark ? 0.75 : 0.55})`,
    showClass: {
      popup: 'swal2-show animate-in fade-in zoom-in-95 duration-150',
      backdrop: 'swal2-backdrop-show animate-in fade-in duration-150',
    },
    hideClass: {
      popup: 'swal2-hide animate-out fade-out zoom-out-95 duration-100',
    },
  };
};

/**
 * Modern SweetAlert confirmation dialog for Delete operations.
 * Guaranteed solid red confirm button and styled cancel button.
 */
export const confirmDelete = async ({
  title = 'Are you sure?',
  text = 'This action cannot be undone and will delete the selected record.',
  confirmButtonText = 'Yes, Delete',
  cancelButtonText = 'Cancel',
}: {
  title?: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
} = {}): Promise<boolean> => {
  const base = getBaseOptions();
  const result = await Swal.fire({
    ...base,
    title,
    text,
    icon: 'warning',
    iconColor: '#f43f5e',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed;
};

/**
 * Modern SweetAlert confirmation dialog for general actions (e.g. Revert, Reset).
 */
export const confirmAction = async ({
  title,
  text,
  icon = 'question',
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  isDanger = false,
}: {
  title: string;
  text?: string;
  icon?: 'warning' | 'question' | 'info';
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDanger?: boolean;
}): Promise<boolean> => {
  const base = getBaseOptions();
  const result = await Swal.fire({
    ...base,
    title,
    text,
    icon,
    iconColor: isDanger ? '#f43f5e' : '#f59e0b',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: isDanger ? '#e11d48' : '#f59e0b',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
  });

  return result.isConfirmed;
};

/**
 * Modern SweetAlert for Warning/Validation messages (replaces window.alert)
 */
export const showWarningAlert = async (title: string, text?: string) => {
  const base = getBaseOptions();
  return Swal.fire({
    ...base,
    title,
    text,
    icon: 'warning',
    iconColor: '#f59e0b',
    confirmButtonText: 'Got It',
    confirmButtonColor: '#f59e0b',
  });
};

/**
 * Modern SweetAlert for Error messages
 */
export const showErrorAlert = async (title: string, text?: string) => {
  const base = getBaseOptions();
  return Swal.fire({
    ...base,
    title,
    text,
    icon: 'error',
    iconColor: '#f43f5e',
    confirmButtonText: 'Dismiss',
    confirmButtonColor: '#e11d48',
  });
};

/**
 * Modern SweetAlert for Success messages
 */
export const showSuccessAlert = async (title: string, text?: string) => {
  const base = getBaseOptions();
  return Swal.fire({
    ...base,
    title,
    text,
    icon: 'success',
    iconColor: '#10b981',
    timer: 2500,
    showConfirmButton: false,
  });
};

export default Swal;
