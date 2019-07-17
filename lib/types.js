"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Roles;
(function (Roles) {
    Roles["ADMIN"] = "admin";
    Roles["USER"] = "user";
    Roles["PENDING"] = "pending";
})(Roles = exports.Roles || (exports.Roles = {}));
var Actions;
(function (Actions) {
    Actions["CREATE"] = "create";
    Actions["READ"] = "read";
    Actions["UPDATE"] = "update";
    Actions["DELETE"] = "delete";
    Actions["QUERY"] = "query";
    // are Approve and Verify the same action, e.g. a limited update?
    Actions["APPROVE"] = "approve";
    Actions["VERIFY"] = "verify";
    Actions["REQUEST"] = "request";
})(Actions = exports.Actions || (exports.Actions = {}));
var Resource;
(function (Resource) {
    Resource["Division"] = "Division";
    Resource["User"] = "User";
    Resource["Order"] = "Order";
})(Resource = exports.Resource || (exports.Resource = {}));
var Scopes;
(function (Scopes) {
    Scopes["SYSADMIN"] = "system:*";
    Scopes["BANKINGADMIN"] = "banking:*";
    Scopes["ORDERADMIN"] = "orders:*";
})(Scopes = exports.Scopes || (exports.Scopes = {}));
//# sourceMappingURL=types.js.map