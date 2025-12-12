// server/src/domains/user/controllers/user.admin.controller.js
const adminService = require('../services/user.admin.service');
const asyncHandler = require('../../../common/middlewares/asyncHandler');
const logger = require('../../../config/logger');

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getAllUsers(req.query);
  res.json(users);
});

exports.getPendingUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getPendingUsers();
  res.json(users);
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  res.json(user);
});

exports.updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await adminService.updateUser(req.params.id, req.body);

  logger.info('[admin.updateUser]', {
    actorId: req.user?.id,
    targetUserId: req.params.id,
    bodyKeys: Object.keys(req.body || {}),
  });

  res.json(updatedUser);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const result = await adminService.deleteUser(req.params.id);

  logger.info('[admin.deleteUser]', {
    actorId: req.user?.id,
    targetUserId: req.params.id,
  });

  res.json(result);
});

exports.approveUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await adminService.approveUser(userId);

  logger.info('[admin.approveUser]', {
    actorId: req.user?.id,
    targetUserId: userId,
  });

  res.json(result);
});

exports.approveUsersBulk = asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  const result = await adminService.approveUsersBulk(userIds);

  logger.info('[admin.approveUsersBulk]', {
    actorId: req.user?.id,
    count: Array.isArray(userIds) ? userIds.length : 0,
  });

  res.json(result);
});

exports.rejectUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await adminService.rejectUser(userId);

  logger.info('[admin.rejectUser]', {
    actorId: req.user?.id,
    targetUserId: userId,
  });

  res.json(result);
});

exports.rejectUsersBulk = asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  const result = await adminService.rejectUsersBulk(userIds);

  logger.info('[admin.rejectUsersBulk]', {
    actorId: req.user?.id,
    count: Array.isArray(userIds) ? userIds.length : 0,
  });

  res.json(result);
});

exports.setAdminLevel = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { level } = req.body;

  const result = await adminService.setAdminLevel(userId, level);

  logger.info('[admin.setAdminLevel]', {
    actorId: req.user?.id,
    targetUserId: userId,
    level: level,
  });

  res.json(result);
});

exports.revokeAdminLevel = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await adminService.revokeAdminLevel(userId);

  logger.info('[admin.revokeAdminLevel]', {
    actorId: req.user?.id,
    targetUserId: userId,
  });

  res.json(result);
});
