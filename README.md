# T-LECTURE


```bash

## 최상위 폴더에서 실행
npm i

##.env.example 파일을 .env 파일로 복사


### db 최신화
npx prisma migrate reset

### 혹은 안된다면
npm run db:migrate 

### 전체 실행 테스트
npm run test

### 파일 단위 테스트

#### assignment 테스트 파일 실행
npm run test:assignment

#### auth 테스트 파일 실행
npm run test:auth

#### distance 테스트 파일 실행
npm run test:distance

#### instructor 테스트 파일 실행
npm run test:instructor

#### message 테스트 파일 실행
npm run test:message

#### metadata 테스트 파일 실행
npm run test:metadata

#### unit 테스트 파일 실행
npm run test:unit

#### user.admin 테스트 파일 실행
npm run test:user.admin

#### user.me 테스트 파일 실행
npm run test:user.me