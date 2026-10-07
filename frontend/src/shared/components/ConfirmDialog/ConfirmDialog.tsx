import React from 'react';
import Modal from '../Modal';
import Button from '../Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="sm">
    <div className="space-y-4">
      <p className="text-zinc-300 text-sm">{message}</p>
      <div className="flex justify-end space-x-3 pt-3">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;

