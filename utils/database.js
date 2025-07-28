const fs = require('fs');
const path = require('path');

// File paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const ROLES_FILE = path.join(DATA_DIR, 'roles.json');
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');

// In-memory storage for user currency
let userCurrency = new Map();

// Shop roles storage
let shopRoles = [];

// Purchase history
let purchaseHistory = [];

/**
 * Initialize database and load existing data
 */
function initializeDatabase() {
    try {
        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        // Load shop roles
        if (fs.existsSync(ROLES_FILE)) {
            const rolesData = fs.readFileSync(ROLES_FILE, 'utf8');
            shopRoles = JSON.parse(rolesData);
            console.log(`✅ Loaded ${shopRoles.length} shop roles`);
        } else {
            shopRoles = [];
            saveShopRoles();
        }

        // Load purchase history
        if (fs.existsSync(PURCHASES_FILE)) {
            const purchasesData = fs.readFileSync(PURCHASES_FILE, 'utf8');
            purchaseHistory = JSON.parse(purchasesData);
            console.log(`✅ Loaded ${purchaseHistory.length} purchase records`);
        } else {
            purchaseHistory = [];
            savePurchaseHistory();
        }

        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
    }
}

/**
 * Save shop roles to file
 */
function saveShopRoles() {
    try {
        fs.writeFileSync(ROLES_FILE, JSON.stringify(shopRoles, null, 2));
    } catch (error) {
        console.error('Error saving shop roles:', error);
    }
}

/**
 * Save purchase history to file
 */
function savePurchaseHistory() {
    try {
        fs.writeFileSync(PURCHASES_FILE, JSON.stringify(purchaseHistory, null, 2));
    } catch (error) {
        console.error('Error saving purchase history:', error);
    }
}

/**
 * Add a role to the shop
 */
function addShopRole(roleData) {
    // Check if role already exists
    const existingRole = shopRoles.find(role => role.roleId === roleData.roleId);
    if (existingRole) {
        return false; // Role already exists
    }

    shopRoles.push(roleData);
    saveShopRoles();
    return true;
}

/**
 * Remove a role from the shop
 */
function removeShopRole(roleId) {
    const index = shopRoles.findIndex(role => role.roleId === roleId);
    if (index === -1) {
        return false; // Role not found
    }

    shopRoles.splice(index, 1);
    saveShopRoles();
    return true;
}

/**
 * Get all shop roles
 */
function getShopRoles() {
    return [...shopRoles];
}

/**
 * Get a specific shop role
 */
function getShopRole(roleId) {
    return shopRoles.find(role => role.roleId === roleId);
}

/**
 * Record a role purchase
 */
function purchaseRole(userId, roleId, price) {
    const purchase = {
        userId,
        roleId,
        price,
        timestamp: new Date().toISOString()
    };
    
    purchaseHistory.push(purchase);
    savePurchaseHistory();
    return purchase;
}

/**
 * Get purchase history for a user
 */
function getUserPurchases(userId) {
    return purchaseHistory.filter(purchase => purchase.userId === userId);
}

/**
 * Get all purchases
 */
function getAllPurchases() {
    return [...purchaseHistory];
}

/**
 * Get user currency (in-memory)
 */
function getUserCurrencyFromDB(userId) {
    return userCurrency.get(userId) || 0;
}

/**
 * Set user currency (in-memory)
 */
function setUserCurrency(userId, amount) {
    userCurrency.set(userId, Math.max(0, amount));
}

/**
 * Add currency to user (in-memory)
 */
function addUserCurrency(userId, amount) {
    const current = getUserCurrencyFromDB(userId);
    setUserCurrency(userId, current + amount);
}

/**
 * Deduct currency from user (in-memory)
 */
function deductUserCurrency(userId, amount) {
    const current = getUserCurrencyFromDB(userId);
    if (current >= amount) {
        setUserCurrency(userId, current - amount);
        return true;
    }
    return false;
}

/**
 * Get all users with currency (in-memory)
 */
function getAllUsersWithCurrency() {
    return Array.from(userCurrency.entries()).map(([userId, currency]) => ({
        userId,
        currency
    }));
}

module.exports = {
    initializeDatabase,
    addShopRole,
    removeShopRole,
    getShopRoles,
    getShopRole,
    purchaseRole,
    getUserPurchases,
    getAllPurchases,
    getUserCurrencyFromDB,
    setUserCurrency,
    addUserCurrency,
    deductUserCurrency,
    getAllUsersWithCurrency
};
