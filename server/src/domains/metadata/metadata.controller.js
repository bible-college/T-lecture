// src/domains/metadata/metadata.controller.js
const metadataService = require('./metadata.service');
const asyncHandler = require('../../common/middlewares/asyncHandler');

exports.getInstructorMeta = asyncHandler(async (req, res) => {
  const data = await metadataService.getInstructorMeta();
  res.status(200).json(data);
});
