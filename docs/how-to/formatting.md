---
description: >-
  This documentation explains how to use Mito's formatting features to change
  the display of a column without effecting the underlying data.
---

# Formatting

![Changing the format of three numeric columns](../.gitbook/assets/ezgif.com-gif-maker\(18\).gif)

Mito lets you change the format of numeric columns. Its important to note that **changing the format of the column only changes the display of the data, not the underlying data.**&#x20;

### Formatting Options

* `Default`: Separate every three numbers with commas. It displays integers with no decimal places (1,234), and floats with one decimal place (1,234.5).
* `Plain Text`: Don't use commas to separate numbers and display all of the decimal places that exist in the raw data (1234.5678).
* `Accounting`: Display numbers using a $ and use parentheses to identify negative numbers. For example, -5000 is displayed as ($5,000.00).
* `0, 1, 2, 3, or 4 decimal places`: Select the number of decimal places to display.&#x20;
* `Percentage`: Display the number as a percentage.&#x20;
* `Using K, M, and B for large numbers`: Make it easier to parse large numbers by using K to represent thousands, M to represent million, and B to represent Billion. For example, 9,000,000,000 will be displayed as 9B.&#x20;
* `Scientific Notation`: Display numbers in scientific notation. For example, 9,000,000,000 will be displayed as 9.00e+9.

### Changing the Formatting of a Column(s)

There are two ways to change the format of a numeric column: by using the format button in the Mito toolbar, or by using the format selector in the column control panel.&#x20;

#### Using the Format Button in the Toolbar

Using the formatting button in the toolbar is simple, just:

1. Select all of the columns you want to update the formatting of (**you can select multiple columns at once by holding down Command on Mac or Control on Windows**).
2. Click on the `Format` button in the toolbar.
3. Select the formatting to apply to the selected columns.

Note: If any of the columns you've selected are not numeric, those columns will not have formatting applied.&#x20;

![Using the format button in the toolbar to change the formatting of 3 numeric columns](<../.gitbook/assets/Screen Shot 2022-01-26 at 1.40.01 PM.png>)

#### Using the Column Control Panel

The other way of changing a column's formatting is to use the column control panel.&#x20;

1. Open the column control panel by double clicking on the type icon in the column header. In this example, the type icon is the `#` sign.&#x20;
2. Use the `Format` select to pick the formatting to apply to the column.&#x20;

![Using the column control panel to change the formatting of one column](<../.gitbook/assets/Screen Shot 2022-01-26 at 1.45.20 PM.png>)
