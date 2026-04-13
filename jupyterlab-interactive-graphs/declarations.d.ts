declare module '*.css';

declare module 'plotly.js-dist-min' {
  import type { Config, Data, Layout } from 'plotly.js';

  interface PlotlyStatic {
    react(
      gd: HTMLElement,
      data: Data[],
      layout: Partial<Layout>,
      config?: Partial<Config>
    ): Promise<unknown>;
    purge(gd: HTMLElement): void;
    Plots: {
      resize(gd: HTMLElement): void;
    };
  }

  const Plotly: PlotlyStatic;
  export default Plotly;
}
