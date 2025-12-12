// src/pages/auth/SignupPage.jsx
import React from 'react';
import { RegisterForm } from '../../features/auth/ui/RegisterForm';
import { ContentWrapper } from '../../shared/ui/ContentWrapper'; // ✅ 수정됨
import { useAuthGuard } from '../../features/auth/model/useAuthGuard';

const SignupPage = () => {
    const { shouldRender } = useAuthGuard('GUEST');

    if (!shouldRender) return null;

    return (
        <ContentWrapper> {/* ✅ 수정됨 */}
            <div className="signup-page-container" style={{ padding: '50px 0' }}>
                <RegisterForm />
            </div>
        </ContentWrapper>
    );
};

export default SignupPage;