const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const PROTO_PATH = path.join(__dirname, "service.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const example = protoDescriptor.example;

const client = new example.MyService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

// Unary endpoint
app.post("/sayHello", (req, res) => {
  const { name } = req.body;
  client.sayHello({ name }, (err, response) => {
    if (err) return res.status(500).send(err);
    res.send(response);
  });
});

// Server Streaming endpoint
app.get("/api/stream-greetings", (req, res) => {
  const { name } = req.query;
  const greetings = [];

  const call = client.streamGreetings({ name });

  call.on("data", (greeting) => {
    greetings.push(greeting.message);
  });

  call.on("end", () => {
    res.json({ greetings });
  });

  call.on("error", (error) => {
    console.error("gRPC error:", error.message);
    res.status(500).json({ error: "Error streaming greetings" });
  });
});

app.post("/api/add-numbers", (req, res) => {
    const numbers = req.body.numbers; // Array of numbers
    if (!Array.isArray(numbers)) {
      return res.status(400).json({ error: "numbers must be an array" });
    }
  
    const call = client.addNumbers((err, response) => {
      if (err) {
        console.error("gRPC error:", err.message);
        return res.status(500).json({ error: "Failed to add numbers" });
      }
      res.json(response); // { sum: ... }
    });
  
    numbers.forEach((num) => {
      call.write({ number: num });
    });
  
    call.end(); // Sinyal bahwa stream dari client selesai
});

const { EventEmitter } = require("events");
const chatEmitters = new Map(); // Map clientId -> { emitter, stream }

app.post("/api/chat/send", (req, res) => {
  const { clientId, sender, message } = req.body;

  if (!clientId) {
    return res.status(400).json({ error: "clientId is required" });
  }

  let chatSession = chatEmitters.get(clientId);

  if (!chatSession) {
    // Kalau belum ada, buat stream baru dan emitter
    const emitter = new EventEmitter();

    const call = client.chat();

    // Simpan session
    chatEmitters.set(clientId, { emitter, call });

    // Dengarkan balasan dari gRPC server
    call.on("data", (response) => {
      emitter.emit("message", response); // 🔥 Ini yang akan dikirim ke client
    });

    call.on("end", () => {
      console.log(`[Chat] Stream ended for clientId: ${clientId}`);
      chatEmitters.delete(clientId);
    });

    call.on("error", (err) => {
      console.error(`[Chat] Error for clientId ${clientId}:`, err);
      emitter.emit("message", { sender: "Server", message: "Error occurred." });
      chatEmitters.delete(clientId);
    });

    chatSession = { emitter, call };
  }

  // Kirim pesan ke gRPC stream
  chatSession.call.write({ sender, message });

  res.json({ status: "sent" });
});

app.get("/api/chat/stream", (req, res) => {
    const clientId = req.query.clientId;
    const session = chatEmitters.get(clientId);
  
    if (!session) {
      return res.status(404).json({ error: "No chat session found" });
    }
  
    const { emitter } = session;
  
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  
    const onMessage = (msg) => {
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
    };
  
    emitter.on("message", onMessage);
  
    req.on("close", () => {
      emitter.removeListener("message", onMessage);
      res.end();
    });
  });
  

app.listen(port, () => {
  console.log(`REST proxy running at http://localhost:${port}`);
});
