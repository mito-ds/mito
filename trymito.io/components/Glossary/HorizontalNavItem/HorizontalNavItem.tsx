import React from 'react';

import Link from 'next/link';


const HorizontalNavItem = (props: {
  title: string
  href: string
}) => {

  return (
    <Link href={props.href}>
        <p>
            {props.title}
        </p>
    </Link>
  );
};

export default HorizontalNavItem;
