import React, { useState } from 'react';
import { Modal, Input, Button } from '@/components/common';
import { authApi } from '@/api/auth';
import { extractErrorMessage } from '@/api/client';
import { toast } from '@/hooks/useToast';
import { KeyRound } from 'lucide-react';

export interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [masterPassphrase, setMasterPassphrase] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Update email if defaultEmail changes
  React.useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !masterPassphrase || !newPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await authApi.resetPassword({
        email,
        master_passphrase: masterPassphrase,
        new_password: newPassword,
      });
      toast(response.message || 'Password reset successfully', 'success');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to reset password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-400" />
          <span>Reset Account Password</span>
        </div>
      }
      description="Use the workspace master passphrase to reset an operator password."
    >
      <form onSubmit={handleReset} className="space-y-4 mt-2">
        <Input
          label="Operator Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="operator@nutmeg.com"
          required
        />

        <Input
          label="Master Passphrase"
          type="password"
          value={masterPassphrase}
          onChange={(e) => setMasterPassphrase(e.target.value)}
          placeholder="Enter master passphrase"
          helperText="Default developer passphrase: password123"
          required
        />

        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimum 6 characters"
          required
        />

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            Reset Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};
