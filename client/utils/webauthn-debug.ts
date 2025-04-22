/**
 * Utility functions for debugging WebAuthn issues
 */

/**
 * Checks if WebAuthn (PublicKeyCredential) is available in the current context
 * and returns detailed information about the environment
 */
export function getWebAuthnDebugInfo() {
  // Basic environment detection
  const isInIframe = typeof window !== 'undefined' && window !== window.top;
  const hasPublicKeyCredential = typeof window !== 'undefined' && 'PublicKeyCredential' in window;
  const hasCredentialsContainer = typeof window !== 'undefined' && 'credentials' in navigator;
  
  // Get parent URL if in iframe
  let parentUrl = 'N/A';
  try {
    if (isInIframe && document.referrer) {
      parentUrl = new URL(document.referrer).origin;
    }
  } catch (e) {
    parentUrl = 'Error detecting parent URL';
  }

  // Check browser-specific info
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A';
  const isChrome = /chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent);
  const isFirefox = /firefox/i.test(userAgent);
  const isSafari = /safari/i.test(userAgent) && !/chrome|chromium/i.test(userAgent);
  const isEdge = /edge|edg/i.test(userAgent);
  
  // Check headers if possible (indirectly through our component)
  let permissionsPolicyHeader = 'Unknown (cannot detect client-side)';
  
  // Get any WebAuthn related permissions
  let passkeyPermissionState = 'Unknown';
  if (typeof navigator !== 'undefined' && navigator.permissions) {
    // Try to query permission state if available in this browser
    try {
      navigator.permissions.query({ name: 'publickey-credentials-get' as PermissionName })
        .then(result => {
          passkeyPermissionState = result.state;
        })
        .catch(err => {
          passkeyPermissionState = `Error: ${err.message}`;
        });
    } catch (e) {
      passkeyPermissionState = 'Permission query not supported';
    }
  }
  
  return {
    environment: {
      isInIframe,
      parentUrl,
      browser: {
        userAgent,
        isChrome,
        isFirefox,
        isSafari,
        isEdge
      }
    },
    webAuthnSupport: {
      hasPublicKeyCredential,
      hasCredentialsContainer,
      passkeyPermissionState
    },
    headers: {
      permissionsPolicyHeader
    },
    referrer: typeof document !== 'undefined' ? document.referrer : 'N/A',
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
    isCrossOrigin: isInIframe && parentUrl !== 'N/A' && 
      typeof window !== 'undefined' && 
      new URL(window.location.href).origin !== parentUrl
  };
}

/**
 * Formats the debug info into a readable string
 */
export function formatWebAuthnDebugInfo() {
  const info = getWebAuthnDebugInfo();
  
  return `
WebAuthn Debug Information:
--------------------------
Environment:
  In iframe: ${info.environment.isInIframe}
  Parent URL: ${info.environment.parentUrl}
  Protocol: ${info.protocol}
  Referrer: ${info.referrer}
  Cross-origin: ${info.isCrossOrigin}
  
Browser:
  User Agent: ${info.environment.browser.userAgent}
  Chrome: ${info.environment.browser.isChrome}
  Firefox: ${info.environment.browser.isFirefox}
  Safari: ${info.environment.browser.isSafari}
  Edge: ${info.environment.browser.isEdge}
  
WebAuthn Support:
  PublicKeyCredential available: ${info.webAuthnSupport.hasPublicKeyCredential}
  Credentials API available: ${info.webAuthnSupport.hasCredentialsContainer}
  Passkey permission state: ${info.webAuthnSupport.passkeyPermissionState}
  
Headers:
  Permissions-Policy: ${info.headers.permissionsPolicyHeader}
`.trim();
} 