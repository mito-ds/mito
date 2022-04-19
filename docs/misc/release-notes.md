---
description: Want to see what is new in the Mitosheet? Check it out below.
---

# Release Notes

## 2022-4-19 <a href="#2022-4-19" id="2022-4-19"></a>

New Features:
* More Code optimization for Mito Pro users. When the user deletes a dataframe, Mito now deletes all of the code that was used to create that dataframe, in most cases. 
* The file browser now works with arrow keys! Woo for efficiency.

Bug Fixes:
* Fixes issues with scrollbars overlapping text, making the text hard to read
* Undo and redo now work with filter and sort
* The rename input field now submits on blur and doesn't add navigation keys like pageup and pagedown to the column name.
* Handles 'yes' and 'no' properly in string to bool conversion

## 2022-4-11 <a href="#2022-4-11" id="2022-4-11"></a>

New Features:
* Code optimization for Mito Pro users. Common scripts now will be 1/3 the size of previous scripts, as Mito automatically generates optimized code as you edit. 
* Filter and concatenate operations now display text telling you the result of the operation - how many rows were removed and how many columns were included respectively - making it easier to figure out the effect of these operations.

Bug Fixes:
* Drop duplicates now opens with no column selected, to allow users to opt into changing the data if they are just exploring.

## 2022-4-5 <a href="#2022-4-5" id="2022-4-5"></a>

Bug Fixes:

* Make sheets with massive numbers of columns work with Mito better, by only displaying the first 1500 columns.
* Add a warning to pivot tables letting users know that adding a `column` key with a large number of unique values will cause performance problems.
* Make analysis replaying much more robust by adding an `analysis_to_replay` parameter to the `mitosheet.sheet()` call. This will stop Mito generated code from getting deleted from the sheet, as it did in the past!

## 2022-3-29 <a href="#2022-3-29" id="2022-3-29"></a>

New Features:

* Add concatenate, allowing users to append dataframes vertically. This is our most requested feature!
* Add basic graph styling, allowing users to set graph titles and toggle axes. Mito Pro users can additionally style graph colors.
* Dramatically speed up all Mito operations when the user has multiple large dataframes by copying less data.
* Shrunk the size of the toolbar buttons, to let us give users all the actions they want at their fingertips :-)

Bug Fixes:

* Make Merge and Deduplicate work with Undo and Redo, for better usability.
* Fix a variety of sheet crashing bugs in the graphing taskpane.
* Cleanup and modernize the merge and pivot taskpanes, for ease of development.

## 2022-3-14 <a href="#2022-3-14" id="2022-3-14"></a>

New Features:

* Graphing tabs! Graphs in Mito are now permanent and act like tabs. This allows you to have multiple graphs going at once, and makes it dramatically easier to explore and present your data.
* Format data in the Unique Values and Summary Statistics tab of the column control panel with whatever formatting is applied to the column.

Bug fixes:

* Both undo and redo work with pivot and graphing. No longer will redoing edits lead to parameters getting out of date with the sheet.
* Don't overwrite written code if the user is replaying an analysis that they do not have on their local machine.

## 2022-3-10 <a href="#2022-3-10" id="2022-3-10"></a>

New Features:

* New graph types: Line, Violin, Strip, Density Heatmap, Density Contour, ECDF
* Move graphs to a step performer in order to make them work with Undo, Redo, and Clear.
* New Filter conditions: `Starts With` and `Ends With.`

Bug fixes:

* Fix bug where Mito didn't generate code if there was not a code cell below the Mito spreadsheet.
* Improved error messages when a user attempts to install Mito in VSCode or Google Collab
* Better logging for when race conditions prevent Mito from reading in the name of the passed dataframe arugments correctly.

## 2022-2-28 <a href="#2022-2-28" id="2022-2-28"></a>

New Features:

* Add better filtering to our graphing tab - allow users to opt into seeing the whole dataset.
* Logging improvements to know where we should invest development time going forward.

Bug fixes:

