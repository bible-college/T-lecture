import React from 'react';
import { CommonHeader } from '../../../../shared/ui/CommonHeader';
// ⚠️ 경로가 멀다면 절대 경로(@/shared/...) 설정을 추천하지만, 일단 상대경로로 작성했습니다.
import { useCurrentUser } from '../../../auth/model/useCurrentUser';

export const SuperAdminHeader = () => {
    const userLabel = useCurrentUser();

    const links = [
    ];

    return (
        <CommonHeader
            title="슈퍼 관리자"
            userLabel={userLabel}
            links={links}
        />
    );
};