// Copyright (c) Mito

import React, { useEffect } from 'react';
import { ModalEnum } from './modals';
import "../../../css/upgrade-modal.css"
import MitoAPI from '../../api/api';
import TextButton from '../elements/TextButton';
import { UIState } from '../../types';

/*
    A modal that appears and tells the user to upgrade to the 
    new version of Mito
*/
const UpgradeModal = (props: {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI
}): JSX.Element => {

    useEffect(() => {
        // We log the opening of the upgrade modal
        void props.mitoAPI.log(
            'opened_upgrade_modal'
        );
    }, [])

    const onUpgrade = (): void => {

        // Log if the user clicked upgrade
        void props.mitoAPI.log(
            'closed_upgrade'
        );

        // And then manually mark as upgraded (assuming they did it, so they
        // don't get an annoying popup a bunch of times).
        void props.mitoAPI.updateManuallyMarkUpgraded();

        // Close the modal
        props.setUIState((prevUIState) => {
            return {
                ...prevUIState,
                currOpenModal: {type: ModalEnum.None}
            }
        })
    }

    return (
        <div className='overlay'>
            <div className='upgrade-modal-container txt-16'>
                <h2 className='mt-5px'>
                    Time to Upgrade!
                </h2>
                <p>
                    To get Mito&apos;s most advanced functionality:
                </p>
                <ol>
                    <li className='mt-5px'>
                        <p>
                            Open a new terminal/command prompt (where you ran the commands to install Mito).
                        </p>
                    </li>
                    <li className='mt-10px'>
                        <div className='upgrade-modal-code-list-item'>
                            <p>
                                Run the command:
                            </p>
                            <code className='upgrade-modal-code'>
                                python -m pip install mitoinstaller --upgrade
                            </code>
                        </div>
                    </li>
                    <li className='mt-10px'>
                        <div className='upgrade-modal-code-list-item'>
                            <p>
                                Run the command:
                            </p>
                            <code className='upgrade-modal-code'>
                                python -m mitoinstaller upgrade
                            </code>
                        </div>
                    </li>
                    <li className='mt-10px'>
                        <p>
                            <b>Restart your Kernel</b> by clicking on Kernel &gt; Restart Kernel.
                        </p>
                    </li>
                    <li className='mt-10px'>
                        <p>
                            <b>Refresh this webpage.</b>
                        </p>
                    </li>
                </ol> 
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={onUpgrade}
                >
                    Got it!
                </TextButton>
            </div>
        </div>
    );
};

export default UpgradeModal;