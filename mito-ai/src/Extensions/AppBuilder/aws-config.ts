/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Amplify } from 'aws-amplify';

const userPoolIdDev = 'us-east-1_Kk0f9mOfx'
const userPoolClientIdDev = '6ara3u3l8sss738hrhbq1qtiqf'

// TODO: modify to prod user ID and client ID on after creating teh cognito resources in prod
const userPoolId = userPoolIdDev
const userPoolClientId = userPoolClientIdDev

export const configureAmplify = (): void => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: userPoolId,
        userPoolClientId: userPoolClientId,

        loginWith: {
          email: true,
          username: false,
        }
      },
    }
  });

  console.log('Amplify configuration loaded successfully');
};

// Configure immediately when this module is imported
configureAmplify();
