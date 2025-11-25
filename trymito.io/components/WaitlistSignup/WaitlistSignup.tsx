/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState, FormEvent, KeyboardEvent, useEffect } from 'react';
import waitlistStyles from './WaitlistSignup.module.css';
import { classNames } from '../../utils/classNames';

declare global {
  interface Window {
    analytics?: {
      track: (eventName: string, properties?: Record<string, any>) => void;
      identify: (userId?: string, traits?: Record<string, any>) => void;
    };
  }
}

const CALENDLY_LINK = 'https://calendly.com/jake_from_mito/mito-meeting';

const WaitlistSignup = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (!email || isSubmitting) {
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Identify user with email and track event to Segment/Mixpanel
      if (typeof window !== 'undefined' && window.analytics) {
        // Build traits object with user information
        const traits: Record<string, any> = {
          email: email,
        };
        
        if (firstName) {
          traits.firstName = firstName;
        }
        
        if (lastName) {
          traits.lastName = lastName;
        }
        
        // Set user profile with email as userId
        window.analytics.identify(email, traits);
        
        // Track completion event
        window.analytics.track('Waitlist Signup - Complete', {
          location: 'homepage_hero',
          email: email,
          firstName: firstName,
          lastName: lastName,
          timestamp: new Date().toISOString(),
        });
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error tracking waitlist signup:', error);
      // Still show success message even if tracking fails
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // Auto-redirect to Calendly after successful submission
  useEffect(() => {
    if (submitted) {
      // Small delay to allow success message to be visible briefly
      const redirectTimer = setTimeout(() => {
        window.location.replace(CALENDLY_LINK);
      }, 500); // .5 second delay

      return () => clearTimeout(redirectTimer);
    }
  }, [submitted]);

  if (submitted) {
    return (
      <div className={waitlistStyles.waitlist_container}>
        <div className={waitlistStyles.success_container}>
          <div className={waitlistStyles.success_header}>
            <div className={waitlistStyles.success_icon}>✓</div>
            <div className={waitlistStyles.success_message}>
              You&apos;re on the list!
            </div>
          </div>
          <div className={waitlistStyles.success_submessage}>
            We&apos;ll be in touch with you shortly.
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={waitlistStyles.waitlist_container}>
      <div className={waitlistStyles.name_row}>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          className={waitlistStyles.email_input}
          disabled={isSubmitting}
          required
          autoComplete="given-name"
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          className={waitlistStyles.email_input}
          disabled={isSubmitting}
          required
          autoComplete="family-name"
        />
      </div>
      <div className={waitlistStyles.email_row}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Email"
          className={waitlistStyles.email_input}
          disabled={isSubmitting}
          required
          autoComplete="email"
        />
        <button
          type="submit"
          className={classNames(waitlistStyles.submit_button, {
            [waitlistStyles.submitting]: isSubmitting,
          })}
          disabled={isSubmitting || !email || !firstName || !lastName}
        >
          {isSubmitting ? 'Joining...' : 'Join Waitlist'}
        </button>
      </div>
    </form>
  );
};

export default WaitlistSignup;

