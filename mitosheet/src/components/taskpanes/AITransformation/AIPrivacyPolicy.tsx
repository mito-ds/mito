import React from "react";
import { UIState } from "../../../types";

import '../../../../css/taskpanes/AITransformation/AITransformation.css';
import MitoAPI from "../../../jupyter/api";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import TextButton from "../../elements/TextButton";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import CollapsibleSection from "../../layout/CollapsibleSection";
import Spacer from "../../layout/Spacer";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";

interface AITransformationResultSectionProps {
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
}

const AITransformationResultSection = (props: AITransformationResultSectionProps): JSX.Element => {

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Mito AI"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <p>
                    Welcome to Mito AI powered by OpenAI. Before getting started, take a second to review our privacy policy. 
                </p>
                <Spacer px={10}/>
                <CollapsibleSection title={'What data does Mito AI collect?'}>
                    <p>
                        Mito AI uses the instructions you provide (the prompt) and information about your dataframe to generate code that works in the context of your analysis. Without this information, the Mito generated code will require additional customization.
                    </p>
                    <Spacer px={5}/>
                    <p>
                        Private data that is contained in the dataframe name, column headers, or first five rows of data might be shared with Mito and OpenAI. 
                    </p>
                </CollapsibleSection>
                <Spacer px={10}/>
                <CollapsibleSection title={'How is my data used?'}>
                    <p>
                        The data collected by Mito AI is used to construct a prompt for OpenAI. Mito supplements the prompt you provide with additional information about your data to give OpenAI the best chance of generating helpful code.
                    </p>
                    <Spacer px={5}/>
                    <p>
                        The data collected is also used to improve Mito AI. Such uses include:
                    </p>
                    <li>
                        Evaluating Mito AI to determine its effectiveness.
                    </li>
                    <li>
                        Conducting research to improve Mito AI.
                    </li>
                    <li>
                        Detecting potential abuse of Mito AI.
                    </li>
                    <Spacer px={5}/>
                    <p>
                        Read <a className='text-underline text-color-mito-purple' href='https://privacy.trymito.io/privacy-policy' target='_blank' rel="noreferrer">Mito</a> and <a className='text-underline text-color-mito-purple' href='https://openai.com/policies/privacy-policy' target='_blank' rel="noreferrer">OpenAI’s</a> privacy policy for more information.
                    </p>
                </CollapsibleSection>
                <Spacer px={10}/>
                <CollapsibleSection title={'How can I further protect my data?'}>
                    <p>
                        Mito AI uses OpenAI to generate code by default. Doing so requires sending your information to OpenAI. To further protect your data, Mito Enterprise users can connect Mito AI to a self-hosted large language model. As a result, Mito would not need to collect or share any information about your data with OpenAI. Your data will never leave your system.
                    </p>
                    <Spacer px={5}/>
                    <p>
                        To learn more about this option, reach out to the <a className='text-underline text-color-mito-purple' href="mailto:founders@sagacollab.com?subject=Mito Enterprise AI">Mito team</a>. 
                    </p>
                </CollapsibleSection>
                <Spacer px={10}/>
                <CollapsibleSection title={'How can I use my own OpenAI API key?'}>
                    <p>
                        So that your completion request never touches Mito servers, you can use your own OpenAI API key. Doing so ensures you are not vulnerable to any attacks on Mito's infrastructure. 
                    </p>
                    <Spacer px={5}/>
                    <p>
                        To use your own OpenAI API key, set the environment variable OPENAI_API_KEY to your OpenAI key. You can get one <a className='text-underline text-color-mito-purple' href='https://platform.openai.com/account/api-keys' target='_blank' rel="noreferrer">here</a>.
                    </p>
                </CollapsibleSection>
                <Spacer px={5}/>
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    onClick={() => {
                        void props.mitoAPI.updateAcceptAITransformationPrivacyPolicy();
                    }}
                    variant='dark'
                >
                    Accept Privacy Policy
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default AITransformationResultSection;