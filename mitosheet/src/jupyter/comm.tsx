import { sleep, sleepUntilTrueOrTimeout } from "../utils/time";
import { isInJupyterLab, isInJupyterNotebook } from "./jupyterUtils";

/**
 * Note the difference between the Lab and Notebook comm interfaces. 
 * 
 * To work, Lab needs to have .open() called on it before sending any messages,
 * and you set the onMsg handler directly. 
 * 
 * Notebook does not need any .open() to be called, and also requires 
 * the message handler to be passed to as on_msg((msg) => handle it).
 * 
 * We need to take special care to ensure we treat any new comms interface how it 
 * expects to be treated, as they are all likely slighly different.
 */
export interface LabComm {
    send: (msg: Record<string, unknown>) => void,
    onMsg: (msg: {content: {data: Record<string, unknown>}}) => void,
    open: () => void;
}
interface NotebookComm {
    send: (msg: Record<string, unknown>) => void,
    on_msg: (handler: (msg: {content: {data: Record<string, unknown>}}) => void) => void,
}

export type CommContainer = {
    'type': 'lab',
    'comm': LabComm
} | {
    'type': 'notebook',
    'comm': NotebookComm
}

export const MAX_WAIT_FOR_COMM_CREATION = 10_000;

export type CommCreationErrorStatus = 'non_working_extension_error' | 'no_backend_comm_registered_error' | 'non_valid_location_error';
export type CommCreationStatus = 'loading' | 'finished' | CommCreationErrorStatus;

export const getNotebookCommConnectedToBackend = async (comm: NotebookComm): Promise<boolean> => {

    return new Promise(async (resolve) => {
        let resolved = false;
        comm.on_msg((msg) => {
            // Wait for the first echo message, and then we know this comm is actually connected
            if (msg.content.data.echo) {
                console.log("Got echo!")
                // First, clear the onMsg from the comm
                // TODO!
                // Then, resolve with this comm
                resolved = true;
                resolve(true);
                return;
            }
        })

        // Give the onMsg a while to run
        await sleep(MAX_WAIT_FOR_COMM_CREATION);

        // Then, if we already resolved with the comm, then we quit here
        if (resolved) {
            return;
        }
        
        // Reset the onMsg
        // TODO

        return resolve(false);
    })
}


export const getNotebookComm = async (commTargetID: string): Promise<CommContainer | CommCreationErrorStatus> => {

    let potentialComm: NotebookComm | undefined = (window as any).Jupyter?.notebook?.kernel?.comm_manager?.new_comm(commTargetID);
    await sleepUntilTrueOrTimeout(async () => {
        potentialComm = (window as any).Jupyter?.notebook?.kernel?.comm_manager?.new_comm(commTargetID);
        return potentialComm !== undefined;
    }, MAX_WAIT_FOR_COMM_CREATION)

    // TODO: we have to test this here as well, with an echo

    console.log("Got potential comm", potentialComm)

    if (potentialComm === undefined) {
        return 'non_working_extension_error';
    } else {
        if (!(await getNotebookCommConnectedToBackend(potentialComm))) {
            return 'no_backend_comm_registered_error'
        } 
        return {
            'type': 'notebook',
            'comm': potentialComm
        };
    }
    
}

export const getLabCommConnectedToBackend = async (comm: LabComm): Promise<boolean> => {

    return new Promise(async (resolve) => {
        const originalOnMsg = comm.onMsg;
        let resolved = false;
        comm.onMsg = (msg) => {
            // Wait for the first echo message, and then we know this comm is actually connected
            if (msg.content.data.echo) {
                console.log("Got echo!")
                // First, clear the onMsg from the comm
                comm.onMsg = originalOnMsg;
                // Then, resolve with this comm
                resolved = true;
                resolve(true);
                return;
            }
        }

        // Give the onMsg a while to run
        await sleep(MAX_WAIT_FOR_COMM_CREATION);

        // Then, if we already resolved with the comm, then we quit here
        if (resolved) {
            return;
        }
        
        // Reset the onMsg
        comm.onMsg = originalOnMsg;

        return resolve(false);
    })
}


export const getLabComm = async (kernelID: string, commTargetID: string): Promise<CommContainer | CommCreationErrorStatus> => {
    // Potentially returns undefined if the command is not yet started
    let potentialComm: LabComm | 'no_backend_comm_registered_error' | undefined = undefined;

    // TODO: I hate this abstraction...
    await sleepUntilTrueOrTimeout(async () => {
        try {
            potentialComm = await window.commands?.execute('mitosheet:create-mitosheet-comm', {kernelID: kernelID, commTargetID: commTargetID});
        } catch (e) {
            // If we hit an explit error, then stop early as this likely mean the plugin does not exist
            console.error(e);
            return true;
        }
        return potentialComm !== undefined && potentialComm !== 'no_backend_comm_registered_error'; // TODO: we have to keep trying till we get a comm
    }, MAX_WAIT_FOR_COMM_CREATION)


    if (potentialComm === undefined) {
        return 'non_working_extension_error'
    } else if (potentialComm === 'no_backend_comm_registered_error') { 
        return 'no_backend_comm_registered_error'
    } else {
        /**
         * If we have successfully made a comm, we need to do a few things:
         *  - Open the comm. This is only required on lab, but otherwise you have a comm that 
         *    will not function.
         *  - Check that the comm is actually getting messages from the backend. For this, we 
         *    send an echo message from the backend, when it gets the open message
         * 
         * The check that we can receive messages ensures that we're not just creating a comm
         * on the frontend without any backend connection. This might happen when you restart
         * the page. 
         * 
         * In this case, we return the CommStatus of no_backend, etc
         */
        (potentialComm as LabComm).open() // TODO: why do I have to do this cast?
        
        if (!(await getLabCommConnectedToBackend(potentialComm))) {
            return 'no_backend_comm_registered_error'
        } else {
            return {
                'type': 'lab',
                'comm': potentialComm
            };
        }
    }
}


// Creates a comm that is open and ready to send messages on, and
// returns it with a label so we know what sort of comm it is
export const getCommContainer = async (kernelID: string, commTargetID: string): Promise<CommContainer | CommCreationErrorStatus> => {
    if (isInJupyterNotebook()) {
        return getNotebookComm(commTargetID);
    } else if (isInJupyterLab()) {
        return getLabComm(kernelID, commTargetID);
    }

    return 'non_valid_location_error'
}
