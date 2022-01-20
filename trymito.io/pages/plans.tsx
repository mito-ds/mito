import type { NextPage } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import titleStyles from '../styles/Title.module.css'
import pageStyles from '../styles/Page.module.css'
import plansStyles from '../styles/Plans.module.css'

import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import PlanBullet from '../components/PlanBullet/PlanBullet';
import TranslucentButton from '../components/TranslucentButton/TranslucentButton';
import DropdownItem from '../components/DropdownItem/DropdownItem';
import Dropdown from '../components/Dropdown/Dropdown';
import FeatureRow from '../components/FeatureRow/FeatureRow'
import FAQCard from '../components/FAQCard/FAQCard'
import CTACard from '../components/CTACard/CTACard'
import TextButton from '../components/TextButton/TextButton'

/* 
  Label used to identify the Pro plan from the faq, so we can scroll to it.
*/
const PRO_PLAN_ID = "PRO_PLAN"

type PlanType = 'Starter' | 'Pro' | 'Enterprise'
interface PlanFeatures {
  'Integration': Record<PlanType, string>,
  'JupyterLab 2 & 3': Record<PlanType, boolean>,
  'CSV, XLSX Import': Record<PlanType, boolean>,
  'Dataframe Import': Record<PlanType, boolean>,
  'Exploration': Record<PlanType, string>,
  'Plotly Graph Generation': Record<PlanType, boolean>,
  'Summary Statistics': Record<PlanType, boolean>,
  'Search Functionality': Record<PlanType, boolean>,
  'Transformation': Record<PlanType, string>,
  'Pivot Tables': Record<PlanType, boolean>,
  'Filtering and Sorting': Record<PlanType, boolean>,
  'Merge (Lookups)': Record<PlanType, boolean>,
  'Type Handling': Record<PlanType, boolean>,
  'Add/Remove Columns': Record<PlanType, boolean>,
  'Excel-Style Formulas': Record<PlanType, boolean>,
  'Deduplication': Record<PlanType, boolean>,
  'Privacy': Record<PlanType, string>,
  'Local Extension': Record<PlanType, boolean>,
  'Turn off telemetry': Record<PlanType, boolean>,
  'Support': Record<PlanType, string>,
  'Customer support': Record<PlanType, boolean>,
  'Success Manager': Record<PlanType, boolean>,
  'Onboarding Program': Record<PlanType, boolean>,
  'Custom Features': Record<PlanType, boolean>,
  'Custom Integration': Record<PlanType, boolean>,
}

const planFeatures: PlanFeatures = {
  'Integration': {
    'Starter': 'Starter',
    'Pro': 'Pro',
    'Enterprise': 'Enterprise' 
  },
  'JupyterLab 2 & 3': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'CSV, XLSX Import': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Dataframe Import': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Exploration': {
    'Starter': 'Starter',
    'Pro': 'Pro',
    'Enterprise': 'Enterprise' 
  },
  'Plotly Graph Generation': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Summary Statistics': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Search Functionality': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Transformation': {
    'Starter': 'Starter',
    'Pro': 'Pro',
    'Enterprise': 'Enterprise' 
  },
  'Pivot Tables': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Filtering and Sorting': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Merge (Lookups)': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Type Handling': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Add/Remove Columns': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Excel-Style Formulas': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Deduplication': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Privacy': {
    'Starter': 'Starter',
    'Pro': 'Pro',
    'Enterprise': 'Enterprise' 
  },
  'Local Extension': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Turn off telemetry': {
    'Starter': false,
    'Pro': true,
    'Enterprise': true 
  },
  'Support': {
    'Starter': 'Starter',
    'Pro': 'Pro',
    'Enterprise': 'Enterprise' 
  },
  'Customer support': {
    'Starter': true,
    'Pro': true,
    'Enterprise': true 
  },
  'Success Manager': {
    'Starter': false,
    'Pro': true,
    'Enterprise': true 
  },
  'Onboarding Program': {
    'Starter': false,
    'Pro': false,
    'Enterprise': true 
  },
  'Custom Features': {
    'Starter': false,
    'Pro': false,
    'Enterprise': true 
  },
  'Custom Integration': {
    'Starter': false,
    'Pro': false,
    'Enterprise': true 
  },
}



