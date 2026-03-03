/**
 * C-FORGIA Chatbot Widget
 * Embed this component in your C-FORGIA CRM to enable AI-powered deal creation
 */

import React, { useState, useEffect, useRef } from 'react';

const ChatbotWidget = ({ 
  apiUrl = 'http://localhost:3000/api/chat/message',
  tenantId,
  position = 'bottom-right', // bottom-right, bottom-left, top-right, top-left
  onFormData = null // Callback function to update form fields: (formData) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        message: 'Hello! I can help you create a deal quickly. Just tell me the details naturally, and I\'ll auto-fill the form for you!\n\nI can understand:\n• School name, type, location, zone, address\n• Contact person, mobile, email\n• Contact person 2, mobile 2\n• Products (IIT, VedicMath, etc.) with price, quantity, strength\n• Lead status, branches, student strength\n• Follow-up date, remarks, assigned executive\n\nExample: "School name ABC School, contact person John Doe, phone 9876543210, email john@abc.com, location Delhi, zone North, products IIT and VedicMath, IIT price 5000 quantity 10"',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      message: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Get phone number from user (if not already provided)
      const phone = extractPhone(userMessage) || '0000000000'; // Fallback

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          message: userMessage,
          source: 'web',
          tenant_id: tenantId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add assistant response
        setMessages(prev => [...prev, {
          role: 'assistant',
          message: data.response,
          timestamp: new Date()
        }]);

        if (data.session_id) {
          setSessionId(data.session_id);
        }

        // If form data is returned, auto-fill the form
        if (data.form_data && onFormData && typeof onFormData === 'function') {
          try {
            onFormData(data.form_data);
            // Show confirmation message
            setTimeout(() => {
              setMessages(prev => [...prev, {
                role: 'system',
                message: '✅ Form fields have been auto-filled! Please review and submit.',
                timestamp: new Date()
              }]);
            }, 500);
          } catch (error) {
            console.error('Error updating form:', error);
          }
        }

        // If lead/deal was created, show success message
        if (data.lead_created) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'system',
              message: '✅ Deal created successfully! You can view it in your deals list.',
              timestamp: new Date()
            }]);
          }, 1000);
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          message: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        message: 'Sorry, I couldn\'t process your message. Please check your connection and try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractPhone = (text) => {
    const phoneRegex = /(\+91[\s-]?)?[6-9]\d{9}/;
    const match = text.match(phoneRegex);
    return match ? match[0].replace(/\D/g, '') : null;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
          aria-label="Open chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-xs text-blue-100">I can help create deals quickly</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.role === 'system'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (e.g., 'School ABC, contact John, phone 9876543210')"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Describe all deal details naturally. I'll auto-fill: school name, contacts, products, location, zone, and more!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
