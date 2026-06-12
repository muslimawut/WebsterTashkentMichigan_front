import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getResponse } from '../utils/chatKnowledgeBase';
import { sendMessageToGemini } from '../utils/gemini';
import { Bot, X, Send, MessageCircle } from 'lucide-react';
import ApiService from '../api/api';

const HIDDEN_ROUTES = ['/writing-exam', '/writing-test', '/writing-instructions'];

const Chatbot = () => {
    const { pathname } = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [datesContext, setDatesContext] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! / Assalomu alaykum! / Здравствуйте!\nPlease select your language / Iltimos, tilni tanlang / Пожалуйста, выберите язык:",
            sender: 'bot',
            timestamp: new Date(),
            options: [
                { label: "🇺🇸 English", value: "Hello" },
                { label: "🇺🇿 O'zbekcha", value: "Assalomu alaykum" },
                { label: "🇷🇺 Русский", value: "Здравствуйте" }
            ]
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Hide when payment modal is open
    useEffect(() => {
        const handleOpen  = () => { setIsPaymentOpen(true);  setIsOpen(false); };
        const handleClose = () => setIsPaymentOpen(false);
        document.addEventListener('payment-modal-open',  handleOpen);
        document.addEventListener('payment-modal-close', handleClose);
        return () => {
            document.removeEventListener('payment-modal-open',  handleOpen);
            document.removeEventListener('payment-modal-close', handleClose);
        };
    }, []);

    // Fetch dates for context
    useEffect(() => {
        const fetchDatesForContext = async () => {
            try {
                const dates = await ApiService.getDates();
                if (dates && dates.length > 0) {
                    const formattedDetails = dates.map(d =>
                        `- Date: ${new Date(d.date).toLocaleDateString()}, Time: ${d.time}, Spots Left: ${d.spots_left}, Status: ${d.is_full ? 'FULL' : 'Available'}`
                    ).join('\n');
                    setDatesContext(formattedDetails);
                }
            } catch (error) {
                console.error("Chatbot failed to fetch dates:", error);
            }
        };
        fetchDatesForContext();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        processMessage(input);
    };

    const handleOptionSelect = (option) => {
        processMessage(option.value);
    };

    const processMessage = async (text) => {
        const userMessage = {
            id: Date.now(),
            text: text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Prepare history for Gemini
        // We filter out the first greeting message and only send simplified text history
        const history = messages.slice(1).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        try {
            // Try Gemini First with Live Context
            const aiResponse = await sendMessageToGemini(text, history, datesContext);

            let botResponseText;
            if (aiResponse) {
                botResponseText = aiResponse;
            } else {
                // Fallback to local logic if NO API KEY or Error
                // Simulate delay for local logic
                await new Promise(r => setTimeout(r, 1000));
                botResponseText = getResponse(text);
            }

            const botMessage = {
                id: Date.now() + 1,
                text: botResponseText,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Chat error:", error);
            // Fallback on unexpected error
            const botResponseText = getResponse(text);
            const botMessage = {
                id: Date.now() + 1,
                text: botResponseText,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    if (isPaymentOpen || HIDDEN_ROUTES.some(r => pathname.startsWith(r))) return null;

    return (
        <div className="fixed bottom-28 right-4 lg:bottom-6 lg:right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <div
                className={`bg-white rounded-2xl shadow-2xl w-[350px] sm:w-[380px] overflow-hidden transition-all duration-300 transform origin-bottom-right mb-4 pointer-events-auto ${isOpen
                    ? 'scale-100 opacity-100 visible'
                    : 'scale-90 opacity-0 translate-y-10 pointer-events-none invisible'
                    }`}
                style={{ maxHeight: '80vh' }}
            >
                {/* Header */}
                <div className="bg-[#024890] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl text-white">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Webster Bot</h3>
                            <p className="text-blue-200 text-xs flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                Online
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages Area */}
                <div className="h-[400px] overflow-y-auto p-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-200">
                    <div className="flex flex-col gap-4">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                        ? 'bg-[#024890] text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                        }`}
                                >
                                    {msg.text.split('\n').map((line, i) => (
                                        <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                                    ))}

                                    {/* Options / Buttons */}
                                    {msg.options && (
                                        <div className="flex flex-col gap-2 mt-3">
                                            {msg.options.map((option, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionSelect(option)}
                                                    className="bg-white text-[#024890] border border-[#024890]/20 py-2 px-4 rounded-xl text-sm font-medium hover:bg-[#024890]/5 transition-colors text-left"
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div
                                        className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                                            }`}
                                    >
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question..."
                        className="flex-1 bg-gray-100 text-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#024890]/50 transition-all border border-transparent focus:bg-white"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="w-10 h-10 rounded-full bg-[#024890] text-white flex items-center justify-center hover:bg-[#023770] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-md"
                    >
                        <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 rounded-full bg-[#024890] text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 pointer-events-auto group relative"
                >
                    {/* Pulse Effect */}
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#024890] opacity-20 animate-ping"></span>

                    <svg className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>

                    {/* Notification Badge */}
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
            )}
        </div>
    );
};

export default Chatbot;
