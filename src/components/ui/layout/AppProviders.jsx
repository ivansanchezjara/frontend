"use client";

import { ConfirmProvider } from "../feedback/ConfirmContext";
import { ToastProvider } from "../feedback/ToastContext";

export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
