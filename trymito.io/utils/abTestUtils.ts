/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

const AB_TEST_VARIANT_KEY = 'ab_test_social_proof_variant';

export type ABTestVariant = 'carousel' | 'logo';

/**
 * Gets the A/B test variant from localStorage
 * @returns The variant ('carousel' | 'logo') or null if not yet assigned
 */
export const getABTestVariant = (): ABTestVariant | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const variant = localStorage.getItem(AB_TEST_VARIANT_KEY);
  if (variant === 'carousel' || variant === 'logo') {
    return variant;
  }
  return null;
};

/**
 * Sets the A/B test variant in localStorage
 * @param variant The variant to store ('carousel' | 'logo')
 */
export const setABTestVariant = (variant: ABTestVariant): void => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(AB_TEST_VARIANT_KEY, variant);
};

/**
 * Generates and stores a new variant assignment (50/50 split)
 * @returns The assigned variant ('carousel' | 'logo')
 */
export const assignABTestVariant = (): ABTestVariant => {
  // 50/50 random split
  const variant: ABTestVariant = Math.random() < 0.5 ? 'carousel' : 'logo';
  setABTestVariant(variant);
  return variant;
};
