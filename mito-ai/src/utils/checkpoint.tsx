import { INotebookTracker } from "@jupyterlab/notebook";
import { getAIOptimizedCells } from "./notebook";
import { JupyterFrontEnd } from "@jupyterlab/application";
import { ChatHistoryManager } from "../Extensions/AiChat/ChatHistoryManager";


export const createCheckpoint = async (app: JupyterFrontEnd, setHasCheckpoint: (hasCheckpoint: boolean) => void): Promise<void> => {
    // By saving the notebook, we create a checkpoint that we can restore from
    await app.commands.execute("docmanager:save")
    // Despite what the docs say, this does not seem to do anything:
    // await app.commands.execute("logconsole:add-checkpoint")
    setHasCheckpoint(true)
}

// Helper function to get a hash of the current notebook state
export const getNotebookStateHash = (notebookTracker: INotebookTracker): string => {
    const cells = getAIOptimizedCells(notebookTracker);
    // Create a simple hash by concatenating all cell IDs and their content
    const notebookState = cells.map(cell => `${cell.id}:${cell.code}`).join('|');
    return notebookState;
}

export const restoreCheckpoint =  async (
    app: JupyterFrontEnd, 
    notebookTracker: INotebookTracker, 
    setHasCheckpoint: (hasCheckpoint: boolean) => void, 
    getDuplicateChatHistoryManager: () => ChatHistoryManager, 
    setChatHistoryManager: (chatHistoryManager: ChatHistoryManager) => void
): Promise<void> => {    
    // Get the notebook state before attempting restoration
    const notebookStateBefore = getNotebookStateHash(notebookTracker);
    
    // Restore the checkpoint        
    await app.commands.execute("docmanager:restore-checkpoint")
    
    // Get the notebook state after the command
    const notebookStateAfter = getNotebookStateHash(notebookTracker);
    
    // Only proceed with state updates if the notebook actually changed
    if (notebookStateBefore === notebookStateAfter) {
        // The user canceled the restoration, so don't update any state
        return;
    }
    
    // The restoration was successful, so update the state
    setHasCheckpoint(false)

    // Add a message to the chat history
    const newChatHistoryManager = getDuplicateChatHistoryManager();
    newChatHistoryManager.addAIMessageFromResponse(
        "I've reverted all previous changes",
        "chat",
        false
    )
    setChatHistoryManager(newChatHistoryManager);           
    
    // Restart the run all
    await app.commands.execute("notebook:restart-run-all")
}