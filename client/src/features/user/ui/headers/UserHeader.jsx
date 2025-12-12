import React from 'react';
import { CommonHeader } from '../../../../shared/ui/CommonHeader';
import { useCurrentUser } from '../../../auth/model/useCurrentUser';

export const UserHeader = () => {
    const userLabel = useCurrentUser();

    const links = [
        { label: '내 정보', path: '/user-main/profile' },
        { label: '신청 현황', path: '/user-main/status' },
    ];

    return (
        <CommonHeader
            title="T-Lecture"
            userLabel={userLabel}
            links={links}
        />
    );
};