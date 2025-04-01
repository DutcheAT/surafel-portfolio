const express = require('express');
const nodemailer = require('nodemailer');
const { Telegraf } = require('telegraf');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const upload = multer();
app.use(upload.none());
app.use(express.static('../public'));
app.use(cors({ origin: `http://localhost:${port}` }));

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Log incoming requests for debugging
app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.url, req.headers);
    console.log('Request body:', req.body);
    next();
});

app.post('/send-message', async (req, res) => {
    const { name, email, subject, message } = req.body || {};

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: 'No form data received.' });
    }

    const userMessage = `
        New Contact Form Submission:
        Name: ${name || 'Not provided'}
        Email: ${email || 'Not provided'}
        Subject: ${subject || 'No subject'}
        Message: ${message || 'No message'}
    `;

    try {
        await transporter.sendMail({
            from: EMAIL_USER,
            to: EMAIL_TO,
            subject: `New Message: ${subject || 'Contact Form Submission'}`,
            text: userMessage,
            html: `<pre>${userMessage.replace(/\n/g, '<br>')}</pre>`,
        });

        await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, userMessage, {
            parse_mode: 'HTML',
        });
 
        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Error sending message. Please try again later.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/../public/index.html');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});