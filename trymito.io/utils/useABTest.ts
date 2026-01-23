/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState, useEffect } from 'react';
import { getABTestVariant, assignABTestVariant, ABTestVariant } from './abTestUtils';

/**
 * React hook for A/B test variant assignment
 * Generates a random variant assignment (50/50 split) for new visitors
 * and ensures the same user always sees the same variant on subsequent visits
 * @returns The variant ('carousel' | 'logo')
 */
export const useABTest = (): ABTestVariant => {
  const [variant, setVariant] = useState<ABTestVariant>(() => {
    // Check if variant already exists in localStorage
    const existingVariant = getABTestVariant();
    if (existingVariant) {
      return existingVariant;
    }
    // Assign a new variant if none exists
    return assignABTestVariant();
  });

  useEffect(() => {
    // Ensure variant is stored in localStorage
    const existingVariant = getABTestVariant();
    if (!existingVariant) {
      const newVariant = assignABTestVariant();
      setVariant(newVariant);
    }
  }, []);

  return variant;
};
