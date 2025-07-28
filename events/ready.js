const { Events, REST, Routes } = require('discord.js');
const config = require('../config');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`🚀 Bot is ready! Logged in as ${client.user.tag}`);
        
        // Register slash commands
        try {
            const commands = [];
            const commandsPath = path.join(__dirname, '..', 'commands');
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                }
            }

            const rest = new REST().setToken(config.token);

            console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);

            let data;
            if (config.guildId) {
                // Register commands for specific guild (faster for development)
                data = await rest.put(
                    Routes.applicationGuildCommands(config.clientId, config.guildId),
                    { body: commands }
                );
            } else {
                // Register commands globally (takes up to 1 hour to propagate)
                data = await rest.put(
                    Routes.applicationCommands(config.clientId),
                    { body: commands }
                );
            }

            console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
            
            // Set bot status
            client.user.setActivity('One Piece Quizzes | /quiz', { type: 'PLAYING' });
            
        } catch (error) {
            console.error('❌ Error registering slash commands:', error);
        }
    }
};
