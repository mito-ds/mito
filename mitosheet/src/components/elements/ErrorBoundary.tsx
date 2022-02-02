import React, { Component, ErrorInfo, ReactNode } from "react";
import MitoAPI from "../../api";

interface Props {
  children: ReactNode;
  mitoAPI: MitoAPI;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      this.props.mitoAPI.sendLogMessage('frontend_render_failed', {
          'error': error,
          'errorInfo': errorInfo.componentStack
      })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <h2 className='text-color-red p-10px'>
            Sorry... Mito had an error. Rerun the Jupyter Cell above, and hopefully this won't happen again.
        </h2>
      )
    }

    return this.props.children;
  }
}

export default ErrorBoundary;