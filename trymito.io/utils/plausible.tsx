/* 
  In order to measure the effectiveness of the docs CTA, we add a custom css tag to all docs cta buttons 
  which plausible will track as a custom event. See here for more info: https://plausible.io/docs/custom-event-goals

  Note: Each of them __must__ start with `plausible-event-name=`
*/

// Install Mito DOCS CTA
export const PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD = 'plausible-event-name=install_docs_cta_pressed+location_title_card'
export const PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FOOTER_CARD = 'plausible-event-name=install_docs_cta_pressed+location_footer_card'
export const PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_PLANS_OS = 'plausible-event-name=install_docs_cta_pressed+location_plans_os'
export const PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_HEADER = 'plausible-event-name=install_docs_cta_pressed+location_header'
export const PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_EXCEL_TO_PYTHON_GLOSSARY_TOC_CTA = 'plausible-event-name=install_docs_cta_pressed+location_excel_to_python_glossary_toc_cta'
export const PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_EXCEL_TO_PYTHON_GLOSSARY_IN_CONTENT_CTA = 'plausible-event-name=install_docs_cta_pressed+location_excel_to_python_glossary_in_content_cta'
export const PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_BLOG = 'plausible-event-name=install_docs_cta_pressed+location_blog'

// The user copied the code from a code block that contains a Mito exported function, ie: SUM(df['A']) from the glossary page
export const PLAUSIBLE_COPIED_CODE_MITO_EXPORTED_FUNCTION = 'plausible-event-name=copied_code_mito_exported_function'
// The user copied some other code from a code block that does not contain a Mito exported function
export const PLAUSIBLE_COPIED_CODE_NON_MITO_EXPORTED_FUNCTION = 'plausible-event-name=copied_code_non_mito_exported_function'

// The user clicked a book a demo CTA
export const PLAUSIBLE_BOOK_A_DEMO_CTA_PRESSED = 'plausible-event-name=book_a_demo_cta_pressed+location_title_card'