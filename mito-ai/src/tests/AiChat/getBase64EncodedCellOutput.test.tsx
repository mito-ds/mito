/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from "@jupyterlab/notebook"
import { getBase64EncodedCellOutput } from "../../Extensions/AiChat/utils"
import { getCellIndexByID, scrollToCell, getActiveCellOutput } from "../../utils/notebook"
import { logEvent } from "../../restAPI/RestAPI"

// Mock the dependencies
jest.mock("../../utils/notebook")
jest.mock("../../restAPI/RestAPI")

const mockGetCellIndexByID = getCellIndexByID as jest.MockedFunction<typeof getCellIndexByID>
const mockScrollToCell = scrollToCell as jest.MockedFunction<typeof scrollToCell>
const mockGetActiveCellOutput = getActiveCellOutput as jest.MockedFunction<typeof getActiveCellOutput>
const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>

describe('getBase64EncodedCellOutput', () => {
    let mockNotebookTracker: INotebookTracker

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks()
        
        // Create a mock notebook tracker
        mockNotebookTracker = {} as INotebookTracker
    })

    describe('when cell ID does not exist in the notebook', () => {
        it('should call logEvent with correct parameter and not call getActiveCellOutput', async () => {
            // Arrange
            const nonExistentCellID = 'non-existent-cell-id'
            mockGetCellIndexByID.mockReturnValue(undefined)

            // Act
            const result = await getBase64EncodedCellOutput(mockNotebookTracker, nonExistentCellID)

            // Assert
            expect(result).toBeUndefined()
            expect(mockGetCellIndexByID).toHaveBeenCalledWith(mockNotebookTracker, nonExistentCellID)
            expect(mockLogEvent).toHaveBeenCalledWith('get_cell_output_requested_non_existent_cell')
            expect(mockScrollToCell).not.toHaveBeenCalled()
            expect(mockGetActiveCellOutput).not.toHaveBeenCalled()
        })
    })

    describe('when cell ID is undefined', () => {
        it('should return undefined without calling any functions', async () => {
            // Act
            const result = await getBase64EncodedCellOutput(mockNotebookTracker, undefined)

            // Assert
            expect(result).toBeUndefined()
            expect(mockGetCellIndexByID).not.toHaveBeenCalled()
            expect(mockLogEvent).not.toHaveBeenCalled()
            expect(mockScrollToCell).not.toHaveBeenCalled()
            expect(mockGetActiveCellOutput).not.toHaveBeenCalled()
        })
    })

    describe('when cell ID exists in the notebook', () => {
        it('should call scrollToCell and getActiveCellOutput', async () => {
            // Arrange
            const existingCellID = 'existing-cell-id'
            mockGetCellIndexByID.mockReturnValue(0)
            mockGetActiveCellOutput.mockResolvedValue('base64-encoded-output')

            // Act
            const result = await getBase64EncodedCellOutput(mockNotebookTracker, existingCellID)

            // Assert
            expect(result).toBe('base64-encoded-output')
            expect(mockGetCellIndexByID).toHaveBeenCalledWith(mockNotebookTracker, existingCellID)
            expect(mockScrollToCell).toHaveBeenCalledWith(mockNotebookTracker, existingCellID, 0)
            expect(mockGetActiveCellOutput).toHaveBeenCalledWith(mockNotebookTracker)
            expect(mockLogEvent).not.toHaveBeenCalled()
        })

        it('should return undefined when getActiveCellOutput returns undefined', async () => {
            // Arrange
            const existingCellID = 'existing-cell-id'
            mockGetCellIndexByID.mockReturnValue(0)
            mockGetActiveCellOutput.mockResolvedValue(undefined)

            // Act
            const result = await getBase64EncodedCellOutput(mockNotebookTracker, existingCellID)

            // Assert
            expect(result).toBeUndefined()
            expect(mockScrollToCell).toHaveBeenCalledWith(mockNotebookTracker, existingCellID, 0)
            expect(mockGetActiveCellOutput).toHaveBeenCalledWith(mockNotebookTracker)
            expect(mockLogEvent).not.toHaveBeenCalled()
        })
    })
})
