module.exports = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID || null, // Leave null for global commands
    dailyQuizTime: process.env.DAILY_QUIZ_TIME || '12:00', // 24-hour format HH:MM
    timezone: process.env.TIMEZONE || 'UTC',
    currencyName: 'Berries', // One Piece currency
    colors: {
        primary: '#FF6B35',
        success: '#28A745',
        error: '#DC3545',
        warning: '#FFC107',
        info: '#17A2B8'
    },
    emojis: {
        berry: '<:berry:1399129328524071104>',
        trophy: '🏆',
        crown: '👑',
        ship: '⛵',
        sword: '⚔️'
    }
};
