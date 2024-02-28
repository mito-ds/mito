import React, { useEffect, useRef } from 'react';

import { AnalysisData, Mito, MitoResponse, SendFunctionReturnType, SheetData, UserProfile, getAnalysisDataFromString, getSheetDataArrayFromString, getUserProfileFromString } from '.';

interface MitoFlaskResponse {
  response: MitoResponse | null,
  state: string
}

interface State {
  backend_state: string,
  shared_state_variables: {
    'sheet_data_json': string,
    'analysis_data_json': string,
    'user_profile_json': string
  }
}


export const MitoFlask = (props: {
  mitoFlaskRoute: string
}) => {

  const [analysis, setAnalysis] = React.useState<string | undefined>(undefined);
  const [userProfile, setUserProfile] = React.useState<UserProfile | undefined>(undefined);
  const [analysisData, setAnalysisData] = React.useState<AnalysisData | undefined>(undefined);
  const [sheetDataArray, setSheetDataArray] = React.useState<SheetData[] | undefined>(undefined);

  // Update the ref whenever the backendState changes, so that we can 
  // make sure the send function always has access to the most up to date
  // backend state
  const analysisRef = useRef(analysis);
  useEffect(() => {
    analysisRef.current = analysis;
  }, [analysis]);

  const getSendFunction = async () => {
    const sendFunction = async (data: any): Promise<SendFunctionReturnType<any>> => {
      const res = await fetch(props.mitoFlaskRoute, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "backend_state": analysisRef.current,
          "mito_event": data
        }),
      })
      const json: MitoFlaskResponse = await res.json();
      const state: State = JSON.parse(json.state);
      setAnalysis(state.backend_state);
  
      // Return the response, or throw an error if it's null
      if (json.response === null) {
        throw new Error("Response is null");
      }

      const response = json.response;

      if (response['event'] == 'error') {
        return {
            error: response.error,
            errorShort: response.errorShort,
            showErrorModal: response.showErrorModal,
            traceback: response.traceback
        };
      }

      const sharedVariables = response.shared_variables;
      
      return {
          sheetDataArray: sharedVariables ? getSheetDataArrayFromString(sharedVariables.sheet_data_json) : undefined,
          analysisData: sharedVariables ? getAnalysisDataFromString(sharedVariables.analysis_data_json) : undefined,
          userProfile: sharedVariables ? getUserProfileFromString(sharedVariables.user_profile_json) : undefined,
          result: response['data'] as any
      };
    }
    return sendFunction;
  }

  useEffect(() => {
    const fetchData = async () => {
      // Get initial spreadsheet contents
      const res = await fetch(props.mitoFlaskRoute, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{}'
      })
      const json: MitoFlaskResponse = await res.json();
      const state: State = JSON.parse(json.state);
      setAnalysis(state.backend_state);
      // TODO: use correct parsing functions
      setSheetDataArray(getSheetDataArrayFromString(state.shared_state_variables.sheet_data_json));
      setAnalysisData(getAnalysisDataFromString(state.shared_state_variables.analysis_data_json));
      setUserProfile(getUserProfileFromString(state.shared_state_variables.user_profile_json));
    }
    void fetchData();    
  }, [])

  if (analysis === undefined || userProfile === undefined || analysisData === undefined || sheetDataArray === undefined) {
    return <div>Loading...</div>
  }

  const key = 'test-string';

  return (
    <Mito 
        key={key as string}
        getSendFunction={getSendFunction}
        sheetDataArray={sheetDataArray} 
        analysisData={analysisData} 
        userProfile={userProfile}
        suppressLogMessages
    />  
  );
}

export default MitoFlask;