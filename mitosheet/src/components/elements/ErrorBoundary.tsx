import React, { Component, ReactNode } from "react";
import MitoAPI from "../../jupyter/api";
import { DISCORD_INVITE_LINK, SLACK_INVITE_LINK } from "../../data/documentationLinks";

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

    public componentDidCatch(error: Error): void {
        void this.props.mitoAPI.log('frontend_render_failed', {
            'error_name': error.name,
            'error_message': error.message,
            'error_stack': error.stack?.split('\n'),
        })
    }

    public render(): ReactNode {
        if (this.state.hasError) {
            return (
                <p className='text-body-1 text-color-red p-10px'>
                    Looks like Mito had an error! Sorry about that. Rerun the Jupyter Cell above, and join our <a className='text-body-1-link' href={SLACK_INVITE_LINK} target='_blank' rel="noreferrer">Slack</a> or <a className='text-body-1-link' href={DISCORD_INVITE_LINK} target='_blank' rel="noreferrer">Discord</a> for support if this error occurs again.
                </p>
            )
        }

        return this.props.children;
    }
}

export default ErrorBoundary;