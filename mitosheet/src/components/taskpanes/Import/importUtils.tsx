import { fuzzyMatch } from "../../../utils/strings";
import { FileElement, ImportTaskpaneState } from "./ImportTaskpane";


export const getElementsToDisplay = (importState: ImportTaskpaneState): FileElement[] => {
    return importState.pathContents.elements?.filter(element => {
        return fuzzyMatch(element.name, importState.searchString) > .8;
    }).sort((elementOne, elementTwo) => {
        if (importState.sort === 'name_ascending') {
            return elementOne.name < elementTwo.name ? -1 : 1;
        } else if (importState.sort === 'name_descending') {
            return elementOne.name >= elementTwo.name ? -1 : 1;
        } else if (importState.sort === 'last_modified_ascending') {
            return elementOne.lastModified < elementTwo.lastModified ? -1 : 1;
        } else {
            return elementOne.lastModified >= elementTwo.lastModified ? -1 : 1;
        }
    })
}