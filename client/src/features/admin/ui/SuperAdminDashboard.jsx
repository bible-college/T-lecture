// client/src/features/admin/ui/SuperAdminDashboard.jsx
import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const SuperAdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState('');
    // 컴포넌트 상태에 추가
    const [search, setSearch] = useState('');

    // users 받아온 뒤에 필터링
    const filtered = users.filter(u => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.userEmail || '').toLowerCase().includes(q)
    );
    });

        // ✅ 검색된 것들 중에서 승인된 애들만
    const approvedUsers = filtered.filter(u => u.status === 'APPROVED');

    // ✅ 그룹도 approvedUsers 기준으로 나누기
    const normalUsers = approvedUsers.filter(u => !u.instructor && !u.admin);
    const instructors = approvedUsers.filter(u => !!u.instructor && !u.admin);
    const admins      = approvedUsers.filter(u => !!u.admin);

    useEffect(() => {
        const fetchAll = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('accessToken');

            // 1) 승인된 유저들
            const resApproved = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` },
            });
            const approvedData = await resApproved.json().catch(() => []);
            if (!resApproved.ok) {
            throw new Error(approvedData?.error || '승인 유저 조회 실패');
            }

            // 2) 승인 대기자
            const resPending = await fetch(`${API_BASE_URL}/api/v1/admin/users/pending`, {
            headers: { 'Authorization': `Bearer ${token}` },
            });
            const pendingData = await resPending.json().catch(() => []);
            if (!resPending.ok) {
            throw new Error(pendingData?.error || '승인 대기 목록 조회 실패');
            }

            setUsers(approvedData);
            setPendingUsers(pendingData);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
        };

        fetchAll();
    }, []);

    const token = localStorage.getItem('accessToken');

    const approveUser = async (userId) => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || '승인 실패');

        // 승인되면 pending 목록에서 제거하고 approved users에 추가
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        setUsers(prev => [...prev, data.user]); // adminController가 user 돌려주게 해두면 좋음
    } catch (e) {
        alert(e.message);
    }
    };

    const rejectUser = async (userId) => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/reject`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || '거절 실패');

        setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
        alert(e.message);
    }
    };

    const grantAdmin = async (userId, level = 'GENERAL') => {
        try {
        const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/admin`, {
            method: 'PATCH',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ level }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || '관리자 권한 부여 실패');

        // 성공 후 목록 다시 로드 (간단하게 전체 fetch 재호출)
        setUsers(prev =>
            prev.map(u =>
            u.id === userId
                ? { ...u, admin: { userId, level } }
                : u
            )
        );
        } catch (e) {
        alert(e.message);
        }
    };

    const revokeAdmin = async (userId) => {
        try {
        const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/admin`, {
            method: 'DELETE',
            headers: {
            'Authorization': `Bearer ${token}`,
            },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || '관리자 권한 회수 실패');

        setUsers(prev =>
            prev.map(u =>
            u.id === userId
                ? { ...u, admin: null }
                : u
            )
        );
        } catch (e) {
        alert(e.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
        {/* 상단 헤더: 관리자메인.html 스타일 비슷하게 */}
        <header className="bg-slate-800 text-white h-14 flex items-center justify-between px-6 shadow">
            <div className="flex items-center gap-2 font-semibold">
            <span className="text-green-400 text-lg">●</span>
            <span>슈퍼 관리자 페이지</span>
            </div>
            <nav className="flex gap-5 text-sm text-slate-300">
            <span className="font-bold text-white">권한 관리</span>
            <span className="hover:text-white cursor-not-allowed opacity-60">배정 관리(추후)</span>
            <span className="hover:text-white cursor-not-allowed opacity-60">시스템 설정(추후)</span>
            </nav>
            <div className="text-xs">
            최고관리자 님
            </div>
        </header>

        <main className="p-6">
            <h2 className="text-xl font-bold mb-4">관리자 권한 관리</h2>
            <p className="text-sm text-gray-600 mb-6">
            강사가 아닌 일반 유저 / 강사 / 현재 관리자 목록을 각각 확인하고, 관리자 권한을 부여하거나 회수할 수 있습니다.
            </p>
            {/* 🔍 검색 바 */}
            <div className="mb-4 flex justify-end">
                <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름 또는 이메일 검색"
                className="border border-gray-300 rounded px-3 py-1 text-sm w-full max-w-xs"
                />
            </div>

            {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
                {error}
            </div>
            )}

            {loading ? (
            <div className="text-sm text-gray-500">불러오는 중...</div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1) 일반 유저 */}
                <section className="bg-white rounded-lg shadow border border-gray-200 flex flex-col">
                <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                    <span className="font-semibold text-sm">👤 일반 유저 (강사 아님)</span>
                    <span className="text-xs text-gray-500">{normalUsers.length}명</span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[70vh] p-3 space-y-2">
                    {normalUsers.length === 0 && (
                    <div className="text-xs text-gray-400 text-center mt-4">
                        일반 유저가 없습니다.
                    </div>
                    )}
                    {normalUsers.map(u => (
                    <div
                        key={u.id}
                        className="border rounded-md px-3 py-2 text-xs flex justify-between items-center hover:border-gray-400"
                    >
                        <div>
                        <div className="font-semibold text-gray-800">
                            {u.name || '이름 없음'}
                        </div>
                        <div className="text-gray-500">{u.userEmail}</div>
                        <div className="text-[11px] text-gray-400 mt-1">
                            상태: {u.status}
                        </div>
                        </div>
                        <button
                        onClick={() => grantAdmin(u.id, 'GENERAL')}
                        className="text-[11px] px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                        관리자 부여
                        </button>
                    </div>
                    ))}
                </div>
                </section>

                {/* 2) 강사(현재 관리자 아님) */}
                <section className="bg-white rounded-lg shadow border border-gray-200 flex flex-col">
                <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                    <span className="font-semibold text-sm">📚 강사 (현 관리자 아님)</span>
                    <span className="text-xs text-gray-500">{instructors.length}명</span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[70vh] p-3 space-y-2">
                    {instructors.length === 0 && (
                    <div className="text-xs text-gray-400 text-center mt-4">
                        강사만 있는 유저가 없습니다.
                    </div>
                    )}
                    {instructors.map(u => (
                    <div
                        key={u.id}
                        className="border rounded-md px-3 py-2 text-xs flex justify-between items-center hover:border-gray-400"
                    >
                        <div>
                        <div className="font-semibold text-gray-800">
                            {u.name || '이름 없음'}{' '}
                            {u.instructor?.isTeamLeader && (
                            <span className="ml-1 text-[10px] text-amber-600 border border-amber-300 rounded px-1">
                                팀장
                            </span>
                            )}
                        </div>
                        <div className="text-gray-500">{u.userEmail}</div>
                        <div className="text-[11px] text-gray-400 mt-1">
                            상태: {u.status}
                        </div>
                        </div>
                        <button
                        onClick={() => grantAdmin(u.id, 'GENERAL')}
                        className="text-[11px] px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                        관리자 부여
                        </button>
                    </div>
                    ))}
                </div>
                </section>

                {/* 3) 현 관리자 */}
                <section className="bg-white rounded-lg shadow border border-gray-200 flex flex-col">
                <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                    <span className="font-semibold text-sm">🛡 현재 관리자</span>
                    <span className="text-xs text-gray-500">{admins.length}명</span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[70vh] p-3 space-y-2">
                    {admins.length === 0 && (
                    <div className="text-xs text-gray-400 text-center mt-4">
                        관리자가 없습니다.
                    </div>
                    )}
                    {admins.map(u => (
                    <div
                        key={u.id}
                        className="border rounded-md px-3 py-2 text-xs flex justify-between items-center hover:border-gray-400"
                    >
                        <div>
                        <div className="font-semibold text-gray-800">
                            {u.name || '이름 없음'}
                        </div>
                        <div className="text-gray-500">{u.userEmail}</div>
                        <div className="text-[11px] text-gray-400 mt-1">
                            레벨:{' '}
                            <span className={
                            u.admin?.level === 'SUPER'
                                ? 'text-red-600 font-semibold'
                                : 'text-blue-600 font-semibold'
                            }>
                            {u.admin?.level}
                            </span>
                        </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                        {u.admin?.level !== 'SUPER' && (
                            // 슈퍼 승격 버튼 제거됨
                            null
                        )}
                        {u.admin?.level !== 'SUPER' && (
                            <button
                            onClick={() => revokeAdmin(u.id)}
                            className="text-[11px] px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                            권한 회수
                            </button>
                        )}
                        </div>
                    </div>
                    ))}
                </div>
                </section>
                {/* 4) 가입 신청 목록 */}
                <section className="bg-white rounded-lg shadow border border-gray-200 flex flex-col">
                <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                    <span className="font-semibold text-sm">📝 가입 신청 (승인 대기)</span>
                    <span className="text-xs text-gray-500">{pendingUsers.length}명</span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[70vh] p-3 space-y-2">
                    {pendingUsers.length === 0 && (
                    <div className="text-xs text-gray-400 text-center mt-4">
                        승인 대기 중인 신청이 없습니다.
                    </div>
                    )}
                    {pendingUsers.map(u => (
                    <div
                        key={u.id}
                        className="border rounded-md px-3 py-2 text-xs flex justify-between items-center hover:border-gray-400"
                    >
                        <div>
                        <div className="font-semibold text-gray-800">
                            {u.name || '이름 없음'}
                        </div>
                        <div className="text-gray-500">{u.userEmail}</div>
                        <div className="text-[11px] text-gray-400 mt-1">
                            상태: {u.status}
                        </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                        <button
                            onClick={() => approveUser(u.id)}
                            className="text-[11px] px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            승인
                        </button>
                        <button
                            onClick={() => rejectUser(u.id)}
                            className="text-[11px] px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            거절
                        </button>
                        </div>
                    </div>
                    ))}
                </div>
                </section>


            </div>
            )}
        </main>
        </div>
    );
};
