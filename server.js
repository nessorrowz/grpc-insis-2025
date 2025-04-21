const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const readline = require("readline"); // Untuk menerima input dari terminal

const PROTO_PATH = path.join(__dirname, "service.proto");

// Load proto definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, // Pertahankan nama field (tidak diubah jadi camelCase)
  longs: String, // Tipe data 'long' direpresentasikan sebagai string
  enums: String, // Tipe data 'enum' direpresentasikan sebagai string
  defaults: true, // Sertakan field default
  oneofs: true, // Sertakan oneof
});

// Load package definition sebagai gRPC object
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const examplePackage = protoDescriptor.example; // 'example' adalah nama package di proto

// Implementasi Service Methods
const server = new grpc.Server();

// Setup readline untuk menerima input dari terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 1. Unary RPC: SayHello
const serviceImplementation = {
  sayHello: (call, callback) => {
    const name = call.request.name;
    console.log(`[Server] Received SayHello request for: ${name}`);

    rl.question(
      "Enter a response message for SayHello: ",
      (responseMessage) => {
        callback(null, { message: responseMessage }); // Kirim response tunggal dari input terminal
      }
    );
  },

  // 2. Server Streaming RPC: StreamGreetings
  streamGreetings: (call) => {
    const name = call.request.name;
    console.log(`[Server] Received StreamGreetings request for: ${name}`);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      const greeting = { message: `Greeting #${count} to ${name}` };
      console.log(`[Server] Sending greeting: ${greeting.message}`);
      call.write(greeting); // Kirim data stream ke client

      if (count >= 5) {
        clearInterval(interval);
        call.end(); // Sinyalkan akhir stream dari server
        console.log("[Server] Finished sending greetings.");
      }
    }, 1000); // Kirim setiap 1 detik

    // Opsional: Handle jika client membatalkan stream
    call.on("cancelled", () => {
      console.log("[Server] Client cancelled StreamGreetings.");
      clearInterval(interval);
    });
  },

  // 3. Client Streaming RPC: AddNumbers
  addNumbers: (call, callback) => {
    console.log("[Server] Received AddNumbers stream request.");
    let sum = 0;

    // Terima data stream dari client
    call.on("data", (request) => {
      sum += request.number;
      console.log(
        `[Server] Received number: ${request.number}, current sum: ${sum}`
      );
    });

    // Client selesai mengirim stream
    call.on("end", () => {
      console.log(
        `[Server] Client finished sending numbers. Final sum: ${sum}`
      );
      callback(null, { sum: sum }); // Kirim response tunggal
    });

    // Handle error dari client stream
    call.on("error", (err) => {
      console.error("[Server] Error in AddNumbers stream:", err);
      callback(err);
    });
  },

  // 4. Bidirectional Streaming RPC: Chat
  chat: (call) => {
    console.log("[Server] Chat stream opened.");

    // Terima data stream dari client
    call.on("data", (request) => {
      console.log(
        `[Server] Received chat message from ${request.sender}: ${request.message}`
      );

      rl.question("Enter your reply message: ", (responseMessage) => {
        // Kirim response balik ke client (contoh: echo)
        const response = {
          sender: "Server",
          message: `Server received: "${responseMessage}"`,
        };
        console.log(`[Server] Sending chat response: ${response.message}`);
        call.write(response);
      });
    });

    // Client selesai mengirim stream
    call.on("end", () => {
      console.log("[Server] Client ended chat stream.");
      call.end(); // Server juga selesai mengirim (opsional, tergantung logika)
    });

    // Handle error
    call.on("error", (err) => {
      console.error("[Server] Error in Chat stream:", err);
      // Tidak perlu call.end() lagi jika sudah error
    });

    // Handle client cancellation
    call.on("cancelled", () => {
      console.log("[Server] Client cancelled chat stream.");
    });
  },
};

// Tambahkan service ke server
server.addService(examplePackage.MyService.service, serviceImplementation);

// Jalankan server
const serverAddress = "0.0.0.0:50051";
server.bindAsync(
  serverAddress,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error("Failed to bind server:", err);
      return;
    }
    console.log(`gRPC server running at ${serverAddress}`);
    server.start();
  }
);
