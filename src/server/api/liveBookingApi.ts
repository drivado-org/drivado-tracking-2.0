import type {
  BookingDetailsResponse,
  DriverReviewPayload,
  DriverReviewResponse,
} from "@/types/liveBooking";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export default api;

export const getBookingDetailsApi = async (
  tripId: string,
): Promise<BookingDetailsResponse> => {
  const response = await api.get<BookingDetailsResponse>(
    "/bookings/getTrackingBookingDetailsByTripId",
    {
      params: {
        tripId,
      },
      headers: {
        "x-api-key": import.meta.env.VITE_TRACKING_API_KEY,
      },
    },
  );

  if (!response.data.success) {
    throw new Error(response.data.message ?? "Failed to fetch booking details");
  }

  return response.data;
};

// --------- DriverReview -----------

export const saveDriverReviewApi = async (
  payload: DriverReviewPayload,
): Promise<DriverReviewResponse> => {
  const response = await api.post<DriverReviewResponse>(
    "/drivers/driverReviewSave",
    payload,
    {
      headers: {
        "x-api-key": import.meta.env.VITE_TRACKING_API_KEY,
      },
    },
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to submit feedback");
  }

  return response.data;
};
