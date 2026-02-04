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
  { name: 'Grok Code Fast 1', src: '/enterprise-llm/xai.svg' },
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
          <span className="decorativeText">
            Your <span className={enterpriseStyles.headlineAIWrap}>
              AI
              <span className={enterpriseStyles.headlineSpark} aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Pixelated starburst: rays radiating from center (top-right of I) */}
                  <rect x="10" y="2" width="2" height="2" fill="currentColor" />
                  <rect x="12" y="3" width="2" height="2" fill="currentColor" />
                  <rect x="14" y="4" width="2" height="2" fill="currentColor" opacity="0.85" />
                  <rect x="16" y="5" width="2" height="2" fill="currentColor" opacity="0.6" />
                  <rect x="14" y="6" width="2" height="2" fill="currentColor" />
                  <rect x="16" y="7" width="2" height="2" fill="currentColor" opacity="0.8" />
                  <rect x="18" y="8" width="2" height="2" fill="currentColor" opacity="0.5" />
                  <rect x="10" y="6" width="2" height="2" fill="currentColor" opacity="0.9" />
                  <rect x="12" y="8" width="2" height="2" fill="currentColor" opacity="0.7" />
                  <rect x="8" y="4" width="2" height="2" fill="currentColor" opacity="0.8" />
                  <rect x="6" y="6" width="2" height="2" fill="currentColor" opacity="0.5" />
                  <rect x="10" y="4" width="2" height="2" fill="currentColor" opacity="0.6" />
                </svg>
              </span>
            </span>, Your Infra,
          </span>
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
              <div
                className={enterpriseStyles.modelIconWrapper}
                key={`${icon.name}-${index}`}
                title={icon.name}
              >
                <div className={enterpriseStyles.modelIcon}>
                  <img src={icon.src} alt="" loading="lazy" />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={enterpriseStyles.card}>
          <h3 className={enterpriseStyles.cardTitle}>No Spying</h3>
          <p className={enterpriseStyles.cardDescription}>
            We don&apos;t see your code or prompts. When you bring your own inference, data flows from you to your provider. We&apos;re not in the middle.
          </p>
          <div className={enterpriseStyles.dataFlowDiagram} aria-label="Data flows directly between your analysis and your LLM">
            {/* Grid: 3 columns. Each side cell = icon + label stacked and centered together */}
            <div className={enterpriseStyles.analysisCard}>
              <div className={enterpriseStyles.analysisIconWrap}>
                <div className={enterpriseStyles.analysisHeader}>
                  <div className={enterpriseStyles.windowDots}>
                    <span className={enterpriseStyles.windowDot}></span>
                    <span className={enterpriseStyles.windowDot}></span>
                    <span className={enterpriseStyles.windowDot}></span>
                  </div>
                </div>
                <div className={enterpriseStyles.analysisContent}>
                  <div className={enterpriseStyles.analysisTitle}></div>
                  <div className={enterpriseStyles.analysisChart}>
                    <div className={enterpriseStyles.chartBar} style={{ height: '40%' }}></div>
                    <div className={enterpriseStyles.chartBar} style={{ height: '70%' }}></div>
                    <div className={enterpriseStyles.chartBar} style={{ height: '55%' }}></div>
                    <div className={enterpriseStyles.chartBar} style={{ height: '85%' }}></div>
                    <div className={enterpriseStyles.chartBar} style={{ height: '60%' }}></div>
                    <div className={enterpriseStyles.chartBar} style={{ height: '45%' }}></div>
                  </div>
                  <div className={enterpriseStyles.analysisLines}>
                    <div className={enterpriseStyles.analysisLine}></div>
                    <div className={enterpriseStyles.analysisLine} style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
              <span className={enterpriseStyles.analysisLabel}>Your Analysis</span>
            </div>

            <div className={enterpriseStyles.dataFlowLines}>
              <div className={enterpriseStyles.flowLine}></div>
              <div className={enterpriseStyles.flowLine}></div>
              <span className={enterpriseStyles.flowDotAnimated}></span>
            </div>

            <div className={enterpriseStyles.llmCard}>
              <div className={enterpriseStyles.llmIconWrapper}>
                <div className={enterpriseStyles.llmGlow}></div>
                <div className={enterpriseStyles.llmIconCircle}>
                  <img src="/enterprise-llm/openai.svg" alt="" className={enterpriseStyles.llmIconImg} />
                </div>
              </div>
              <span className={enterpriseStyles.llmLabel}>Your LLM</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default EnterpriseLLM;
