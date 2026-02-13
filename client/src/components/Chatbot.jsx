import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../api';

export default function Chatbot({ userId, userEmail }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'שלום! 👋 אני עוזר ה-AI של האורווה. אפשר לשאול אותי על סוסים, ביקורים, חיסונים ועוד.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setInput('');
        setLoading(true);

        try {
            const data = await chatWithAI(userId, userMessage, userEmail);
            setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, { role: 'assistant', text: 'מצטער, נתקלתי בשגיאה בתקשורת. (ודא ש-API Key מוגדר)' }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
                🤖
            </button>
        );
    }

    return (
        <div className="chatbot-window">
            <div className="chatbot-header">
                <div className="chatbot-title">
                    <span>🤖</span> AI Assistant
                </div>
                <button className="chatbot-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="chatbot-messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role}`}>
                        <div className="message-bubble">{msg.text}</div>
                    </div>
                ))}
                {loading && (
                    <div className="chat-message assistant">
                        <div className="message-bubble typing">...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chatbot-input-area" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="שאל אותי משהו..."
                    disabled={loading}
                />
                <button type="submit" disabled={!input.trim() || loading}>➤</button>
            </form>
        </div>
    );
}
