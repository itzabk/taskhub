import { userSchema } from './schema.js';
import bcrypt from 'bcrypt';

export default class UserModel {
  constructor({ mongooseConnection }) {
    this.User = mongooseConnection.model('User', userSchema);
  }

  async findById(userId) {
    return this.User.findOne({ _id: userId, isDeleted: false });
  }

  async findByEmail(email) {
    return this.User.findOne({ email, isDeleted: false });
  }

  async findByEmailWithPassword(email) {
    return this.User.findOne({ email, isDeleted: false }).select('+password');
  }

  async create({ name, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.User.create({
      name,
      email,
      password: hashedPassword,
    });
  }

  async findByIdAndUpdate(userId, updates) {
    return this.User.findOneAndUpdate({ _id: userId, isDeleted: false }, updates, {
      new: true,
      runValidators: true,
    });
  }

  async softDelete(userId) {
    return this.User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }

  async findAll(skip = 0, limit = 10) {
    const users = await this.User.find({ isDeleted: false })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.User.countDocuments({ isDeleted: false });

    return { users, total };
  }

  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
