/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { validateAndCorrectAgentResponse } from '../../Extensions/AiChat/validationUtils';
import { AgentResponse } from '../../websockets/completions/CompletionModels';

describe('validateAndCorrectAgentResponse', () => {
    describe('type validation', () => {
        it('should preserve valid types', () => {
            const validTypes = ['cell_update', 'get_cell_output', 'run_all_cells', 'finished_task'];
            
            validTypes.forEach(type => {
                const response: AgentResponse = {
                    type: type as any,
                    message: 'test message'
                };
                
                const result = validateAndCorrectAgentResponse(response);
                expect(result.type).toBe(type);
            });
        });

        it('should default to finished_task for invalid types', () => {
            const invalidTypes = ['invalid_type', '', null, undefined, 123, {}];
            
            invalidTypes.forEach(invalidType => {
                const response: AgentResponse = {
                    type: invalidType as any,
                    message: 'test message'
                };
                
                const result = validateAndCorrectAgentResponse(response);
                expect(result.type).toBe('finished_task');
            });
        });
    });

    describe('message validation', () => {
        it('should preserve valid string messages', () => {
            const response: AgentResponse = {
                type: 'finished_task',
                message: 'This is a valid message'
            };
            
            const result = validateAndCorrectAgentResponse(response);
            expect(result.message).toBe('This is a valid message');
        });

        it('should default to empty string for invalid messages', () => {
            const invalidMessages = [null, undefined, 123, {}, []];
            
            invalidMessages.forEach(invalidMessage => {
                const response: AgentResponse = {
                    type: 'finished_task',
                    message: invalidMessage as any
                };
                
                const result = validateAndCorrectAgentResponse(response);
                expect(result.message).toBe('');
            });
        });
    });

    describe('get_cell_output_cell_id validation', () => {
        it('should preserve valid string cell_id', () => {
            const response: AgentResponse = {
                type: 'get_cell_output',
                message: 'test',
                get_cell_output_cell_id: 'cell-123'
            };
            
            const result = validateAndCorrectAgentResponse(response);
            expect(result.get_cell_output_cell_id).toBe('cell-123');
        });

        it('should preserve null and undefined cell_id', () => {
            const responseWithNull: AgentResponse = {
                type: 'get_cell_output',
                message: 'test',
                get_cell_output_cell_id: null
            };
            
            const responseWithUndefined: AgentResponse = {
                type: 'get_cell_output',
                message: 'test',
                get_cell_output_cell_id: undefined
            };
            
            expect(validateAndCorrectAgentResponse(responseWithNull).get_cell_output_cell_id).toBe(undefined);
            expect(validateAndCorrectAgentResponse(responseWithUndefined).get_cell_output_cell_id).toBe(undefined);
        });

        it('should default to undefined for invalid cell_id types', () => {
            const invalidCellIds = [123, {}, [], true];
            
            invalidCellIds.forEach(invalidCellId => {
                const response: AgentResponse = {
                    type: 'get_cell_output',
                    message: 'test',
                    get_cell_output_cell_id: invalidCellId as any
                };
                
                const result = validateAndCorrectAgentResponse(response);
                expect(result.get_cell_output_cell_id).toBe(undefined);
            });
        });
    });

    describe('next_steps validation', () => {
        it('should preserve valid string arrays', () => {
            const response: AgentResponse = {
                type: 'finished_task',
                message: 'test',
                next_steps: ['step1', 'step2', 'step3']
            };
            
            const result = validateAndCorrectAgentResponse(response);
            expect(result.next_steps).toEqual(['step1', 'step2', 'step3']);
        });

        it('should convert string to array', () => {
            const response: AgentResponse = {
                type: 'finished_task',
                message: 'test',
                next_steps: 'single step' as any
            };
            
            const result = validateAndCorrectAgentResponse(response);
            expect(result.next_steps).toEqual(['single step']);
        });

        it('should preserve null and undefined next_steps', () => {
            const responseWithNull: AgentResponse = {
                type: 'finished_task',
                message: 'test',
                next_steps: null
            };
            
            const responseWithUndefined: AgentResponse = {
                type: 'finished_task',
                message: 'test',
                next_steps: undefined
            };
            
            expect(validateAndCorrectAgentResponse(responseWithNull).next_steps).toBe(null);
            expect(validateAndCorrectAgentResponse(responseWithUndefined).next_steps).toBe(undefined);
        });

        it('should return null for invalid next_steps types', () => {
            const invalidNextSteps = [123, {}, true];
            
            invalidNextSteps.forEach(invalidNextStep => {
                const response: AgentResponse = {
                    type: 'finished_task',
                    message: 'test',
                    next_steps: invalidNextStep as any
                };
                
                const result = validateAndCorrectAgentResponse(response);
                expect(result.next_steps).toBe(undefined);
            });
        });
    });

    describe('analysis_assumptions validation', () => {
        it('should preserve valid string arrays', () => {
            const response: AgentResponse = {
                type: 'finished_task',
                message: 'test',
                analysis_assumptions: ['assumption1', 'assumption2']
            };
            
            const result = validateAndCorrectAgentResponse(response);
            expect(result.analysis_assumptions).toEqual(['assumption1', 'assumption2']);
        });

        it('should convert string to array', () => {
            const response: AgentResponse = {
                type: 'finished_task',
                message: 'test',
                analysis_assumptions: 'single assumption' as any
            };
            
            const result = validateAndCorrectAgentResponse(response);
            expect(result.analysis_assumptions).toEqual(['single assumption']);
        });

        it('should preserve null and undefined analysis_assumptions', () => {
            const responseWithNull: AgentResponse = {
                type: 'finished_task',
                message: 'test',
                analysis_assumptions: null
            };
            
            const responseWithUndefined: AgentResponse = {
                type: 'finished_task',
                message: 'test',
                analysis_assumptions: undefined
            };
            
            expect(validateAndCorrectAgentResponse(responseWithNull).analysis_assumptions).toBe(null);
            expect(validateAndCorrectAgentResponse(responseWithUndefined).analysis_assumptions).toBe(undefined);
        });

        it('should return null for invalid analysis_assumptions types', () => {
            const invalidAssumptions = [123, {}, true];
            
            invalidAssumptions.forEach(invalidAssumption => {
                const response: AgentResponse = {
                    type: 'finished_task',
                    message: 'test',
                    analysis_assumptions: invalidAssumption as any
                };
                
                const result = validateAndCorrectAgentResponse(response);
                expect(result.analysis_assumptions).toBe(undefined);
            });
        });
    });

    describe('cell_update validation', () => {
        it('should preserve valid cell_update objects', () => {
            const response: AgentResponse = {
                type: 'cell_update',
                message: 'test',
                cell_update: {
                    type: 'modification',
                    id: 'cell-123',
                    code: 'print("hello")',
                    code_summary: 'Print hello',
                    cell_type: 'code'
                }
            };
            
            const result = validateAndCorrectAgentResponse(response);
            expect(result.cell_update).toEqual(response.cell_update);
        });

        it('should preserve null and undefined cell_update', () => {
            const responseWithNull: AgentResponse = {
                type: 'cell_update',
                message: 'test',
                cell_update: null
            };
            
            const responseWithUndefined: AgentResponse = {
                type: 'cell_update',
                message: 'test',
                cell_update: undefined
            };
            
            expect(validateAndCorrectAgentResponse(responseWithNull).cell_update).toBe(null);
            expect(validateAndCorrectAgentResponse(responseWithUndefined).cell_update).toBe(undefined);
        });
    });

    describe('immutability', () => {
        it('should not mutate the original response', () => {
            const originalResponse: AgentResponse = {
                type: 'invalid_type' as any,
                message: 'test',
                next_steps: 'single step' as any
            };
            
            const originalCopy = { ...originalResponse };
            const result = validateAndCorrectAgentResponse(originalResponse);
            
            // Original should be unchanged
            expect(originalResponse).toEqual(originalCopy);
            
            // Result should be corrected
            expect(result.type).toBe('finished_task');
            expect(result.next_steps).toEqual(['single step']);
        });
    });

    describe('complex scenarios', () => {
        it('should handle completely malformed response', () => {
            const malformedResponse: AgentResponse = {
                type: 'invalid' as any,
                message: null as any,
                get_cell_output_cell_id: 123 as any,
                next_steps: 'step1,step2' as any,
                analysis_assumptions: 'assumption1' as any,
                cell_update: null
            };
            
            const result = validateAndCorrectAgentResponse(malformedResponse);
            
            expect(result.type).toBe('finished_task');
            expect(result.message).toBe('');
            expect(result.get_cell_output_cell_id).toBe(undefined);
            expect(result.next_steps).toEqual(['step1,step2']);
            expect(result.analysis_assumptions).toEqual(['assumption1']);
            expect(result.cell_update).toBe(null);
        });

        it('should handle empty arrays correctly', () => {
            const response: AgentResponse = {
                type: 'finished_task',
                message: 'test',
                next_steps: [],
                analysis_assumptions: []
            };
            
            const result = validateAndCorrectAgentResponse(response);
            expect(result.next_steps).toEqual([]);
            expect(result.analysis_assumptions).toEqual([]);
        });
    });
});
