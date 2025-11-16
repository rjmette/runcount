import React from 'react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full dark:text-white border-2 border-orange-500 dark:border-orange-600">
        <h3 className="text-xl font-bold mb-4">Alert</h3>

        <div className="mb-6">
          <p className="mb-4 text-gray-700 dark:text-gray-300">{message}</p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-lg font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