* Fix bug where any filter applied to a column with strings and numbers failed.
* Cleanup saved analysis visibly private in the generated code when logging turned off.

## 2022-2-22 <a href="#2022-2-22" id="2022-2-22"></a>

Major dependency changes:

* The `mitosheet` package now supports JupyterLab 3.0. We will continue to maintain the `mitosheet3` package. The `mitosheet2` package now supports JupyterLab 2.0.
* The `mitosheet` package is now dramatically more flexible in supporting older versions of Pandas.

New Features:

* Add new icons for all types, so they are totally clear.
* Add INT and FLOAT functions, for explicit casting.

Bug Fixes:

* Fixes various bugs causing the sheet to totally brick itself in rare cases.
* Make autofocus on Mito inputs work again

## 2022-2-9 <a href="#2022-2-9" id="2022-2-9"></a>

Bug Fixes:

* Add a basic error boundary to stop rare, sheet crashing bugs from breaking your tab.
* Remove API loading column dtypes. Instead access dtypes directly, resulting in less laggy taskpanes.
* Better types across the codebase, fix up of all type errors, for better continued type support.
* Internal refactor of taskpane logic, to cleanup code.

## 2022-1-30 <a href="#0.1.360-and-0.3.147-2021-1-11" id="0.1.360-and-0.3.147-2021-1-11"></a>

New Features

