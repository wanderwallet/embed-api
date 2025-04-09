"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/client/utils/trpc/trpc-client"
import { useAuth } from "@/client/hooks/useAuth"
import { AuthProviderType } from "@prisma/client"
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { supabase } from "@/client/utils/supabase/supabase-client-client"

export default function Login() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const loginMutation = trpc.authenticate.useMutation();
  const startRegistrationMutation = trpc.startRegistration.useMutation();
  const verifyRegistrationMutation = trpc.verifyRegistration.useMutation();
  const startAuthenticationMutation = trpc.startAuthentication.useMutation();
  const verifyAuthenticationMutation = trpc.verifyAuthentication.useMutation();
  const finalizePasskeyMutation = trpc.finalizePasskey.useMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push("/dashboard")
    }
  }, [isAuthLoading, user, router])

  const handleOAuthSignIn = async (provider: Exclude<AuthProviderType, "EMAIL_N_PASSWORD">) => {
    try {
      setIsLoading(true);

      const { data } = await loginMutation.mutateAsync({ authProviderType: provider });

      if (data) {
        // Redirect to OAuth page
        window.location.href = data
      } else {
        console.error(`No URL returned from ${provider} authenticate`)
        setIsLoading(false);
      }
    } catch (error) {
      console.error(`${provider} sign-in failed:`, error)
      setIsLoading(false);
    }
  }

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      await loginMutation.mutateAsync({
        authProviderType: "EMAIL_N_PASSWORD",
        email,
        password,
      });

      router.push("/dashboard")

      // If successful, the useEffect will handle redirection
    } catch (error) {
      console.error("Email/password sign-in failed:", error)
      setIsLoading(false);
    }
  }

  // Handle passkey registration
  const handlePasskeySignUp = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      // First, check if email is provided
      if (!email) {
        setErrorMessage("Please enter your email address to link with passkey");
        setIsLoading(false);
        return;
      }
      
      // Step 1: Start registration process with email
      const { options, userId } = await startRegistrationMutation.mutateAsync({
        email,
      });
      
      console.log("Registration options:", options);
      
      try {
        // Step 2: Create passkey on device
        const attestationResponse = await startRegistration({ optionsJSON: options });
        console.log("Attestation response:", attestationResponse);
        
        // Step 3: Verify registration with server and trigger magic link email
        const { message } = await verifyRegistrationMutation.mutateAsync({
          userId,
          attestationResponse,
        });
        
        // Show message about magic link
        setErrorMessage(message || "Please check your email for a magic link to complete passkey registration.");
        setIsLoading(false);
        
      } catch (webAuthnError) {
        console.error("WebAuthn API error:", webAuthnError);
        setErrorMessage(`Passkey API error: ${(webAuthnError as Error).message || "Unknown error"}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Passkey registration failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Passkey registration failed");
      setIsLoading(false);
    }
  };

  // Add a function to complete the passkey registration after magic link authentication
  const handleCompletePasskeyRegistration = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      const verificationId = localStorage.getItem('passkeyVerificationId');
      const pendingEmail = localStorage.getItem('pendingPasskeyEmail');
      
      if (!verificationId || !pendingEmail) {
        setErrorMessage("No pending passkey verification found");
        setIsLoading(false);
        return;
      }
      
      // Check if user is authenticated via Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setErrorMessage("Please click the magic link in your email first, then return to this page to complete registration");
        setIsLoading(false);
        return;
      }
      
      // User is authenticated, finalize passkey registration
      const result = await finalizePasskeyMutation.mutateAsync({
        verificationId,
        email: pendingEmail,
        sessionToken: session.access_token,
      });
      
      if (result.verified) {
        // Clear stored verification data
        localStorage.removeItem('passkeyVerificationId');
        localStorage.removeItem('pendingPasskeyEmail');
        
        // Store the device nonce
        localStorage.setItem('deviceNonce', result.deviceNonce);
        
        // Registration successful
        setErrorMessage("Passkey registered successfully!");
        
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        setErrorMessage("Passkey verification failed. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Passkey verification completion failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Passkey verification failed");
      setIsLoading(false);
    }
  };

  // Add this to your useEffect to check for pending passkey registrations
  useEffect(() => {
    const checkPendingPasskeyRegistration = async () => {
      const pendingEmail = localStorage.getItem('pendingPasskeyEmail');
      const verificationId = localStorage.getItem('passkeyVerificationId');
      
      if (pendingEmail && verificationId && !isAuthLoading && user) {
        // User has a pending passkey registration and is now logged in
        // Show a prompt to complete the registration
        const shouldComplete = confirm(
          "You have a pending passkey registration. Would you like to complete it now?"
        );
        
        if (shouldComplete) {
          await handleCompletePasskeyRegistration();
        } else {
          // Clear the pending registration
          localStorage.removeItem('pendingPasskeyEmail');
          localStorage.removeItem('passkeyVerificationId');
        }
      }
    };
    
    checkPendingPasskeyRegistration();
  }, [isAuthLoading, user]);

  // Handle passkey sign-in
  const handlePasskeySignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      // Start authentication - optionally provide email if available
      const { options } = await startAuthenticationMutation.mutateAsync({
        email: email || undefined
      });
      
      console.log("Authentication options:", options);
      
      // Get assertion from browser
      const assertionResponse = await startAuthentication({ optionsJSON: options });
      
      console.log("Assertion response:", assertionResponse);
      
      // Verify authentication with server
      const verificationResult = await verifyAuthenticationMutation.mutateAsync({
        credentialId: assertionResponse.id,
        authenticatorData: assertionResponse.response.authenticatorData,
        clientDataJSON: assertionResponse.response.clientDataJSON,
        signature: assertionResponse.response.signature,
        userHandle: assertionResponse.response.userHandle,
        challenge: options.challenge,
      });
      
      if (verificationResult.verified) {
        // Store the device nonce in local storage
        localStorage.setItem('deviceNonce', verificationResult.deviceNonce || "");
        
        // Authentication successful, redirect to dashboard
        router.push("/dashboard");
      } else {
        setErrorMessage("Passkey authentication failed");
      }
    } catch (error) {
      console.error("Passkey authentication failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Passkey authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add the CSS styles to the document head
    const style = document.createElement('style');
    style.innerHTML = `
      /* Login Page Styles */
      .login-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background-color: black;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }

      .login-form {
        width: 100%;
        max-width: 400px;
        padding: 0 20px;
      }

      .login-header {
        text-align: center;
        margin-bottom: 48px;
      }

      .login-subtitle {
        color: #999;
        margin-bottom: 8px;
        font-size: 16px;
      }

      .login-title {
        font-size: 28px;
        font-weight: 700;
        color: white;
        margin: 0;
      }

      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-label {
        font-size: 14px;
        color: #999;
        margin-bottom: 4px;
      }

      .input-container {
        position: relative;
      }

      .form-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #333;
        border-radius: 6px;
        font-size: 16px;
        transition: border-color 0.2s;
        box-sizing: border-box;
        background-color: #111;
        color: white;
      }

      .form-input:focus {
        outline: none;
        border-color: #4285F4;
        box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
      }

      .form-input::placeholder {
        color: #666;
      }

      .input-icon {
        position: absolute;
        top: 50%;
        right: 12px;
        transform: translateY(-50%);
        color: #666;
        pointer-events: none;
      }

      .toggle-password {
        position: absolute;
        top: 50%;
        right: 12px;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
        padding: 0;
      }

      .submit-button {
        width: 100%;
        background-color: #4285F4;
        color: white;
        font-weight: 500;
        padding: 12px 16px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .submit-button:hover {
        background-color: #3367D6;
      }

      .submit-button:disabled {
        background-color: #2A4A80;
        cursor: not-allowed;
      }

      .divider {
        display: flex;
        align-items: center;
        margin: 24px 0;
      }

      .divider-line {
        flex-grow: 1;
        height: 1px;
        background-color: #333;
      }

      .divider-text {
        margin: 0 16px;
        font-size: 14px;
        color: #999;
      }

      .social-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        width: 100%;
      }

      .social-button {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 12px;
        border: 1px solid #333;
        border-radius: 6px;
        background: #111;
        cursor: pointer;
        transition: background-color 0.2s;
        width: 100%;
      }

      .social-button:hover {
        background-color: #222;
      }

      .error-message {
        color: #ff6b6b;
        font-size: 14px;
        margin-top: 16px;
        text-align: center;
      }

      .login-footer {
        margin-top: 64px;
        text-align: center;
      }

      .login-footer-text {
        color: #999;
        font-size: 14px;
      }

      .login-link {
        color: #4285F4;
        text-decoration: none;
        font-weight: 500;
      }

      .login-link:hover {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);

    // Clean up function to remove the style when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add a useEffect with console.log to debug when useAuth is being called
  useEffect(() => {
    console.log("Auth state changed:", { user, isAuthLoading });
  }, [user, isAuthLoading]);

  if (isAuthLoading || isLoading || user) return <div>Authenticating...</div>

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-form">
          <h2 className="login-title">Sign in to your account</h2>
          
          <form onSubmit={handleEmailPasswordSignIn}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-control"
              />
            </div>
            
            <button
              type="submit"
              disabled={loginMutation.isLoading || isLoading}
              className="login-button"
            >
              {loginMutation.isLoading || isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="social-login">
            <p>Or sign in with:</p>

            <button
              onClick={() => handleOAuthSignIn("GOOGLE")}
              disabled={loginMutation.isLoading || isLoading}
              className="social-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            
            <button
              onClick={handlePasskeySignUp}
              disabled={loginMutation.isLoading || isLoading}
              className="social-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              <span style={{ marginLeft: '4px', fontSize: '12px', color: 'white' }}>Register Passkey</span>
            </button>
            
            <button
              onClick={handlePasskeySignIn}
              disabled={loginMutation.isLoading || isLoading}
              className="social-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              <span style={{ marginLeft: '4px', fontSize: '12px', color: 'white' }}>Sign In with Passkey</span>
            </button>
          </div>
        </div>
        
        {errorMessage ? (<p className="error-message">{errorMessage}</p>) : null}
        {loginMutation.error ? (<p className="error-message">{loginMutation.error.message}</p>) : null}
      </div>
    </div>
  )
}

