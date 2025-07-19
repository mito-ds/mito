# Authorization

### Authorization Code Flow:

1. User clicks "Sign In" → then they are redirected to Cognito's hosted UI
2. User authenticates → then Cognito redirects back with an authorization code
3. Our backend then exchanges the code for JWT tokens

The authorization code in step2 is a short-lived, one-time use code. 
To exchange the authorization code for tokens, we have to make a POST request to Cognito's token endpoint:
POST https://your-domain.auth.region.amazoncognito.com/oauth2/token

The JWT tokens received will provide an hour's session for the user for the next deployments, without having to re-login.

### The response from this request contains 3 JWT tokens:
1. Access Token - Used to call APIs (expires in 1 hour by default)
2. ID Token - Contains user identity information (name, email, etc.)
3. Refresh Token - Used to get new access/ID tokens when they expire