* Export Excel files with the formatting you applied in Mito. This marks the first real Pro-only feature. To see more information about our plans, see our plans page [here](https://www.trymito.io/plans).

## 2022-1-26 <a href="#0.1.360-and-0.3.147-2021-1-11" id="0.1.360-and-0.3.147-2021-1-11"></a>

New Features

* Added Formatting. You can now change the format of your columns through a dropdown in the toolbar, or through the column control panel. Display a column as a percentage, control the number of decimals, and more.
* Improved date handling through date functions, including SECONDS, MINUTES, HOURS, as well as ENDOFMONTH, STARTOFMONTH, ENDOFBUSINESSMONTH, STARTOFBUSINESSMONTH, and STRIPTIMETOMINUTES, STRIPTIMETOHOURS, etc. See our [formula reference](../how-to/interacting-with-your-data/mito-spreadsheet-formulas.md) for more detail.
* Unique Merge. The `unique in left` and `unique in right` merge types find only the values that are not contained in the other sheet.

Bug Fixes

* File import improvements. Mito now handles a wider range of file encodings.

## 2021-1-13 <a href="#0.1.360-and-0.3.147-2021-1-11" id="0.1.360-and-0.3.147-2021-1-11"></a>

* Turn off the signup for Pro users, since we don't collect any data from Pro.

## 2021-20-12 <a href="#0.1.360-and-0.3.147-2021-1-11" id="0.1.360-and-0.3.147-2021-1-11"></a>

Removed Features

* Removed search functionality for now. We're working on improved searching functionality that does not slow down the sheet.
* Added a flow to signup for removing telemetry from the app and signing up for Mito Pro.

Bug Fixes:

* Massive overhaul to app performance. Mitosheet is now 2x faster in most cases, and feels much snappier overall!

## 2021-13-12 <a href="#0.1.360-and-0.3.147-2021-1-11" id="0.1.360-and-0.3.147-2021-1-11"></a>

New Features

* Add the **Action Search Bar:**
  * Allows you to search for any functionality that Mito offers, dramatically improving how easy it is for users to learn Mito.
  * Removes the search bar at the bottom of the sheet, and combines it with the action search bar.

Bug Fixes:

* Remove OFFSET function, which didn't work well with non-standard indexes.
* Removes the Save and Replay Analysis buttons, which are deprecated due to lack of usage + better ways of accomplishing the same functionality.
* Fix minor bugs in transpiled code found by fuzz testing.
* Reset search bar in input

## 0.1.364 & 0.3.151 - 2021-24-11 <a href="#0.1.360-and-0.3.147-2021-1-11" id="0.1.360-and-0.3.147-2021-1-11"></a>

New Features

* **Drop Duplicates.** We've added a drop duplicates button in the toolbar that lets you configure which columns to use as the key for deduplication.
* **Excel File Export.** You can now export your dataframes as .csv or .xlsx files.
* Start the process of deprecating the in-app save and replay analysis buttons.
* We've dramatically reduced the amount of code that we generate for filter steps.

Bug Fixes

* **Generated Code Robustness.** We've done a bit of work behind the scenes to reduce the occurrences of the generated code getting overwritten or deduplicated.

## 0.1.363 & 0.3.150 - 2021-15-11 <a href="#0.1.360-and-0.3.147-2021-1-11" id="0.1.360-and-0.3.147-2021-1-11"></a>

New Features

* **Search in sheet.** You can now use the bottom search bar to search through all data in your Mito sheet.
* **Load Entire Dataframe.** When using Mito on larger datasets, it will now load the data as you look at it. **Please reach out with any issues.**

Bug Fixes

* Fix minor bug in display entire dataframe button
* Fix bug when deleting columns and changing dtypes

## 0.1.360 & 0.3.147 - 2021-1-11

### New Features

* **Import XLSX files.** Mito now allows you to import XLSX files, and provides configuration options, like selecting specific sheets, skipping rows, and adding column headers.
* Bulk delete columns by selecting multiple columns using `shift` or `cmd` and pressing `delete`.

### Bug Fixes

* Close the cell editor if it is open when you switch sheets.
* Display if you are editing a specific cell or a column.
* Fix display in non-standard indexes.

## 0.1.359 & 0.3.146 - 2021-20-10

### New Features

* Save the widths of the columns as you switch between the sheets.
* In-place column editing: you can now edit column headers in place without having to enter the column control panel, making it much easier to rename columns.
* Added search to the merge modal, making it easier to manage merge with mulitple columns
* Adds in-place the documentation when writing formulas. The editor now gives information about the formula you're writing as you're writing it.

## 0.1.356 & 0.3.143 - 2021-12-10

### New Features

* Added Mito's new incredibly quick grid: **Endo**
  * **Handle datasets with 100s of columns with no lag. Mito is now the best spreadsheet for Big Data!**
  * Write formulas using the arrow keys, as you do in Excel and Google Sheets
  * Get in-context feedback on the formulas you're editing, errors during merge, and other common errors
* Allowed arrow key navigation in the dropdowns.

## 0.1.355 & 0.3.142 - 2021-03-10

### New Features

* Made selecting in dropdowns easier by adding searching functionality.

### Bug Fixes

* Fixed a bug where renaming a column and then changing it's dtype would error.
* Fix bug when you rename to an empty dataframe name, it errored instead of correct it to something valid as we wanted
* Make export display a better error message if there is no imported data

## 0.1.352 & 0.3.139 - 2021-26-09

### New Features

* Added a **Open in Mito** button to make it easier to get existing dataframes into Mito inside your Jupyter Lab notebook.
  * You can turn this button off by running the command `python -m mitosheet turnoffdataframebutton`

### Bug Fixes

* Fix a bug with deleting dataframes causing issues later in the analysis.
* Fixed a bug where the unique values exploded if you had too much data.
* Fixed minor bugs in the installer.

## 0.1.341 & 0.3.131 - 2021-08-09

### New Features

* **Edit your data directly.** Mito now allows you to edit any data in the raw dataset that you import to Mito. Just double click on the cell and edit the value that appears. Intelligent type handling will make sure your edits make sense in the context of your data.
* **Filter unique values.** By clicking on any column header, and then clicking on the **Values** tab, you can now see, search, and sort a list of all the unique values in a specific column. Toggle the values to filter them out easily!
* Support for parsing number representations like Mil, Bil, etc.

#### Bug Fixes

* **No column header changes**. Mito now supports all common string and number columns, which means it plays much better with your other Python scripts. No need to figure out how Mito has changed your column headers!
* Fix minor bugs in passing strings to the mitosheet.sheet function directly, where seperators were not correctly detected.

## 0.1.339 & 0.3.128 - 2021-22-08

### New Features

* **Export Graph Code.** You can now quickly create graphs in Mito and copy + paste the generated code. This gives you the flexibility to fully customize your graphs using Plotly.
* Mito now saves the last graph that you generated for each sheet, making it easy to look at the graph, edit your data, and then reexamine the graph without having to create it from scratch.
* We now support more date formats!

#### Bug Fixes

* The Summary Statistics Graphs now display NaN values, making it easier to identify lossy data.

## 0.1.322 & 0.3.112 - 2021-30-07

### New Features

* **New Types of Merges.** Added different types of merges to the merge modal. Users can do a `left`, `right`, `inner`, `outter`, and `lookup` style joins!
* Added a redo button and a reset analysis button to make it easier to do exploratory data anlaysis with the tool.
* Various improvements to the pivot taskpane to make it more dynamic.
* Create new sheet button added to the footer of Mito.

#### Bug Fixes

* Moves the save analysis and download dataframe modals to taskpanes.
* Continues to update the remaining old-Mito-styled components to the new style.

## 0.1.322 & 0.3.112 - 2021-30-07

### New Features

* **New and Improved Mito.** Mito is now dramatically prettier and easier to use. We've taken the past few weeks to standardize and improve our spacing, colors, text, and interactive elements throughout the tool. The initial feedback is very positive: Mito is much more pleasant to look at, and to use! Try out the new redesign today by updating.

![New and Improved Mito - looking pretty!](<../.gitbook/assets/Screen Shot 2021-07-30 at 11.57.30 AM.png>)

* **Pivot table editing**. Switching to a pivot table that has already been created will allow you to edit the existing configuration of that pivot table. This makes data slicing dramatically more dynamic - and makes your analyses go that much faster!

## 0.1.301 & 0.3.91 - 2021-04-07

### New Features

* Security improvements that give users more control over logging.
* In-app feedback improvements. Ask users a larger variety of questions over multiple usages.
* Text Button implementation to standardize all buttons across Mito.

## 0.1.297 & 0.3.87 - 2021-28-06

### New Features

* Automatic parenthesis closing for formula. Mito has your back! If you forget to add closing parenthesises to your formula, Mito will add them for you.
* Automatically open the import sidebar when Mito has no data.
* Let users double click on a file inside the import file browser to import a file.

### Bug Fixes

* Don't display hidden folders on Windows in the file explorer.

## 0.1.292 & 0.3.82 - 2021-25-06

### New Features

* **Import File Browser.** The Mito import sidebar is now easier to use than ever. You can navigate through your file system to import files.
* The `EXP` sheet function is now available. It calculates raising `e` to the power of the passed series.
* Mito can now be imported using any name. Mito no longer requires the import statement to read `import mitosheet`. For example, you can now use `import mitosheet as ms`.

### Bug Fixes

* The in-app feedback prompt displays less frequently.
* The FILLNAN function performs faster.

## 0.1.274 & 0.3.64 - 2021-13-06

### New Features

* **Auto-documenting code.** The Mito generated code is dramatically cleaner and more informative. Each section of generated code is commented to make it easier for you to understand and communicate exactly how your code edits your data.
* **Graphing v2.1.** Better automatic zoom on graphs, as well as more natural defaults for bar chart graphs.
* Improve in-app feedback mechanisms to be less annoying and more helpful.
* Improve upgrade prompt to include instructions on how to upgrade.

### Bug Fixes

* Fixes a bug in the display of the column summary stats graph that made it to big.

## 0.1.269 & 0.3.59 - 2021-02-06

### New Features

* **In-place type editing v2.** Better handling of date formats, better display of icons, and better display of floating point values.
* **Graphing v2.0.** Allows you to toggle graph types and add mulitple columns to each graph for more advanced analysis.
* **Boolean filtering.** Now, you can filter columns with boolean values in them to True or False :)

