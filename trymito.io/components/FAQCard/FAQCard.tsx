/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState } from 'react';
import faqCardStyles from './FAQCard.module.css';
import { classNames } from '../../utils/classNames';

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={classNames(faqCardStyles.chevron, { [faqCardStyles.chevronOpen]: isOpen })}
    aria-hidden
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

interface FAQCardProps {
  title: string;
  children: JSX.Element;
  id?: string;
  /** Optional 1-based index for numbered label (e.g. 1 → "01"). Omit to hide number. */
  index?: number;
}

const FAQCard = (props: FAQCardProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div
      className={classNames(
        faqCardStyles.item,
        { [faqCardStyles.itemOpen]: isOpen },
        props.index == null && faqCardStyles.itemNoNumber
      )}
      id={props.id}
    >
      <button
        type="button"
        className={faqCardStyles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        {props.index != null && (
          <span className={faqCardStyles.number}>
            {props.index < 10 ? `0${props.index}` : String(props.index)}
          </span>
        )}
        <span className={faqCardStyles.headline}>{props.title}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>
      <div
        className={classNames(faqCardStyles.panel, { [faqCardStyles.panelOpen]: isOpen })}
        role="region"
      >
        <div className={faqCardStyles.panelInner}>
          <div className={faqCardStyles.content}>{props.children}</div>
        </div>
      </div>
    </div>
  );
};

export default FAQCard;
export { faqCardStyles };
