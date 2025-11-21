const kakaoService = require('../../../infra/kakao/kakao.service');
const kakaoUsageRepository = require('../repositories/kakaoUsage.repository');

const instructorRepository = require('../../instructor/repositories/instructor.repository');
const unitRepository = require('../../unit/repositories/unit.repository');

const kakaoService = require('../../../infra/kakao/kakao.service');

const MAX_ROUTE_PER_DAY = 9000;
const MAX_GEOCODE_PER_DAY = 900;

class DistanceService {
  /**
   * Calculate distance and duration between two coordinates.
   * Checks daily API usage limit before making the request.
   * @param {number} originLat
   * @param {number} originLng
   * @param {number} destLat
   * @param {number} destLng
   * @returns {Promise<{distance: number, duration: number, route: any}>}
   */
  async calculateDistance(originLat, originLng, destLat, destLng) {
    // 1. Check daily usage limit
    const usage = await kakaoUsageRepository.getOrCreateToday();
    if (usage.routeCount >= 9000) {
      throw new Error('Daily Kakao Navi API limit (9000) reached.');
    }

    // 2. Call Kakao API
    const result = await kakaoService.getRouteDistance(originLat, originLng, destLat, destLng);

    // 3. Increment usage count
    await kakaoUsageRepository.incrementRouteCount();

    return result;
  }
}

module.exports = new DistanceService();
