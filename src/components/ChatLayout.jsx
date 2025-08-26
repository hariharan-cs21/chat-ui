import React, { useEffect, useRef, useState } from "react";
import {
    Layout,
    List,
    Avatar,
    Input,
    Button,
    Upload,
    message,
    Typography,
    Spin,
    Badge,
} from "antd";
import { api, SOCKET_URL } from '../api';
import { SendOutlined, UploadOutlined, UserOutlined } from "@ant-design/icons";
import { io } from "socket.io-client";
import moment from "moment";

const { Sider, Content } = Layout;
const { TextArea } = Input;

export default function ChatLayout({ user, token, profilePhoto }) {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sendingFile, setSendingFile] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const socketRef = useRef();
    const messagesEndRef = useRef();

    useEffect(() => {
        api.getUsers(token)
            .then((res) => setUsers(res.data.filter((u) => u._id !== user._id)))
            .catch(() => message.error('Failed to load users'));
    }, [token, user]);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);
        socketRef.current.emit("user-online", user._id);
        socketRef.current.on("online-users", setOnlineUsers);
        socketRef.current.on("receive-message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });
        return () => socketRef.current.disconnect();
    }, [user._id]);

    useEffect(() => {
        if (selectedUser) {
            setLoading(true);
            api.getHistory(token, selectedUser._id)
                .then((res) => setMessages(res.data))
                .catch(() => message.error('Failed to load messages'))
                .finally(() => setLoading(false));
        }
    }, [selectedUser, token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input && !file) return;
        try {
            if (file) {
                setSendingFile(true);
                const formData = new FormData();
                formData.append("file", file);
                formData.append("receiver", selectedUser._id);
                formData.append("content", input);
                const res = await api.sendMessage(token, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setMessages((prev) => [...prev, res.data]);
            } else {
                const newMsg = {
                    sender: user._id,
                    receiver: selectedUser._id,
                    content: input,
                    fileUrl: "",
                    timestamp: new Date(),
                };
                socketRef.current.emit("send-message", newMsg);
                setMessages((prev) => [...prev, newMsg]);
            }
        } catch {
            message.error("Failed to send message");
        } finally {
            setInput("");
            setFile(null);
            setSendingFile(false);
        }
    };

    return (
        <Layout style={{ height: "100vh" }}>
            <Sider width={250} style={{ background: "#f0f2f5", borderRight: "1px solid #eee" }}>
                <div style={{ padding: 16, textAlign: "center" }}>
                    <Avatar size={64} src={profilePhoto || user.profilePhoto} icon={<UserOutlined />} />
                    <Typography.Text style={{ display: "block", marginTop: 8 }}>
                        {user.username}
                    </Typography.Text>
                </div>
                <List
                    itemLayout="horizontal"
                    dataSource={users}
                    renderItem={(u) => (
                        <List.Item
                            style={{
                                cursor: "pointer",
                                background: selectedUser?._id === u._id ? "#e6f7ff" : undefined,
                            }}
                            onClick={() => setSelectedUser(u)}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Badge dot={onlineUsers.includes(u._id)} offset={[-5, 30]}>
                                        <Avatar src={u.profilePhoto} icon={<UserOutlined />} />
                                    </Badge>
                                }
                                title={u.username}
                                description={u.email}
                            />
                        </List.Item>
                    )}
                />
            </Sider>

            <Layout style={{ display: "flex", flex: 1, minWidth: 0 }}>
                <Content
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: 16,
                        background: "#fff",
                        minHeight: 0,
                    }}
                >
                    {selectedUser ? (
                        <>
                            <Typography.Title level={4} style={{ margin: 0, marginBottom: 12 }}>
                                {selectedUser.username}
                            </Typography.Title>

                            <div
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    overflowY: "auto",
                                    border: "1px solid #eee",
                                    padding: 12,
                                    background: "#fafafa",
                                    borderRadius: 8,
                                    marginBottom: 12,
                                }}
                            >
                                {loading ? (
                                    <Spin />
                                ) : (
                                    messages
                                        .filter(
                                            (m) =>
                                                (m.sender === user._id && m.receiver === selectedUser._id) ||
                                                (m.sender === selectedUser._id && m.receiver === user._id)
                                        )
                                        .map((msg, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    marginBottom: 12,
                                                    textAlign: msg.sender === user._id ? "right" : "left",
                                                }}
                                            >
                                                <div>
                                                    <Avatar
                                                        src={
                                                            msg.sender === user._id
                                                                ? profilePhoto || user.profilePhoto
                                                                : selectedUser.profilePhoto
                                                        }
                                                        size={32}
                                                        icon={<UserOutlined />}
                                                    />
                                                    <span style={{ marginLeft: 8, fontWeight: 500 }}>
                                                        {msg.sender === user._id ? "You" : selectedUser.username}
                                                    </span>
                                                    <span style={{ marginLeft: 8, color: "#888", fontSize: 12 }}>
                                                        {moment(msg.timestamp || new Date()).format("HH:mm")}
                                                    </span>
                                                </div>
                                                <div style={{ marginTop: 6 }}>
                                                    {msg.content && <span>{msg.content}</span>}
                                                    {msg.fileUrl && (
                                                        <a
                                                            href={msg.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ marginLeft: 8 }}
                                                        >
                                                            <Button icon={<UploadOutlined />} size="small">
                                                                File
                                                            </Button>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: 'center' }}>
                                <TextArea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onPressEnter={(e) => {
                                        e.preventDefault();
                                        sendMessage();
                                    }}
                                    rows={2}
                                    style={{ flex: 1 }}
                                    placeholder="Type a message..."
                                    allowClear
                                    disabled={sendingFile}
                                />
                                <Upload
                                    beforeUpload={(f) => {
                                        setFile(f);
                                        return false;
                                    }}
                                    showUploadList={false}
                                    disabled={sendingFile}
                                >
                                    <Button icon={<UploadOutlined />} style={{ height: 48 }} disabled={sendingFile} />
                                </Upload>
                                {file && !sendingFile && (
                                    <span style={{
                                        maxWidth: 120,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: 13,
                                        color: '#555',
                                        background: '#f5f5f5',
                                        borderRadius: 4,
                                        padding: '2px 8px'
                                    }}>
                                        {file.name}
                                    </span>
                                )}
                                <Button
                                    type="primary"
                                    icon={sendingFile ? <Spin size="small" /> : <SendOutlined />}
                                    onClick={sendMessage}
                                    style={{ height: 48 }}
                                    disabled={sendingFile}
                                >
                                    {sendingFile ? "Sending..." : ""}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div
                            style={{
                                flex: 1,
                                minHeight: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#888",
                            }}
                        >
                            Select a user to start chatting.
                        </div>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
}
