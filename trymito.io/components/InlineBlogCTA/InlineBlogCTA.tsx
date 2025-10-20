/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import TextButton from '../Buttons/TextButton/TextButton';
import { classNames } from '../../utils/classNames';
import inlineBlogCTAStyles from './InlineBlogCTA.module.css';

interface InlineBlogCTAProps {
  textButtonClassName: string;
  variant?: 'default' | 'data-analysis' | 'automation';
  className?: string;
}

const InlineBlogCTA = (props: InlineBlogCTAProps): JSX.Element => {
  const getValueProposition = () => {
    switch (props.variant) {
      case 'data-analysis':
        return {
          title: 'Stop wrestling with Python syntax',
          description: 'Work in a familiar spreadsheet interface while Mito generates the Python code automatically.',
          cta: 'Try Mito for free'
        };
      case 'automation':
        return {
          title: 'Automate your data tasks',
          description: 'Turn hours of manual work into minutes of automated Python scripts.',
          cta: 'Start automating today'
        };
      default:
        return {
          title: 'Turn data into insights 4x faster',
          description: 'Work in a familiar spreadsheet interface while Mito generates the Python code automatically.',
          cta: 'Download Mito'
        };
    }
  };

  const valueProp = getValueProposition();

  return (
    <div className={classNames(inlineBlogCTAStyles.inline_cta, props.className)}>
      <div className={inlineBlogCTAStyles.content}>
        <h3 className={inlineBlogCTAStyles.title}>
          {valueProp.title}
        </h3>
        
        <p className={inlineBlogCTAStyles.description}>
          {valueProp.description}
        </p>
        
        <div className={inlineBlogCTAStyles.button_container}>
          <TextButton 
            text={valueProp.cta}
            href="/downloads"
            variant="purple"
            className={props.textButtonClassName}
          />
        </div>
      </div>
    </div>
  );
};

export default InlineBlogCTA;
