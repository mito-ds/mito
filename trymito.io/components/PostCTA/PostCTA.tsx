/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import TextButton from '../Buttons/TextButton/TextButton';
import { classNames } from '../../utils/classNames';
import postCTAStyles from './PostCTA.module.css';

interface PostCTAProps {
  textButtonClassName: string;
  variant?: 'answers-not-syntax-errors';
  className?: string;
}

const PostCTA = (props: PostCTAProps): JSX.Element => {
  const ctaText = props.variant === 'answers-not-syntax-errors' 
    ? 'Get answers from your data, not syntax errors. Download the Mito AI analyst'
    : 'Turn data into insights, reports, and automations 4x faster.';

  return (
    <div className={classNames(postCTAStyles.post_cta, props.className)}>
      <p className={postCTAStyles.cta_text}>
        {ctaText}
      </p>
      <div className={postCTAStyles.button_container}>
        <TextButton 
          text="Download Mito"
          href="/downloads"
          variant="purple"
          className={props.textButtonClassName}
        />
      </div>
    </div>
  );
};

export default PostCTA;
