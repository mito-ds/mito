import React from 'react';

import horizontalNavStyles from './horizontalNav.module.css'
import { classNames } from '../../../utils/classNames';
import Link from 'next/link';
import Image from 'next/image';


const GlossayHorizontalNavbar = (props: {
  children: JSX.Element[];
}) => {
  // Apply syntax highlighting to the provided code

  const navItems = props.children.map(navBarItem => {
    return [<div>
        <Image src='/excel-to-python/navbar_divider.svg' alt='divider' width={8} height={14.5}/>
      </div>, 
      navBarItem
    ]
  })

  return (
    <div className={horizontalNavStyles.container}>
      <div>
        <Link href='/'>
          <Image src={'/excel-to-python/house.svg'} alt='Home Icon' width={28} height={20} />
        </Link>
      </div>
      {navItems}
      
    </div>
  );
};

export default GlossayHorizontalNavbar;
