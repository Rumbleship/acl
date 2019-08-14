import { Authorizer } from './authorizer';
// tslint:disable-next-line: interface-name
export interface IAuthorizerFactory {
  make(authorizationHeader: string, secret: string): Authorizer;
}
export class AuthorizerFactory implements IAuthorizerFactory {
  make(authorizationHeader: string, secret: string) {
    return new Authorizer(authorizationHeader, secret);
  }
}

export const authorizerFactory = new AuthorizerFactory();
