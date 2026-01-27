/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import Image from 'next/image';
import enterpriseLLMStyles from './EnterpriseLLM.module.css';

const providerLogos = [
  { name: 'Azure OpenAI', logo: '/enterprise-llm/azure-openai.svg' },
  { name: 'OpenAI', logo: '/enterprise-llm/openai.svg' },
  { name: 'LiteLLM', logo: '/enterprise-llm/litellm.svg' },
  { name: 'On-Prem', logo: '/enterprise-llm/on-prem.svg' },
];

const EnterpriseLLM = (): JSX.Element => {
  return (
    <div className={enterpriseLLMStyles.container}>
      <div className={enterpriseLLMStyles.header}>
        <h2 className={enterpriseLLMStyles.heading}>Your AI, Your Infrastructure</h2>
        <p>
          Mito is designed for enterprises. Connect to your own LLM providers, so no data ever leaves your systems.
        </p>
      </div>

      <div className={enterpriseLLMStyles.card}>
        <div className={enterpriseLLMStyles.points}>
          <div className={enterpriseLLMStyles.point}>
            <span className={enterpriseLLMStyles.point_icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <div>
              <h3>Zero data egress</h3>
              <p>Your code, data, and prompts never get sent to Mito. Everything runs on your infrastructure.</p>
            </div>
          </div>
          <div className={enterpriseLLMStyles.point}>
            <span className={enterpriseLLMStyles.point_icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 13a6 6 0 0 1 11.4-2.6A4.5 4.5 0 0 1 18.5 19H7.5A3.5 3.5 0 0 1 4 15.5V13Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </span>
            <div>
              <h3>Azure OpenAI Enterprise</h3>
              <p>Connect to your organization&apos;s Azure OpenAI deployment with full compliance.</p>
            </div>
          </div>
          <div className={enterpriseLLMStyles.point}>
            <span className={enterpriseLLMStyles.point_icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M6 8h12M6 12h12M6 16h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <h3>LiteLLM</h3>
              <p>Use LiteLLM as a unified proxy to any LLM provider your enterprise supports.</p>
            </div>
          </div>
          <div className={enterpriseLLMStyles.point}>
            <span className={enterpriseLLMStyles.point_icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 12h10M12 7v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <div>
              <h3>Any OpenAI-compatible API</h3>
              <p>Works with any endpoint that follows the OpenAI API spec.</p>
            </div>
          </div>
        </div>

        <div className={enterpriseLLMStyles.providers}>
          {providerLogos.map((provider) => (
            <div key={provider.name} className={enterpriseLLMStyles.provider_card}>
              <Image src={provider.logo} alt={provider.name} width={42} height={42} />
              <span>{provider.name}</span>
            </div>
          ))}
        </div>

        <div className={enterpriseLLMStyles.diagram} aria-hidden="true">
          <span>Your Data</span>
          <span className={enterpriseLLMStyles.diagram_arrow}>-&gt;</span>
          <span>Your LLM</span>
          <span className={enterpriseLLMStyles.diagram_arrow}>-&gt;</span>
          <span>Mito (local)</span>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseLLM;
