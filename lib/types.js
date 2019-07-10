"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PermissionSource;
(function (PermissionSource) {
    PermissionSource["MATRIX"] = "matrix";
    PermissionSource["DECORATOR"] = "decorator";
})(PermissionSource = exports.PermissionSource || (exports.PermissionSource = {}));
var Roles;
(function (Roles) {
    Roles["ADMIN"] = "admin";
    Roles["USER"] = "user";
    Roles["PENDING"] = "pending";
})(Roles = exports.Roles || (exports.Roles = {}));
var Scope;
(function (Scope) {
    Scope["SYSADMIN"] = "sysadmin";
})(Scope = exports.Scope || (exports.Scope = {}));
var Actions;
(function (Actions) {
    Actions["CREATE"] = "create";
    Actions["READ"] = "read";
    Actions["UPDATE"] = "update";
    Actions["DELETE"] = "delete";
    Actions["REQUEST"] = "request";
    Actions["APPROVE"] = "approve";
    Actions["QUERY"] = "query";
})(Actions = exports.Actions || (exports.Actions = {}));
var Resource;
(function (Resource) {
    Resource["Division"] = "Division";
    Resource["User"] = "User";
    Resource["Order"] = "Order";
})(Resource = exports.Resource || (exports.Resource = {}));
//# sourceMappingURL=types.js.map