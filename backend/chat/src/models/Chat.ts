import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChat extends Document {
  users: mongoose.Types.ObjectId[];
  latestMessage: {
    text: string;
    sender: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema<IChat> = new Schema(
  {
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    latestMessage: {
      text: {
        type: String,
      },
      sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Chat: Model<IChat> = mongoose.model<IChat>("Chat", ChatSchema);

export default Chat;