# Spacing Components

In the past, we haven't done a great job with spacing components. There are a few main issues with our approach:
1. It takes a lot of custom code to set up. When you're making a new taskpane, you have all the inputs and selects you need, but you need to wrap them in <div>s that then space them correctly. This takes time and effort and adds complexity to the codebase, when a lot of this code is shared between taskpanes (for example).
2. We don't dynamically resize the sheet. Most of our items are spaced with explicit widths, which means we don't adjust to screen size. In practice, this means that some users see a tiny mitosheet. 

## New Approach

Inspiration: 
1. https://material-ui.com/system/flexbox/ - a flexbox component that you can use to wrap other components. It allows you to keep things out of CSS - and not have to worry about adding new files. All the spacing is visible in TSX code!
2. https://ant.design/components/grid/ - this is similar to flexbox, but instead of a box as the primitive, it does a grid as the primitive. Here's generally how it works:

- Rows are the top level object. Each row has `24` units of space to break up.
- Columns go inside of rows. You can give each Column some number of these units with the `span` prop (e.g. `span={4}`).
- You can give columns offsets so that you can space them from eachother
- You can given the rows spacing like `start` or `end` or some sort of `space-between`.

Generally these are very flexible. See the `PivotTable` for example - we use Rows and Cols similar to the interface above, and it requires _no_ special CSS code. The pivot table is build with just components, with very little configuration!


## Other Option: Common Layouts just for Mito

We could imagine having a component called a `SectionHeader` and a `SectionHeaderWithButton` or something, and this would go in the pivot table and the graphing interface. We'd just design them to be general enough for both. 

I don't think that we should start here; they won't apply that well across different items (e.g. how much is really shared here). They are too specific!

For this reason, we're just currently using the above spacing components!