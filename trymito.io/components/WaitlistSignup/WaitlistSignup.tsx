/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState, FormEvent, KeyboardEvent } from 'react';
import waitlistStyles from './WaitlistSignup.module.css';
import { classNames } from '../../utils/classNames';

declare global {
  interface Window {
    analytics?: {
      track: (eventName: string, properties?: Record<string, any>) => void;
      identify: (userId: string, traits?: Record<string, any>) => void;
    };
  }
}

const WaitlistSignup = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (!email || isSubmitting || submitted) {
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Track event to Segment/Mixpanel
      // Segment queues events if not ready, so this is safe to call immediately
      if (typeof window !== 'undefined' && window.analytics) {
        window.analytics.track('Waitlist Signup', {
          email: email,
          location: 'homepage_hero',
          timestamp: new Date().toISOString(),
        });
      }

      setSubmitted(true);
      setEmail('');
    } catch (error) {
      console.error('Error tracking waitlist signup:', error);
      // Still show success message even if tracking fails
      setSubmitted(true);
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (submitted) {
    return (
      <div className={waitlistStyles.waitlist_container}>
        <div className={waitlistStyles.success_message}>
          Thanks! We'll be in touch soon.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={waitlistStyles.waitlist_container}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your email"
        className={waitlistStyles.email_input}
        disabled={isSubmitting}
        required
      />
      <button
        type="submit"
        className={classNames(waitlistStyles.submit_button, {
          [waitlistStyles.submitting]: isSubmitting,
        })}
        disabled={isSubmitting || !email}
      >
        {isSubmitting ? 'Joining...' : 'Join Waitlist'}
      </button>
    </form>
  );
};

export default WaitlistSignup;

