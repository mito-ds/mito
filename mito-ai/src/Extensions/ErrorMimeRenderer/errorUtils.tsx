/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { stripAnsiCodes } from '../../utils/strings';

/* 
Get the error string from the model. 
    
For example, if this is the error message: 

    Cell In[3], line 3
      1 import pandas as pd
      2 df = pd.DataFrame({'A': ['1/2/24', '2/2/24', '3/2/24'], 'B': [4, 5, 6]})
----> 3 df['Year'] = df['A'].dt.year

    AttributeError: Can only use .dt accessor with datetimelike values

This function will return:

    AttributeError: Can only use .dt accessor with datetimelike values
*/
export const getConciseErrorMessage = (model: IRenderMime.IMimeModel): string => {
    const error = model.data['application/vnd.jupyter.error']
    if (error && typeof error === 'object' && 'ename' in error && 'evalue' in error) {
        return `${error.ename}: ${error.evalue}`
    }
    return ''
}

/* 
Gets all of the error message parts that contain code in the Jupyter Notebook.

For example, if this is the error message: 

---------------------------------------------------------------------------
AttributeError                            Traceback (most recent call last)
Cell In[3], line 3
      1 import pandas as pd
      2 df = pd.DataFrame({'A': ['1/2/24', '2/2/24', '3/2/24'], 'B': [4, 5, 6]})
----> 3 df['Year'] = df['A'].dt.year

File ~/Mito/mito/mito-ai/venv/lib/python3.11/site-packages/pandas/core/generic.py:6299, in NDFrame.__getattr__(self, name)
   6292 if (
   6293     name not in self._internal_names_set
   6294     and name not in self._metadata
   6295     and name not in self._accessors
   6296     and self._info_axis._can_hold_identifiers_and_holds_name(name)
   6297 ):
   6298     return self[name]
-> 6299 return object.__getattribute__(self, name)

File ~/Mito/mito/mito-ai/venv/lib/python3.11/site-packages/pandas/core/accessor.py:224, in CachedAccessor.__get__(self, obj, cls)
    221 if obj is None:
    222     # we're accessing the attribute of the class, i.e., Dataset.geo
    223     return self._accessor
--> 224 accessor_obj = self._accessor(obj)
    225 # Replace the property with the accessor object. Inspired by:
    226 # https://www.pydanny.com/cached-property.html
    227 # We need to use object.__setattr__ because we overwrite __setattr__ on
    228 # NDFrame
    229 object.__setattr__(obj, self._name, accessor_obj)

File ~/Mito/mito/mito-ai/venv/lib/python3.11/site-packages/pandas/core/indexes/accessors.py:643, in CombinedDatetimelikeProperties.__new__(cls, data)
    640 elif isinstance(data.dtype, PeriodDtype):
    641     return PeriodProperties(data, orig)
--> 643 raise AttributeError("Can only use .dt accessor with datetimelike values")

AttributeError: Can only use .dt accessor with datetimelike values


This function will only return:

Cell In[3], line 3
      1 import pandas as pd
      2 df = pd.DataFrame({'A': ['1/2/24', '2/2/24', '3/2/24'], 'B': [4, 5, 6]})
----> 3 df['Year'] = df['A'].dt.year

AttributeError: Can only use .dt accessor with datetimelike values

*/

export const getFullErrorMessageFromModel = (model: IRenderMime.IMimeModel): string => {
    const error = model.data['application/vnd.jupyter.error'] as {traceback: string[]}
    return getFullErrorMessageFromTraceback(error['traceback'])
}


export const getFullErrorMessageFromTraceback = (tracebackArray: string[]): string => {

    try {
        // Strip ANSI codes from each line
        const cleanedArray = tracebackArray.map(line => stripAnsiCodes(line));
        
        const filteredLines: string[] = [];
        
        for (const line of cleanedArray) {
            
            // Start capturing when we see a Cell block or its the last line
            if (line.trim().startsWith('Cell In[') || line === cleanedArray[cleanedArray.length - 1]) {
                // Split on any type of line ending (\r\n, \r, \n, ↵)
                const newLines = line.split(/\r\n|\r|\n|↵/);
                filteredLines.push(...newLines);

                // Add a new line to separate the sections
                filteredLines.push('\n');
                continue;
            }
        }

        const fullErrorMessage = filteredLines.join('\n');

        return fullErrorMessage;
    } catch (error) {
        // If something goes wrong parsing the error, just return the concise error message
        console.error('Error processing traceback:', error);
        return tracebackArray[tracebackArray.length - 1] ?? '';
    }
}