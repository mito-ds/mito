/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Tells Typescript to treat svg files as strings 
// so that we can import them in our code
declare module '*.svg' {
    const content: string;
    export default content;
}