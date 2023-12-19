This folder contains .json file that are used to populate the Excel to Python glossary. Any file that ends in .json inside of this folder will be automatically 
converted into a page in the glossary. 

## How to use:
1. Create a .json file inside of this folder
2. Populate it according to the type described in types.tsx


# TODO:
1. For pages like HLOOKUP, where we introduce HLOOKUP and then have another example that is case insensitive, it would be awesome to highlight the differences between the two. I think there is support for highlighting lines in Prism. 
2. On Mobile, we need to fix the pages that have long code blocks. The code blocks are too wide and the text is too small.
3. Add the nav bar on the left
4. It would be amazing to have a command+K search that makes it really easy to navigate the glossary!
5. For formulas that exist in Mito, it would be cool to add a section that shows how to do it in Mito.