/* 
  In order to measure the effectiveness of the docs CTA, we add a custom css tag to all docs cta buttons 
  which plausible will track as a custom event. See here for more info: https://plausible.io/docs/custom-event-goals

  Note: Each of them __must__ start with `plausible-event-name=`
*/

export const PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_HEADER = 'plausible-event-name=install_docs_cta_pressed_location=header'
export const PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_EXCEL_TO_PYTHON_GLOSSARY = 'plausible-event-name=install_docs_cta_pressed_location=excel_to_python_glossary'