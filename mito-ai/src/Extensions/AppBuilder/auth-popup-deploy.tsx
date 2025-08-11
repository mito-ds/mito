// auth-popup.tsx - Simple authentication popup
import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import '../../../style/ConnectionForm.css';
import '../../../style/button.css';
import '../../../style/AuthPopup.css';
import TextButton from '../../components/TextButton';

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

// Using Mito's modal styling classes

export const AuthPopup: React.FC<AuthPopupProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Track if we've already called onSuccess to prevent infinite loops
  const hasCalledOnSuccess = React.useRef(false);

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
                label: 'Password *'
              },
              confirm_password: {
                order: 4,
                placeholder: 'Confirm your password',
                label: 'Confirm Password *'
              }
            }
          }}
        >
          {({ signOut, user }) => {
            // Call onSuccess when user is authenticated, but only once
            if (user && !hasCalledOnSuccess.current) {
              // Use setTimeout to avoid calling onSuccess during render
              setTimeout(() => {
                if (!hasCalledOnSuccess.current) {
                  hasCalledOnSuccess.current = true;
                  onSuccess(user);
                }
              }, 0);
            }

            return (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ color: 'var(--jp-ui-font-color1)', marginBottom: '16px' }}>
                  Welcome! You're now signed in and ready to deploy your app.
                </p>
                <TextButton
                  text="Sign Out"
                  onClick={signOut}
                  title="Sign out of your account"
                  variant="red"
                  width="fit-contents"
                />
              </div>
            );
          }}
        </Authenticator>
      </div>
    </div>
  );
};