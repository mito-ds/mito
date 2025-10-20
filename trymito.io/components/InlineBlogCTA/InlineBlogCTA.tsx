/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import TextButton from '../Buttons/TextButton/TextButton';
import { classNames } from '../../utils/classNames';
import inlineBlogCTAStyles from './InlineBlogCTA.module.css';

interface InlineBlogCTAProps {
  textButtonClassName: string;
  className?: string;
}

const InlineBlogCTA = (props: InlineBlogCTAProps): JSX.Element => {


  const valueProp = {
    title: 'AI-powered data analysis you can trust',
    description: 'Go from raw data to presentation-ready insights 4x faster with AI that understands your data. Completely open source.',
    cta: 'Download Mito'
  };

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
