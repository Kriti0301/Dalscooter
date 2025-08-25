import { jwtDecode } from "jwt-decode";

export function getRole(token) {
  const claims = jwtDecode(token);          // ← no signature verify
  return (
    (Array.isArray(claims["cognito:groups"])      // or first Cognito group
        ? claims["cognito:groups"][0]
        : undefined)
  );
}