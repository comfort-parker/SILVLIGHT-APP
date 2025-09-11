import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  }
});

export const Newsletter = mongoose.model('Newsletter', newsletterSchema);
