const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

// Esquema de Mongoose
const QuizSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  topic: String,
  questions: [String],
  score: Number,
});

const Quiz = mongoose.model('Quiz', QuizSchema);

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/generate-questions', async (req, res) => {
  const { topic } = req.body;

  const prompt = `Genera exactamente 5 preguntas de opción múltiple sobre el tema de ${topic}. 
Cada pregunta debe tener este formato exacto:
1. ¿Pregunta? 
A) opción A
B) opción B
C) opción C
D) opción D
Respuesta: X`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = completion.choices[0].message.content;

    // Separar en bloques por preguntas
    const questionBlocks = content.split(/\n(?=\d\.)/).filter(Boolean);

    const formattedQuestions = questionBlocks.map((block) => block.trim());

    res.json({ questions: formattedQuestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar preguntas.' });
  }
});

// Guardar resultado del quiz
app.post('/api/save-quiz', async (req, res) => {
  const { topic, questions, score } = req.body;
  try {
    const newQuiz = new Quiz({ topic, questions, score });
    await newQuiz.save();
    res.json({ message: 'Quiz guardado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar el quiz.' });
  }
});

// Conexión MongoDB y servidor
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error conectando a MongoDB:', err);
  });
