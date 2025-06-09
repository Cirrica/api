console.clear();

const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

const emailRouter = require('./routes/email');
app.use('/email', emailRouter);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
