import type { DriverData } from "@/types/liveBooking";

export const getDriverDetailsApi = async (): Promise<DriverData> => {
  // Mock API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Mock Data
  return {
    name: "Arjun Mehra",
    rating: 4.97,
    trips: 1284,
    vehicleRegistration: "LX24 RVD",
  };
};

// For actual API call
// import axios from "axios";
// import type { DriverData } from "@/types/liveBooking";

// export const getDriverDetailsApi = async (): Promise<DriverData> => {
//   try {
//     const response = await axios.get(
//       `${import.meta.env.VITE_BASE_URL}/driver/details`,
//     );

//     return response.data;
//   } catch (error) {
//     console.error("GET DRIVER DETAILS API ERROR:", error);
//     throw error;
//   }
// };
