require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

const app = express();
app.use(cors()); // Permite que tu frontend se conecte
app.use(express.json({ limit: '50mb' })); // Límite alto por los PDFs en Base64

// Inicializar Firebase oculto en el backend
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// 1. Ruta para obtener datos de Firebase
app.get('/api/sync/:collection', async (req, res) => {
    try {
        const docSnap = await getDoc(doc(db, "estucontaDB", req.params.collection));
        if (docSnap.exists()) {
            res.json({ success: true, data: docSnap.data().payload });
        } else {
            res.json({ success: true, data: null });
        }
    } catch (error) {
        console.error(`Error cargando ${req.params.collection}:`, error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// 2. Ruta para guardar datos en Firebase
app.post('/api/sync/:collection', async (req, res) => {
    try {
        const { payload } = req.body;
        await setDoc(doc(db, "estucontaDB", req.params.collection), { payload: payload });
        res.json({ success: true, message: 'Guardado correctamente' });
    } catch (error) {
        console.error(`Error guardando ${req.params.collection}:`, error);
        res.status(500).json({ success: false, error: 'Error del servidor al guardar' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Backend corriendo en http://localhost:${PORT}`);
});