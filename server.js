const express = require('express');
const app = express();
const mqtt = require('mqtt');
const cors = require('cors');

app.use(express.json());
app.use(cors());

// Mantener el estado actual del LED
let currentLedState = "0";

// Almacenar las conexiones SSE activas
let clients = [];

// === CONFIGURACIÓN HIVE MQ ===
const client = mqtt.connect('mqtts://142f14e58fcb4093a50350523ac910b2.s1.eu.hivemq.cloud:8883', {
    username: 'Prueba',
    password: 'Prueba12',
    clientId: 'backend-led-controller'
});

client.on('connect', () => {
    console.log("✅ Conectado a HiveMQ");
    // Suscribirse al tema de estado del LED
    client.subscribe('led/control', (err) => {
        if (err) {
            console.error('Error al suscribirse:', err);
        }
    });
});

client.on('message', (topic, message) => {
    if (topic === 'led/control') {
        currentLedState = message.toString();
        // Notificar a todos los clientes conectados
        sendStateToAllClients(currentLedState);
    }
});

client.on('error', (err) => {
    console.error("❌ Error al conectar con HiveMQ:", err.message);
});

client.on('reconnect', () => {
    console.log("🔄 Reconectando a HiveMQ...");
});

client.on('offline', () => {
    console.warn("🔌 Cliente MQTT está offline");
});

// Función para enviar el estado a todos los clientes SSE
function sendStateToAllClients(state) {
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({ state })}

`);
    });
}

// Endpoint para obtener el estado actual
app.get('/api/led/state', (req, res) => {
    res.json({ state: currentLedState });
});

// Endpoint SSE para recibir actualizaciones en tiempo real
app.get('/api/led/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    clients.push(newClient);

    // Enviar el estado actual inmediatamente
    res.write(`data: ${JSON.stringify({ state: currentLedState })}

`);

    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
    });
});

app.post('/api/led', (req, res) => {
    const { state } = req.body;
    console.log(`Estado recibido: ${state}`);
    currentLedState = state;
    client.publish('led/control', state);
    // Notificar a todos los clientes del nuevo estado
    sendStateToAllClients(state);
    res.json({ success: true });
});

app.listen(3001, '0.0.0.0', () => {
    console.log("📡 Servidor corriendo en http://localhost:3001");
});