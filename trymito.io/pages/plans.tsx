import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import titleStyles from '../styles/Title.module.css'
import pageStyles from '../styles/Page.module.css'
import plansStyles from '../styles/Plans.module.css'
import iconAndTextCardStyles from '../styles/IconAndTextCard.module.css'

import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import PlanBullet from '../components/PlanBullet/PlanBullet';
import TranslucentButton from '../components/TranslucentButton/TranslucentButton';
import DropdownItem from '../components/DropdownItem/DropdownItem';
import Dropdown from '../components/Dropdown/Dropdown';
import FAQCard from '../components/FAQCard/FAQCard'
import DownloadCTACard from '../components/CTACards/DownloadCTACard'
import TextButton from '../components/TextButton/TextButton'
import FeatureSection from '../components/FeatureSection/FeatureSection'
import GithubButton from '../components/GithubButton/GithubButton'
import FlagIcon from '../public/icon-squares/FlagIcon.svg'


/* 
  Labels used to scroll to specific location of the page
*/
const PRO_PLAN_ID = "pro-plan"
const PRIVATE_TELEMTRY_FAQ_ID = 'private-telemetry-faq'

export type PlanType = 'Open Source' | 'Pro' | 'Enterprise';
export interface Feature {
  feature: string,
  planSupport: Record<PlanType, string | boolean>
}

