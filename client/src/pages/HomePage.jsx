// src/pages/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-5">Welcome to T-LECTURE</h1>
      <div className="space-x-4">
        <button onClick={() => navigate('/login')} className="px-4 py-2 bg-blue-500 text-white rounded">로그인 하러가기</button>
        <button onClick={() => navigate('/register')} className="px-4 py-2 bg-gray-500 text-white rounded">회원가입 하러가기</button>
      </div>
    </div>
  );
};

export default HomePage;