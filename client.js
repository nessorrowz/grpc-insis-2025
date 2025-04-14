// client.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'service.proto');

// Load proto definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

// Load package definition sebagai gRPC object
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const examplePackage = protoDescriptor.example;

// Buat koneksi client (Insecure untuk contoh ini)
const client = new examplePackage.MyService('localhost:50051', grpc.credentials.createInsecure());

// --- Fungsi untuk memanggil setiap mode RPC ---

// 1. Panggil Unary RPC
function callSayHello() {
    console.log('\n--- Calling SayHello (Unary) ---');
    const request = { name: 'NodeJS Client' };
    client.sayHello(request, (error, response) => {
        if (error) {
            console.error('[Client] Error calling SayHello:', error.message);
            return;
        }
        console.log('[Client] SayHello Response:', response.message);
        // Panggil fungsi berikutnya setelah selesai
        callStreamGreetings();
    });
}

// 2. Panggil Server Streaming RPC
function callStreamGreetings() {
    console.log('\n--- Calling StreamGreetings (Server Streaming) ---');
    const request = { name: 'Streaming Fan' };
    const call = client.streamGreetings(request);

    call.on('data', (greeting) => {
        console.log('[Client] Received Greeting:', greeting.message);
    });

    call.on('end', () => {
        console.log('[Client] StreamGreetings finished.');
        // Panggil fungsi berikutnya setelah selesai
        callAddNumbers();
    });

    call.on('error', (error) => {
        console.error('[Client] Error in StreamGreetings:', error.message);
         // Tetap panggil fungsi berikutnya meskipun error
         callAddNumbers();
    });

    call.on('status', (status) => {
        console.log('[Client] StreamGreetings Status:', status);
    });
}

// 3. Panggil Client Streaming RPC
function callAddNumbers() {
    console.log('\n--- Calling AddNumbers (Client Streaming) ---');
    const numbersToSend = [1, 2, 3, 4, 5];

    const call = client.addNumbers((error, response) => {
        // Callback ini dipanggil SETELAH server mengirim response tunggalnya
        if (error) {
            console.error('[Client] Error calling AddNumbers:', error.message);
            // Panggil fungsi berikutnya
            callChat();
            return;
        }
        console.log(`[Client] AddNumbers Response (Sum): ${response.sum}`);
        // Panggil fungsi berikutnya
        callChat();
    });

    // Kirim data stream ke server
    numbersToSend.forEach((num, index) => {
        setTimeout(() => { // Tambahkan sedikit delay untuk simulasi
            const request = { number: num };
            console.log(`[Client] Sending number: ${request.number}`);
            call.write(request);

            // Jika ini angka terakhir, akhiri stream dari client
            if (index === numbersToSend.length - 1) {
                console.log('[Client] Finished sending numbers.');
                call.end(); // Sinyalkan akhir stream dari client
            }
        }, index * 300); // Delay 300ms antar pengiriman
    });
}

// 4. Panggil Bidirectional Streaming RPC
function callChat() {
    console.log('\n--- Calling Chat (Bidirectional Streaming) ---');
    const call = client.chat();
    let messageCounter = 0;
    const messagesToSend = ["Hi Server!", "How are you?", "gRPC is cool!"];

    // Terima data stream dari server
    call.on('data', (response) => {
        console.log(`[Client] Received chat from ${response.sender}: ${response.message}`);
    });

    // Server selesai mengirim
    call.on('end', () => {
        console.log('[Client] Server ended chat stream.');
    });

    // Error stream
    call.on('error', (error) => {
        console.error('[Client] Error in Chat stream:', error.message);
    });

    call.on('status', (status) => {
        console.log('[Client] Chat Status:', status);
    });

    // Kirim data stream ke server secara berkala
    const interval = setInterval(() => {
        if (messageCounter < messagesToSend.length) {
            const request = {
                sender: 'NodeClient',
                message: messagesToSend[messageCounter]
            };
            console.log(`[Client] Sending chat message: ${request.message}`);
            call.write(request);
            messageCounter++;
        } else {
            // Setelah semua pesan terkirim, akhiri stream dari client
            console.log('[Client] Finished sending chat messages.');
            call.end();
            clearInterval(interval);
        }
    }, 800); // Kirim setiap 800ms
}


// Mulai rantai pemanggilan
callSayHello();