### Bug Fixes

* Fixes a small bug causing bad behavior when viewing steps for certain step types.
* Fixes a bug in the display of the sorting buttons.
* Fixes a bug in the FILLNAN function where it would fill the referenced column in some cases.

## 0.1.252 & 0.3.42 - 2021-02-06

### New Features

* **In place type editing.** Using the control panel, users can change the type of their data columns.
* The type of each series is displayed in the column header.
* Adds "is not exactly" filter condition for string columns.

### Bug Fixes

* Fixes bug with displaying the datetimes in the sheet.

## 0.1.234 & 0.3.34 - 2021-20-05

### New Features

* **Mito graphing v2 is out.** Using the Graphing Sidebar, users can create scatter plots to visualize the relationship between two columns in their dataest, and use the interactive graph to dig down into their data.
* Adds "is not exactly" filter condition for string columns.

### Bug Fixes

* **Filter speedup.** Filtering large datasets is now dramatically faster in all analyses, and will no longer slow down the sheet.
* Remove the confirmation modal that popup when you deleted columns.

## 0.1.229 & 0.3.19 - 2021-17-05

### New Features

* **Mito now supports graphing relationships between columns.** Through the Graphing Sidebar, users can create scatter plots to visualize the relationship between two columns in their dataest.

## 0.1.226 - 0.3.16 - 2021-14-05

