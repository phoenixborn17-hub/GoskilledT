"use client";
import * as React from "react";
import { Modal } from "./modal";
import { Button } from "./button";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive actions render a danger confirm button. */
  destructive?: boolean;
  loading?: boolean;
}

/**
 * Confirmation dialog for consequential actions. Prefer undo over confirm where safe (DESIGN §
 * forgiving) — reserve this for genuinely destructive/irreversible steps. Built on <Modal>.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="sm:w-auto">
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            loading={loading}
            onClick={onConfirm}
            className={
              destructive
                ? "bg-danger hover:bg-danger/90 sm:w-auto"
                : "sm:w-auto"
            }
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
