require('dotenv').config();
const app = require('./app');
const { getDB } = require('./db');

const PORT = process.env.PORT || 3000;
/* we do not want the Express server to start
acceoting the requests until we have a 
successful connection to the database*/
async function startServer() {
    try {
        await getDB();

        app.listen(PORT, () => {
            console.log(`DevBoard API running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }   
}

startServer();