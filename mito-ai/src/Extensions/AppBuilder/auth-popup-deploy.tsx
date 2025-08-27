/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// auth-popup.tsx - Simple authentication popup with CSS-based requirements
import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import '../../../style/ConnectionForm.css';
import '../../../style/button.css';
import '../../../style/AuthPopup.css';

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const AuthPopup: React.FC<AuthPopupProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Track if we've already called onSuccess to prevent infinite loops
  const hasCalledOnSuccess = React.useRef(false);
  // Track if we should show progress bar
  const [showProgress, setShowProgress] = React.useState(false);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      setShowProgress(false);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Sign In / Sign Up</h3>
          <button
            onClick={onClose}
            className="modal-close-button"
            title="Close"
          >
            ×
          </button>
        </div>

        <Authenticator
          loginMechanisms={['email']}
          signUpAttributes={['name', 'email']}
          formFields={{
            signUp: {
              name: {
                order: 1,
                placeholder: 'Enter your full name',
                label: 'Full Name *',
                required: true
              },
              email: {
                order: 2,
                placeholder: 'Enter your email address',
                label: 'Email *'
              },
              password: {
                order: 3,
                placeholder: 'Enter your password',
                label: 'Password *',
                required: true
              },
              confirm_password: {
                order: 4,
                placeholder: 'Confirm your password',
                label: 'Confirm Password *'
              }
            }
          }}
        >
          {({ user }) => {
            // Call onSuccess when user is authenticated, but only once and with delay
            if (user && !hasCalledOnSuccess.current) {
              // Show the progress bar
              setShowProgress(true);

              // Give users time to see the success message before calling onSuccess
              setTimeout(() => {
                if (!hasCalledOnSuccess.current) {
                  hasCalledOnSuccess.current = true;
                  onSuccess(user);
                }
              }, 3000); // 3 second delay
            }

            // If user is signed in, show the welcome message
            if (user) {
              return (
                <div className="welcome-message-container">
                  <p className="welcome-message-title">
                    Welcome to mito!
                  </p>

                  <p className="welcome-message-description">
                    You&apos;re all set to deploy your app.
                  </p>

                  {/* Progress bar container */}
                  {showProgress && (
                    <div className="progress-bar-container">
                      {/* Progress bar fill with CSS animation */}
                      <div className="progress-bar-fill" />
                    </div>
                  )}

                  <p className="progress-bar-timer">
                    Closing automatically in a few seconds...
                  </p>
                </div>
              );
            }

            // If user is not signed in, don't render anything here
            return <div style={{ display: 'none' }} />;
          }}
        </Authenticator>

        {/* Password Requirements Display - shown via CSS when sign-up tab is active */}
        <div className="password-requirements">
          <p>Password Requirements:</p>
          <ul>
            <li>At least 8 characters long</li>
            <li>Contains at least one uppercase letter</li>
            <li>Contains at least one lowercase letter</li>
            <li>Contains at least one number</li>
            <li>Contains at least one special character</li>
          </ul>
        </div>
      </div>
    </div>
  );
};