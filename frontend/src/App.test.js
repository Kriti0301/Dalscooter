import { getRole } from './utils/CheckRoles';
import { Roles } from './constants/AccessConstants';

// Build an unsigned JWT with the given claims (getRole only decodes the payload).
const makeToken = (claims) => {
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(claims)}.`;
};

describe('getRole', () => {
  test('returns the Franchise role from Cognito groups', () => {
    const token = makeToken({ 'cognito:groups': [Roles.FRANCHISE] });
    expect(getRole(token)).toBe(Roles.FRANCHISE);
  });

  test('returns the first group when a user has several', () => {
    const token = makeToken({ 'cognito:groups': [Roles.USER, Roles.FRANCHISE] });
    expect(getRole(token)).toBe(Roles.USER);
  });

  test('returns undefined when the token has no Cognito groups', () => {
    const token = makeToken({ sub: 'abc123' });
    expect(getRole(token)).toBeUndefined();
  });
});
