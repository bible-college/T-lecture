import React from 'react';
import { SuperAdminHeader } from '../../features/admin/ui/headers/SuperAdminHeader';
import { ContentWrapper } from '../../shared/ui/ContentWrapper';
import { SuperAdminDashboard } from '../../features/admin/ui/SuperAdminDashboard';
import { useAuthGuard } from '../../features/auth/model/useAuthGuard';

const SuperAdminPage = () => {
    const { shouldRender } = useAuthGuard('SUPER_ADMIN');
    if (!shouldRender) return null;

    return (
        <>
            <SuperAdminHeader />
            <ContentWrapper>
                <SuperAdminDashboard />
            </ContentWrapper>
        </>
    );
};

export default SuperAdminPage;