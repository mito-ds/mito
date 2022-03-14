---
description: >-
  This documentation will teach you how to merge datasets together in Mito and
  find the difference between datasets.
---

# Merging/Diffing Datasets

## Merging Data Sets Together

{% embed url="https://youtu.be/_COzJTQ65CY" %}

Mito's merge functionality can be used to combine datasets together horizontally. Merge looks for matches between the key column of the first sheet and the key column of the second sheet. Mito supports all of the most common merges.

* **Left Merge**: Includes all rows from the first sheet and only matching rows from the second sheet. Includes all matches.
* **Right Merge**: Includes all rows from the second sheet and only matching rows from the first sheet. Includes all matches.
* **Inner Merge**: Only includes rows that have matches in both sheets.
* **Outer Merge**: Includes all rows from both sheets, regardless of if there is a match in the other sheet.
* **Lookup Merge**: Left join, but only includes the first match from the second sheet if there are multiple. Just like a Vlookup in Excel.

![](<../.gitbook/assets/final merge.png>)

To merge datasets together, click on the **merge icon** in the Mito toolbar and then configure the merge task pane by:

* Selecting the type of merge that you want to conduct.&#x20;
* Selecting the two Mito sheets that you want to merge together.
* Choosing the Merge Keys to merge the datasets together on.&#x20;
* Using the columns toggles to determine which columns to keep from the previous two sheets.

{% hint style="info" %}
If you want to use multiple columns as the merge key, try creating a new column and using the CONCAT function combine all of the columns into one. Then, select that new column as the merge key!
{% endhint %}

## Finding the Difference Between Datasets

Mito's dataframe difference functionality lets you find unique records across two different datasets.&#x20;

You can access this functionality through the merge taskpane and then selecting either the `unique in left` or `unique in right` merge types.&#x20;

* **Unique in Left:**  Includes each row from the first sheet that doesn't have a match in the second sheet.
* **Unique in Right:** Includes each row from the second sheet that doesn't have a match in the first sheet.&#x20;

Just like the other types of merges, Mito uses the merge key that you select for each sheet to detect matches.&#x20;

{% hint style="info" %}
If you want to identify uniqueness by looking at multiple columns in each dataframe, try creating a new column and using the CONCAT function combine all of the columns into one column. Then, select that new column as the merge key!
{% endhint %}

![](<../.gitbook/assets/Screen Shot 2022-01-26 at 2.09.48 PM.png>)
