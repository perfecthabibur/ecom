
import React from 'react';
import Button from './Button';
import { ModalState } from '../../types';

interface ModalProps {
  modalState: ModalState;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ modalState, onClose }) => {
  if (!modalState.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{modalState.title}</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">{modalState.message}</p>
        <div className={`flex ${modalState.isConfirmOnly ? 'justify-end' : 'justify-between'} space-x-3 mt-6`}>
          {!modalState.isConfirmOnly && (
            <Button
              variant="outline"
              onClick={() => {
                modalState.onCancel?.();
                onClose();
              }}
            >
              {modalState.cancelText || 'Cancel'}
            </Button>
          )}
          <Button
            onClick={() => {
              modalState.onConfirm?.();
              onClose();
            }}
          >
            {modalState.confirmText || 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;