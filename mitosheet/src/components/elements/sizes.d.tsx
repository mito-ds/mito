/* 
    Different size types for common elements
*/

export type Height = 'small' | 'medium' | 'large' | 'block';
export type Width = 'small' | 'medium' | 'large' |  'block';


// Must match CSS pixel values
export const WIDTH_MAPPING = {
    'small': 100,
    'medium': 170,
    'large': 345
}
