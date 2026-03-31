/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { globalMitoRegistry } from "../jupyter/MitoInstanceRegistry";
import { MitoAPI } from "../mito/api/api";

// Create a minimal mock MitoAPI for testing
const createMockMitoAPI = (): MitoAPI => {
    return {
        updateUndo: jest.fn(),
        updateRedo: jest.fn(),
    } as unknown as MitoAPI;
};

// Create a mock HTMLElement
const createMockContainer = (): HTMLElement => {
    return document.createElement("div");
};

describe("MitoInstanceRegistry", () => {
    beforeEach(() => {
        globalMitoRegistry.clear();
    });

    describe("register / unregister", () => {
        it("registers a Mito instance", () => {
            const api = createMockMitoAPI();
            const container = createMockContainer();

            globalMitoRegistry.register("analysis-1", api, container);

            expect(globalMitoRegistry.getInstanceCount()).toBe(1);
            expect(globalMitoRegistry.getInstance("analysis-1")).toBeDefined();
            expect(globalMitoRegistry.getInstance("analysis-1")?.mitoAPI).toBe(api);
        });

        it("unregisters a Mito instance", () => {
            const api = createMockMitoAPI();
            const container = createMockContainer();

            globalMitoRegistry.register("analysis-1", api, container);
            globalMitoRegistry.unregister("analysis-1");

            expect(globalMitoRegistry.getInstanceCount()).toBe(0);
            expect(globalMitoRegistry.getInstance("analysis-1")).toBeUndefined();
        });

        it("handles multiple instances", () => {
            const api1 = createMockMitoAPI();
            const api2 = createMockMitoAPI();

            globalMitoRegistry.register("analysis-1", api1, createMockContainer());
            globalMitoRegistry.register("analysis-2", api2, createMockContainer());

            expect(globalMitoRegistry.getInstanceCount()).toBe(2);
        });

        it("removes undo stack entries when unregistering", () => {
            const api = createMockMitoAPI();
            globalMitoRegistry.register("analysis-1", api, createMockContainer());
            globalMitoRegistry.recordEdit("analysis-1", "step-1");
            globalMitoRegistry.recordEdit("analysis-1", "step-2");

            expect(globalMitoRegistry.getUndoStackLength()).toBe(2);

            globalMitoRegistry.unregister("analysis-1");

            expect(globalMitoRegistry.getUndoStackLength()).toBe(0);
        });
    });

    describe("recordEdit", () => {
        it("records an edit and updates the undo stack", () => {
            const api = createMockMitoAPI();
            globalMitoRegistry.register("analysis-1", api, createMockContainer());

            globalMitoRegistry.recordEdit("analysis-1", "step-1");

            expect(globalMitoRegistry.getUndoStackLength()).toBe(1);
        });

        it("does nothing for unregistered instances", () => {
            globalMitoRegistry.recordEdit("nonexistent", "step-1");
            expect(globalMitoRegistry.getUndoStackLength()).toBe(0);
        });

        it("records edits from multiple instances", () => {
            const api1 = createMockMitoAPI();
            const api2 = createMockMitoAPI();
            globalMitoRegistry.register("analysis-1", api1, createMockContainer());
            globalMitoRegistry.register("analysis-2", api2, createMockContainer());

            globalMitoRegistry.recordEdit("analysis-1", "step-1");
            globalMitoRegistry.recordEdit("analysis-2", "step-2");
            globalMitoRegistry.recordEdit("analysis-1", "step-3");

            expect(globalMitoRegistry.getUndoStackLength()).toBe(3);
        });
    });

    describe("getMostRecentlyEdited", () => {
        it("returns undefined when no edits have been made", () => {
            expect(globalMitoRegistry.getMostRecentlyEdited()).toBeUndefined();
        });

        it("returns the most recently edited instance", () => {
            const api1 = createMockMitoAPI();
            const api2 = createMockMitoAPI();
            globalMitoRegistry.register("analysis-1", api1, createMockContainer());
            globalMitoRegistry.register("analysis-2", api2, createMockContainer());

            globalMitoRegistry.recordEdit("analysis-1", "step-1");
            globalMitoRegistry.recordEdit("analysis-2", "step-2");

            const mostRecent = globalMitoRegistry.getMostRecentlyEdited();
            expect(mostRecent).toBeDefined();
            expect(mostRecent?.analysisName).toBe("analysis-2");
            expect(mostRecent?.mitoAPI).toBe(api2);
        });

        it("skips unregistered instances and returns the next most recent", () => {
            const api1 = createMockMitoAPI();
            const api2 = createMockMitoAPI();
            globalMitoRegistry.register("analysis-1", api1, createMockContainer());
            globalMitoRegistry.register("analysis-2", api2, createMockContainer());

            globalMitoRegistry.recordEdit("analysis-1", "step-1");
            globalMitoRegistry.recordEdit("analysis-2", "step-2");

            // Unregister analysis-2 (the most recent)
            globalMitoRegistry.unregister("analysis-2");

            const mostRecent = globalMitoRegistry.getMostRecentlyEdited();
            expect(mostRecent).toBeDefined();
            expect(mostRecent?.analysisName).toBe("analysis-1");
        });
    });

    describe("popUndoEntry", () => {
        it("returns undefined when undo stack is empty", () => {
            expect(globalMitoRegistry.popUndoEntry()).toBeUndefined();
        });

        it("pops the most recent entry from the undo stack", () => {
            const api = createMockMitoAPI();
            globalMitoRegistry.register("analysis-1", api, createMockContainer());

            globalMitoRegistry.recordEdit("analysis-1", "step-1");
            globalMitoRegistry.recordEdit("analysis-1", "step-2");

            const entry = globalMitoRegistry.popUndoEntry();
            expect(entry).toBeDefined();
            expect(entry?.stepId).toBe("step-2");
            expect(globalMitoRegistry.getUndoStackLength()).toBe(1);
        });

        it("skips entries for unregistered instances", () => {
            const api1 = createMockMitoAPI();
            const api2 = createMockMitoAPI();
            globalMitoRegistry.register("analysis-1", api1, createMockContainer());
            globalMitoRegistry.register("analysis-2", api2, createMockContainer());

            globalMitoRegistry.recordEdit("analysis-1", "step-1");
            globalMitoRegistry.recordEdit("analysis-2", "step-2");

            globalMitoRegistry.unregister("analysis-2");

            // Should skip the analysis-2 entry (already cleaned by unregister)
            // and return analysis-1's entry
            const entry = globalMitoRegistry.popUndoEntry();
            expect(entry).toBeDefined();
            expect(entry?.analysisName).toBe("analysis-1");
        });

        it("supports consecutive undos across multiple cells", () => {
            const api1 = createMockMitoAPI();
            const api2 = createMockMitoAPI();
            globalMitoRegistry.register("analysis-1", api1, createMockContainer());
            globalMitoRegistry.register("analysis-2", api2, createMockContainer());

            // Simulate: edit cell 1, edit cell 2, edit cell 1
            globalMitoRegistry.recordEdit("analysis-1", "step-1");
            globalMitoRegistry.recordEdit("analysis-2", "step-2");
            globalMitoRegistry.recordEdit("analysis-1", "step-3");

            // Undo should go: cell 1 (step-3), cell 2 (step-2), cell 1 (step-1)
            const first = globalMitoRegistry.popUndoEntry();
            expect(first?.analysisName).toBe("analysis-1");
            expect(first?.stepId).toBe("step-3");

            const second = globalMitoRegistry.popUndoEntry();
            expect(second?.analysisName).toBe("analysis-2");
            expect(second?.stepId).toBe("step-2");

            const third = globalMitoRegistry.popUndoEntry();
            expect(third?.analysisName).toBe("analysis-1");
            expect(third?.stepId).toBe("step-1");

            expect(globalMitoRegistry.popUndoEntry()).toBeUndefined();
        });
    });
});
