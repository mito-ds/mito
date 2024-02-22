import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import titleStyles from '../styles/Title.module.css';

import customerStyles from '../styles/Customers.module.css';


// Import Icons & Background Grid
import { classNames } from '../utils/classNames';
import ContactCTACard from '../components/CTACards/ContactCTACard';
import CustomerCard from '../components/CustomerCard/CustomerCard';

const Customers: NextPage = () => {

  return (
    <>
      <Head>
        <title>Join the world&apos;s largest banks, asset managers, and insurance firms using Mito | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Analysts at the world&apos;s largest banks and insurance firms use Mito to automate Excel reports" />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>

            <section className={classNames(titleStyles.title_card)}>
                <h1 className={titleStyles.title}>
                    Find out why thousands of analysts at the world&apos;s largest companies use Mito
                </h1>
            </section>
            <section>
              <div className={customerStyles.customer_cards_container}>
                <CustomerCard
                  customerName={"Bulge Bracket Bank"}
                  imageSrc={"/customers/white-financial-services.png"}
                  width={68}
                  quoteText={"I used Mito to automate a critical monthly reporting process that is sent to the C-suite."}
                  readMoreLink={"https://www.trymito.io/blog/wealth-management-analyst-automates-critical-monthly-deliverable"}
                />
                <CustomerCard
                  customerName={"Major PE Firm"}
                  imageSrc={"/customers/private_equity_logo.png"}
                  width={77}
                  quoteText={"The Mito report process will end up saving my team and I countless hours during the year."}
                  readMoreLink={"http://trymito.io/blog/special-events-team-at-large-asset-manager-saves-7-hours-week-using-mito"}
                />
                <CustomerCard
                  customerName={"Enigma"}
                  imageSrc={"/customers/enigma.png"}
                  width={134}
                  quoteText={"Instead of fighting with Excel... I'm using Mito to generate Python scripts myself savings four hours/week."}
                  readMoreLink={"https://www.trymito.io/blog/enigma-case-study"}
                />
                <CustomerCard
                  customerName={"Cytiva"}
                  imageSrc={"/customers/cytiva.png"}
                  width={60}
                  quoteText={"Three years later, I can’t imagine tackling my day-to-day work without Mito as one of my tools."}
                />
                <CustomerCard
                  customerName={"Bulge Bracket Bank"}
                  imageSrc={"/customers/white-financial-services.png"}
                  width={68}
                  quoteText={"We’ve trained thousands of analysts to use Mito. It’s a major part of our Python training."}
                />
                <CustomerCard
                  customerName={"Major Asset Manager"}
                  imageSrc={"/customers/white-financial-services.png"}
                  width={58}
                  quoteText={"We were going to hire a Python developer to automate this report. With Mito, I automated it myself."}
                />

              </div>
              

            </section>
            
            
            <section className='only-on-mobile'>
              <div className={customerStyles.customer_logos}>
                <div>
                  <Image src="/customers/sap.png" height={60} width={107} alt="SAP"/>
                </div>
                <div>
                  <Image src="/customers/kpmg.png" height={60} width={150} alt="KPMG"/>
                </div>
                <div>
                  <Image src="/customers/ericsson.png" height={60} width={182} alt="Ericsson"/>
                </div>
                <div>
                  <Image src="/customers/amazon.png" height={60} width={199} alt="Amazon"/>
                </div>
                <div>
                  <Image src="/customers/wayfair.png" height={60}  width={224} alt="Wayfair"/>
                </div>
                <div>
                  <Image src="/customers/accenture.png" height={60} width={194} alt="Accenture"/>
                </div>
                <div>
                  <Image src="/customers/cisco.png" height={60} width={113} alt="Cisco"/>
                </div>
                <div>
                  <Image src="/customers/deloitte.png" height={60} width={220} alt="Deloitte"/>
                </div>
                <div>
                  <Image src="/customers/pwc.png" height={60} width={148} alt="PWC"/>
                </div>
              </div>
            </section>
            <section className={classNames(customerStyles.customer_table, 'display-desktop-only-flex')}>
                <table>
                    <tr>
                        <td><Image src="/customers/sap.png" height={60} width={107} alt="SAP"/></td>
                        <td><Image src="/customers/kpmg.png" height={60} width={150} alt="KPMG"/></td>
                        <td><Image src="/customers/ericsson.png" height={60} width={182} alt="Ericsson"/></td>
                    </tr>
                    <tr>
                        <td><Image src="/customers/amazon.png" height={60} width={199} alt="Amazon"/></td>
                        <td><Image src="/customers/wayfair.png" height={60}  width={224} alt="Wayfair"/></td>
                        <td><Image src="/customers/accenture.png" height={60} width={194} alt="Accenture"/></td>
                    </tr>
                    <tr>
                        <td><Image src="/customers/cisco.png" height={60} width={113} alt="Cisco"/></td>
                        <td><Image src="/customers/deloitte.png" height={60} width={220} alt="Deloitte"/></td>
                        <td><Image src="/customers/pwc.png" height={60} width={148} alt="PWC"/></td>
                    </tr>
                </table>
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

export default Customers