import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import bifoldStyles from '../styles/Bifold.module.css';
import titleStyles from '../styles/Title.module.css';
import textImageSplitStyles from '../styles/TextImageSplit.module.css';
import lowCodeSQLStyles from '../styles/LowCodeSQL.module.css';
import trifoldStyles from '../styles/Trifold.module.css';
import homeStyles from '../styles/Home.module.css';
import customerStyles from '../styles/Customers.module.css';


// Import Icons & Background Grid
import { classNames } from '../utils/classNames';
import ImageTextCard from '../components/ImageTextCard/ImageTextCard';
import AuthenticateIcon from '../public/low-code-sql/AuthenticateIcon.svg';
import EditIcon from '../public/low-code-sql/EditIcon.svg';
import EmailIcon from '../public/low-code-sql/EmailIcon.svg';
import ExploreIcon from '../public/low-code-sql/ExploreIcon.svg';
import FilterIcon from '../public/low-code-sql/FilterIcon.svg';
import ScheduleIcon from '../public/low-code-sql/ScheduleIcon.svg';
import SelectIcon from '../public/low-code-sql/SelectIcon.svg';
import SpreadsheetIcon from '../public/low-code-sql/SpreadsheetIcon.svg';
import WideGraphIcon from '../public/low-code-sql/WideGraphIcon.svg';
import CTAButtons from '../components/CTAButtons/CTAButtons';
import ContactCTACard from '../components/CTACards/ContactCTACard';

const Customers: NextPage = () => {

  return (
    <>
      <Head>
        <title>Join the world's largest banks, asset managers, and insurance firms using Mito | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Mito is used by the world's largest banks, asset managers, insurance firms, and private equity firms to help non-technical analysts automate Excel reports" />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>

            <section className={classNames(titleStyles.title_card)}>
                <h1 className={titleStyles.title}>
                    Find our why thousands of analysts at the world's largest companies are using Mito
                </h1>
            </section>

            <section className={customerStyles.customer_table}>
                <table>
                    <tr>
                        <td><Image src="/customers/sap.png" height={60} width={107} alt="Image 1"/></td>
                        <td><Image src="/customers/kpmg.png" height={60} width={150} alt="Image 2"/></td>
                        <td><Image src="/customers/ericsson.png" height={60} width={182} alt="Image 3"/></td>
                    </tr>
                    <tr>
                        <td><Image src="/customers/amazon.png" height={60} width={199} alt="Image 4"/></td>
                        <td><Image src="/customers/wayfair.png" height={60}  width={224} alt="Image 6"/></td>
                        <td><Image src="/customers/accenture.png" height={60} width={194} alt="Image 5"/></td>
                    </tr>
                    <tr>
                        <td><Image src="/customers/cisco.png" height={60} width={113} alt="Image 7"/></td>
                        <td><Image src="/customers/deloitte.png" height={60} width={220} alt="Image 8"/></td>
                        <td><Image src="/customers/pwc.png" height={60} width={148} alt="Image 9"/></td>
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