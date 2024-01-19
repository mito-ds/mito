


import React, { Component } from "react";
import { SendFunctionReturnType } from "../mito";
import Mito from '../mito/Mito';


export default class MitoFlaskWrapper extends Component {
    processMessageQueueTimer: null | NodeJS.Timeout;

    constructor(props: any) {
        super(props);
    }

    public async send(msg: Record<string, unknown>): Promise<SendFunctionReturnType<any>> {
        console.log("SENDING", msg)
        return {} as any
    }


    render = () => {
        const key = 'abc'
        const sheetDataArray = [] as any;
        const analysisData = {} as any;
        const userProfile = {} as any;

        return (
            <Mito 
                key={key as string}
                getSendFunction={async () => this.send.bind(this)} 
                sheetDataArray={sheetDataArray} 
                analysisData={analysisData} 
                userProfile={userProfile}
            />  
        )
    }
}