const INTEGRATION_FEATURES: Feature[] = [
  {
    feature: 'Jupyter Notebooks',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'CSV, XLSX Import',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Dataframe Import',
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
    feature: 'Formatting Export',
    planSupport: {
      'Open Source': false,
      'Pro': true,
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
]

const PRESENTATION_FEATURES: Feature[] = [
  {
    feature: 'Graph Formatting',
    planSupport: {
      'Open Source': false,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Export Column Formats',
    planSupport: {
      'Open Source': false,
      'Pro': true,
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
    feature: 'ML Prep Transforms',
    planSupport: {
      'Open Source': false,
      'Pro': false,
      'Enterprise': true 
    }
  },
]

const CODE_GENERATION_FEATURES: Feature[] = [
  {
    feature: 'Code Generation',
    planSupport: {
      'Open Source': true,
      'Pro': true,
      'Enterprise': true 
    }
  },
  {
    feature: 'Optimized Generated Code',
    planSupport: {
      'Open Source': false,
      'Pro': true,
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
    feature: 'Turn off Telemetry',
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
// Make Intercom accessible globally
declare global {
  interface Window {
      Intercom: any;
  }
}

const Plans: NextPage = () => {

  const [displayDropdown, setDisplayDropdown] = useState<boolean>(false)
  const [mobilePlanDisplayed, setMobilePlanDisplayed] = useState<PlanType>('Pro')

  useEffect(() => {
    if (window.Intercom) {
      window.Intercom("boot", {
        api_base: "https://api-iam.intercom.io",
        app_id: "mu6azgiv"
      });
    }
  }, [])

  // Update intercom whenever we rerender
  useEffect(() => {
    if (window.Intercom) {
      window.Intercom("update");
    }
  })

  return (
    <>
      <Head>
        <title>Mito | Plans </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>
          <section className={titleStyles.title_card + ' ' + titleStyles.grid_card}>
              <h1 className={titleStyles.title}>
                Plans & Pricing
              </h1>
              <p className={titleStyles.description}>
                Use Mito alone or with your team. Spend less time writing code and more time developing insights.
              </p>
            </section>
            <section className={plansStyles.plan_cards}>
              <div className={plansStyles.plan_card + ' ' + pageStyles.background_card}>
                <h1 className={plansStyles.plan_card_header}>
                  Open Source
                </h1>
                <p className={plansStyles.price_text}>
                  $0
                </p>
                <p className={plansStyles.plan_description}>
                  Perfect for solo data analytics for work or for fun. Includes <a href={'#' + PRIVATE_TELEMTRY_FAQ_ID} className={plansStyles.private_telemtry_link}> private telemetry</a>.
                </p>
                <div className={plansStyles.plan_bullets_container}> 
                  <PlanBullet>
                    <p>
                      Data exploration tools
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Data transformation tools
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Automatic code generation
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Customer support
                    </p>
                  </PlanBullet>
                </div>
                <div className={plansStyles.plan_cta}>
                  <TextButton 
                    text='Get Started'
                    href='https://docs.trymito.io/getting-started/installing-mito'
                  />
                </div>
              </div>

              <div className={plansStyles.plan_card + ' ' + pageStyles.gradient_card} id={PRO_PLAN_ID}>
                <h1 className={plansStyles.plan_card_header}>
                  Pro
                </h1>
                <p className={plansStyles.price_text}>
                  $10 a month
                </p>
                <p className={plansStyles.plan_description}>
                  Mito’s analysis tools, with no telemetry, advanced features, and personal support.
                </p>
                <div className={plansStyles.plan_bullets_container}> 
                  <PlanBullet>
                    <p>
                      All of Open Source: and:
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Turn off private telemetry
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Advanced features
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Dedicated customer support
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
                <h1 className={plansStyles.plan_card_header}>
                  Enterprise
                </h1>
                <p className={plansStyles.price_text}>
                  Contact Us
                </p>
                <p className={plansStyles.plan_description}>
                  Advanced features, support and integrations for teams.
                </p>
                <div className={plansStyles.plan_bullets_container}> 
                  <PlanBullet>
                    <p>
                      The power of Pro, and:
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      ML prep transforms
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Onboarding program
                    </p>
                  </PlanBullet>
                  <PlanBullet>
                    <p>
                      Custom integration
                    </p>
                  </PlanBullet>
                </div>
                
                <div className={plansStyles.plan_cta}>
                  <TextButton 
                    text='Contact Us'
                    href={"mailto:jake@sagacollab.com?cc=aaron@sagacollab.com, nate@sagacollab.com&subject=Mito Enterprise Plan"}
                  />
                </div>
              </div>
            </section>

            <section className={'display-mobile-only'}>
              <div className={pageStyles.subsection + ' flex-row'}>
                <h1 className={plansStyles.features_in_text}>
                  Features in 
                </h1>
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

            <section className={pageStyles.suppress_section_margin_top + ' display-mobile-only'}>
              <FeatureSection
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Integration'
                features={INTEGRATION_FEATURES}
              />
              <FeatureSection
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Exploration'
                features={EXPLORATION_FEATURES}
              />
              <FeatureSection
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Presentation'
                features={PRESENTATION_FEATURES}
              />
              <FeatureSection
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Transformation'
                features={TRANSFORMATION_FEATURES}
              />
              <FeatureSection
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Code Generation'
                features={CODE_GENERATION_FEATURES}
              />
              <FeatureSection
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Privacy'
                features={PRIVACY_FEATURES}
              />
              <FeatureSection
                mobilePlanDisplayed={mobilePlanDisplayed}
                sectionTitle='Support'
                features={SUPPORT_FEATURES}
              />
            </section>
            <section className={pageStyles.suppress_section_margin_top + ' ' + plansStyles.plan_feature_grid_container + ' display-desktop-only-inline-block'}>
              <FeatureSection
                  sectionTitle='Integration'
                  features={INTEGRATION_FEATURES}
              />
              <FeatureSection
                sectionTitle='Exploration'
                features={EXPLORATION_FEATURES}
              />
              <FeatureSection
                sectionTitle='Transformation'
                features={TRANSFORMATION_FEATURES}
              />
              <FeatureSection
                sectionTitle='Presentation'
                features={PRESENTATION_FEATURES}
              />
              <FeatureSection
                sectionTitle='Code Generation'
                features={CODE_GENERATION_FEATURES}
              />
              <FeatureSection
                sectionTitle='Privacy'
                features={PRIVACY_FEATURES}
              />
              <FeatureSection
                sectionTitle='Support'
                features={SUPPORT_FEATURES}
              />
            </section>

            <section id='mito_pro_roadmap'>
                <h1 className={titleStyles.title}>
                    Mito Pro & Enterprise Roadmap
                </h1>
                <p>
                  Coming soon!
                </p>
            </section>
            <section>
                <div className={pageStyles.subsection}>
                    <div className={iconAndTextCardStyles.icon_and_text_card}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Shareable <br/> notebooks
                        </h1>
                        <p>
                          Share notebooks with Mito embedded in them so colleagues can continue the analysis in Mito.  
                        </p>
                    </div>
                    <div className={iconAndTextCardStyles.icon_and_text_card + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                          Advanced <br/> analysis
                        </h1>
                        <p>
                          Go beyond basic data cleaning and analysis features with support for regressions, fuzzy matching and clustering. 
                        </p>
                    </div>
                </div>
                <div className={pageStyles.subsection}>
                    <div className={iconAndTextCardStyles.icon_and_text_card}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                          Custom <br /> transformations
                        </h1>
                        <p>
                          Import custom Python snippets to use within the Mito Spreadsheet. Add completely new transformations directly into the Mitosheet.  
                        </p>
                    </div>
                    <div className={iconAndTextCardStyles.icon_and_text_card + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Graph <br/> styling
                        </h1>
                        <p>
                            Create presentation-ready graphs with full control of colors, ability to save graph templates, and more. 
                        </p>
                    </div>
                </div>
                <div className={pageStyles.subsection}>
                    <div className={iconAndTextCardStyles.icon_and_text_card}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                          Connect to more data sources
                        </h1>
                        <p>
                          Connect to databases so users can import any data set  without having to write custom pandas code.   
                        </p>
                    </div>
                    <div className={iconAndTextCardStyles.icon_and_text_card + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                          Feature <br/> settings
                        </h1>
                        <p>
                          Customize Mito by toggling code optimization, auto-documentation, seleting between light and dark mode, and more. 
                        </p>
                    </div>
                </div>
                <div className={pageStyles.subsection}>
                    <div className={iconAndTextCardStyles.icon_and_text_card}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                          Advanced <br/> formatting
                        </h1>
                        <p>
                          Utilize Excel-like formatting and conditional formatting to make your analysis stand out.
                        </p>
                    </div>
                    <div className={iconAndTextCardStyles.icon_and_text_card + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                          Keyboard <br/> shortcuts
                        </h1>
                        <p>
                          Navigate Mito without ever using your mouse. 🐁 
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
              <h1 className='center'>
                Frequently Asked Questions
              </h1>
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
                    If you want to turn off telemetry entirely, purchase our <a href={'#' + PRO_PLAN_ID} className={pageStyles.link}>Pro Plan →</a>
                  </p>
                </div>
              </FAQCard>
              <FAQCard title='Where is Mito installable?'>
                <div>
                  <p>
                    Mito is installable in Jupyter Lab 2.0, Jupyter Lab 3.0 and Jupyter Notebooks. Mito does not work in VSCode, Google Collab, Streamlit or any other IDE&apos;s. 
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
              <DownloadCTACard />
            </section>              
            
        </main>

        <Footer />
      </div>
    </>
  )
}

export default Plans