const Plans: NextPage = () => {

  const [displayDropdown, setDisplayDropdown] = useState<boolean>(false)
  const [mobilePlanDisplayed, setMobilePlanDisplayed] = useState<PlanType>('Pro')

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
                <h1>
                  Starter
                </h1>
                <p className={plansStyles.price_text}>
                  $0
                </p>
                <p className={plansStyles.plan_description}>
                  Perfect for solo data analytics for work or for fun.
                </p>
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
                <div className={plansStyles.plan_cta}>
                  <TextButton 
                    text='Get Started'
                    href='https://docs.trymito.io/getting-started/installing-mito'
                  />
                </div>
              </div>

              <div className={plansStyles.plan_card + ' ' + pageStyles.gradient_card} id={PRO_PLAN_ID}>
                <h1>
                  Pro
                </h1>
                <p className={plansStyles.price_text}>
                  $10 a month
                </p>
                <p className={plansStyles.plan_description}>
                  Mito’s analysis tools, with no telemetry and advanced support.
                </p>
                <PlanBullet>
                  <p>
                    All of Starter: and:
                  </p>
                </PlanBullet>
                <PlanBullet>
                  <p>
                    Turn off private telemetry
                  </p>
                </PlanBullet>
                <PlanBullet>
                  <p>
                    Dedicated customer support
                  </p>
                </PlanBullet>
                <PlanBullet>
                  <p>
                    Future Pro functionality
                  </p>
                </PlanBullet>
                <div className={plansStyles.plan_cta}>
                  <TextButton 
                    text="Get Started"
                    action="https://jl76z192i0.execute-api.us-east-1.amazonaws.com/Prod/create_checkout_session/"
                  />
                </div>
              </div>

              <div className={plansStyles.plan_card + ' ' + pageStyles.background_card}>
                <h1>
                  Enterprise
                </h1>
                <p className={plansStyles.price_text}>
                  Contact Us
                </p>
                <p className={plansStyles.plan_description}>
                  Advanced support and integrations for teams.
                </p>
                <PlanBullet>
                  <p>
                    The power of Pro, and:
                  </p>
                </PlanBullet>
                <PlanBullet>
                  <p>
                    Customer success manager
                  </p>
                </PlanBullet>
                <PlanBullet>
                  <p>
                    Onboarding Program
                  </p>
                </PlanBullet>
                <PlanBullet>
                  <p>
                    Custom integration
                  </p>
                </PlanBullet>
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
                        title='Starter'
                        onClick={() => setMobilePlanDisplayed('Starter')}
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
              {Object.entries(planFeatures).map(([key, value], idx) => {
                return (
                  <FeatureRow 
                    key={idx}
                    rowLabel={key} 
                    featureRowContent={[value[mobilePlanDisplayed]]}
                  />
                )
              })}
            </section>
            <section className={pageStyles.suppress_section_margin_top + ' display-desktop-only-inline-block'}>
              {Object.entries(planFeatures).map(([key, value], idx) => {
                const values: string[] | boolean [] = [value['Starter'], value['Pro'], value['Enterprise']]
                return (
                  <FeatureRow 
                    key={idx}
                    rowLabel={key} 
                    featureRowContent={values}
                  />
                )
              })}
            </section>
              
            <section>
              <FAQCard title='What telemetry do we collect?'>
                <div>
                  <p>
                    We collect no information about your data. We never get access to the shape, size, color, or any other specific information about your private data, and we never will.
                  </p>
                  <p>
                    To improve the product, we collect telemetry on app usage, allowing us to see when users have clicked buttons, provided feedback, as well as how they interact with the sheet.
                  </p>
                  <p>
                    If you want to turn off telemetry entirely, consider purchasing our <a href={'#' + PRO_PLAN_ID} className={pageStyles.link}>Pro Plan →</a>
                  </p>
                </div>
              </FAQCard>
              <FAQCard title='Where is Mito installable?'>
                <div>
                  <p>
                    Mito is installable in Jupyter Lab 2.0 and Jupyter Lab 3.0. Mito does not work in VSCode, Google Collab, Streamlit or any other IDE&apos;s. 
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
              <CTACard />
            </section>              
            
        </main>

        <Footer />
      </div>
    </>
  )
}

export default Plans
