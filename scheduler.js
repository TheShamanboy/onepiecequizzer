const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const { getRandomQuestion } = require('./utils/quiz');
const { addCurrency, getUserCurrency } = require('./utils/currency');
const config = require('./config');

let dailyQuizChannelId = null;
let isSchedulerActive = false;

/**
 * Set the channel for daily quizzes
 */
function setDailyQuizChannel(channelId) {
    dailyQuizChannelId = channelId;
    console.log(`📅 Daily quiz channel set to: ${channelId}`);
}

/**
 * Start daily quiz scheduler
 */
function scheduleDaily(client) {
    if (isSchedulerActive) {
        console.log('⚠️ Scheduler is already active');
        return;
    }

    // Parse the daily quiz time
    const [hour, minute] = config.dailyQuizTime.split(':').map(Number);
    
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        console.error('❌ Invalid daily quiz time format. Using default time 12:00');
        scheduleDaily(client, '12:00');
        return;
    }

    // Create cron expression for daily execution
    const cronExpression = `${minute} ${hour} * * *`;
    
    console.log(`📅 Scheduling daily quiz at ${config.dailyQuizTime} (${config.timezone})`);
    console.log(`📅 Cron expression: ${cronExpression}`);

    // Schedule the daily quiz
    cron.schedule(cronExpression, async () => {
        await executeDailyQuiz(client);
    }, {
        timezone: config.timezone,
        scheduled: true
    });

    isSchedulerActive = true;
    console.log('✅ Daily quiz scheduler started successfully');
}

/**
 * Execute daily quiz
 */
async function executeDailyQuiz(client) {
    try {
        console.log('🎯 Executing daily quiz...');

        // If no channel is set, try to find a general channel
        if (!dailyQuizChannelId) {
            // Try to find a suitable channel in each guild
            const guilds = client.guilds.cache;
            
            for (const [guildId, guild] of guilds) {
                const channel = findSuitableChannel(guild);
                if (channel) {
                    dailyQuizChannelId = channel.id;
                    console.log(`📅 Auto-selected channel: ${channel.name} in ${guild.name}`);
                    break;
                }
            }

            if (!dailyQuizChannelId) {
                console.log('⚠️ No suitable channel found for daily quiz');
                return;
            }
        }

        const channel = client.channels.cache.get(dailyQuizChannelId);
        if (!channel) {
            console.log('❌ Daily quiz channel not found');
            return;
        }

        // Get random question for daily quiz
        const question = getRandomQuestion('random');
        if (!question) {
            console.log('❌ No questions available for daily quiz');
            return;
        }

        // Create daily quiz embed
        const embed = new EmbedBuilder()
            .setTitle(`${config.emojis.ship} Daily One Piece Quiz!`)
            .setDescription(`**Difficulty:** ${question.difficulty.toUpperCase()}\n\n**Question:**\n${question.question}`)
            .addFields(
                { name: 'Options', value: question.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n') },
                { name: 'Reward', value: `${config.emojis.berry} ${question.reward} ${config.currencyName}`, inline: true },
                { name: 'Time Limit', value: '⏱️ 5 minutes', inline: true }
            )
            .setColor(config.colors.primary)
            .setTimestamp()
            .setFooter({ text: '🏆 First correct answer gets full reward! Second gets 75%, third gets 50%' });

        const message = await channel.send({ 
            content: '🌅 **Good morning everyone! Time for your daily One Piece quiz!**',
            embeds: [embed] 
        });

        // Set up answer collection
        const filter = m => !m.author.bot;
        const collector = channel.createMessageCollector({ filter, time: 300000 }); // 5 minutes

        let winners = [];
        let answered = new Set();

        collector.on('collect', async (collectedMessage) => {
            if (answered.has(collectedMessage.author.id)) return;

            const userAnswer = collectedMessage.content.toLowerCase().trim();
            const correctAnswers = [
                question.correctAnswer.toLowerCase(),
                question.options[question.correctIndex].toLowerCase(),
                String.fromCharCode(65 + question.correctIndex).toLowerCase()
            ];

            if (correctAnswers.includes(userAnswer)) {
                answered.add(collectedMessage.author.id);

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
                    user: collectedMessage.author,
                    reward: reward,
                    position: position
                });

                await addCurrency(collectedMessage.author.id, reward);

                const positionEmoji = position === 1 ? config.emojis.crown : 
                                    position === 2 ? config.emojis.trophy : '🥉';

                await collectedMessage.react('✅');
                await collectedMessage.reply(`${positionEmoji} ${collectedMessage.author} is correct! You earned ${config.emojis.berry} **${reward} ${config.currencyName}**!`);

                if (winners.length >= 3) {
                    collector.stop('max_winners');
                }
            }
        });

        collector.on('end', async (collected, reason) => {
            if (winners.length === 0) {
                const noWinnersEmbed = new EmbedBuilder()
                    .setTitle('Daily Quiz Ended')
                    .setDescription(`⏰ Time's up! No one got the correct answer.\n\n**Correct Answer:** ${question.correctAnswer}`)
                    .setColor(config.colors.warning);

                await channel.send({ embeds: [noWinnersEmbed] });
            } else {
                // Create results embed
                const resultsEmbed = new EmbedBuilder()
                    .setTitle(`${config.emojis.trophy} Daily Quiz Results`)
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

                resultsEmbed.addFields({
                    name: '📅 Next Quiz',
                    value: `Tomorrow at ${config.dailyQuizTime} ${config.timezone}`,
                    inline: false
                });

                await channel.send({ embeds: [resultsEmbed] });
            }
        });

        console.log('✅ Daily quiz executed successfully');

    } catch (error) {
        console.error('❌ Error executing daily quiz:', error);
    }
}

/**
 * Find a suitable channel for daily quizzes
 */
function findSuitableChannel(guild) {
    // Priority list of channel names to look for
    const preferredNames = ['general', 'quiz', 'games', 'bot', 'commands', 'chat'];
    
    // First, try to find channels with preferred names
    for (const name of preferredNames) {
        const channel = guild.channels.cache.find(ch => 
            ch.isTextBased() && 
            ch.name.toLowerCase().includes(name) &&
            ch.permissionsFor(guild.members.me).has(['SendMessages', 'ViewChannel'])
        );
        if (channel) return channel;
    }
    
    // If no preferred channel found, get the first available text channel
    const firstChannel = guild.channels.cache.find(ch => 
        ch.isTextBased() && 
        ch.permissionsFor(guild.members.me).has(['SendMessages', 'ViewChannel'])
    );
    
    return firstChannel;
}

/**
 * Stop the scheduler
 */
function stopScheduler() {
    isSchedulerActive = false;
    console.log('🛑 Daily quiz scheduler stopped');
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
    return {
        active: isSchedulerActive,
        channelId: dailyQuizChannelId,
        nextQuizTime: config.dailyQuizTime
    };
}

module.exports = {
    scheduleDaily,
    setDailyQuizChannel,
    executeDailyQuiz,
    stopScheduler,
    getSchedulerStatus
};
