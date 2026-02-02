/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect } from 'react';
import enterpriseStyles from './EnterpriseLLM.module.css';

const modelCarouselItems = [
  { name: 'Opus 4.5', src: '/enterprise-llm/anthropic.svg' },
  { name: 'DeepSeek v3.2', src: '/enterprise-llm/DeepSeek.png' },
  { name: 'GPT 5.2 Codex', src: '/enterprise-llm/openai.svg' },
  { name: 'Gemini 3 Pro', src: '/enterprise-llm/GoogleAIStudio.svg' },
  { name: 'Kimi K2', src: '/enterprise-llm/kimi-color.svg' },
];

const modelIcons = [
  { name: 'Microsoft', src: '/enterprise-llm/microsoft.svg' },
  { name: 'Nvidia', src: '/enterprise-llm/nvidia-color.svg' },
  { name: 'Meta', src: '/enterprise-llm/meta-color.svg' },
  { name: 'Gemini', src: '/enterprise-llm/GoogleAIStudio.svg' },
  { name: 'Mistral', src: '/enterprise-llm/mistral-color.svg' },
  { name: 'OpenRouter', src: '/enterprise-llm/openrouter.svg' },
  { name: 'DeepSeek', src: '/enterprise-llm/DeepSeek.png' },
  { name: 'Anthropic', src: '/enterprise-llm/anthropic.svg' },
  { name: 'OpenAI', src: '/enterprise-llm/openai.svg' },
  { name: 'xAI', src: '/enterprise-llm/xai.svg' },
  { name: 'Cohere', src: '/enterprise-llm/cohere-color.svg' },
  { name: 'Perplexity', src: '/enterprise-llm/perplexity.svg' },
  { name: 'Qwen', src: '/enterprise-llm/qwen-color.svg' },
  { name: 'AWS', src: '/enterprise-llm/aws-color.svg' },
  { name: 'Kimi', src: '/enterprise-llm/kimi-color.svg' },
].slice(0, 20);

const EnterpriseLLM = (): JSX.Element => {
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % modelCarouselItems.length);
    }, 2500);
    return () => clearInterval(t);
  }, []);

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
        <article className={enterpriseStyles.card}>
          <h3 className={enterpriseStyles.cardTitle}>Any Model</h3>
          <p className={enterpriseStyles.cardDescription}>
            Use the best model for each task. Switch between OpenAI, Anthropic, Gemini, Qwen, and more without changing your code or workflows.
          </p>
          <div className={enterpriseStyles.modelCarousel} aria-label="Featured models">
            <div className={enterpriseStyles.modelCarouselTrack} style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
              {modelCarouselItems.map((item, index) => (
                <div className={enterpriseStyles.modelCarouselSlide} key={item.name}>
                  <div className={enterpriseStyles.modelCarouselIcon}>
                    <img src={item.src} alt="" />
                  </div>
                  <span className={enterpriseStyles.modelCarouselName}>{item.name}</span>
                </div>
              ))}
            </div>
            <div className={enterpriseStyles.modelCarouselDots} role="tablist" aria-label="Carousel position">
              {modelCarouselItems.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={index === carouselIndex}
                  aria-label={`Slide ${index + 1}`}
                  className={enterpriseStyles.modelCarouselDot}
                  onClick={() => setCarouselIndex(index)}
                />
              ))}
            </div>
          </div>
        </article>

        <article className={enterpriseStyles.card}>
          <h3 className={enterpriseStyles.cardTitle}>Any Provider</h3>
          <p className={enterpriseStyles.cardDescription}>
            Connect through your existing contracts. LiteLLM, Azure OpenAI Enterprise, AWS Bedrock, Microsoft Copilot — one interface, your choice of provider.
          </p>
          <div className={enterpriseStyles.modelIconCloud} aria-hidden="true">
            {modelIcons.map((icon, index) => (
              <div className={enterpriseStyles.modelIcon} key={`${icon.name}-${index}`}>
                <img src={icon.src} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        </article>

        <article className={enterpriseStyles.card}>
          <h3 className={enterpriseStyles.cardTitle}>No Spying</h3>
          <p className={enterpriseStyles.cardDescription}>
            We don&apos;t see your code or prompts. When you bring your own inference, data flows from you to your provider. We&apos;re not in the middle.
          </p>
        </article>
      </div>
    </div>
  );
};

export default EnterpriseLLM;
