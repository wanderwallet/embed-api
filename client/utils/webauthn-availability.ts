/**
 * Utility functions for checking WebAuthn availability, especially in iframe contexts
 */

/**
 * Checks if the WebAuthn API is available in the current context
 * @returns Promise that resolves to true if WebAuthn is available, or false if not
 */
export async function isWebAuthnAvailable(): Promise<boolean> {
  // First check if PublicKeyCredential is defined
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }

  // Then check if we're in an iframe context
  const isInIframe = window !== window.top;

  // If we're not in an iframe, WebAuthn should be available
  if (!isInIframe) {
    return true;
  }

  // If we're in an iframe, we need to check if the browser supports WebAuthn in iframes
  // by actually attempting a small operation
  try {
    // Check if isUserVerifyingPlatformAuthenticatorAvailable is accessible
    // This is a low-impact way to check availability without triggering permissions
    await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    
    // If we get here without an error, the API is accessible
    return true;
  } catch (error) {
    console.error('WebAuthn is not available in this iframe context:', error);
    return false;
  }
}

/**
 * Gets a user-friendly message explaining why WebAuthn might not be available
 * @returns A string message suitable for displaying to users
 */
export function getWebAuthnErrorMessage(): string {
  if (typeof window === 'undefined') {
    return 'WebAuthn is not available in server-side contexts.';
  }

  const isInIframe = window !== window.top;
  
  if (!window.PublicKeyCredential) {
    return 'WebAuthn is not supported in this browser. Please try a modern browser like Chrome, Edge, Safari or Firefox.';
  }

  if (isInIframe) {
    return 'Passkey authentication may be blocked in embedded contexts. The parent website may need to enable the "publickey-credentials-get" permission policy.';
  }

  return 'WebAuthn is not available for an unknown reason.';
} 