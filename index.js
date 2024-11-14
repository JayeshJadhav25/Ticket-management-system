const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
    return res.status(200).json({
        message: "Server is running.."
    })
})

app.use('/api', userRoutes);
app.use('/api', ticketRoutes);

app.use((err, req, res, next) => {
    const statusCode = res.statusCode || 500;
    res.status(statusCode).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});