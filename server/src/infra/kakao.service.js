// server/src/infra/kakao/kakao.service.js
const axios = require('axios');

class KakaoService {
  constructor() {
    this.kakaoApiKey = process.env.KAKAO_API_KEY;
    if (!this.kakaoApiKey) {
      throw new Error('KAKAO_API_KEY environment variable is not set');
    }
    this.baseUrl = 'https://apis-navi.kakaomobility.com/v1';
  }

  /**
   * 카카오 내비 API를 통해 두 좌표 간 거리 및 소요시간 조회
   * @returns {Promise<{distance: number, duration: number, route: any}>}
   */
  async getRouteDistance(originLat, originLng, destLat, destLng) {
    try {
      const response = await axios.get(`${this.baseUrl}/directions`, {
        params: {
          origin: `${originLng},${originLat}`, // 카카오는 경도,위도 순서
          destination: `${destLng},${destLat}`,
          waypoints: '',
          priority: 'RECOMMEND',
          car_fuel: 'GASOLINE',
          alternatives: false,
          road_details: false,
        },
        headers: {
          Authorization: `KakaoMobility ${this.kakaoApiKey}`,
        },
      });

      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const summary = route.summary;

        return {
          distance: summary.distance, // 미터
          duration: summary.duration, // 초
          route,
        };
      }

      throw new Error('No route found in Kakao API response');
    } catch (error) {
      console.error('Kakao API Error:', error.response?.data || error.message);
      throw new Error(`Failed to calculate distance: ${error.message}`);
    }
  }

  /**
   * 주소를 좌표로 변환 (카카오 로컬 API 사용)
   */
  async addressToCoordinates(address) {
    try {
      const response = await axios.get(
        'https://dapi.kakao.com/v2/local/search/address.json',
        {
          params: { query: address },
          headers: {
            Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
          },
        }
      );

      if (response.data && response.data.documents && response.data.documents.length > 0) {
        const doc = response.data.documents[0];
        return {
          lat: parseFloat(doc.y),
          lng: parseFloat(doc.x),
          address: doc.address_name,
        };
      }

      throw new Error(`Address not found: ${address}`);
    } catch (error) {
      console.error('Kakao Address API Error:', error.response?.data || error.message);
      throw new Error(`Failed to convert address: ${error.message}`);
    }
  }
}

module.exports = new KakaoService();
