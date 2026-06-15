require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { migrate } = require("./database/migrate");
const { seed } = require("./database/seed");
const routes = require("./routes");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(routes);

app.get("/", (req, res) => {
  res.json({ message: "API funcionando!" });
});

const PORT = process.env.PORT || 5000;

migrate()
  .then(() => seed())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Falha ao iniciar:", err);
    process.exit(1);
  });
