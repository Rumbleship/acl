"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authorizer_1 = require("./authorizer");
class AuthorizerFactory {
    make(authorizationHeader, secret) {
        return new authorizer_1.Authorizer(authorizationHeader, secret);
    }
}
exports.AuthorizerFactory = AuthorizerFactory;
exports.authorizerFactory = new AuthorizerFactory();
//# sourceMappingURL=factories.js.map