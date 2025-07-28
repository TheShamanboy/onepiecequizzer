# One Piece Discord Quiz Bot

A Discord bot that posts daily One Piece quizzes where users can earn currency (Berries) and purchase roles from a shop.
By TSB
## Features

- **Quiz System**: Start quizzes with `/quiz` command or automatic daily quizzes
- **Currency System**: Earn Berries by answering questions correctly
- **Role Shop**: Purchase Discord roles using earned currency
- **Leaderboard**: View top currency holders with `/leaderboard`
- **Admin Commands**: Add roles to shop with `/add-role`

## Setup

### 1. Discord Application Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "Bot" section and create a bot
4. Copy the bot token and application client ID

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DISCORD_TOKEN`: Your bot's secret token from Discord Developer Portal
- `CLIENT_ID`: Your Discord application's client ID

Optional variables:
- `GUILD_ID`: Your server ID for faster command registration during development
- `DAILY_QUIZ_TIME`: Time for daily quizzes (default: 12:00)
- `TIMEZONE`: Timezone for scheduling (default: UTC)

### 3. Bot Permissions
When inviting the bot to your server, make sure it has these permissions:
- Send Messages
- Use Slash Commands
- Manage Roles
- Add Reactions
- Read Message History

## Commands

- `/quiz [difficulty]` - Start a One Piece quiz
- `/shop` - Browse and purchase roles with currency
- `/leaderboard [limit]` - View top currency holders
- `/add-role <role> <price> [name]` - (Admin) Add role to shop

## How It Works

1. Users answer quiz questions to earn Berries
2. First correct answer gets full reward, second gets 75%, third gets 50%
3. Earned currency can be spent in the role shop
4. Daily quizzes are automatically posted at the scheduled time
5. Leaderboard tracks top earners

## Files Structure

- `commands/` - Slash command implementations
- `events/` - Discord.js event handlers
- `utils/` - Database and currency management
- `data/` - JSON storage for questions, roles, and purchases
- `scheduler.js` - Daily quiz automation