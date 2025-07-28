const { getUserCurrencyFromDB, setUserCurrency, addUserCurrency, deductUserCurrency, getAllUsersWithCurrency } = require('./database');

/**
 * Get user's current currency
 */
function getUserCurrency(userId) {
    return getUserCurrencyFromDB(userId);
}

/**
 * Add currency to a user
 */
async function addCurrency(userId, amount) {
    if (amount <= 0) return false;
    
    addUserCurrency(userId, amount);
    console.log(`💰 Added ${amount} currency to user ${userId}`);
    return true;
}

/**
 * Deduct currency from a user
 */
async function deductCurrency(userId, amount) {
    if (amount <= 0) return false;
    
    const success = deductUserCurrency(userId, amount);
    if (success) {
        console.log(`💸 Deducted ${amount} currency from user ${userId}`);
    }
    return success;
}

/**
 * Set user's currency to a specific amount
 */
async function setCurrency(userId, amount) {
    if (amount < 0) return false;
    
    setUserCurrency(userId, amount);
    console.log(`💰 Set user ${userId} currency to ${amount}`);
    return true;
}

/**
 * Transfer currency between users
 */
async function transferCurrency(fromUserId, toUserId, amount) {
    if (amount <= 0) return false;
    
    const fromBalance = getUserCurrency(fromUserId);
    if (fromBalance < amount) {
        return false; // Insufficient funds
    }
    
    deductUserCurrency(fromUserId, amount);
    addUserCurrency(toUserId, amount);
    
    console.log(`💸 Transferred ${amount} currency from ${fromUserId} to ${toUserId}`);
    return true;
}

/**
 * Get top users by currency amount
 */
function getTopUsers(limit = 10) {
    const allUsers = getAllUsersWithCurrency();
    return allUsers
        .sort((a, b) => b.currency - a.currency)
        .slice(0, limit);
}

/**
 * Get user's rank by currency
 */
function getUserRank(userId) {
    const allUsers = getAllUsersWithCurrency();
    const sortedUsers = allUsers.sort((a, b) => b.currency - a.currency);
    const userIndex = sortedUsers.findIndex(user => user.userId === userId);
    
    return userIndex === -1 ? null : {
        rank: userIndex + 1,
        total: sortedUsers.length,
        currency: sortedUsers[userIndex].currency
    };
}

/**
 * Get total currency in circulation
 */
function getTotalCurrency() {
    const allUsers = getAllUsersWithCurrency();
    return allUsers.reduce((total, user) => total + user.currency, 0);
}

/**
 * Reset a user's currency
 */
async function resetUserCurrency(userId) {
    setUserCurrency(userId, 0);
    console.log(`🔄 Reset currency for user ${userId}`);
    return true;
}

/**
 * Get currency statistics
 */
function getCurrencyStats() {
    const allUsers = getAllUsersWithCurrency();
    const currencies = allUsers.map(user => user.currency);
    
    if (currencies.length === 0) {
        return {
            totalUsers: 0,
            totalCurrency: 0,
            averageCurrency: 0,
            medianCurrency: 0,
            topUser: null
        };
    }
    
    const sortedCurrencies = [...currencies].sort((a, b) => a - b);
    const total = currencies.reduce((sum, curr) => sum + curr, 0);
    const average = total / currencies.length;
    const median = sortedCurrencies[Math.floor(sortedCurrencies.length / 2)];
    const topUser = getTopUsers(1)[0];
    
    return {
        totalUsers: allUsers.length,
        totalCurrency: total,
        averageCurrency: Math.floor(average),
        medianCurrency: median,
        topUser
    };
}

module.exports = {
    getUserCurrency,
    addCurrency,
    deductCurrency,
    setCurrency,
    transferCurrency,
    getTopUsers,
    getUserRank,
    getTotalCurrency,
    resetUserCurrency,
    getCurrencyStats
};
