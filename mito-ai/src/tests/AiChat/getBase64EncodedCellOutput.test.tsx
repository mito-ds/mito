/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook"
import { getBase64EncodedCellOutput } from "../../Extensions/AiChat/utils"
import { getCellIndexByIDInNotebookPanel } from "../../utils/notebook"
import { getCellOutputByIDInNotebook } from "../../utils/cellOutput"
import { logEvent } from "../../restAPI/RestAPI"

// Mock the dependencies
jest.mock("../../utils/notebook")
jest.mock("../../utils/cellOutput")
jest.mock("../../restAPI/RestAPI")

const mockGetCellIndexByIDInNotebookPanel = getCellIndexByIDInNotebookPanel as jest.MockedFunction<typeof getCellIndexByIDInNotebookPanel>
const mockGetCellOutputByIDInNotebook = getCellOutputByIDInNotebook as jest.MockedFunction<typeof getCellOutputByIDInNotebook>
const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>

describe('getBase64EncodedCellOutput', () => {
    let mockNotebookTracker: INotebookTracker
    let mockNotebookPanel: NotebookPanel
    const mockNotebookId = '/test/notebook.ipynb';

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks()
        
        // Create a mock notebook panel with proper structure
        mockNotebookPanel = {
            id: mockNotebookId,
            context: {
                path: '/test/notebook.ipynb'
            }
        } as unknown as NotebookPanel
        
        // Create a mock notebook tracker
        mockNotebookTracker = {
            currentWidget: mockNotebookPanel
        } as unknown as INotebookTracker
    })

    describe('when cell ID does not exist in the notebook', () => {
        it('should call logEvent with correct parameter and not call getCellOutputByIDInNotebook', async () => {
            // Arrange
            const nonExistentCellID = 'non-existent-cell-id'
            mockGetCellIndexByIDInNotebookPanel.mockReturnValue(undefined)

            // Act
            const result = await getBase64EncodedCellOutput(mockNotebookTracker, nonExistentCellID)

            // Assert
            expect(result).toBeUndefined()
            expect(mockGetCellIndexByIDInNotebookPanel).toHaveBeenCalledWith(mockNotebookPanel, nonExistentCellID)
            expect(mockLogEvent).toHaveBeenCalledWith('get_cell_output_requested_non_existent_cell')
            expect(mockGetCellOutputByIDInNotebook).not.toHaveBeenCalled()
        })
    })

    describe('when cell ID is undefined', () => {
        it('should return undefined without calling any functions', async () => {
            // Act
            const result = await getBase64EncodedCellOutput(mockNotebookTracker, undefined)

            // Assert
            expect(result).toBeUndefined()
            expect(mockGetCellIndexByIDInNotebookPanel).not.toHaveBeenCalled()
            expect(mockLogEvent).not.toHaveBeenCalled()
            expect(mockGetCellOutputByIDInNotebook).not.toHaveBeenCalled()
        })
    })

    describe('when cell ID exists in the notebook', () => {
        it('should call getCellOutputByIDInNotebook', async () => {
            // Arrange
            const existingCellID = 'existing-cell-id'
            mockGetCellIndexByIDInNotebookPanel.mockReturnValue(0)
            mockGetCellOutputByIDInNotebook.mockResolvedValue('base64-encoded-output')

            // Act
            const result = await getBase64EncodedCellOutput(mockNotebookTracker, existingCellID)

            // Assert
            expect(result).toBe('base64-encoded-output')
            expect(mockGetCellIndexByIDInNotebookPanel).toHaveBeenCalledWith(mockNotebookPanel, existingCellID)
            expect(mockGetCellOutputByIDInNotebook).toHaveBeenCalledWith(mockNotebookPanel, existingCellID)
            expect(mockLogEvent).not.toHaveBeenCalled()
        })

        it('should return undefined when getCellOutputByIDInNotebook returns undefined', async () => {
            // Arrange
            const existingCellID = 'existing-cell-id'
            mockGetCellIndexByIDInNotebookPanel.mockReturnValue(0)
            mockGetCellOutputByIDInNotebook.mockResolvedValue(undefined)

            // Act
            const result = await getBase64EncodedCellOutput(mockNotebookTracker, existingCellID)

            // Assert
            expect(result).toBeUndefined()
            expect(mockGetCellOutputByIDInNotebook).toHaveBeenCalledWith(mockNotebookPanel, existingCellID)
            expect(mockLogEvent).not.toHaveBeenCalled()
        })
    })
})
