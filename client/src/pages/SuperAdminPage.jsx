// client/src/pages/SuperAdminPage.jsx
import React from 'react';
import { MainLayout } from '../shared/ui/MainLayout';
import { SuperAdminDashboard } from '../features/admin/ui/SuperAdminDashboard';

const SuperAdminPage = () => {
    return (
        <MainLayout>
        <SuperAdminDashboard />
        </MainLayout>
    );
};

export default SuperAdminPage;
