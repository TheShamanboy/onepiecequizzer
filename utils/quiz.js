const fs = require('fs');
const path = require('path');

const QUESTIONS_FILE = path.join(__dirname, '..', 'data', 'questions.json');
let questions = [];

/**
 * Load questions from file
 */
function loadQuestions() {
    try {
        if (fs.existsSync(QUESTIONS_FILE)) {
            const questionsData = fs.readFileSync(QUESTIONS_FILE, 'utf8');
            questions = JSON.parse(questionsData);
            console.log(`✅ Loaded ${questions.length} quiz questions`);
        } else {
            console.log('⚠️ Questions file not found, using empty array');
            questions = [];
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        questions = [];
    }
}

/**
 * Get a random question based on difficulty
 */
function getRandomQuestion(difficulty = 'random') {
    if (questions.length === 0) {
        loadQuestions();
    }

    if (questions.length === 0) {
        return null;
    }

    let filteredQuestions;
    
    if (difficulty === 'random') {
        filteredQuestions = questions;
    } else {
        filteredQuestions = questions.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (filteredQuestions.length === 0) {
        // Fallback to all questions if no questions found for difficulty
        filteredQuestions = questions;
    }

    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    const question = filteredQuestions[randomIndex];

    // Add reward based on difficulty
    const baseReward = 50;
    const difficultyMultipliers = {
        'easy': 1,
        'medium': 1.5,
        'hard': 2
    };

    const multiplier = difficultyMultipliers[question.difficulty.toLowerCase()] || 1;
    const reward = Math.floor(baseReward * multiplier) + Math.floor(Math.random() * baseReward);

    return {
        ...question,
        reward
    };
}

/**
 * Get questions by difficulty
 */
function getQuestionsByDifficulty(difficulty) {
    if (questions.length === 0) {
        loadQuestions();
    }

    return questions.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
}

/**
 * Get all questions
 */
function getAllQuestions() {
    if (questions.length === 0) {
        loadQuestions();
    }
    
    return [...questions];
}

/**
 * Add a new question
 */
function addQuestion(questionData) {
    questions.push(questionData);
    saveQuestions();
}

/**
 * Save questions to file
 */
function saveQuestions() {
    try {
        fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
    } catch (error) {
        console.error('Error saving questions:', error);
    }
}

// Load questions on module initialization
loadQuestions();

module.exports = {
    getRandomQuestion,
    getQuestionsByDifficulty,
    getAllQuestions,
    addQuestion,
    loadQuestions
};
