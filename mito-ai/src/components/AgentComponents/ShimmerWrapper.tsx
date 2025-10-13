/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { classNames } from '../../utils/classNames';
import '../../../style/ShimmerWrapper.css';

interface ShimmerWrapperProps {
    children: React.ReactNode;
    isActive?: boolean;
    className?: string;
}

const ShimmerWrapper: React.FC<ShimmerWrapperProps> = ({ 
    children, 
    isActive = false, 
    className = '' 
}) => {
    const shimmerClass = isActive ? 'shimmer-wrapper' : '';

    return (
        <div className={classNames(shimmerClass, className)}>
            {children}
        </div>
    );
};

export default ShimmerWrapper;
