import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});  // ✅ renamed to plural

  const { socket, axios, user } = useContext(AuthContext); // assuming you have `user`

  // ✅ Fetch all users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMesseges); // ✅ match backend key spelling
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Fetch all messages for selected user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
        // Reset unseen count
        setUnseenMessages((prev) => ({ ...prev, [userId]: 0 }));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Send message
  const sendMessage = async (receiverId, messageData) => {
    try {
      const { data } = await axios.post(`/api/messages/send/${receiverId}`, messageData);
      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Real-time message listener
  const subscribeToMessages = () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prevUnseen) => ({
          ...prevUnseen,
          [newMessage.senderId]: (prevUnseen[newMessage.senderId] || 0) + 1,
        }));
      }
    });
  };

  const unsubscribeFromMessages = () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    setSelectedUser,
    getUsers,
    getMessages,
    sendMessage,
    unseenMessages,
    setUnseenMessages,
    // setMessages,
    currentUserId: user?._id,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
