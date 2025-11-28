import React from 'react';
import { MainLayout } from '../shared/ui/MainLayout';
import { UserDashboard } from '../features/user/ui/userMainhome';

const UserMainHome = () => {
    return (
        <MainLayout>
        <UserDashboard />
        </MainLayout>
    );
};

export default UserMainHome;

