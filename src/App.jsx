import React, { useState, useEffect } from "react";
import {
  Layout,
  Button,
  Upload,
  Avatar,
  message
} from "antd";
import {
  UploadOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { api } from "./api";
import AuthForm from "./components/AuthForm";
import ChatLayout from "./components/ChatLayout";
import "./App.css";

const { Header, Content } = Layout;

function App() {
  const [auth, setAuth] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedAuth = localStorage.getItem("auth");
    const savedPhoto = localStorage.getItem("profilePhoto");
    if (savedAuth) {
      setAuth(JSON.parse(savedAuth));
    }
    if (savedPhoto) {
      setProfilePhoto(savedPhoto);
    }
  }, []);

  useEffect(() => {
    if (auth) {
      localStorage.setItem("auth", JSON.stringify(auth));
    } else {
      localStorage.removeItem("auth");
    }
  }, [auth]);

  useEffect(() => {
    if (profilePhoto) {
      localStorage.setItem("profilePhoto", profilePhoto);
    } else {
      localStorage.removeItem("profilePhoto");
    }
  }, [profilePhoto]);

  const handleLogout = () => {
    setAuth(null);
    setProfilePhoto(null);
    localStorage.clear();
    navigate("/");
  };

  const handleProfilePhotoChange = async (file) => {
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const res = await api.updateProfilePhoto(auth.token, formData);
      setProfilePhoto(res.data.profilePhoto);
      setAuth((prev) => ({
        ...prev,
        user: { ...prev.user, profilePhoto: res.data.profilePhoto }
      }));
      message.success("Profile photo updated!");
    } catch (err) {
      message.error("Failed to update profile photo");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          color: "#fff",
          fontSize: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <span style={{ display: "flex", alignItems: "center" }}>
          MERN Chat App
          {auth && (
            <span
              style={{
                marginLeft: 24,
                display: "flex",
                alignItems: "center"
              }}
            >
              <Avatar
                size={32}
                src={profilePhoto || auth.user.profilePhoto}
                icon={<UserOutlined />}
                style={{ marginRight: 8 }}
              />
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  handleProfilePhotoChange(file);
                  return false;
                }}
                accept="image/*"
              >
                <Button
                  icon={<UploadOutlined />}
                  size="small"
                  style={{ marginRight: 8 }}
                >
                  Edit Photo
                </Button>
              </Upload>
            </span>
          )}
        </span>
        {auth && (
          <Button onClick={handleLogout} type="primary" danger size="small">
            Logout
          </Button>
        )}
      </Header>

      <Content style={{ padding: "24px", background: "#fff" }}>
        <Routes>
          <Route
            path="/"
            element={
              !auth ? (
                <AuthForm onAuth={setAuth} setProfilePhoto={setProfilePhoto} />
              ) : (
                <Navigate to="/chat" replace />
              )
            }
          />

          <Route
            path="/chat"
            element={
              auth ? (
                <ChatLayout
                  user={auth.user}
                  token={auth.token}
                  profilePhoto={profilePhoto}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </Content>
    </Layout>
  );
}

export default App;
