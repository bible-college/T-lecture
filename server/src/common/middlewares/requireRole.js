// common/middlewares/requireRole.js

function requireRole(requiredRole) {
    return (req, res, next) => {
        // [DEBUG] 권한 검사 로그
        console.log(`[Permission] 검사 시작: 필요권한=${requiredRole}`);
        console.log(`[Permission] 현재유저:`, req.user);

        const user = req.user;
        if (!user) {
            console.log(`[Permission] 실패: 유저 없음`);
            return res.status(401).json({ error: '인증이 필요합니다.' });
        }

        if (requiredRole === 'ADMIN') {
            if (!user.isAdmin) {
                return res.status(403).json({ error: '관리자만 접근할 수 있습니다.' });
            }
            return next();
        }

        if (requiredRole === 'INSTRUCTOR') {
            if (!user.isInstructor) {
                // [DEBUG] 클라이언트에게 원인 알려주기
                return res.status(403).json({
                    error: `강사 권한이 없습니다. (ID: ${user.id}, isInstructor: ${user.isInstructor})`,
                    debug: user
                });
            }
            return next();
        }

        // 혹시 옛날 'USER' 같은 값 쓰던 곳이 있으면 여기서 처리
        if (user.role !== requiredRole) {
            return res.status(403).json({ error: '권한이 없습니다.' });
        }

        next();
    };
}

module.exports = requireRole;
