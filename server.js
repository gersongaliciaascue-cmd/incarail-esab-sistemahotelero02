require('dotenv').config();  
const express = require('express');  
const mongoose = require('mongoose');  
const cors = require('cors');  
const path = require('path');  
const app = express();  
const PORT = process.env.PORT || 3000;  
  
app.use(cors());  
app.use(express.json());  
app.use(express.static('public'));  
  
// 1. Conexión a MongoDB - NO SE BORRA NUNCA  
mongoose.connect(process.env.MONGO_URI)  
.then(() => console.log('MongoDB Conectado ESAB'))  
.catch(err => console.error(err));  
  
// 2. Esquema de Reserva  
const ReservaSchema = new mongoose.Schema({  
  vivienda: String, // calicanto o andenes  
  habitacion: String,  
  cama: Number,  
  nombre: String,  
  sexo: String, // M o F  
  dni: String,  
  dias: Number,  
  fechaFin: Date // Para que dure los 14 días  
});  
const Reserva = mongoose.model('Reserva', ReservaSchema);  
  
// 3. API: Obtener todas las reservas activas  
app.get('/api/data', async (req, res) => {  
  const hoy = new Date();  
  const data = await Reserva.find({ fechaFin: { $gte: hoy } });  
  res.json(data);  
});  
  
// 4. API: Reservar cama  
app.post('/api/reservar', async (req, res) => {  
  const { vivienda, habitacion, cama, nombre, sexo, dni, dias } = req.body;  
  const fechaFin = new Date();  
  fechaFin.setDate(fechaFin.getDate() + parseInt(dias));  
  
  // Regla: Habitación solo 1 sexo  
  const ocupantes = await Reserva.find({ vivienda, habitacion, fechaFin: { $gte: new Date() } });  
  if (ocupantes.length > 0 && ocupantes[0].sexo!== sexo) {  
    return res.status(400).json({ error: 'Habitación solo para ' + (ocupantes[0].sexo === 'M'? 'Hombres' : 'Mujeres') });  
  }  
  
  // Regla: Cama no repetida  
  const existe = await Reserva.findOne({ vivienda, habitacion, cama, fechaFin: { $gte: new Date() } });  
  if (existe) return res.status(400).json({ error: 'Cama ya ocupada' });  
  
  const nueva = new Reserva({ vivienda, habitacion, cama, nombre, sexo, dni, dias, fechaFin });  
  await nueva.save();  
  res.json({ success: true });  
});  
  
// 5. API: Liberar - Solo con pass Admin  
app.post('/api/liberar', async (req, res) => {  
  const { id, pass } = req.body;  
  if (pass!== 'incarail789') return res.status(401).json({ error: 'Contraseña incorrecta' });  
  await Reserva.findByIdAndDelete(id);  
  res.json({ success: true });  
});  
  
app.listen(PORT, () => console.log(`ESAB 02 corriendo en ${PORT}`));  
