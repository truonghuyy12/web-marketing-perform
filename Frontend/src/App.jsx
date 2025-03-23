import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Landing from './pages/Landing';
import News from './pages/News';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword'; // Import ResetPassword component
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Employees from './pages/Employees';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Activate from './pages/Activate';
import CreatePost from './pages/CreatePost';
import UpdatePost from './pages/UpdatePost';
import BlogManager from './pages/BlogManager';
import Public_Products from './pages/Public_Products';
import Chatbot from './components/Chatbot';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <div className="app">
        <Router>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/news" element={<News />} />
            <Route path="/login" element={<Login />} />
            <Route path="/activate/:token" element={<Activate />} />
            {/* Add ResetPassword route */}
            <Route path="/resetPassword/:token" element={<ResetPassword />} />
            <Route path="/public-products" element={<Public_Products />} />
            <Route path="/dashboard" element={<MainLayout />}>
              <Route index element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="products" element={
                <PrivateRoute>
                  <Products />
                </PrivateRoute>
              } />
              <Route path="categories" element={
                <PrivateRoute>
                  <Categories />
                </PrivateRoute>
              } />
              <Route path="employees" element={
                <PrivateRoute>
                  <Employees />
                </PrivateRoute>
              } />
              <Route path="transactions" element={
                <PrivateRoute>
                  <Transactions />
                </PrivateRoute>
              } />
              <Route path="reports" element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              } />
              <Route path="settings" element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              } />
              <Route path="create-post" element={
                <PrivateRoute>
                  <CreatePost />
                </PrivateRoute>
              } />
              <Route path="update-post/:id" element={
                <PrivateRoute>
                  <UpdatePost />
                </PrivateRoute>
              } />
              <Route path="blog-manager" element={
                <PrivateRoute>
                  <BlogManager />
                </PrivateRoute>
              } />
            </Route>
          </Routes>
        </Router>
        <Chatbot />
      </div>
    </>
  );
}

// PrivateRoute component
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
}

export default App;