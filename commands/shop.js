const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserCurrency, deductCurrency } = require('../utils/currency');
const { getShopRoles, purchaseRole } = require('../utils/database');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Browse and purchase roles with your currency'),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const userCurrency = getUserCurrency(userId);
            const shopRoles = getShopRoles();

            if (shopRoles.length === 0) {
                return await interaction.reply({
                    content: '🏪 The shop is currently empty! Ask an admin to add some roles.',
                    ephemeral: true
                });
            }

            // Create shop embed
            const shopEmbed = new EmbedBuilder()
                .setTitle(`${config.emojis.berry} Role Shop`)
                .setDescription(`Your Balance: **${userCurrency} ${config.currencyName}**`)
                .setColor(config.colors.primary)
                .setTimestamp();

            // Add role fields
            shopRoles.forEach((role, index) => {
                const affordableIcon = userCurrency >= role.price ? '✅' : '❌';
                shopEmbed.addFields({
                    name: `${affordableIcon} ${role.name}`,
                    value: `Price: ${config.emojis.berry} **${role.price} ${config.currencyName}**\nRole: <@&${role.roleId}>`,
                    inline: true
                });
            });

            // Create select menu for purchasing
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('purchase_role')
                .setPlaceholder('Select a role to purchase')
                .addOptions(
                    shopRoles.map(role => ({
                        label: role.name,
                        description: `${role.price} ${config.currencyName}`,
                        value: role.roleId,
                        emoji: userCurrency >= role.price ? '✅' : '❌'
                    }))
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({ embeds: [shopEmbed], components: [row] });

            // Handle role purchase
            const filter = i => i.customId === 'purchase_role' && i.user.id === interaction.user.id;
            const collector = interaction.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (selectInteraction) => {
                const selectedRoleId = selectInteraction.values[0];
                const selectedRole = shopRoles.find(role => role.roleId === selectedRoleId);
                
                if (!selectedRole) {
                    return await selectInteraction.reply({
                        content: '❌ Role not found!',
                        ephemeral: true
                    });
                }

                // Check if user already has the role
                const member = selectInteraction.member;
                if (member.roles.cache.has(selectedRoleId)) {
                    return await selectInteraction.reply({
                        content: '❌ You already have this role!',
                        ephemeral: true
                    });
                }

                // Check if user has enough currency
                const currentCurrency = getUserCurrency(userId);
                if (currentCurrency < selectedRole.price) {
                    return await selectInteraction.reply({
                        content: `❌ Insufficient ${config.currencyName}! You need ${selectedRole.price - currentCurrency} more.`,
                        ephemeral: true
                    });
                }

                try {
                    // Add role to user
                    await member.roles.add(selectedRoleId);
                    
                    // Deduct currency
                    await deductCurrency(userId, selectedRole.price);
                    
                    // Log purchase
                    purchaseRole(userId, selectedRoleId, selectedRole.price);

                    const successEmbed = new EmbedBuilder()
                        .setTitle('Purchase Successful!')
                        .setDescription(`You have purchased the **${selectedRole.name}** role!`)
                        .addFields(
                            { name: 'Cost', value: `${config.emojis.berry} ${selectedRole.price} ${config.currencyName}`, inline: true },
                            { name: 'Remaining Balance', value: `${config.emojis.berry} ${getUserCurrency(userId)} ${config.currencyName}`, inline: true }
                        )
                        .setColor(config.colors.success)
                        .setTimestamp();

                    await selectInteraction.reply({ embeds: [successEmbed], ephemeral: true });

                } catch (error) {
                    console.error('Error purchasing role:', error);
                    await selectInteraction.reply({
                        content: '❌ Failed to purchase role. Please try again later.',
                        ephemeral: true
                    });
                }
            });

            collector.on('end', () => {
                // Disable the select menu after timeout
                selectMenu.setDisabled(true);
                interaction.editReply({ components: [new ActionRowBuilder().addComponents(selectMenu)] });
            });

        } catch (error) {
            console.error('Error in shop command:', error);
            await interaction.reply({
                content: '❌ An error occurred while loading the shop!',
                ephemeral: true
            });
        }
    }
};
