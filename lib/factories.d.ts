import { Authorizer } from './authorizer';
export interface IAuthorizerFactory {
    make(authorizationHeader: string, secret: string): Authorizer;
}
export declare class AuthorizerFactory implements IAuthorizerFactory {
    make(authorizationHeader: string, secret: string): Authorizer;
}
export declare const authorizerFactory: AuthorizerFactory;
