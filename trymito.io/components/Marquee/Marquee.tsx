/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { Fragment, useEffect, useState, useRef } from "react";
import styleMarquee from  "./Marquee.module.css";

/*
    Marquee object is adapted from: https://github.com/justin-chu/react-fast-marquee
*/

interface MarqueeProps {
  /**
   * Inline style for the container div
   * Type: object
   * Default: {}
   */
  style?: React.CSSProperties;
  /**
   * Class name to style the container div
   * Type: string
   * Default: ""
   */
  className?: string;
  /**
   * Whether to play or pause the marquee
   * Type: boolean
   * Default: true
   */
  play?: boolean;
  /**
   * The direction the marquee is sliding
   * Type: "left" or "right"
   * Default: "left"
   */
  direction?: "left" | "right";
  /**
   * Speed calculated as pixels/second
   * Type: number
   * Default: 20
   */
  speed?: number;
  /**
   * Duration to delay the animation after render, in seconds
   * Type: number
   * Default: 0
   */
  delay?: number;
  /**
   * The number of times the marquee should loop, 0 is equivalent to infinite
   * Type: number
   * Default: 0
   */
  loop?: number;
  /**
   * The children rendered inside the marquee
   * Type: ReactNode
   * Default: null
   */
  children?: React.ReactNode;
}

const Marquee: React.FC<MarqueeProps> = ({
  style = {},
  className = "",
  play = true,
  direction = "left",
  speed = 45,
  delay = 0,
  loop = 0,
  children,
}) => {
  // React Hooks
  const [containerWidth, setContainerWidth] = useState(0);
  const [marqueeWidth, setMarqueeWidth] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  const calculateWidth = () => {

    // Find width of container and width of marquee
    if (marqueeRef.current && containerRef.current) {
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
      setMarqueeWidth(marqueeRef.current.getBoundingClientRect().width);
    }

    if (marqueeWidth < containerWidth) {
      setDuration(containerWidth / speed);
    } else {
      setDuration(marqueeWidth / speed);
    }
  };

  useEffect(() => {
    calculateWidth();
    // Rerender on window resize
    window.addEventListener("resize", calculateWidth);
    return () => {
      window.removeEventListener("resize", calculateWidth);
    };
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Fragment>
      {!isMounted ? null : (
        <div
          ref={containerRef}
          style={{
            ...style
          }}
          className={className + " " + styleMarquee.marquee_container}
        >
          <div
            ref={marqueeRef}
            style={{
              ["--play" as string]: play ? "running" : "paused",
              ["--direction" as string]:
                direction === "left" ? "normal" : "reverse",
              ["--duration" as string]: `${duration}s`,
              ["--delay" as string]: `${delay}s`,
              ["--iteration-count" as string]: !!loop ? `${loop}` : "infinite",
            }}
            className={styleMarquee.marquee}
          >
            {children}
          </div>
          <div
            style={{
              ["--play" as string]: play ? "running" : "paused",
              ["--direction" as string]:
                direction === "left" ? "normal" : "reverse",
              ["--duration" as string]: `${duration}s`,
              ["--delay" as string]: `${delay}s`,
              ["--iteration-count" as string]: !!loop ? `${loop}` : "infinite",
            }}
            className={styleMarquee.marquee}
          >
            {children}
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default Marquee;