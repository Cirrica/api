console.clear();

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const emailRouter = require('./routes/email');
app.use('/email', emailRouter);

const userRouter = require('./routes/user');
app.use('/user', userRouter);

const githubRouter = require('./routes/github');
app.use('/github-webhook', githubRouter);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
