/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import taglineStyles from './HomeTagline.module.css';

const TOOLTIPS = {
  yourSystems:
    "Mito runs completely locally on your user's computers and is configurable to use your API keys with Azure, LiteLLM or other preferred LLM provider.",
  jupyter:
    "Mito is compatible with your existing Jupyter extensions and JupyterHub. And it knows how to edit notebook file formats unlike other AI tools.",
  everyLevel:
    "Mito is used by everyone from citizen data scientists at the world's largest banks who are automating Excel reporting Python through ML researchers at labs.",
};

const HomeTagline = (): JSX.Element => (
  <div className={taglineStyles.container}>
    <p className={taglineStyles.tagline}>
      The only tool that runs 100% on{' '}
      <span className={taglineStyles.tooltipTrigger}>
        <span className={taglineStyles.decorativeTextPurple}>your systems</span>
        <span className={taglineStyles.tooltipContent} role="tooltip">
          {TOOLTIPS.yourSystems}
        </span>
      </span>
      , purpose built for{' '}
      <span className={taglineStyles.tooltipTrigger}>
        <span className={taglineStyles.decorativeTextPurple}>Jupyter</span>
        <span className={taglineStyles.tooltipContent} role="tooltip">
          {TOOLTIPS.jupyter}
        </span>
      </span>
      , and designed for{' '}
      <span className={taglineStyles.tooltipTrigger}>
        <span className={taglineStyles.decorativeTextPurple}>citizen data scientists</span>
        <span className={taglineStyles.tooltipContent} role="tooltip">
          {TOOLTIPS.everyLevel}
        </span>
      </span>.
    </p>
  </div>
);

export default HomeTagline;
