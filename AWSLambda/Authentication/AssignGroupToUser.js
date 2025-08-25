import {
    CognitoIdentityProviderClient,
    AdminAddUserToGroupCommand,
  } from "@aws-sdk/client-cognito-identity-provider";
  
  const cognito = new CognitoIdentityProviderClient({});
  
  export const handler = async (event) => {
    const userPoolId = event.userPoolId;
    const username = event.userName;
    const userAttributes = event.request.userAttributes;
    const role = userAttributes["custom:role"];
  
    console.log(`Post-auth trigger: user=${username}, role=${role}`);
  
    // Only proceed if the custom:role exists and is either 'franchise' or 'user'
    if (role === "franchise" || role === "user") {
      const groupParams = {
        GroupName: role,
        UserPoolId: userPoolId,
        Username: username,
      };
  
      try {
        await cognito.send(new AdminAddUserToGroupCommand(groupParams));
        console.log(`Added ${username} to group ${role}`);
      } catch (error) {
        console.error("Failed to add user to group:", error);
        // Optionally: throw error to stop login if group add fails
      }
    } else {
      console.warn(`Unknown or missing role: ${role}`);
    }
  
    return event;
  };
  