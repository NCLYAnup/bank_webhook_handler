const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

const corsOptions = {
    origin: 'https://paytm-pro-user-app.vercel.app',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));
app.use(express.json());

app.post('/hdfcWebhook', async (req, res) => {
    // TODO: Add zod validation here?
    // TODO: HDFC bank should ideally send us a secret so we know this is sent by them
    const paymentInformation = {
        token: req.body.token,
        userId: req.body.user_identifier,
        amount: req.body.amount,
    };

    try {
        await prisma.$transaction([
            prisma.balance.updateMany({
                where: {
                    userId: Number(paymentInformation.userId),
                },
                data: {
                    amount: {
                        increment: Number(paymentInformation.amount),
                    },
                },
            }),
            prisma.onRampTransaction.updateMany({
                where: {
                    token: paymentInformation.token,
                },
                data: {
                    status: 'Success',
                },
            }),
        ]);

        res.json({
            message: 'Captured',
            amount: Number(paymentInformation.amount),
        });
    } catch (e) {
        console.error(e);
        res.status(411).json({
            message: 'Error while processing webhook',
        });
    }
});
app.listen(3004);
//module.exports = app;
