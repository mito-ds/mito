/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState, useEffect } from 'react';
import TextButton from '../Buttons/TextButton/TextButton';
import { classNames } from '../../utils/classNames';
import postCTAStyles from './PostCTA.module.css';

interface PostCTAProps {
  textButtonClassName: string;
  variant?: 'answers-not-syntax-errors';
  className?: string;
  addScrollMargin?: boolean;
}

const PostCTA = (props: PostCTAProps): JSX.Element => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!props.addScrollMargin) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 100); // Add margin after scrolling 100px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [props.addScrollMargin]);

  const ctaText = props.variant === 'answers-not-syntax-errors' 
    ? 'Get answers from your data, not syntax errors. Download the Mito AI analyst'
    : 'Turn data into insights and reports 4x faster with Mito AI';

  const scrollMarginClass = props.addScrollMargin && isScrolled ? postCTAStyles.scroll_margin : '';

  return (
    <div className={classNames(postCTAStyles.post_cta, props.className, scrollMarginClass)}>
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
