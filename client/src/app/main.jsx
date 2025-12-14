// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css'; // 전역 스타일 여기서 불러옴
import '../features/schedule/styles/Calendar.css'; // 캘린더 스타일도 여기서
import ErrorBoundary from '../shared/ui/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/* 🟢 여기서 감싸주면 앱 전체의 에러를 잡습니다 */}
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);