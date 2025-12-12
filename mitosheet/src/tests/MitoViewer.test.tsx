import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
// Import specific component to avoid importing @jupyterlab package
import { MitoViewer } from "../viewer/MitoViewer";

describe("MitoViewer", () => {
    const mockPayload = {
        columns: [
            { name: ["index"], dtype: "int64" },
            { name: ["Name"], dtype: "object" },
            { name: ["Age"], dtype: "int64" },
            { name: ["Score"], dtype: "float64" },
        ],
        data: '[[0, "Alice", 25, 85.5],[1, "Bob", 30, 92.0],[2, "Charlie", 35, 78.2]]',
        totalRows: 3,
        indexLevels: 1,
    };
    const multiIndexPayload = {
        "columns": [
            {
                "dtype": "level_1",
                "name": ["level_0"]
            },
            {
                "dtype": "level_2",
                "name": ["level_1"]
            },
            {
                "dtype": "level_3",
                "name": ["level_2"]
            },
            {
                "dtype": "level_4",
                "name": ["level_3"]
            },
            {
                "dtype": "int64",
                "name": ["a", "bar"]
            },
            {
                "dtype": "int64",
                "name": ["a", "foo"]
            },
            {
                "dtype": "int64",
                "name": ["b", "bah"]
            },
            {
                "dtype": "int64",
                "name": ["b", "foo"]
            }
        ],
        "data": "[[\"A0\",\"B0\",\"C0\",\"D0\",1,0,3,2],[\"A0\",\"B0\",\"C0\",\"D1\",5,4,7,6],[\"A0\",\"B0\",\"C1\",\"D0\",9,8,11,10],[\"A0\",\"B0\",\"C1\",\"D1\",13,12,15,14],[\"A0\",\"B0\",\"C2\",\"D0\",17,16,19,18]]",
        "indexLevels": 4,
        "columnLevels": 2,
        "totalRows": 5
    };

    it("renders the table with correct headers", () => {
        render(<MitoViewer payload={mockPayload} />);

        expect(screen.getByText("index")).toBeInTheDocument();
        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Age")).toBeInTheDocument();
        expect(screen.getByText("Score")).toBeInTheDocument();

        // Check that we have the right number of dtype elements
        const dtypeElements = screen.getAllByText("int64");
        expect(dtypeElements).toHaveLength(2); // index and Age columns

        expect(screen.getByText("object")).toBeInTheDocument();
        expect(screen.getByText("float64")).toBeInTheDocument();
    });

    it("renders the table data correctly", () => {
        render(<MitoViewer payload={mockPayload} />);

        expect(screen.getByText("0")).toBeInTheDocument();
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("25")).toBeInTheDocument();
        expect(screen.getByText("85.5")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("30")).toBeInTheDocument();
        expect(screen.getByText("92")).toBeInTheDocument();
    });

    it("displays row count information", () => {
        render(<MitoViewer payload={mockPayload} />);

        expect(screen.getByText("Total Rows: 3")).toBeInTheDocument();
    });

    it("shows truncation message when data is truncated", () => {
        const truncatedPayload = {
            ...mockPayload,
            totalRows: 100,
        };

        render(<MitoViewer payload={truncatedPayload} />);

        expect(
            screen.getByText(
                /⚠ Table truncated to first 3 \/ 100 rows\. Set pandas display\.max_rows to configure total rows\./
            )
        ).toBeInTheDocument();
    });

    it("handles empty dataframe", () => {
        const emptyPayload = {
            columns: [],
            data: `[]`,
            totalRows: 0,
            indexLevels: 1,
        };

        render(<MitoViewer payload={emptyPayload} />);

        expect(screen.getByText("Total Rows: 0")).toBeInTheDocument();
    });

    it("filters data based on search term", async () => {
        const user = userEvent.setup();
        render(<MitoViewer payload={mockPayload} />);

        const searchInput = screen.getByPlaceholderText("Search...");
        await user.type(searchInput, "Alice");

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.queryByText("Bob")).not.toBeInTheDocument();
        expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
        // Component shows total rows, not filtered count
        expect(screen.getByText("Total Rows: 3")).toBeInTheDocument();
    });

    it("shows no results message when search has no matches", async () => {
        const user = userEvent.setup();
        render(<MitoViewer payload={mockPayload} />);

        const searchInput = screen.getByPlaceholderText("Search...");
        await user.type(searchInput, "Nonexistent");

        expect(
            screen.getByText("No rows match the search criteria")
        ).toBeInTheDocument();
    });

    it("sorts data when column headers are clicked", async () => {
        const user = userEvent.setup();
        render(<MitoViewer payload={mockPayload} />);

        const nameHeader = screen.getByText("Name");
        await user.click(nameHeader);

        // Check that sort icon appears
        expect(screen.getByText("↑")).toBeInTheDocument();

        // Data should be sorted ascending by name
        const rows = screen.getAllByRole("row");
        expect(rows[1]).toHaveTextContent("Alice");
        expect(rows[2]).toHaveTextContent("Bob");
        expect(rows[3]).toHaveTextContent("Charlie");
    });

    it("cycles through sort directions", async () => {
        const user = userEvent.setup();
        render(<MitoViewer payload={mockPayload} />);

        const nameHeader = screen.getByText("Name");

        // First click - ascending
        await user.click(nameHeader);
        expect(screen.getByText("↑")).toBeInTheDocument();

        // Second click - descending
        await user.click(nameHeader);
        expect(screen.getByText("↓")).toBeInTheDocument();

        // Third click - no sort
        await user.click(nameHeader);
        expect(screen.queryByText("↑")).not.toBeInTheDocument();
        expect(screen.queryByText("↓")).not.toBeInTheDocument();
    });

    it("sorts numeric columns correctly", async () => {
        const user = userEvent.setup();
        render(<MitoViewer payload={mockPayload} />);

        const ageHeader = screen.getByText("Age");
        await user.click(ageHeader);

        // Data should be sorted ascending by age
        const rows = screen.getAllByRole("row");
        expect(rows[1]).toHaveTextContent("Alice"); // Age 25
        expect(rows[2]).toHaveTextContent("Bob"); // Age 30
        expect(rows[3]).toHaveTextContent("Charlie"); // Age 35
    });

    it("applies correct text alignment based on data types", () => {
        render(<MitoViewer payload={mockPayload} />);

        // Check that numeric columns are right-aligned
        const ageCells = screen.getAllByText("25");
        const scoreCells = screen.getAllByText("85.5");
        const nameCells = screen.getAllByText("Bob");

        // These should have right text alignment (we can't easily test this with testing-library)
        // but we can verify the class is set correctly
        expect(ageCells[0]).toHaveClass('mito-viewer__body-cell-numeric');
        expect(ageCells[0]).not.toHaveClass('mito-viewer__body-cell-text');
        expect(scoreCells[0]).toHaveClass('mito-viewer__body-cell-numeric');
        expect(scoreCells[0]).not.toHaveClass('mito-viewer__body-cell-text');
        expect(nameCells[0]).toHaveClass('mito-viewer__body-cell-text');
        expect(nameCells[0]).not.toHaveClass('mito-viewer__body-cell-numeric');
    });

    it("handles rowspan correctly with multi-index data", () => {
        render(<MitoViewer payload={multiIndexPayload} />);

        // Check that multi-index cells are rendered with correct row spans
        // rowspan is on the <th> or <td> element, not the text
        const a0Cell = screen.getByText("A0").closest("th") || screen.getByText("A0").closest("td");
        const b0Cell = screen.getByText("B0").closest("th") || screen.getByText("B0").closest("td");
        const c0Cell = screen.getByText("C0").closest("th") || screen.getByText("C0").closest("td");
        const c1Cell = screen.getByText("C1").closest("th") || screen.getByText("C1").closest("td");
        const c2Cell = screen.getByText("C2").closest("th") || screen.getByText("C2").closest("td");

        expect(a0Cell).toHaveAttribute("rowspan", "5");
        expect(b0Cell).toHaveAttribute("rowspan", "5");
        expect(c0Cell).toHaveAttribute("rowspan", "2");
        expect(c1Cell).toHaveAttribute("rowspan", "2");
        expect(c2Cell).not.toHaveAttribute("rowspan");

        // Check colspan for multi-index column headers
        const aHeader = screen.getByText("a", {exact: true}).closest("th");
        const barHeader = screen.getByTitle("bar (int64)").closest("th");
        const bHeader = screen.getByText("b", {exact: true}).closest("th");

        expect(aHeader).toHaveAttribute("colspan", "2");
        expect(barHeader).not.toHaveAttribute("colspan");
        expect(bHeader).toHaveAttribute("colspan", "2");
    });
});
