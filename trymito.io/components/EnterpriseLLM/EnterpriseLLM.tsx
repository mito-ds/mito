/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import Image from 'next/image';
import enterpriseStyles from './EnterpriseLLM.module.css';

interface ProviderIcon {
  src: string;
  alt: string;
}

interface KeyPoint {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconAlt: string;
  providerIcons?: ProviderIcon[];
}

const KEY_POINTS: KeyPoint[] = [
  {
    id: 'any-model',
    title: 'Any Model',
    description: 'Use the best model for each task. Switch between OpenAI, Anthropic, Gemini, Qwen, and more without changing your code or workflows.',
    icon: '/enterprise-llm/openai-compatible.svg',
    iconAlt: 'Models',
    providerIcons: [
      { src: '/enterprise-llm/openai.svg', alt: 'OpenAI' },
      { src: '/enterprise-llm/anthropic.svg', alt: 'Anthropic' },
      { src: '/enterprise-llm/gemini.svg', alt: 'Gemini' },
      { src: '/enterprise-llm/qwen.svg', alt: 'Qwen' },
    ],
  },
  {
    id: 'any-provider',
    title: 'Any Provider',
    description: 'Connect through your existing contracts. LiteLLM, Azure OpenAI Enterprise, AWS Bedrock, Microsoft Copilot — one interface, your choice of provider.',
    icon: '/enterprise-llm/litellm.svg',
    iconAlt: 'LiteLLM',
    providerIcons: [
      { src: '/enterprise-llm/litellm.svg', alt: 'LiteLLM' },
      { src: '/enterprise-llm/azure.svg', alt: 'Azure OpenAI' },
      { src: '/enterprise-llm/aws-bedrock.svg', alt: 'AWS Bedrock' },
      { src: '/enterprise-llm/copilot.svg', alt: 'Microsoft Copilot' },
      { src: '/enterprise-llm/openai.svg', alt: 'OpenAI' },
      { src: '/enterprise-llm/anthropic.svg', alt: 'Anthropic' },
      { src: '/enterprise-llm/gemini.svg', alt: 'Gemini' },
    ],
  },
  {
    id: 'no-code-prompts',
    title: 'No Spying',
    description: 'We don\'t see your code or prompts. When you bring your own inference, data flows from you to your provider. We\'re not in the middle.',
    icon: '/icon-squares/SecurityIcon.svg',
    iconAlt: 'Security',
  },
];

const EnterpriseLLM = (): JSX.Element => {
  return (
    <div className={enterpriseStyles.container}>
      <header className={enterpriseStyles.header}>
        <h2 className={enterpriseStyles.headline}>
          <span className={enterpriseStyles.headlineDecorative}>Your AI, Your Infra,</span>
          <span className={enterpriseStyles.headlineBold}> Your Privacy</span>
        </h2>
        <p className={enterpriseStyles.subtitle}>
          Mito is designed for enterprises. Connect to your own LLM providers — no data ever leaves your systems.
        </p>
      </header>

      <div className={enterpriseStyles.cards}>
        {KEY_POINTS.map((point) => (
          <article key={point.id} className={enterpriseStyles.card}>
            <div className={enterpriseStyles.cardIconRow}>
              <div className={enterpriseStyles.cardIcon}>
                <Image src={point.icon} alt={point.iconAlt} width={48} height={48} unoptimized />
              </div>
              {point.providerIcons && point.providerIcons.length > 0 && (
                <div className={enterpriseStyles.providerIcons} aria-hidden>
                  {point.providerIcons.map((p) => (
                    <span key={p.src + p.alt} className={enterpriseStyles.providerIcon}>
                      <Image src={p.src} alt={p.alt} width={24} height={24} unoptimized />
                    </span>
                  ))}
                </div>
              )}
            </div>
            <h3 className={enterpriseStyles.cardTitle}>{point.title}</h3>
            <p className={enterpriseStyles.cardDescription}>{point.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default EnterpriseLLM;
