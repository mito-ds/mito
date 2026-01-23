/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState, FormEvent, KeyboardEvent } from 'react';
import waitlistStyles from './WaitlistSignup.module.css';
import { classNames } from '../../utils/classNames';
import { getABTestVariant } from '../../utils/abTestUtils';

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
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'email' | 'details'>('email');
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
      // Log email submission
      if (typeof window !== 'undefined' && window.analytics) {
        window.analytics.identify(email, { email });
        window.analytics.track('Waitlist Signup - Email', {
          location: 'homepage_hero',
          email: email,
          timestamp: new Date().toISOString(),
          abTestVariant: getABTestVariant(),
        });
      }

      // Move to next step
      setStep('details');
    } catch (error) {
      console.error('Error tracking email signup:', error);
      // Still move to next step even if tracking fails
      setStep('details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailsSubmit = async (e: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (!firstName || !lastName || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Identify user with all information and track completion event
      if (typeof window !== 'undefined' && window.analytics) {
        const traits: Record<string, any> = {
          email: email,
          firstName: firstName,
          lastName: lastName,
        };

        if (company) {
          traits.company = company;
        }

        window.analytics.identify(email, traits);
        window.analytics.track('Waitlist Signup - Complete', {
          location: 'homepage_hero',
          email: email,
          firstName: firstName,
          lastName: lastName,
          company: company,
          timestamp: new Date().toISOString(),
          abTestVariant: getABTestVariant(),
        });
      }

    } finally {
      // Always redirect to calendly 
      window.open(CALENDLY_LINK, '_blank');
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, step: 'email' | 'details') => {
    if (e.key === 'Enter') {
      if (step === 'email') {
        handleEmailSubmit(e);
      } else {
        handleDetailsSubmit(e);
      }
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className={waitlistStyles.waitlist_container}>
        <div className={waitlistStyles.success_container}>
          <div className={waitlistStyles.success_header}>
            <div className={waitlistStyles.success_icon}>✓</div>
            <div className={waitlistStyles.success_message}>
              Congrats you jumped to the front of the waitlist. Click here to sign up for your onboarding
            </div>
          </div>
          <div className={waitlistStyles.success_submessage}>
            <a 
              href={CALENDLY_LINK} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: 'var(--color-purple)', 
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Schedule your onboarding
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Email only
  if (step === 'email') {
    return (
      <form onSubmit={handleEmailSubmit} className={waitlistStyles.waitlist_container}>
        <div className={waitlistStyles.email_row}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'email')}
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
            {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
          </button>
        </div>
      </form>
    );
  }

  // Step 2: First name, last name, and company
  return (
    <form onSubmit={handleDetailsSubmit} className={classNames(waitlistStyles.waitlist_container, waitlistStyles.additional_step)}>
      <p className={waitlistStyles.additional_info_message}>
        Share a bit about yourself to move up the waitlist
      </p>
      <div className={waitlistStyles.name_row}>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'details')}
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
          onKeyDown={(e) => handleKeyDown(e, 'details')}
          placeholder="Last name"
          className={waitlistStyles.email_input}
          disabled={isSubmitting}
          required
          autoComplete="family-name"
        />
      </div>
      <input
        type="text"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, 'details')}
        placeholder="Company"
        className={waitlistStyles.email_input}
        disabled={isSubmitting}
        autoComplete="organization"
      />
      <button
        type="submit"
        className={classNames(waitlistStyles.submit_button, {
          [waitlistStyles.submitting]: isSubmitting,
        })}
        disabled={isSubmitting || !firstName || !lastName}
      >
        {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
      </button>
    </form>
  );
};

export default WaitlistSignup;

