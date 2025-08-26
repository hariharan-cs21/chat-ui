import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Upload, Avatar } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const API_URL = 'https://chat-backend-b5cl.onrender.com/api/auth';

export default function AuthForm({ onAuth, setProfilePhoto }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [photo, setPhoto] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!photo) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(photo);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [photo]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            if (isLogin) {
                const res = await axios.post(`${API_URL}/login`, values);
                onAuth(res.data);
                message.success('Login successful');
            } else {
                const formData = new FormData();
                formData.append('username', values.username);
                formData.append('email', values.email);
                formData.append('password', values.password);
                if (photo) formData.append('photo', photo);

                const res = await axios.post(`${API_URL}/register`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                onAuth(res.data);
                message.success('Registration successful');
            }
        } catch (err) {
            message.error(err.response?.data?.msg || 'Error');
        }
        setLoading(false);
    };

    const handlePhotoUpload = ({ file }) => {
        setPhoto(file);
        setProfilePhoto(file);
    };

    return (
        <div style={{ maxWidth: 350, margin: 'auto', marginTop: 60 }}>
            <Title level={3} style={{ textAlign: 'center' }}>
                {isLogin ? 'Login' : 'Register'}
            </Title>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                name="authForm"
                initialValues={{ email: '', password: '' }}
                autoComplete="off"
            >
                {!isLogin && (
                    <Form.Item
                        name="username"
                        label="Username"
                        rules={[{ required: true, message: 'Please enter a username' }]}
                    >
                        <Input prefix={<UserOutlined />} />
                    </Form.Item>
                )}

                <Form.Item
                    name="email"
                    label="Email"
                    rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="password"
                    label="Password"
                    rules={[{ required: true, message: 'Please enter a password' }]}
                >
                    <Input.Password />
                </Form.Item>

                {!isLogin && (
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 4 }}>Profile Photo</label>
                        <Upload beforeUpload={() => false} showUploadList={false} onChange={handlePhotoUpload}>
                            <Button icon={<UploadOutlined />}>Select Photo</Button>
                        </Upload>
                        {previewUrl && (
                            <Avatar src={previewUrl} size={48} style={{ marginTop: 8 }} />
                        )}
                    </div>
                )}

                <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                        {isLogin ? 'Login' : 'Register'}
                    </Button>
                </Form.Item>
            </Form>

            <Button type="link" block onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </Button>
        </div>
    );
}
