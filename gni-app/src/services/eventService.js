import { apiClient } from "@/services/apiClient";

export const getEvents = async () => {
  return await apiClient("/events");
};

export const getEventById = async (id) => {
  return await apiClient(`/events/${id}`);
};