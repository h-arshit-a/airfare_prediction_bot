import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Modal, Form, Input, message } from 'antd';

const AuthButtons: React.FC = () => {
  const { user, signIn, signUp, signOut } = useAuth();
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isSignupModalVisible, setIsSignupModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const showLoginModal = () => {
    setIsLoginModalVisible(true);
  };

  const showSignupModal = () => {
    setIsSignupModalVisible(true);
  };

  const handleLoginCancel = () => {
    setIsLoginModalVisible(false);
    form.resetFields();
  };

  const handleSignupCancel = () => {
    setIsSignupModalVisible(false);
    form.resetFields();
  };

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      await signIn(values.email, values.password);
      setIsLoginModalVisible(false);
      form.resetFields();
      message.success('Successfully logged in!');
    } catch (error: any) {
      message.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (values: { email: string; password: string; confirm: string }) => {
    if (values.password !== values.confirm) {
      message.error('Passwords do not match!');
      return;
    }

    try {
      setLoading(true);
      await signUp(values.email, values.password);
      setIsSignupModalVisible(false);
      form.resetFields();
      message.success('Successfully signed up! Please check your email for confirmation.');
    } catch (error: any) {
      message.error(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      message.success('Successfully logged out!');
    } catch (error: any) {
      message.error(error.message || 'Failed to logout');
    }
  };

  return (
    <div className="auth-buttons">
      {user ? (
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-sm font-medium mr-2">{user.email}</span>
          <button 
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button 
            onClick={showLoginModal}
            className="text-xs px-3 py-1.5 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
          >
            Login
          </button>
          <button 
            onClick={showSignupModal}
            className="text-xs px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
          >
            Sign Up
          </button>
        </div>
      )}

      <Modal
        title="Login"
        open={isLoginModalVisible}
        onCancel={handleLoginCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleLogin} layout="vertical">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Sign Up"
        open={isSignupModalVisible}
        onCancel={handleSignupCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleSignup} layout="vertical">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Sign Up
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AuthButtons; 