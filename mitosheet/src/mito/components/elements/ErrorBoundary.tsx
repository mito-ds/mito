import React, { Component, ReactNode } from "react";
import { MitoAPI } from "../../api/api";
import { DISCORD_INVITE_LINK } from "../../data/documentationLinks";
import { AnalysisData, SheetData, UserProfile } from "../../types";
import { isInDash, isInStreamlit } from "../../utils/location";
import { DEFAULT_SUPPORT_EMAIL } from "./GetSupportButton";

interface Props {
    children: ReactNode;
    mitoAPI: MitoAPI;
    userProfile: UserProfile,
    analyisData: AnalysisData,
    sheetDataArray: SheetData[]
}

interface State {
    hasError: boolean;
    error?: Error
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: undefined,
    };

    public static getDerivedStateFromError(): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error: undefined };
    }

    public componentDidCatch(error: Error): void {
        console.error("Sheet crashing error", error);
        console.error("userProfile", this.props.userProfile)
        console.error("analysisData", this.props.analyisData)
        console.error("sheetDataArray", this.props.sheetDataArray)

        void this.props.mitoAPI.log('frontend_render_failed', {
            'error_name': error.name,
            'error_message': error.message,
            'error_stack': error.stack?.split('\n'),
        })

        this.setState({ error });
    }

    public render(): ReactNode {

        let fixUpMessage = 'Rerun the Jupyter Cell above';
        if (isInStreamlit()) {
            fixUpMessage = 'Refresh the Streamlit app'
        } else if (isInDash()) {
            fixUpMessage = 'Refresh the Dash app'
        }

        let supportMessage = (<>join our <a className='text-body-1-link' href={DISCORD_INVITE_LINK} target='_blank' rel="noreferrer">Discord</a> for support</>);
        const supportEmail = this.props.userProfile.mitoConfig.MITO_CONFIG_SUPPORT_EMAIL;
        if (supportEmail !== DEFAULT_SUPPORT_EMAIL) {
            const body = "Error Report (DO NOT DELETE): " + JSON.stringify({
                'userProfile': this.props.userProfile,
                'analysisData': this.props.analyisData,
                'sheetDataArray': this.props.sheetDataArray,
                'error': this.state.error 
                    ? {
                        'name': this.state.error.name,
                        'message': this.state.error.message,
                        'stack': this.state.error,
                    } : null
            })
            supportMessage = (<><a className='text-body-1-link' href={`mailto:${supportEmail}?subject=Mito error report&body=${body}`} target='_blank' rel="noreferrer">contact support</a></>)
        }

        if (this.state.hasError) {
            return (
                <p className='text-body-1 text-color-red p-10px'>
                    Looks like Mito had an error! Sorry about that. {fixUpMessage}, and {supportMessage} if this error occurs again.
                </p>
            )
        }

        return this.props.children;
    }
}

export default ErrorBoundary;