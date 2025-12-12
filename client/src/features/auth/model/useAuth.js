import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, logout as logoutApi } from '../authApi';
import { USER_ROLES, ADMIN_LEVELS } from '../../../shared/constants/roles'; 

export const useAuth = () => {
    const navigate = useNavigate();

    const loginMutation = useMutation({
        mutationFn: loginApi,
        // 🔴 수정 전: onSuccess: (data) => { 
        // 🟢 수정 후: variables(로그인 시도할 때 보낸 데이터)를 받아옵니다.
        onSuccess: (data, variables) => {
            const user = data.user;
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('currentUser', JSON.stringify(user));

            const role = determineUserRole(user);
            localStorage.setItem('userRole', role);

            // 🔴 수정 전: handleNavigation(role, navigate);
            // 🟢 수정 후: loginType을 중간에 넣어줍니다.
            handleNavigation(role, variables.loginType, navigate);
        },
        onError: (error) => {
            console.error("로그인 실패:", error);
        }
    });

    const logoutMutation = useMutation({
        mutationFn: logoutApi,
        onSettled: () => {
            localStorage.clear();
            navigate('/login');
        }
    });

    return {
        login: loginMutation.mutate,     
        logout: logoutMutation.mutate,   
        isLoading: loginMutation.isPending, 
        error: loginMutation.error,         
    };
};

/**
 * 도우미 함수들
 */
function determineUserRole(user) {
    if (user.isAdmin) {
        return user.adminLevel === ADMIN_LEVELS.SUPER ? 'SUPER_ADMIN' : 'ADMIN';
    }
    return USER_ROLES.USER;
}

// 이 함수가 3개의 인자를 받으므로, 호출할 때도 3개를 맞춰줘야 합니다.
function handleNavigation(role, loginType, navigate) {
    // 1. '일반/강사' 탭(GENERAL)으로 로그인했다면, 
    //    관리자 권한이 있어도 무조건 사용자 메인 페이지로 보냄
    if (loginType === USER_ROLES.GENERAL) {
        navigate('/user-main');
        return;
    }

    // 2. '관리자' 탭으로 로그인했을 때만 권한에 따라 관리자 페이지로 이동
    switch (role) {
        case 'SUPER_ADMIN':
            navigate('/admin/super');
            break;
        case 'ADMIN':
            navigate('/admin');
            break;
        default:
            navigate('/user-main');
    }
}