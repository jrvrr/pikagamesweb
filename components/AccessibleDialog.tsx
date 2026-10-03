"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";

interface AccessibleDialogProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}

export function AccessibleDialog({ open, title, description, onClose, children }: AccessibleDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" />
        <Dialog.Viewport className="fixed inset-0 z-[101] flex items-center justify-center overflow-y-auto overscroll-contain p-4 sm:p-6">
          <Dialog.Popup className="relative w-full flex items-center justify-center outline-none">
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            <Dialog.Description className="sr-only">{description}</Dialog.Description>
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
