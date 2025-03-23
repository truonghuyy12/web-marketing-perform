import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Box,
    TextField,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Avatar,
    ListItemAvatar,
    Collapse,
    Typography,
    Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CloseIcon from '@mui/icons-material/Close';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [backendUrl, setBackendUrl] = useState(process.env.REACT_APP_API_URL);
    const [context, setContext] = useState([]);
    const chatBoxRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false); // State để quản lý trạng thái mở rộng

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (inputText.trim()) {
            const userMessage = { role: "user", parts: inputText };
            setMessages(prevMessages => [...prevMessages, userMessage]);
            setInputText('');

            try {
                const response = await axios.post(`${backendUrl}/dashboard/chat`, {
                    message: inputText,
                    context: context
                });

                const geminiResponse = response.data.response;
                const newContext = response.data.context;

                setMessages(prevMessages => [...prevMessages, { role: "model", parts: geminiResponse }]);
                setContext(newContext);

            } catch (error) {
                console.error("Error sending message:", error);
                setMessages(prevMessages => [...prevMessages, { role: "error", parts: "Failed to get response." }]);
            }
        }
    };

    const toggleChat = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <Box
            sx={{
                position: 'fixed', // Cố định vị trí
                bottom: 20,
                right: 20,
                zIndex: 1000, // Đảm bảo hiển thị trên các thành phần khác
            }}
        >
            {/* Nút bong bóng chat */}
            {!isExpanded && (
                <IconButton
                    onClick={toggleChat}
                    sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: 'primary.dark',
                        },
                    }}
                >
                    <ChatBubbleIcon />
                </IconButton>
            )}

            {/* Khung chat (ẩn/hiện) */}
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Paper elevation={5} sx={{
                    width: 320, // Kích thước nhỏ hơn cho bong bóng chat
                    maxWidth: '90vw', // Đảm bảo responsive trên mobile
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    overflow: 'hidden', // Ẩn các phần tử tràn ra ngoài
                    boxShadow: '0px 3px 5px rgba(0,0,0,0.2)', // Tạo hiệu ứng bóng đổ
                }}>
                    {/* Header của khung chat */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: 'primary.main',
                        color: 'white',
                    }}>
                        <Typography variant="subtitle1">Chatbot</Typography>
                        <IconButton onClick={toggleChat} sx={{ color: 'white' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Nội dung chat */}
                    <Box
                        ref={chatBoxRef}
                        sx={{
                            flexGrow: 1,
                            overflowY: 'auto',
                            padding: '8px',
                            height: 200, // Chiều cao cố định cho scroll
                        }}
                    >
                        <List>
                            {messages.map((message, index) => (
                                <ListItem key={index} alignItems="flex-start" sx={{ padding: '4px 0' }}>
                                    <ListItemAvatar sx={{ mr: 1 }}>
                                        <Avatar sx={{ bgcolor: message.role === 'model' ? 'secondary.main' : 'success.main', width: 24, height: 24, fontSize: '0.75rem' }}>
                                            {message.role === 'model' ? 'G' : 'U'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={message.parts}
                                        secondary={message.role}
                                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>

                    {/* Input và nút gửi */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px',
                        borderTop: '1px solid #e0e0e0',
                    }}>
                        <TextField
                            fullWidth
                            label="Type your message..."
                            variant="outlined"
                            size="small"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') sendMessage(); }}
                            sx={{ mr: 1 }}
                        />
                        <IconButton color="primary" onClick={sendMessage} aria-label="send">
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Paper>
            </Collapse>
        </Box>
    );
};

export default Chatbot;