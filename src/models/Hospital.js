import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  address: String,
  availableBeds: { type: Number, default: 0 },
  phone: String
});

hospitalSchema.index({ location: '2dsphere' });

export default mongoose.model('Hospital', hospitalSchema); 