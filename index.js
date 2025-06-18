console.clear();

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware: CORS and JSON parsing early
app.use(cors());
app.use(express.json());

// Routers
const githubRouter = require('./routes/github');
app.use('/github-webhook', githubRouter);

const emailRouter = require('./routes/email');
app.use('/email', emailRouter);

const userRouter = require('./routes/user');
app.use('/user', userRouter);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
