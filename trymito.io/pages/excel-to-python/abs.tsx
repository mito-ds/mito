// Import necessary React and Next.js modules and components
import React from 'react';
import Head from 'next/head';

import pageStyles from '../../styles/Page.module.css';
import excelToPythonStyles from '../../styles/ExcelToPython.module.css';
import { classNames } from '../../utils/classNames';
import TextButton from '../../components/TextButton/TextButton';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

// Define the specific function name
const functionName = "ABS";

// Define your page content and metadata
const PageContent = () => {
  return (
    <>
      <Head>
        {/* Title Tag */}
        <title>{`Excel to Python: ${functionName} - A Complete Guide`}</title>
        
        {/* Meta Description */}
        <meta
          name="description"
          content={`Learn how to convert Excel's ${functionName} function to Python using Pandas. This comprehensive guide provides step-by-step instructions and practical examples.`}
        />
        
        {/* Canonical URL (if applicable) */}
        {/* <link rel="canonical" href={`https://www.example.com/excel-to-python/${function-name}-guide`} /> */}
        
        {/* Open Graph Tags (for social media sharing) */}
        <meta
          property="og:title"
          content={`Excel to Python: ${functionName} - A Complete Guide`}
        />
        <meta
          property="og:description"
          content={`Learn how to convert Excel's ${functionName} function to Python using Pandas. This comprehensive guide provides step-by-step instructions and practical examples.`}
        />
        {/* Add more Open Graph tags as needed */}
        
        {/* Twitter Card Tags (for Twitter sharing) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`Excel to Python: ${functionName} - A Complete Guide`}
        />
        <meta
          name="twitter:description"
          content={`Learn how to convert Excel's ${functionName} function to Python using Pandas. This comprehensive guide provides step-by-step instructions and practical examples.`}
        />
        {/* Add more Twitter Card tags as needed */}
        
        {/* Other SEO-related tags (structured data, robots meta, etc.) */}
        {/* Add other SEO-related tags here */}
      </Head>
      <Header/>

      <div className={pageStyles.container}>
        <main>
          <h1>{`How to Implement Excel's: ${functionName} function in Pandas`}</h1>
          <div className={classNames(excelToPythonStyles.related_functions_card)}>
            <p>Related Functions</p>
            <TextButton 
              text="SUM"
              variant='white'
            />
            <TextButton
              text='ROUND'
              variant='white'
            />
            <TextButton
              text='CEIL'
              variant='white'
            />

          </div>
          <p>
            Related Function
          </p>
          
          <section>
            <p>
              Excel&apos;s ABS function finds the absolute value of a number. The absolute value of a function is the non-negative value of a number. The absolute value function is commonly used, for example, to calculate the distance between two points. Regardless of the order we look at the points, the distance should always be positive.
            </p>
            <p>
              This page explains how to implement Excel's ABS function in Python, so you can automate Excel reports using Python and Pandas.
            </p>
          </section>

          {/* Understanding the Excel Function */}
          <section>
              <h2>Understanding the Excel Function</h2>
              <p>
                The ABS function in Excel takes a single parameters and returns its absolute value.
              </p>
              <p>
                =ABS(<span className='text-highlight'>number</span>)
              </p>
              <h3>ABS Excel Syntax</h3>
              <table className={excelToPythonStyles.table}>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Description</th>
                    <th>Data Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>number</td>
                    <td>The number you want to take the absolute value of</td>
                    <td>number</td>
                  </tr>
                </tbody>
              </table>

              <h3>ABS Examples</h3>
              <table className={excelToPythonStyles.table}>
                <thead>
                  <tr>
                    <th>Formula</th>
                    <th>Description</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>=ABS(-5)</td>
                    <td>Calculate the absolute value of -5</td>
                    <td>5</td>
                  </tr>
                  <tr>
                    <td>=ABS(2*-2)</td>
                    <td>Calculate the absolute value of 2 * -2</td>
                    <td>4</td>
                  </tr>
                </tbody>
              </table>
          </section>

          {/* Equivalent Python Code Using Pandas */}
          <section>
              <h2>Equivalent Python Code Using Pandas</h2>
              <p>
                To replicate the functionality of the SUM function in Excel using Python and Pandas, you can use the `sum()` function available in Pandas. Below are examples of how to achieve the same functionality.
              </p>
              
              <h3>Using Pandas sum() to calculate the sum of a Pandas DataFrame column</h3>
              <p>
                The most common way to use the SUM function in Excel is to apply it to a column or series of numbers in a Pandas DataFrame.
              </p>
              <code>{`import pandas as pd

  # Sample DataFrame
  data = {'Numbers': [1, 2, 3, 4]}
  df = pd.DataFrame(data)

  # Calculate the sum using Pandas sum() function
  total = df['Numbers'].sum()

  # Display the total
  print(total)`}</code>

              <h3>Using Pandas sum() with filtering</h3>
              <p>
                You can also use the SUM function in Excel to calculate the sum of specific rows in a Pandas DataFrame based on certain conditions.
              </p>
              <code>{`import pandas as pd

  # Sample DataFrame
  data = {'Category': ['A', 'B', 'A', 'C'],
          'Value': [10, 20, 30, 40]}

  df = pd.DataFrame(data)

  # Calculate the sum of values where Category is 'A'
  total_a = df[df['Category'] == 'A']['Value'].sum()

  # Display the sum for 'A' category
  print(total_a)`}</code>
          </section>

          {/* Common Pitfalls and Tips */}
          <section>
            <h2>Common Pitfalls and Tips</h2>
            <p>
              When implementing the SUM function in Python using Pandas, here are some common challenges and tips to keep in mind:
            </p>
            <h3>Handling Missing Values</h3>
            <p>
              In Excel, the SUM function simply ignores empty cells. In Pandas, missing values (NaN) can affect the result. To handle missing values like Excel, use the `.sum()` function with the `skipna=True` parameter.
            </p>
            <code>{`import pandas as pd

  # Sample DataFrame with missing values
  data = {'Numbers': [1, 2, None, 4]}
  df = pd.DataFrame(data)

  # Calculate the sum, ignoring missing values
  total = df['Numbers'].sum(skipna=True)

  # Display the total
  print(total)`}</code>
          
              <h3>Aggregating Data</h3>
              <p>
                The SUM function in Excel is often used to aggregate data. In Pandas, you can use the `.groupby()` function to group and sum data based on specific criteria.
              </p>
              <code>{`import pandas as pd

  # Sample DataFrame
  data = {'Category': ['A', 'B', 'A', 'C'],
          'Value': [10, 20, 30, 40]}

  df = pd.DataFrame(data)

  # Group by 'Category' and calculate the sum for each group
  grouped = df.groupby('Category')['Value'].sum()

  # Display the grouped data
  print(grouped)`}</code>

          <p>If you want to automate Excel-based calculations using Python, understanding the SUM function in Pandas is a valuable skill.</p>
          </section>

          {/* Practical Example */}
          <section>
              <h2>Practical Example</h2>
              <p>
                Let's consider a practical example where the SUM function is commonly used. Suppose you have a sales dataset with monthly sales figures, and you want to calculate the total annual sales.
              </p>
              <p>
                Here's how you can apply the SUM function in Python to achieve this:
              </p>
              <code>{`import pandas as pd

  # Sample DataFrame with monthly sales data
  data = {'Month': ['Jan', 'Feb', 'Mar', 'Apr'],
          'Sales': [5000, 6000, 5500, 7000]}
  df = pd.DataFrame(data)

  # Calculate the total annual sales
  annual_sales = df['Sales'].sum()

  # Display the total annual sales
  print(f"Total Annual Sales: \${annual_sales}")`}</code>
          </section>

          {/* Conclusion */}
          <section>
            <h2>Conclusion</h2>
            <p>
              In this guide, we've shown you how to convert the Excel SUM function to Python using Pandas. By following the examples and tips provided, you can seamlessly transition from Excel to Python for data analysis and automation.
            </p>
            <p>
              We encourage you to explore other Excel-to-Python guides on our website to further enhance your data analysis skills with Python.
            </p>
          </section>
        </main>
      </div>
      <Footer/>
    </>
  );
};

export default PageContent;
