---
description: >-
  This documentation explains how to change the data type of data and formula
  columns using Mito's type casting features.
---

# Type Changes

{% embed url="https://youtu.be/MGzqmJE9lwI" %}

Mito's point and click type changes make it easy to identify the data type of each column in your dataframe, and cast those columns to a different type.

#### Identifying Data Types

For each column in your dataframe, the datatype is displayed in the column header. The icon will help you distinguish between int, floats, strings, booleans, and dates/time deltas.

#### Changing Data Types

There are two ways to change the data type of columns inside Mito.

Firstly, for data columns (any column that was not created by a Mito spreadsheet formula), you can use the **column dtype select dropdown** in the column control panel. Just select the dtype that you want to cast the column series to.

![](<../.gitbook/assets/final mito data type.png>)

For formula columns, you can use the typecasting spreadsheet formulas. To do so, add the VALUE, TEXT BOOL, or DATEVALUE function to your formula to convert your column to a number, string, boolean, or datetime respectively.

For example, to convert the result of an IF statement to a boolean, wrap the if statement in the BOOL function.

```
=BOOL(IF(A > 100, 1, 0))
```

The resulting column will have `true` for each row where A is greater than 100 and `false` for each row where A is less than or equal to 100.
