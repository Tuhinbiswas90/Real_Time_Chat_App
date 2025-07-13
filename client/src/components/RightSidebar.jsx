import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const [msgImages, setMsgImages] = useState([]);

  // Extract message images
  useEffect(() => {
    const imageList = messages
      .filter((msg) => msg.image)
      .map((msg) => msg.image);
    setMsgImages(imageList);
  }, [messages]);

  return (
    selectedUser && (
      <div
        className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${
          selectedUser ? "max-md:hidden" : ""
        }`}
      >
        {/* Profile Section */}
        <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt="Profile"
            className="w-20 aspect-square rounded-full object-cover border border-white/20"
          />

          <h1 className="px-10 text-xl font-medium mx-auto flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                onlineUsers.includes(selectedUser._id)
                  ? "bg-green-500"
                  : "bg-gray-400"
              }`}
            ></span>
            {selectedUser.fullName}
          </h1>

          {selectedUser.bio && (
            <p className="px-10 mx-auto text-center text-sm text-gray-300">
              {selectedUser.bio}
            </p>
          )}
        </div>

        <hr className="border-[#ffffff30] my-4" />

        {/* Media Section */}
        <div className="px-5 text-xs">
          <p className="font-semibold mb-2">Shared Media</p>
          <div className="max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80">
            {msgImages.length > 0 ? (
              msgImages.map((url, index) => (
                <div
                  key={index}
                  onClick={() => window.open(url)}
                  className="cursor-pointer rounded overflow-hidden"
                >
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              ))
            ) : (
              <p className="col-span-2 text-center text-gray-400 text-xs">
                No media shared yet.
              </p>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white text-sm font-light py-2 px-20 rounded-full cursor-pointer"
        >
          Logout
        </button>
      </div>
    )
  );
};

export default RightSidebar;
