/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Signal } from '@lumino/signaling';

/**
 * Event emitter for user signup events
 */
class UserSignupEventEmitter {
    private _signupSuccess = new Signal<this, void>(this);

    /**
     * Signal emitted when a user successfully signs up
     */
    get signupSuccess(): Signal<this, void> {
        return this._signupSuccess;
    }

    /**
     * Emit a signup success event
     */
    emitSignupSuccess(): void {
        this._signupSuccess.emit();
    }
}

// Create a singleton instance
export const userSignupEvents = new UserSignupEventEmitter();
