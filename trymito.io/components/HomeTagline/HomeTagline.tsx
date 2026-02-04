/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import taglineStyles from './HomeTagline.module.css';

const TOOLTIPS = {
  yourSystems:
    "Run Mito completely locally on your user's computers or through your existing JupyterHub. Configure it to use your API keys through your Azure OpenAI Enterprise account, LiteLLM or other preferred LLM provider.",
  jupyter:
    "Mito has a deep understanding of how to work with Jupyter notebooks unlike other AI tools which treat notebooks as second class. Because Mito is designed for Jupyter it is compatible with all of your existing Jupyter extensions and environments.",
  everyLevel:
    "Mito is used by everyone from citizen data scientists at the world's largest financial institutions who are automating Excel reporting with Python through ML researchers at labs who are making breakthrough discoveries with data.",
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
      , designed for{' '}
      <span className={taglineStyles.tooltipTrigger}>
        <span className={taglineStyles.decorativeTextPurple}>Jupyter</span>
        <span className={taglineStyles.tooltipContent} role="tooltip">
          {TOOLTIPS.jupyter}
        </span>
      </span>
      , and works for{' '}
      <span className={taglineStyles.tooltipTrigger}>
        <span className={taglineStyles.decorativeTextPurple}>every level</span>
        <span className={taglineStyles.tooltipContent} role="tooltip">
          {TOOLTIPS.everyLevel}
        </span>
      </span>
      {' '}of Python.
    </p>
  </div>
);

export default HomeTagline;
