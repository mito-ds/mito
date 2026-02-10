/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Types for AI + Jupyter integration SEO pages.
 * Content is stored in integrations-page-contents/*.json.
 */

export type ModelSpec = {
  provider: string;
  tokenLimit: string;
  speed: string;
  complexityHandling: string;
  bestFor: string[];
  limitations: string[];
};

export type QuickStartStep = string | { title: string; body: string };

export type ComparisonRow = {
  feature: string;
  withMito: string;
  directApi: string;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type IntegrationPageContent = {
  slug: string;
  modelDisplayName: string;
  providerName: string;
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubhead: string;
  heroCtaPrimary?: string;
  heroCtaSecondary?: string;
  modelSpec: ModelSpec;
  quickStartSteps: QuickStartStep[];
  apiSectionIntro: string;
  apiCodeBlock: string;
  apiCalloutLimitations: string[];
  apiCalloutMitoBenefits: string[];
  useCases: string[];
  comparisonRows: ComparisonRow[];
  faqs: FAQItem[];
  relatedSlugs: string[];
};
