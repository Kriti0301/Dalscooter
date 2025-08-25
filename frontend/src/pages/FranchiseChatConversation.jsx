import { useEffect, useState, useRef } from "react";
import { Send, ArrowLeft, MessagesSquare, User, Clock, Check, CheckCheck, X, MoreVertical } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../api/axiosInstance";

const FranchiseChatConversation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { tripId, franchiseId, customerName, customerId } = location.state || {};
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [lastSeen, setLastSeen] = useState(null);
    const [showOptions, setShowOptions] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when component mounts
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!tripId) return;

        const fetchMessages = async () => {
            try {
                setIsConnected(true);
                const res = await axiosInstance.get(`${process.env.REACT_APP_BACKEND_BASE_URL}/messages/${tripId}`);
                const data = res.data;

                const normalized = data.map((msg) => ({
                    id: msg.id || Math.random().toString(36).substr(2, 9),
                    message: msg.message || msg.messageText || "",
                    sender: msg.sender || msg.messageType || (msg.senderId === franchiseId ? "franchise" : "customer"),
                    timestamp: msg.created_at,
                    status: msg.status || (msg.senderId === franchiseId ? "sent" : "received")
                }));

                setMessages(normalized);
                setLastSeen(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            } catch (err) {
                console.error("Failed to fetch messages:", err);
                setIsConnected(false);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [tripId, franchiseId]);

    const handleSend = async () => {
        if (loading || !newMessage.trim()) return;

        const trimmedMessage = newMessage.trim();
        const tempId = Math.random().toString(36).substr(2, 9);

        try {
            setLoading(true);

            // Optimistically show message in UI
            const optimisticMessage = {
                id: tempId,
                message: trimmedMessage,
                sender: "franchise",
                timestamp: new Date().toISOString(),
                status: "sending"
            };

            setMessages((prev) => [...prev, optimisticMessage]);
            setNewMessage("");

            const res = await axiosInstance.post(`${process.env.REACT_APP_BACKEND_BASE_URL}/messages/send-customer-message`, 
                {
                    trip_id: tripId,
                    senderId: franchiseId,
                    senderType: "franchise",
                    message: trimmedMessage,
                
            });

            if (res.status === 200) {
                // Update message status to sent
                setMessages((prev) => 
                    prev.map(msg => 
                        msg.id === tempId 
                            ? { ...msg, status: "sent",                
                                timestamp: new Date().toISOString() // Still may differ slightly             
                            }
                            : msg
                    )
                );
            } else {
                throw new Error('Failed to send message');
            }

        } catch (err) {
            console.error("Failed to send message:", err);
            
            // Update message status to failed
            setMessages((prev) => 
                prev.map(msg => 
                    msg.id === tempId 
                        ? { ...msg, status: "failed" }
                        : msg
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatMessageTime = (timestamp) => {
        const utcDateStr = timestamp.endsWith("Z") ? timestamp : timestamp + "Z";

        return new Date(utcDateStr).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: "America/Halifax"
        });
    };

    const getMessageStatusIcon = (status) => {
        switch (status) {
            case "sending":
                return <Clock className="w-3 h-3 text-gray-400 animate-pulse" />;
            case "sent":
                return <Check className="w-3 h-3 text-gray-400" />;
            case "delivered":
                return <CheckCheck className="w-3 h-3 text-gray-400" />;
            case "failed":
                return <X className="w-3 h-3 text-red-400" />;
            default:
                return null;
        }
    };

    return (
        
            <div className="min-h-screen flex bg-gray-100">
        <Sidebar />
        <main className="flex-1 pt-20 lg:pt-0 p-0 overflow-auto">
            {/* Desktop Container */}
            <div className="flex-1 flex justify-center h-screen items-stretch">
                <div className="w-full max-w-4xl bg-white shadow-2xl flex flex-col md:rounded-t-xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 shadow-lg md:rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => navigate(-1)}
                                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold">{customerName}</h1>
                                    <div className="flex items-center gap-2 text-white/80 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                        <span>{isConnected ? 'Online' : 'Connecting...'}</span>
                                        {/* {lastSeen && <span>• Last seen {lastSeen}</span>} */}
                                    </div>
                                </div>
                            </div>
                            {/* <div className="relative">
                                <button 
                                    onClick={() => setShowOptions(!showOptions)}
                                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                                {showOptions && (
                                    <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg py-2 min-w-[150px] z-10">
                                        <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 text-sm">
                                            Trip Details
                                        </button>
                                        <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 text-sm">
                                            Customer Profile
                                        </button>
                                        <button className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 text-sm">
                                            End Chat
                                        </button>
                                    </div>
                                )}
                            </div> */}
                        </div>
                        
                        {/* Trip Info Bar */}
                        {tripId && (
                            <div className="mt-3 p-2 bg-white/10 rounded-lg">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Trip #{tripId.slice(-6)}</span>
                                    <span>Support Chat</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                    <MessagesSquare className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-700 mb-2">No messages yet</h3>
                                <p className="text-sm text-center text-gray-500 max-w-xs">
                                    This is the beginning of your conversation with {customerName}
                                </p>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto space-y-4">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={msg.id || idx}
                                        className={`flex items-end gap-3 ${msg.sender === "franchise" ? "flex-row-reverse" : "flex-row"}`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                                            msg.sender === "franchise" 
                                                ? "bg-green-500 text-white" 
                                                : "bg-blue-500 text-white"
                                        }`}>
                                            {msg.sender === "franchise" ? (
                                                <MessagesSquare className="w-5 h-5" />
                                            ) : (
                                                <User className="w-5 h-5" />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`max-w-md lg:max-w-lg ${msg.sender === "franchise" ? "text-right" : "text-left"}`}>
                                            <div
                                                className={`px-4 py-3 rounded-2xl shadow-sm ${
                                                    msg.sender === "franchise"
                                                        ? "bg-green-500 text-white rounded-br-md"
                                                        : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                                                }`}
                                            >
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                            </div>
                                            <div className={`flex items-center gap-1 mt-1 px-1 ${
                                                msg.sender === "franchise" ? "justify-end" : "justify-start"
                                            }`}>
                                                <span className="text-xs text-gray-400">
                                                    {formatMessageTime(msg.timestamp)}
                                                </span>
                                                {msg.sender === "franchise" && getMessageStatusIcon(msg.status)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <textarea
                                        ref={inputRef}
                                        placeholder="Type your response..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        rows="1"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm"
                                        style={{ 
                                            minHeight: "48px",
                                            maxHeight: "120px"
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={loading || !newMessage.trim()}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                        loading || !newMessage.trim()
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            : "bg-green-500 text-white hover:bg-green-600 active:scale-95 shadow-lg hover:shadow-xl"
                                    }`}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            
                            {/* Status Bar */}
                            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                                <div className="flex items-center gap-2">
                                    {!isConnected && (
                                        <>
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                            <span>Reconnecting...</span>
                                        </>
                                    )}
                                </div>
                                {newMessage.trim() && (
                                    <span className="text-gray-500">Press Enter to send</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Click outside to close options */}
            {showOptions && (
                <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setShowOptions(false)}
                />
            )}
            </main>
        </div>
    );
};
 export default FranchiseChatConversation;