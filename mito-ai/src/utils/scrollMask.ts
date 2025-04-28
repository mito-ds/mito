/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Updates the mask for a scrollable container based on its scroll position and container width
 * @param container - The scrollable container element
 */
export const updateScrollMask = (container: HTMLElement | null): void => {
  if (!container) return;
  
  // Get the container and its parent's width
  const scrollLeft = container.scrollLeft;
  const scrollWidth = container.scrollWidth;
  const clientWidth = container.clientWidth;
  const isScrollable = scrollWidth > clientWidth;
  
  // Get the parent container which has the maximum width set
  const parentContainer = container.closest('.suggestions-container');
  const parentWidth = parentContainer?.getBoundingClientRect().width || 0;
  
  // Check if we're at max-width (600px) where we should hide the mask
  const isAtMaxWidth = parentWidth >= 600 && parentWidth <= 601; // Small buffer for rounding errors
  
  // If at max width or not scrollable, no need for any mask
  if (isAtMaxWidth || !isScrollable) {
    container.style.maskImage = 'none';
    container.style.webkitMaskImage = 'none';
    return;
  }
  
  // Determine mask type based on scroll position
  const scrollEnd = scrollWidth - clientWidth;
  const leftEdgeVisible = scrollLeft <= 5; // Add small buffer for precision issues
  const rightEdgeVisible = scrollLeft >= scrollEnd - 5; // Add small buffer for precision issues
  
  let maskImage = '';
  
  if (leftEdgeVisible) {
    // Only right mask when at left edge
    maskImage = 'linear-gradient(to right, black 85%, transparent 100%)';
  } else if (rightEdgeVisible) {
    // Only left mask when at right edge
    maskImage = 'linear-gradient(to left, black 85%, transparent 100%)';
  } else {
    // Both masks when in the middle
    maskImage = 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)';
  }
  
  container.style.maskImage = maskImage;
  container.style.webkitMaskImage = maskImage;
};

/**
 * Initializes the scroll mask with a delay to ensure content has rendered
 * @param container - The scrollable container element
 * @param delay - Delay in milliseconds before updating the mask
 */
export const initScrollMask = (container: HTMLElement | null, delay: number = 100): void => {
  if (!container) return;
  
  // Reset scroll position to start
  container.scrollLeft = 0;
  
  // Apply mask after a short delay to ensure content has rendered
  setTimeout(() => {
    updateScrollMask(container);
  }, delay);
}; 