import React, { useState } from 'react';
import Button from './common/Button';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  reportAuthor: string;
}

const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, onReject, reportAuthor }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onReject(reason.trim());
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Reject Report</h3>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white"
            disabled={isSubmitting}
          >
            <ion-icon name="close" size="large"></ion-icon>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-slate-300 text-sm mb-2">
            You are about to reject the report by <span className="font-semibold text-white">{reportAuthor}</span>.
          </p>
          <p className="text-slate-400 text-xs">
            Please provide a reason for rejection. This will be visible to the report author.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="rejectionReason" className="block text-sm font-medium text-slate-300 mb-2">
              Rejection Reason *
            </label>
            <textarea
              id="rejectionReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="e.g., Insufficient evidence, unclear location, duplicate report..."
              required
              disabled={isSubmitting}
              maxLength={500}
            />
            <div className="text-xs text-slate-400 mt-1">
              {reason.length}/500 characters
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={!reason.trim() || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Rejecting...
                </div>
              ) : (
                <>
                  <ion-icon name="close-circle" className="mr-2"></ion-icon>
                  Reject Report
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectModal;
