import { useState, useEffect } from 'react';
import { isWebAuthnAvailable, getWebAuthnErrorMessage } from '../utils/webauthn-availability';

/**
 * A hook to check if WebAuthn is available in the current context
 * and provide relevant error information if it's not.
 */
export default function useWebAuthnAvailability() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Don't run during SSR
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const checkAvailability = async () => {
      try {
        const available = await isWebAuthnAvailable();
        
        if (isMounted) {
          setIsAvailable(available);
          
          if (!available) {
            setErrorMessage(getWebAuthnErrorMessage());
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setIsAvailable(false);
          setErrorMessage('Error checking WebAuthn availability');
          setIsLoading(false);
          console.error('Error checking WebAuthn availability:', error);
        }
      }
    };

    checkAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isAvailable,
    isLoading,
    errorMessage,
  };
} 