"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: integrate jwt provided in the request header of HAPI...
exports.RFIAuthChecker = ({ root, args, context, info }, definedRoleGroups) => {
    const { value: authorizer } = context.container.services.find((s) => s.id === 'authorization');
    const { operation } = info.operation;
    return authorizer.can(operation, root, definedRoleGroups[0]);
};
//# sourceMappingURL=index.js.map