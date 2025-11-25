import React from 'react';
import { MainLayout } from '../shared/ui/MainLayout';
import { InstructorDashboard } from '../features/user/ui/InstructorDashboard';

const InstructorPage = () => {
    return (
        <MainLayout>
        <InstructorDashboard />
        </MainLayout>
    );
};

export default InstructorPage;