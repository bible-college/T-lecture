import { useState, useEffect } from 'react';

export const useCurrentUser = () => {
    const [userLabel, setUserLabel] = useState('User');

    useEffect(() => {
        try {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                // 이름이 없으면 이메일, 그것도 없으면 기본값
                setUserLabel(user.name || user.email || 'User');
            }
        } catch (e) {
            console.error('Failed to parse user info:', e);
        }
    }, []);

    return userLabel;
};