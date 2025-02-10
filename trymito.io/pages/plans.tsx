import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState } from 'react'
import titleStyles from '../styles/Title.module.css'
import pageStyles from '../styles/Page.module.css'
import plansStyles from '../styles/Plans.module.css'
import iconAndTextCardStyles from '../styles/IconAndTextCard.module.css'

import Header, { MITO_INSTALLATION_DOCS_LINK } from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import PlanBullet from '../components/PlansFeatureGroup/PlanBullet';
import TranslucentButton from '../components/Buttons/TranslucentButton/TranslucentButton';
import DropdownItem from '../components/Dropdown/DropdownItem';
import Dropdown from '../components/Dropdown/Dropdown';
import FAQCard from '../components/FAQCard/FAQCard'
import TextButton from '../components/Buttons/TextButton/TextButton';
import PlansFeatureGroup from '../components/PlansFeatureGroup/PlansFeatureGroup'
import FlagIcon from '../public/icon-squares/FlagIcon.svg'
import ContactCTACard from '../components/CTACards/ContactCTACard'
import { PLAUSIBLE_BOOK_A_DEMO_CTA_PRESSED_PLANS_PAGE, PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_PLANS_OS } from '../utils/plausible'
import { CALENDLY_LINK } from '../components/CTAButtons/CTAButtons'
import GithubButton from '../components/Buttons/GithubButton/GithubButton'


/* 
  Labels used to scroll to specific location of the page
*/
export const PRO_PLAN_ID = "pro-plan"
const PRIVATE_TELEMTRY_FAQ_ID = 'private-telemetry-faq'

export type PlanType = 'Open Source' | 'Pro' | 'Enterprise';
export interface Feature {
  feature: string,
  planSupport: Record<PlanType, string | boolean>
}

