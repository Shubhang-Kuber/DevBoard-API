const express = require('express');
//app acts like the main handler of the HTTP requests
const app = express();

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/auth', require('./routes/auth'));
app.use('/tasks', require('./routes/tasks'));
app.use('/bookmarks', require('./routes/bookmarks'));
app.use('/tags', require('./routes/tags'));

app.get('/', (req, res) => {
    res.json({ message: 'DevBoard API is running!' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route Not Found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
});

module.exports = app;