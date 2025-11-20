const nodemailer = require('nodemailer');

// 환경 변수에 따라 전송 객체(Transporter) 생성
const transporter = nodemailer.createTransport({
  // 1. Gmail처럼 service 명칭이 있는 경우
  service: process.env.EMAIL_SERVICE || undefined, 
  
  // 2. Naver 등 일반 SMTP 설정을 사용하는 경우 (service가 없을 때 적용됨)
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // 587 포트는 보통 false (TLS 사용)
  
  // 3. 인증 정보 (필수)
  auth: {
    user: process.env.EMAIL_USER, // 발신자 계정 아이디
    pass: process.env.EMAIL_PASS, // 발신자 계정 비밀번호 (또는 앱 비밀번호)
  },
});

exports.sendPasswordResetEmail = async (toEmail, token) => {
  // 비밀번호 재설정 링크 (프론트엔드 주소)
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"T-LECTURE" <${process.env.EMAIL_USER}>`, // 발신자 표시
    to: toEmail,                                      // 수신자 (강사 이메일)
    subject: '[T-LECTURE] 비밀번호 재설정 안내',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">비밀번호 재설정 요청</h2>
        <p>안녕하세요, T-LECTURE 입니다.</p>
        <p>아래 버튼을 클릭하여 비밀번호를 새로 설정해주세요.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" target="_blank" style="padding: 15px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">비밀번호 재설정하기</a>
        </div>
        <p style="color: #888; font-size: 12px;">* 이 링크는 1시간 동안만 유효합니다.</p>
        <p style="color: #888; font-size: 12px;">* 본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ 메일 발송 성공: ${info.messageId}`);
  } catch (error) {
    console.error('❌ 메일 발송 실패:', error);
    throw new Error('메일 서버 연결 실패: 아이디/비밀번호를 확인해주세요.');
  }
};