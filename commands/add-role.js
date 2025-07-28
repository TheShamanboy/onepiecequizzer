const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addShopRole } = require('../utils/database');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-role')
        .setDescription('Add a role to the shop (Admin only)')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to add to the shop')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('price')
                .setDescription('The price of the role in currency')
                .setRequired(true)
                .setMinValue(1)
        )
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Custom name for the role in shop (optional)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Check if user has admin permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: '❌ You need Administrator permissions to use this command!',
                    ephemeral: true
                });
            }

            const role = interaction.options.getRole('role');
            const price = interaction.options.getInteger('price');
            const customName = interaction.options.getString('name') || role.name;

            // Validate role
            if (role.managed) {
                return await interaction.reply({
                    content: '❌ Cannot add managed roles (bot roles) to the shop!',
                    ephemeral: true
                });
            }

            if (role.id === interaction.guild.id) {
                return await interaction.reply({
                    content: '❌ Cannot add the @everyone role to the shop!',
                    ephemeral: true
                });
            }

            // Check if bot can manage this role
            const botMember = interaction.guild.members.me;
            if (role.position >= botMember.roles.highest.position) {
                return await interaction.reply({
                    content: '❌ I cannot manage this role! Please move my role above it in the role hierarchy.',
                    ephemeral: true
                });
            }

            // Add role to shop
            const success = addShopRole({
                roleId: role.id,
                name: customName,
                price: price,
                addedBy: interaction.user.id,
                addedAt: new Date().toISOString()
            });

            if (!success) {
                return await interaction.reply({
                    content: '❌ This role is already in the shop!',
                    ephemeral: true
                });
            }

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Role Added to Shop')
                .setDescription(`Successfully added **${customName}** to the role shop!`)
                .addFields(
                    { name: 'Role', value: `<@&${role.id}>`, inline: true },
                    { name: 'Price', value: `${config.emojis.berry} ${price} ${config.currencyName}`, inline: true },
                    { name: 'Added By', value: `${interaction.user}`, inline: true }
                )
                .setColor(config.colors.success)
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

            // Log to console
            console.log(`Role added to shop: ${customName} (${role.id}) for ${price} ${config.currencyName} by ${interaction.user.tag}`);

        } catch (error) {
            console.error('Error in add-role command:', error);
            await interaction.reply({
                content: '❌ An error occurred while adding the role to the shop!',
                ephemeral: true
            });
        }
    }
};
