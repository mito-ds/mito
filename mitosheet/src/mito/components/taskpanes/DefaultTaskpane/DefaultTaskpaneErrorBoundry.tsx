/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// ErrorBoundary.js
import React from 'react';
import { UIState } from '../../../types';
import { TaskpaneType } from '../taskpanes';
import { MitoAPI } from '../../../api/api';

type PropsType = {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    taskpaneHeader: string;
    mitoAPI?: MitoAPI,
    children: React.ReactNode
};

// If the error is not caught, the error will be logged to the console and the taskpane will be closed.
// This is to prevent the entire sheet from crashing, and just allows the user to reopen the taskpane.
class DefaultTaskpaneErrorBoundry extends React.Component<PropsType, {hasError: boolean}> {
    constructor(props: PropsType) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
        this.props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenTaskpane: {type: TaskpaneType.NONE}
            }
        })

        void this.props.mitoAPI?.log('taskpane_render_failed', {
            js_error: error,
            js_error_info: errorInfo,
            // We don't log this as it might have sensitive information
            // js_taskpane_header: this.props.taskpaneHeader
        });
    }

    render() {
        if (this.state.hasError) {
            return <></>;
        }

        return this.props.children;
    }
}

export default DefaultTaskpaneErrorBoundry;