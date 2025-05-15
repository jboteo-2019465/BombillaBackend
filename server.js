const express = require('express');
const app = express();
const mqtt = require('mqtt');
const cors = require('cors');

app.use(express.json());
app.use(cors());

// === CONFIGURACIÓN HIVE MQ ===
const client = mqtt.connect('mqtts://142f14e58fcb4093a50350523ac910b2.s1.eu.hivemq.cloud:8883', {
    username: 'juanboto',
    password: 'JuanBoteo1@',
    clientId: 'backend-led-controller'
});

client.on('connect', () => {
    console.log("✅ Conectado a HiveMQ");
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

app.post('/api/led', (req, res) => {
    const { state } = req.body;
    console.log(`Estado recibido: ${state}`);
    client.publish('led/control', state);
    res.json({ success: true });
});

app.listen(3001, '0.0.0.0', () => {
    console.log("📡 Servidor corriendo en http://localhost:3001");
});