import React, { Component, ErrorInfo, ReactNode } from "react";
import MitoAPI from "../../api";
import { DISCORD_INVITE_LINK } from "../../data/documentationLinks";

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

    public static getDerivedStateFromError(): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        void this.props.mitoAPI.sendLogMessage('frontend_render_failed', {
            'error': error,
            'errorInfo': errorInfo.componentStack
        })
    }

    public render(): ReactNode {
        if (this.state.hasError) {
            return (
                <p className='text-body-1 text-color-red p-10px'>
                    Looks like Mito had an error! Sorry about that. Rerun the Jupyter Cell above, and <a className='text-body-1-link' href={DISCORD_INVITE_LINK} target='_blank' rel="noreferrer">join our Discord for support</a> if this error occurs again.
                </p>
            )
        }

        return this.props.children;
    }
}

export default ErrorBoundary;