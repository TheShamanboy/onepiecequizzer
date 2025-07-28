const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getRandomQuestion } = require('../utils/quiz');
const { addCurrency, getUserCurrency } = require('../utils/currency');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quiz')
        .setDescription('Start a One Piece quiz!')
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('Choose quiz difficulty')
                .setRequired(false)
                .addChoices(
                    { name: 'Easy', value: 'easy' },
                    { name: 'Medium', value: 'medium' },
                    { name: 'Hard', value: 'hard' },
                    { name: 'Random', value: 'random' }
                )
        ),

    async execute(interaction) {
        try {
            const difficulty = interaction.options.getString('difficulty') || 'random';
            const question = getRandomQuestion(difficulty);
            
            if (!question) {
                return await interaction.reply({
                    content: '❌ No questions available for the selected difficulty!',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.ship} One Piece Quiz`)
                .setDescription(`**Difficulty:** ${question.difficulty.toUpperCase()}\n\n**Question:**\n${question.question}`)
                .addFields(
                    { name: 'Options', value: question.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n') },
                    { name: 'Reward', value: `${config.emojis.berry} ${question.reward} ${config.currencyName}`, inline: true },
                    { name: 'Time Limit', value: '⏱️ 30 seconds', inline: true }
                )
                .setColor(config.colors.primary)
                .setTimestamp()
                .setFooter({ text: 'First correct answer gets full reward!' });

            await interaction.reply({ embeds: [embed] });

            // Store quiz data for answer checking
            const filter = m => !m.author.bot;
            const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });
            
            let winners = [];
            let answered = new Set();

            collector.on('collect', async (message) => {
                if (answered.has(message.author.id)) return;
                
                const userAnswer = message.content.toLowerCase().trim();
                const correctAnswers = [
                    question.correctAnswer.toLowerCase(),
                    question.options[question.correctIndex].toLowerCase(),
                    String.fromCharCode(65 + question.correctIndex).toLowerCase()
                ];

                if (correctAnswers.includes(userAnswer)) {
                    answered.add(message.author.id);
                    
                    let reward = question.reward;
                    let position = winners.length + 1;
                    
                    // Calculate reward based on position
                    if (position === 1) {
                        reward = question.reward;
                    } else if (position === 2) {
                        reward = Math.floor(question.reward * 0.75);
                    } else if (position === 3) {
                        reward = Math.floor(question.reward * 0.5);
                    } else {
                        return; // No reward for 4th place and beyond
                    }

                    winners.push({
                        user: message.author,
                        reward: reward,
                        position: position
                    });

                    await addCurrency(message.author.id, reward);
                    
                    const positionEmoji = position === 1 ? config.emojis.crown : 
                                        position === 2 ? config.emojis.trophy : '🥉';
                    
                    await message.react('✅');
                    await message.reply(`${positionEmoji} ${message.author} is correct! You earned ${config.emojis.berry} **${reward} ${config.currencyName}**!`);

                    if (winners.length >= 3) {
                        collector.stop('max_winners');
                    }
                }
            });

            collector.on('end', async (collected, reason) => {
                if (winners.length === 0) {
                    const noWinnersEmbed = new EmbedBuilder()
                        .setTitle('Quiz Ended')
                        .setDescription(`⏰ Time's up! No one got the correct answer.\n\n**Correct Answer:** ${question.correctAnswer}`)
                        .setColor(config.colors.warning);
                    
                    await interaction.followUp({ embeds: [noWinnersEmbed] });
                } else {
                    // Create results embed
                    const resultsEmbed = new EmbedBuilder()
                        .setTitle(`${config.emojis.trophy} Quiz Results`)
                        .setDescription(`**Correct Answer:** ${question.correctAnswer}`)
                        .setColor(config.colors.success)
                        .setTimestamp();

                    winners.forEach((winner, index) => {
                        const positionEmoji = index === 0 ? config.emojis.crown : 
                                            index === 1 ? config.emojis.trophy : '🥉';
                        const position = ['1st', '2nd', '3rd'][index];
                        
                        resultsEmbed.addFields({
                            name: `${positionEmoji} ${position} Place`,
                            value: `${winner.user} earned ${config.emojis.berry} **${winner.reward} ${config.currencyName}**`,
                            inline: false
                        });
                    });

                    await interaction.followUp({ embeds: [resultsEmbed] });
                }
            });

        } catch (error) {
            console.error('Error in quiz command:', error);
            await interaction.reply({
                content: '❌ An error occurred while starting the quiz!',
                ephemeral: true
            });
        }
    }
};
