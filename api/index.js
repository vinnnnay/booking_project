const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('./models/User.js');

require('dotenv').config();

const app = express();
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';

// ✅ Connect DB ONCE
(async () => {
  try {
    await mongoose.connect('mongodb+srv://vinay:GTieLzwOHt4wXVZQ@cluster0.yi3zu0m.mongodb.net/?appName=Cluster0');
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Mongo error:", err);
  }
})();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: 'http://localhost:5173',
}));

app.get('/api/test', (req, res) => {
  res.json('test ok');
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });

  if (!userDoc) return res.json('not found');

  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (!passOk) return res.status(422).json('pass not ok');

  jwt.sign(
    { email: userDoc.email, id: userDoc._id },
    jwtSecret,
    {},
    (err, token) => {
      if (err) throw err;
      res.cookie('token', token).json(userDoc);
    }
  );
});

app.get('/profile', async (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.json(null);

  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const { name, email, _id } = await User.findById(userData.id);
    res.json({ name, email, _id });
  });
});

app.post('/api/logout', (req, res) => {
  res.cookie('token', '').json(true);
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
