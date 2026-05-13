import { Schema } from 'mongoose';

const subTaskSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
    index: true,
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
});

export default function (mongooseConnection) {
  return mongooseConnection.model('SubTask', subTaskSchema);
}
