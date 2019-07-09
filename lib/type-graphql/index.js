"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: integrate jwt provided in the request header of HAPI...
exports.RFIAuthChecker = ({ root, args, context, info }, definedRoleGroups) => {
    const { value: authorization } = context.container.services.find((s) => s.id === 'authorization');
    const { operation } = info.operation;
    return authorization.allowedDecorator(definedRoleGroups[0], operation, root);
};
//# sourceMappingURL=index.js.map