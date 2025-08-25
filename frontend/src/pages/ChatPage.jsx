import { useEffect, useState, useRef } from "react";
import { Send, ArrowLeft, MessagesSquare, User, Clock, Check, CheckCheck, MoreVertical, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../api/axiosInstance";

export default function ChatPage({ 
    tripId, 
    customerId, 
    customerName, 
    onBack = null,
    title = "Franchise Support",
    headerColor = "from-blue-500 to-blue-600"
}) {
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
                const { data } = await axiosInstance.get(`${process.env.REACT_APP_BACKEND_BASE_URL}/messages/${tripId}`);

                const normalized = data.map((msg) => ({
                    id: msg.id || Math.random().toString(36).substr(2, 9),
                    message: msg.message || msg.messageText || "",
                    sender: msg.sender || msg.messageType || (msg.senderId === customerId ? "customer" : "franchise"),
                    timestamp: msg.created_at,
                    status: msg.status || (msg.senderId === customerId ? "sent" : "received")
                }));

                setMessages(normalized);
                setLastSeen(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            } catch (err) {
                console.error("Failed to fetch messages:", err);
                setIsConnected(false);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 4000);
        return () => clearInterval(interval);
    }, [tripId, customerId]);

    const handleSend = async () => {
        if (loading || !newMessage.trim()) return;

        const trimmedMessage = newMessage.trim();
        const tempId = Math.random().toString(36).substr(2, 9);

        const messagePayload = {
            trip_id: tripId,
            senderId: customerId,
            message: trimmedMessage,
            senderType: "customer",
            customer_name: customerName,
        };

        try {
            setLoading(true);

            // Optimistically show message in UI with temporary ID
            const optimisticMessage = {
                id: tempId,
                message: trimmedMessage,
                sender: "customer",
                timestamp: new Date().toISOString(),
                status: "sending"
            };

            setMessages((prev) => [...prev, optimisticMessage]);
            setNewMessage("");

            console.log(messagePayload);

            // Send message to TripMessages
            await axiosInstance.post(`${process.env.REACT_APP_BACKEND_BASE_URL}/messages/send-customer-message`, messagePayload);

            // Send to PendingChatRequests table (for franchise queue)
            const pendingRequestPayload = {
                trip_id: tripId,
                customer_id: customerId,
                customer_name: customerName,
                message: trimmedMessage,
            };

            console.log(pendingRequestPayload);
            await axiosInstance.post(
                `${process.env.REACT_APP_BACKEND_BASE_URL}/messages/create-pending-request`,
                pendingRequestPayload
            );

            // Update message status to sent
            setMessages((prev) => 
                prev.map(msg => 
                    msg.id === tempId 
                        ? { ...msg, status: "sent" }
                        : msg
                )
            );

        } catch (err) {
            console.error("Failed to send message or save pending chat", err);
            
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
        <div className="flex-1 flex justify-center h-screen items-stretch">

            {/* Desktop Container */}
            <div className="flex-1 flex justify-center items-stretch">
                <div className="w-full max-w-4xl bg-white shadow-2xl flex flex-col md:rounded-t-xl">
                    {/* Header */}
                    <div className={`bg-gradient-to-r ${headerColor} text-white p-4 shadow-lg md:rounded-t-xl`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {onBack && (
                                    <button 
                                        onClick={onBack}
                                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                )}
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <MessagesSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold">{title}</h1>
                                    <div className="flex items-center gap-2 text-white/80 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                        <span>{isConnected ? 'Online' : 'Connecting...'}</span>
                                        {/* {lastSeen && <span>• Last seen {lastSeen}</span>} */}
                                    </div>
                                </div>
                            </div>
                           
                        </div>
                        
                        {/* Trip Info Bar */}
                        {tripId && (
                            <div className="mt-3 p-2 bg-white/10 rounded-lg">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Trip #{tripId.slice(-6)}</span>
                                    {/* <span>{customerName}</span> */}
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
                                <h3 className="text-lg font-medium text-gray-700 mb-2">Start a conversation</h3>
                                <p className="text-sm text-center text-gray-500 max-w-xs">
                                    Connect with our support team. We're here to help with your trip!
                                </p>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto space-y-4">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={msg.id || idx}
                                        className={`flex items-end gap-3 ${msg.sender === "customer" ? "flex-row-reverse" : "flex-row"}`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                                            msg.sender === "customer" 
                                                ? "bg-blue-500 text-white" 
                                                : "bg-gray-300 text-gray-600"
                                        }`}>
                                            {msg.sender === "customer" ? (
                                                <User className="w-5 h-5" />
                                            ) : (
                                                <MessagesSquare className="w-5 h-5" />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`max-w-md lg:max-w-lg ${msg.sender === "customer" ? "text-right" : "text-left"}`}>
                                            <div
                                                className={`px-4 py-3 rounded-2xl shadow-sm ${
                                                    msg.sender === "customer"
                                                        ? "bg-blue-500 text-white rounded-br-md"
                                                        : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                                                }`}
                                            >
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                            </div>
                                            <div className={`flex items-center gap-1 mt-1 px-1 ${
                                                msg.sender === "customer" ? "justify-end" : "justify-start"
                                            }`}>
                                                <span className="text-xs text-gray-400">
                                                    {formatMessageTime(msg.timestamp)}
                                                </span>
                                                {msg.sender === "customer" && getMessageStatusIcon(msg.status)}
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
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        rows="1"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
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
                                            : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-lg hover:shadow-xl"
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
        </div>
        </main>
        </div>

    );

}