const INTEGRATION_FEATURES: Feature[] = [
  {
    feature: 'Mito in Jupyter',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Mito in Streamlit',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Mito in Dash',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'CSV, XLSX, Dataframe Import',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'CSV, XLSX Export',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Remote File Import',
    planSupport: {
      'Open Source': false,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Database Import',
    planSupport: {
      'Open Source': false,
      'Pro': false,
      'Enterprise': true 
    }
  },
  {
    feature: 'Admin Settings',
    planSupport: {
      'Open Source': false,
      'Pro': false,
      'Enterprise': true 
    }
  },
  {
    feature: 'On-Prem AI',
    planSupport: {
      'Open Source': false,
      'Pro': false,
      'Enterprise': true 
    }
  },
]

const EXPLORATION_FEATURES: Feature[] = [
  {
    feature: 'Summary Statistics',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Search Functionality',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Cell Formatting',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Plotly Graph Generation',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: "Bulk Undo Operations",
    planSupport: {
      'Open Source': false,
      'Pro': true,
      'Enterprise': true
    }
  }
]

const PRESENTATION_FEATURES: Feature[] = [
  {
    feature: 'Graph Formatting',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Export Formatting',
    planSupport: {
      'Open Source': false,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Conditional Formatting',
    planSupport: {
      'Open Source': false,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Style Dataframes',
    planSupport: {
      'Open Source': false,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Apply Custom Styling',
    planSupport: {
      'Open Source': false,
      'Pro': false,
      'Enterprise': true 
    }
  },
]

const TRANSFORMATION_FEATURES: Feature[] = [
  {
    feature: 'Pivot Tables',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Filtering and Sorting',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Merge (Lookups)',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Type Handling',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Add/Remove Columns',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Excel-Style Formulas',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Deduplication',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'AI Transformations',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true
    }
  },
  {
    feature: 'Custom Code Snippets',
    planSupport: {
      'Open Source': false,
      'Pro': false,
      'Enterprise': true 
    }
  },
  {
    feature: 'User Defined Functions',
    planSupport: {
      'Open Source': false,
      'Pro': false,
      'Enterprise': true 
    }
  },
]

const PRIVACY_FEATURES: Feature[] = [
  {
    feature: 'Local Extension',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Default No Telemetry',
    planSupport: {
      'Open Source': false,
      'Pro': true,
      'Enterprise': true 
    }
  },
]

const SUPPORT_FEATURES: Feature[] = [
  {
    feature: 'Customer Support',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Success Manager',
    planSupport: {
      'Open Source': false,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Onboarding Program',
    planSupport: {
      'Open Source': false,
      'Pro': false,
      'Enterprise': true 
    }
  },
  {
    feature: 'Custom Features',
    planSupport: {
      'Open Source': false,
      'Pro': false,
      'Enterprise': true 
    }
  },
  {
    feature: 'Custom Integration',
    planSupport: {
      'Open Source': false,
      'Pro': false,
      'Enterprise': true 
    }
  },
]

const Plans: NextPage = () => {

  const [displayDropdown, setDisplayDropdown] = useState<boolean>(false)
  const [mobilePlanDisplayed, setMobilePlanDisplayed] = useState<PlanType>('Pro')

  return (
    <>
      <Head>
        <title>Pricing & Plans | Mito </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content=" Mito makes Python data science easier, with spreadsheet automation, code generation, and AI assistance. Check out plans and pricing for Mito." />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>
          <section className={titleStyles.title_card + ' ' + titleStyles.grid_card}>
              <h1 className={titleStyles.title}>
                Plans & Pricing
              </h1>
              <p className={titleStyles.description}>
                Use Mito alone, with your team, or turn your entire organization into Automators.
              </p>
            </section>
            <section className={plansStyles.plan_cards}>
              <div className={plansStyles.plan_card + ' ' + pageStyles.background_card}>
                <h2 className={plansStyles.plan_card_header}>
                  Open Source
                </h2>
                <p className={plansStyles.price_text}>
                  $0
                </p>
                <p className={plansStyles.plan_description}>
                  For citizen data scientists looking to write Python faster.
                </p>
                <div className={plansStyles.plan_bullets_container}> 
                  <PlanBullet>
                    <p>
                      One month trial with 500 Chats
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Basic Mito Spreadsheet
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Community Support
                    </p>
                  </PlanBullet>
                </div>
                <div className={plansStyles.plan_cta}>
                  <TextButton 
                    text='Install Now'
                    href={MITO_INSTALLATION_DOCS_LINK}
                    className={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_PLANS_OS}
                  />
                </div>
              </div>

              <div className={plansStyles.plan_card + ' ' + pageStyles.gradient_card} id={PRO_PLAN_ID}>
                <h2 className={plansStyles.plan_card_header}>
                  Pro
                </h2>
                <p className={plansStyles.price_text}>
                  $20/user per month
                </p>
                <p className={plansStyles.plan_description}>
                  For practitioners or small teams looking to be effective with Python.
                </p>
                <div className={plansStyles.plan_bullets_container}> 
                  <PlanBullet>
                    <p>
                      Unlimited AI Chat Completions
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Advanced reasoning with o3 models
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Turn off private telemetry
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Advanced Mito Spreadsheet
                    </p>
                  </PlanBullet>
                </div>
                <div className={plansStyles.plan_cta}>
                  <TextButton 
                    text="Get Started"
                    action="https://jl76z192i0.execute-api.us-east-1.amazonaws.com/Prod/create_checkout_session/"
                  />
                </div>
              </div>

              <div className={plansStyles.plan_card + ' ' + pageStyles.background_card}>
                <h2 className={plansStyles.plan_card_header}>
                  Enterprise
                </h2>
                <p className={plansStyles.price_text}>
                  Contact Us
                </p>
                <p className={plansStyles.plan_description}>
                  For teams that want to connect Mito to custom databases, LLMs, and other internal infrastructure.
                </p>
                <div className={plansStyles.plan_bullets_container}> 
                  <PlanBullet>
                    <p>
                      The power of Pro, and:
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Admin controls
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      LLM and Database integrations
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Training programs
                    </p>
                  </PlanBullet>
                </div>
                
                <div className={plansStyles.plan_cta}>
                  <TextButton 
                    text='Book a Demo'
                    href={CALENDLY_LINK}
                    className={PLAUSIBLE_BOOK_A_DEMO_CTA_PRESSED_PLANS_PAGE}
                  />
                </div>
              </div>
            </section>

            <section>
                <h2 className={titleStyles.title}>
                  Mito Spreadsheet Features
                </h2>
            </section>

            <section className={'only-on-mobile'}>
              <div className={pageStyles.subsection + ' flex-row'}>
                <h2 className={plansStyles.features_in_text}>
                  Features in 
                </h2>
                <div className='flex-column'>
                  <TranslucentButton
                    onClick={() => setDisplayDropdown(true)}
                  > 
                    <div>
                      {mobilePlanDisplayed} ▼
                    </div>
                  </TranslucentButton>
                  {displayDropdown && 
                    <Dropdown
                      closeDropdown={() => setDisplayDropdown(false)}
                    >
                      <DropdownItem 
                        title='Open Source'
                        onClick={() => setMobilePlanDisplayed('Open Source')}
                      />
                      <DropdownItem 
                        title='Pro'
                        onClick={() => setMobilePlanDisplayed('Pro')}
                      />
                      <DropdownItem 
                        title='Enterprise'
                        onClick={() => setMobilePlanDisplayed('Enterprise')}
                      />
                    </Dropdown>
                  }
                </div>
              </div>
            </section>

            <section className={pageStyles.suppress_section_margin_top + ' only-on-mobile'}>
              <PlansFeatureGroup
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Integration'
                features={INTEGRATION_FEATURES}
              />
              <PlansFeatureGroup
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Exploration'
                features={EXPLORATION_FEATURES}
              />
              <PlansFeatureGroup
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Presentation'
                features={PRESENTATION_FEATURES}
              />
              <PlansFeatureGroup
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Transformation'
                features={TRANSFORMATION_FEATURES}
              />
              <PlansFeatureGroup
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Privacy'
                features={PRIVACY_FEATURES}
              />
              <PlansFeatureGroup
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Support'
                features={SUPPORT_FEATURES}
              />
            </section>
            <section className={pageStyles.suppress_section_margin_top + ' ' + plansStyles.plan_feature_grid_container + ' only-on-desktop-inline-block'}>
              <PlansFeatureGroup
                  sectionTitle='Integration'
                  features={INTEGRATION_FEATURES}
              />
              <PlansFeatureGroup
                sectionTitle='Exploration'
                features={EXPLORATION_FEATURES}
              />
              <PlansFeatureGroup
                sectionTitle='Transformation'
                features={TRANSFORMATION_FEATURES}
              />
              <PlansFeatureGroup
                sectionTitle='Presentation'
                features={PRESENTATION_FEATURES}
              />
              <PlansFeatureGroup
                sectionTitle='Privacy'
                features={PRIVACY_FEATURES}
              />
              <PlansFeatureGroup
                sectionTitle='Support'
                features={SUPPORT_FEATURES}
              />
            </section>

            <section id='mito_pro_roadmap'>
                <h2 className={titleStyles.title}>
                    Mito Pro & Enterprise Features
                </h2>
            </section>
            <section>
                  <div className={pageStyles.subsection}>
                      <div className={iconAndTextCardStyles.icon_and_text_card}>
                          <div className={iconAndTextCardStyles.icon}>
                              <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                          </div>
                          <h2>
                            Shareable <br/> notebooks
                          </h2>
                          <p>
                            Share notebooks with Mito embedded in them so colleagues can continue the analysis in Mito. (coming soon)
                          </p>
                      </div>
                      <div className={iconAndTextCardStyles.icon_and_text_card + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                          <div className={iconAndTextCardStyles.icon}>
                              <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                          </div>
                          <h2>
                            On-prem <br/> AI
                          </h2>
                          <p>
                            Use a locally deployed large language model to power Mito AI, so you can be sure no data ever leaves your system.
                          </p>
                      </div>
                  </div>
                  <div className={pageStyles.subsection}>
                      <div className={iconAndTextCardStyles.icon_and_text_card}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h2>
                          Advanced <br/> formatting
                        </h2>
                        <p>
                          Utilize Excel-like formatting and conditional formatting to make your analysis stand out.
                        </p>
                    </div>
                    <div className={iconAndTextCardStyles.icon_and_text_card + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h2>
                            Script <br/> scheduling
                        </h2>
                        <p>
                            Schedule scripts to run automatically to fully automate reports (coming soon)
                        </p>
                    </div>
                </div>                
                <div className={pageStyles.subsection}>
                    <div className={iconAndTextCardStyles.icon_and_text_card}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h2>
                          Integrate with <br/> data sources
                        </h2>
                        <p>
                          Connect to databases so users can import any data set without having to write custom pandas code.
                        </p>
                    </div>
                    <div className={iconAndTextCardStyles.icon_and_text_card + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h2>
                          Feature <br/> settings
                        </h2>
                        <p>
                          Customize Mito by toggling on/off onboarding tours, support locations, seleting between light and dark mode, and more.
                        </p>
                    </div>
                </div>
                <div className={pageStyles.subsection}>
                      <div className={iconAndTextCardStyles.icon_and_text_card}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h2>
                          Custom <br /> transformations
                        </h2>
                        <p>
                          Import custom Python snippets to use within the Mito Spreadsheet. Add completely new transformations directly into the Mitosheet.
                        </p>
                    </div>
                    <div className={iconAndTextCardStyles.icon_and_text_card + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h2>
                          Advanced <br/> analysis
                        </h2>
                        <p>
                          Go beyond basic data cleaning and analysis features with support for regressions, fuzzy matching and clustering. (coming soon)
                        </p>
                    </div>
                </div>
            </section>
            <section className='center'>
                <h2>
                  Have a new feature idea? 💡
                </h2>
                <p>
                  Prioritizing your feedback is the best way we can help you speed up your analysis.
                </p>
                <div className='margin-top-3rem'>
                    <GithubButton variant='Issue' text='Open a GitHub issue'/>
                </div>
            </section>
              
            <section >
              <h2 className='center'>
                Frequently Asked Questions
              </h2>
              <FAQCard title='What telemetry do we collect?' id={PRIVATE_TELEMTRY_FAQ_ID}>
                <div>
                  <p>
                    We collect no information about your data. We never get access to the shape, size, color, or any other specific information about your private data, and we never will.
                  </p>
                  <p>
                    To improve the product, we collect telemetry on app usage, allowing us to see when users have clicked buttons, provided feedback, as well as how they interact with the sheet.
                  </p>
                  <p>
                    We also collect telemetry about basic interactions with the mitosheet package, including importing the package and running code generated by the package. As above, we see no private data!
                  </p>
                  <p>
                    You can turn off telemetry by upgrading to our <a href={'#' + PRO_PLAN_ID} className={pageStyles.link}>Pro Plan →</a>
                  </p>
                </div>
              </FAQCard>
              <FAQCard title='Where is Mito installable?'>
                <div>
                  <p>
                    Out of the box, Mito is installable in Jupyter Lab 3.0, Jupyter Notebooks, Streamlit, and Dash. If you want to install Mito in VSCode, Google Collab or a custom app, <a href={"mailto:jake@sagacollab.com?subject=Change Plan"} className={pageStyles.link}>email us</a>. 
                  </p>
                </div>
              </FAQCard>
              <FAQCard title='Can I change my plan?'>
                <div>
                  <p>
                    Yes, you can change your plan at any time by sending an <a href={"mailto:jake@sagacollab.com?subject=Change Plan"} className={pageStyles.link}>email</a>. 
                  </p>
                </div>
              </FAQCard>
            </section>

            <section className={pageStyles.background_card}>
              <ContactCTACard />
            </section>
        </main>

        <Footer />
      </div>
    </>
  )
}

export default Plans