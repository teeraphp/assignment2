// TODO: mongoose schema for user
import mongoose from 'mongoose';
import {User} from '../../types/DBTypes';

const userSchema = new mongoose.Schema<User>({
  user_name: String,
  email: {type: String, required: true, unique: true},
  role: {type: String, enum: ['user', 'admin'], default: 'user'},
  password: String,
});

export default mongoose.model<User>('User', userSchema);
