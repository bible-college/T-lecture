// server/src/domains/user/controllers/user.me.controller.js
const userMeService = require('../services/user.me.service');
const asyncHandler = require('../../../common/middlewares/asyncHandler');
const logger = require('../../../config/logger');

exports.getMyProfile = asyncHandler(async (req, res) => {
  const profile = await userMeService.getMyProfile(req.user.id);
  res.json(profile);
});

exports.updateMyProfile = asyncHandler(async (req, res) => {
  const updatedProfile = await userMeService.updateMyProfile(req.user.id, req.body);

  logger.info('[user.updateMyProfile]', {
    userId: req.user.id,
    bodyKeys: Object.keys(req.body || {}),
  });

  res.json(updatedProfile);
});

exports.withdraw = asyncHandler(async (req, res) => {
  const result = await userMeService.withdraw(req.user.id);

  logger.info('[user.withdraw]', {
    userId: req.user.id,
  });

  res.json(result);
});
