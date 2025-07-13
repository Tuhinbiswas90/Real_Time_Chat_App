import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// ✅ Get all users except the logged-in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // ✅ FIX: .select() must be after .find()
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

    // ✅ unseenMessages not misspelled
    const unseenMessages = {};

    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false
      });

      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });

    await Promise.all(promises);

    res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all messages between logged-in user and selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId }
      ]
    });

    // ✅ mark messages as seen
    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );

    res.json({ success: true, messages }); // ✅ FIXED "message" typo
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Mark a specific message as seen
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Send a message to selected user
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    
    // ✅ FIXED: senderId must come from token, NOT param
    const senderId = req.user._id;
    const receiverId = req.params.id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl
    });

    // ✅ Emit to receiver's socket
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
