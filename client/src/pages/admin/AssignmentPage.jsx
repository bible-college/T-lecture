import React from 'react';
import { SuperAdminHeader } from '../../features/admin/ui/headers/SuperAdminHeader';
import { ContentWrapper } from '../../shared/ui/ContentWrapper';
import { AssignmentWorkspace } from '../../features/assignment/ui/AssignmentWorkspace';
import { useAuthGuard } from '../../features/auth/model/useAuthGuard';

const AssignmentPage = () => {
    const { shouldRender } = useAuthGuard('ADMIN');
    if (!shouldRender) return null;

    return (
        <>
            <SuperAdminHeader />
            <ContentWrapper scrollable={false}>
                <AssignmentWorkspace />
            </ContentWrapper>
        </>
    );
};

export default AssignmentPage;