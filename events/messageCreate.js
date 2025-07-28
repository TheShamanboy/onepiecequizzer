const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;
        
        // This event is mainly for quiz answer collection
        // The actual quiz answer handling is done in the quiz command collector
        
        // You can add other message-based features here if needed
        // For example, automatic currency for certain keywords, etc.
    }
};
