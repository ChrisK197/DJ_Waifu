import express from 'express';
const app = express();
import constructorMethod from './routes/index.js';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

constructorMethod(app);

app.listen(3000, () => {
    console.log("We've now got a server!");
    console.log('Your routes will be running on http://localhost:3000');
});