### New Features

* **Mito is now available for JupyterLab 3.0.** To use Mito for JupyterLab 3.0, follow the install instructions in the documentation. **We will continue to support Mito for JupyterLab 2.0.**
  * NOTE: if you want to upgrade from JupyterLab 2.0, you can find upgrade [instructions here.](../how-to/upgrading-mito.md#upgrading-to-mitosheet-on-jupyterlab-3-0)

### Bug Fixes

* Better errors when you import a directory instead of a file.
* Redirect to upgrade correctly when the upgrade popup appears.
* Adds a small delay to filter messages so that tons of filter messages don't queue while the user is typing, resulting in much faster filtering in most cases.
* Fix a minor bug with column renames occuring to the original dataframes.

## 0.1.215 - 2021-19-04

### New Features

* Adds a variety of more tours to the tool, which allows users to get a better understanding of the actions they want to perform.
* Adds in-app feedback, which is accessible through the documentation, and will help you better communicate how you want to improve the tool!

### Bug Fixes

* Suppress the JupyterLab context menu within Mito, to avoid confusing users with confusing messages.
* Remove invalid licensing.

## 0.1.201 - 2021-19-04

### New Features

* Dramatically improve signup flow and privacy communication.
* Add working version of the first tour of the tool, showing you how to pivot. More coming soon!

## 0.1.190 - 2021-13-04

### New Features

* Import data by passing a file path to mitosheet.sheet() or through the import taskpane.
* Instructions on how to import data when Mito contains no data.
* Make the cell editor larger.
* Privacy improvements.

### Bug Fixes

* Stop merge from operating with less than two sheets.

## 0.1.176 - 2021-31-03

### New Features

* Import overhaul! Importing is now live updating, and presents better error messages in the case that you do not have CSV files in the correct location.

### Bug Fixes

* Fixed formatting bugs with the fullscreen label.

## 0.1.170-173 - 2021-30-03

### New Features

* The column suggestions displayed while writing a formula is now case insensitive, making it easier to find your columns when you have lots!
* The formula bar lets the user copy and paste the formula, which is particularly helpful for copying and pasting values into your Python scripts.

### Bug Fixes

* The formula bar better supports large inputs. It no longer wraps the text, and instead lets you scroll to see your formulas.

## 0.1.169 - 2021-30-03

### New Features

* Added sheet functions KURT, STDEV, VAR and SKEW. Use them to calculate common statistical properties in your mitosheet formulas.

### Bug Fixes

* When writing formulas in the sheet, column suggestions are now case insensitive.

## 0.1.167 - 2021-29-03

### New Features

* Added support for date deltas. You can now subtract two datetime column and see the result in the Mito frontend!

## 0.1.158-165 - 2021-26-03

### New Features

* You can now keep the column summary statistics tab open while navigating through your data. This should make data exploration easier!
* Added labels to the Mito toolbar buttons, so its easier to discover Mito's functionality.

### Bug Fixes

* Fix bugs with inserting multiple columns before setting formulas.
* Fix bugs with changing the selected column during formula editing.

## 0.1.156-157 - 2021-18-03

**Note, do not install this release as it contains bugs in formula editing.**

### New Features

* Added internationalization. _Mito now supports all languages!_
* Added the POWER function.
* Minor generated code optimizations.

### Bug Fixes

* Mito now correctly refreshes cells after certain types of formula changes.

## 0.1.152-153 - 2021-18-03

### New Features

* **Adding a new column now adds the column directly to the right of the selected column.**
* Added the median and sum to the column summary statistics.

## 0.1.150-151 - 2021-16-03

### New Features

* The selected column is now highlighted!
* The column header cell can be used to select a column.
* Added support for Big5 Chinese character encoding.

### Bug Fixes

* Deleting a column will now select the column in its place.
* Switching sheets now correctly updates the selected column.

## 0.1.141-142 - 2021-27-02

### New Features

* Major improvements to replaying an analysis! Click the replay analysis button to see that your analyses have moved to the taskpane, where you can:
  * See a list of all your saved analyses
  * Click an analysis to see the list of steps it contains
  * Rename your analyses
  * Delete analyses you no longer need

## 0.1.139-140 - 2021-26-02

### Bug Fixes

* Fix major bug where multiple filters being applied and edited could delete portions of your analysis. **We highly recommend updating to fix this bug**.

## 0.1.133-138 - 2021-22-02

### New Features

* Adds the MIN and MAX function. They, unsurprisingly, take the minimum and maximum of the inputs.

### Bug Fixes

* Dramatically reduces the memory required for most common operations in Mito.
* Stopped clicking on a different row from generating an OFFSET function, as it is most likely backwards compatible behavior.
* Fixed a bug where the Mitosheet crashes when your deleting certain tabs.

## 0.1.132 - 2021-19-02

### New Features

* Step rewinding! Open the Step History list in the upper right of the toolbar, and then click on a specific step to see the sheet at that step. This allows you to more easily audit what edits you have made to your data.

### Bug Fixes

* Dramatically reduce memory required to interact with large datasets in Mito, fixing some MemoryErrors experienced by users.

## 0.1.130 - 2021-18-02

### New Features

* Added a basic Step History, allowing you to see all historical steps you've taken in your analysis.
* Added the CORR function, allowing you to compute the correlation between two columns

## 0.1.129 - 2021-15-02

### New Features

* Graph downloading! After opening the column control panel and navigating the summary stats tab, you can click on the download icon to download a graph.

### Bug Fixes

* Fixed graph labels getting cut off when they got too long.

## 0.1.127 - 2021-12-02

### New Features

* Added filter groups! Using filter groups, you can nest sets of filter conditions together, which allows you to more easily express complex filtering criteria.

## 0.1.125 - 2021-11-02

### New Features

* Added support for the Russian alphabet
* Display column dtype in the column control panel
* Allow users to select mulitple rows at once

### Bug Fixes

* Throw a better error message if a user tries to pass a filename to a mitosheet.sheet call

## 0.1.124 - 2021-8-01

### New Features

#### Graphing V1

Visualize your data by using graphs in Mito!

* To visualize a distribution of your data, click the **Filter** icon in the column header, and then in the column control panel that opens, navigate to the **Summary Stats** tab. **A graph that displays a distribution of your data will be displayed.**
* Scrolling down in this tab will show you summary statistics for your column, allowing you to understand the distribution further.
* As this is an early feature, graphing currently is limited in size and scope. If you're trying to visualize bigger datasets or use create graphs for presentation - shoot us a message! We'd be happy to help you get going.

## 0.1.121 - 2021-2-01

### New Features

* Added signup and demo booking for local installation.
* Added upgrade reminders to local installation.

### Bug Fixes

* Fixed download so that the entire sheet is now downloaded when there are >2k rows.
* Fixed a minor bug in column renaming that make it impossible to use your mouse to select the column header.

##
