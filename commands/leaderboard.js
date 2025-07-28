const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTopUsers } = require('../utils/currency');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top currency holders')
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of users to display (1-25)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(25)
        ),

    async execute(interaction) {
        try {
            const limit = interaction.options.getInteger('limit') || 10;
            const topUsers = getTopUsers(limit);

            if (topUsers.length === 0) {
                return await interaction.reply({
                    content: `📊 No users found with ${config.currencyName} yet! Start answering quizzes to earn some!`,
                    ephemeral: true
                });
            }

            const leaderboardEmbed = new EmbedBuilder()
                .setTitle(`${config.emojis.trophy} Currency Leaderboard`)
                .setDescription(`Top ${topUsers.length} ${config.currencyName} holders`)
                .setColor(config.colors.primary)
                .setTimestamp()
                .setFooter({ text: `Total users with ${config.currencyName}: ${topUsers.length}` });

            // Build leaderboard description
            let description = '';
            const medals = ['🥇', '🥈', '🥉'];
            
            for (let i = 0; i < topUsers.length; i++) {
                const user = topUsers[i];
                const position = i + 1;
                const medal = medals[i] || `**#${position}**`;
                
                try {
                    // Try to fetch user info
                    const discordUser = await interaction.client.users.fetch(user.userId);
                    const displayName = discordUser.username;
                    
                    description += `${medal} **${displayName}** - ${config.emojis.berry} ${user.currency.toLocaleString()} ${config.currencyName}\n`;
                } catch (error) {
                    // If user can't be fetched, show user ID
                    description += `${medal} **User ${user.userId}** - ${config.emojis.berry} ${user.currency.toLocaleString()} ${config.currencyName}\n`;
                }
            }

            leaderboardEmbed.setDescription(description);

            // Add user's position if they're not in the top list
            const userCurrency = getUserCurrency(interaction.user.id);
            if (userCurrency > 0) {
                const allUsers = getTopUsers(1000); // Get more users to find position
                const userPosition = allUsers.findIndex(u => u.userId === interaction.user.id) + 1;
                
                if (userPosition > limit) {
                    leaderboardEmbed.addFields({
                        name: 'Your Position',
                        value: `**#${userPosition}** - ${config.emojis.berry} ${userCurrency.toLocaleString()} ${config.currencyName}`,
                        inline: false
                    });
                }
            }

            await interaction.reply({ embeds: [leaderboardEmbed] });

        } catch (error) {
            console.error('Error in leaderboard command:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching the leaderboard!',
                ephemeral: true
            });
        }
    }
};

// Import getUserCurrency function
const { getUserCurrency } = require('../utils/currency');
