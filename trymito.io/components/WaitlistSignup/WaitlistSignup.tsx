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
      identify: (userId?: string, traits?: Record<string, any>) => void;
    };
  }
}

const WaitlistSignup = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [step, setStep] = useState<'email' | 'additional'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLInputElement>) => {
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
        // Set user profile with email as userId
        window.analytics.identify(email, {
          email: email,
        });
        
        // Track email submission event
        window.analytics.track('Waitlist Signup - Email', {
          location: 'homepage_hero',
          email: email,
          timestamp: new Date().toISOString(),
        });
      }

      // Move to next step
      setStep('additional');
    } catch (error) {
      console.error('Error tracking waitlist signup:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdditionalSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Update user profile with additional information and track completion event
      if (typeof window !== 'undefined' && window.analytics) {
        // Build traits object with all user information
        const traits: Record<string, any> = {
          email: email,
        };
        
        if (name) {
          traits.name = name;
        }
        
        if (company) {
          traits.company = company;
        }
        
        // Identify user with email as userId and all traits - this sets them on the user profile
        window.analytics.identify(email, traits);
        
        // Track completion event - user traits will be automatically included from the profile
        window.analytics.track('Waitlist Signup - Complete', {
          location: 'homepage_hero',
          email: email,
          name: name,
          company: company,
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
    if (e.key === 'Enter' && step === 'email') {
      handleEmailSubmit(e);
    }
  };

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

  if (step === 'email') {
    return (
      <form onSubmit={handleEmailSubmit} className={waitlistStyles.waitlist_container}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your email"
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
          disabled={isSubmitting || !email}
        >
          {isSubmitting ? 'Joining...' : 'Join Waitlist'}
        </button>
      </form>
    );
  }

  // Additional information step
  return (
    <form onSubmit={handleAdditionalSubmit} className={classNames(waitlistStyles.waitlist_container, waitlistStyles.additional_step)}>
      <p className={waitlistStyles.additional_info_message}>
        Share a bit about yourself to move up the waitlist
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className={waitlistStyles.email_input}
        disabled={isSubmitting}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      <input
        type="text"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company"
        className={waitlistStyles.email_input}
        disabled={isSubmitting}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      <button
        type="submit"
        className={classNames(waitlistStyles.submit_button, {
          [waitlistStyles.submitting]: isSubmitting,
        })}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Complete Signup'}
      </button>
    </form>
  );
};

export default WaitlistSignup;

