// server/scripts/test-kakao-navi.js
require('dotenv').config();
console.log('KAKAO_REST_API_KEY loaded?', !!process.env.KAKAO_REST_API_KEY);
const kakaoService = require('../src/infra/kakao/kakao.service');
const distanceService = require('../src/domains/distance/services/distance.service');
const prisma = require('../src/libs/prisma'); // Adjust path if necessary

async function main() {
    try {
        console.log('🚀 Starting Kakao Navi API Test...');

        // 1. Define arbitrary addresses
        const originAddress = '서울특별시 용산구 한강대로 405';   // 서울역 근처 실제 주소
        const destAddress   = '서울특별시 서초구 서초대로 396';

        console.log(`\n📍 Origin: ${originAddress}`);
        console.log(`📍 Destination: ${destAddress}`);

        // 2. Convert addresses to coordinates
        console.log('\n🔄 Converting addresses to coordinates...');
        const originCoords = await kakaoService.addressToCoordinates(originAddress);
        console.log(`   Origin Coords: ${originCoords.lat}, ${originCoords.lng}`);

        const destCoords = await kakaoService.addressToCoordinates(destAddress);
        console.log(`   Dest Coords: ${destCoords.lat}, ${destCoords.lng}`);

        // 3. Calculate distance (this should trigger usage increment)
        console.log('\n🚗 Calculating distance and duration...');
        const result = await distanceService.calculateDistance(
        originCoords.lat,
        originCoords.lng,
        destCoords.lat,
        destCoords.lng
        );

        console.log('\n✅ Result:');
        console.log(`   Distance: ${result.distance} meters`);
        console.log(`   Duration: ${result.duration} seconds`);

        // 4. Verify usage count
        console.log('\n📊 Verifying usage count in DB...');
        const now = new Date();
        const todayDate = new Date(Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
        ));
        
        const usage = await prisma.kakaoApiUsage.findUnique({
        where: { date: todayDate },
        });

        console.log('   Current Usage:', usage);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('   Response data:', error.response.data);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
