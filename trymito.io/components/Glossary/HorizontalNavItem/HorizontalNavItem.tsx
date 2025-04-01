/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

import Link from 'next/link';
import horizontalNavItemStyles from './HorizontalNavItem.module.css'

const HorizontalNavItem = (props: {
  title: string
  href: string
}) => {

  return (
    <Link href={props.href}>
      <p className={horizontalNavItemStyles.item}>
        {props.title}
      </p>
    </Link>
  );
};

export default HorizontalNavItem;
