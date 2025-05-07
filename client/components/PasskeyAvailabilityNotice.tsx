import React, { useEffect } from 'react';
import useWebAuthnAvailability from '../hooks/useWebAuthnAvailability';

interface PasskeyAvailabilityNoticeProps {
  onAvailabilityChange?: (isAvailable: boolean) => void;
}

/**
 * A component that checks if passkeys are available in the current context
 * and notifies the parent component via callback.
 * 
 * This component can be used without rendering anything visible (by default)
 * or it can show an error message by setting showErrorMessage to true.
 * 
 * @param props Component properties
 * @returns React component
 */
export const PasskeyAvailabilityNotice: React.FC<PasskeyAvailabilityNoticeProps & {
  showErrorMessage?: boolean;
  className?: string;
}> = ({ 
  onAvailabilityChange,
  showErrorMessage = false,
  className = '',
}) => {
  const { isAvailable, isLoading, errorMessage } = useWebAuthnAvailability();

  useEffect(() => {
    if (!isLoading && onAvailabilityChange) {
      onAvailabilityChange(!!isAvailable);
    }
  }, [isAvailable, isLoading, onAvailabilityChange]);

  // Don't render anything if we're not supposed to show the error message
  // or if passkeys are available or we're still loading
  if (!showErrorMessage || isLoading || isAvailable) {
    return null;
  }

  // Otherwise, show the error message
  return (
    <div className={`passkey-availability-notice ${className}`} style={{
      padding: '12px',
      margin: '8px 0',
      borderRadius: '4px',
      backgroundColor: '#fff4e5',
      border: '1px solid #ffab70',
      color: '#664500',
      fontSize: '14px',
      lineHeight: '1.4',
    }}>
      <strong>Passkey Login Information</strong>
      <p style={{ margin: '8px 0 0 0' }}>
        {errorMessage || 'Passkey authentication is not available in this context.'}
      </p>
      {window !== window.top && (
        <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
          This application is running in an iframe. The parent website needs to allow passkey authentication
          by adding the appropriate permissions policy header.
        </p>
      )}
    </div>
  );
};

export default PasskeyAvailabilityNotice; 