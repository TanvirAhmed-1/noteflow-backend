import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { InterestServices } from "./interest.services";
import {
  createInterestSchema,
  updateInterestSchema,
} from "./interest.validation";

// Create Interest (Admin only)
const createInterest = catchAsync(async (req, res) => {
  const validatedData = createInterestSchema.parse(req.body);
  const result = await InterestServices.createInterestDB({
    ...validatedData,
    createdBy: req.user!.id,
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: 201,
    message: "Interest topic created successfully",
    result,
  });
});

// Fetch Interests (Paginated, Searchable, Status Filterable)
const fetchInterests = catchAsync(async (req, res) => {
  const result = await InterestServices.fetchInterestsDB(req.query);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "Interests fetched successfully",
    meta: result.meta,
    result: result.data,
  });
});

// Get Single Interest
const getSingleInterest = catchAsync(async (req, res) => {
  const result = await InterestServices.getSingleInterestDB(
    req.params.interestId as string
  );

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "Interest fetched successfully",
    result,
  });
});

// Update Interest (Admin only)
const updateInterest = catchAsync(async (req, res) => {
  const validatedData = updateInterestSchema.parse(req.body);
  const result = await InterestServices.updateInterestDB(
    req.params.interestId as string,
    validatedData
  );

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "Interest updated successfully",
    result,
  });
});

// Toggle Status / Quick update
const toggleStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const result = await InterestServices.updateInterestDB(
    req.params.interestId as string,
    { status }
  );

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: `Interest status updated to ${status}`,
    result,
  });
});

// Delete Interest (Admin only)
const deleteInterest = catchAsync(async (req, res) => {
  const result = await InterestServices.deleteInterestDB(
    req.params.interestId as string
  );

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "Interest deleted successfully",
    result,
  });
});

export const interestController = {
  createInterest,
  fetchInterests,
  getSingleInterest,
  updateInterest,
  toggleStatus,
  deleteInterest,
};
