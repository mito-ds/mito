---
description: >-
  This documentation will teach you how to deduplicate repeated entries from
  your dataframe.
---

# Deduplicate

![Using deduplicate to find the highest scoring NBA player on each team](../.gitbook/assets/ezgif.com-gif-maker\(21\).gif)

Mito's deduplication feature is a sneakily powerful tool for removing unwanted data. Let's look at how it works, and then look at an example of why its so powerful.&#x20;

To use the deduplicate feature:

1. Click on the `dedupe` button in the Mito toolbar
2. Select which record of the duplicated data you want to keep: `first`, `last` or `none`
3. Configure which columns to use for looking for duplicated data. **Two rows are considered duplicates of eachother if they have the same value in all of the columns that you select in the Columns to Deduplicate On section.**

![](<../.gitbook/assets/Screen Shot 2022-02-15 at 11.15.39 AM.png>)

## Example: Using deduplicate and sort together

Deduplicate becomes really powerful when we combine it with [sorting](sort-data.md). In this example, we will use sorting and deduplicating to find the highest scoring NBA player on each team.&#x20;

The dataset that we're looking at has 3 columns:&#x20;

* Player -- the name of the player&#x20;
* Tm -- the team the player is on&#x20;
* PTS - the average number of points the player has scored in the 2021-2022 NBA basketball season

Our strategy for figuring out the highest scoring player on each team is to sort the data in ascending order of points scored, and then use the dedupe feature to keep only one player from each team, making sure that we keep the last entry of each duplicated row.&#x20;

#### Sorting the data

The first step is to sort the PTS column in ascending order. To do so, double click on the filter icon in the PTS column header and click the `ascending` sort button in the taskpane.

Sorting the data is a crucial part of this analysis because it ensures that the highest scoring player of each team will be further down in the dataset than any other player on their team.&#x20;

![Sort the data in ascending order](<../.gitbook/assets/Screen Shot 2022-02-15 at 11.29.32 AM.png>)

#### Select the columns used for finding duplicated values

Since we're trying to find the highest scoring player on each team, our answer should only have one player on each team. So we're going to use the toggles to only look for duplicated values in the Tm column.

![Configure which columns to deduplicate on](<../.gitbook/assets/Screen Shot 2022-02-15 at 11.35.45 AM.png>)

#### Keep the last instance of duplicated data

Let's bring it all together. So far, we've sorted our data in ascending order so that the highest scoring player on each team is at the bottom, and we've told Mito to only look for duplicates in the Tm column. So all that is left to do is tell Mito that when you find duplicates in the Tm column, keep the last instance of the duplicated row.&#x20;

Since the highest scoring player is always going to be lower down in the data set than any other player on his team, this removal technique will always leave us with the highest scoring player on each team.&#x20;

![Configure which duplicated entries to keep](<../.gitbook/assets/Screen Shot 2022-02-15 at 11.34.12 AM.png>)

#### Checkout the results!

A quick sanity check tells us that our analysis is correct!&#x20;

![The highest scoring player on each NBA team](<../.gitbook/assets/Screen Shot 2022-02-15 at 11.45.37 AM.png>)



