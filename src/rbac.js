class RBAC {
    constructor() {
        this.roles = {};
    }

    addRole(role) {
        if (!this.roles[role]) {
            this.roles[role] = new Set();
        }
    }

    addPermissionToRole(role, permission) {
        if (this.roles[role]) {
            this.roles[role].add(permission);
        }
    }

    hasPermission(role, permission) {
        return this.roles[role] && this.roles[role].has(permission);
    }
}

module.exports = RBAC;
