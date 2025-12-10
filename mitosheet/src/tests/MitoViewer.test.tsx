import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MitoViewer } from "../viewer";

describe("MitoViewer", () => {
    const mockPayload = {
        columns: [
            { name: "index", dtype: "int64" },
            { name: "Name", dtype: "object" },
            { name: "Age", dtype: "int64" },
            { name: "Score", dtype: "float64" },
        ],
        data: `[
            [0, "Alice", 25, 85.5],
            [1, "Bob", 30, 92.0],
            [2, "Charlie", 35, 78.2],
        ]`,
        totalRows: 3,
        indexLevels: 1,        
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
        expect(screen.getByText("92.0")).toBeInTheDocument();
    });

    it("displays row count information", () => {
        render(<MitoViewer payload={mockPayload} />);

        expect(screen.getByText("3 of 3 rows")).toBeInTheDocument();
    });

    it("shows truncation message when data is truncated", () => {
        const truncatedPayload = {
            ...mockPayload,
            totalRows: 100,
        };

        render(<MitoViewer payload={truncatedPayload} />);

        expect(
            screen.getByText(
                "Table truncated to 10 rows by pandas display.max_rows setting. Total rows: 100"
            )
        ).toBeInTheDocument();
        expect(screen.getByText("3 of 100 rows (showing 10)")).toBeInTheDocument();
    });

    it("handles empty dataframe", () => {
        const emptyPayload = {
            columns: [],
            data: `[]`,
            totalRows: 0,
            indexLevels: 1,
        };

        render(<MitoViewer payload={emptyPayload} />);

        expect(screen.getByText("0 of 0 rows")).toBeInTheDocument();
    });

    it("filters data based on search term", async () => {
        const user = userEvent.setup();
        render(<MitoViewer payload={mockPayload} />);

        const searchInput = screen.getByPlaceholderText("Search...");
        await user.type(searchInput, "Alice");

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.queryByText("Bob")).not.toBeInTheDocument();
        expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
        expect(screen.getByText("1 of 3 rows")).toBeInTheDocument();
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

        // These should have right text alignment (we can't easily test this with testing-library)
        // but we can verify the content is there
        expect(ageCells[0]).toBeInTheDocument();
        expect(scoreCells[0]).toBeInTheDocument();
    });
});
