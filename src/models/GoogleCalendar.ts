import { queryClient } from "@/lib/queryClient";
import { useMutation, useQueries, useQuery } from "react-query";
import axios from "axios";
import { axiosGoogle } from "@/lib/auth";
import { useAuth } from "@/lib/useAuth";

export function useGetGoogleCalendarList(enabled: boolean) {
  // const { isGoogleSignedIn } = useAuth();
  async function getGoogleCalendarList() {
    return await axiosGoogle
      .get(`https://www.googleapis.com/calendar/v3/users/me/calendarList`)
      .then((res) => {
        const calendarList = res.data.items;
        const calendars = calendarList.map((calendar: any) => {
          return {
            id: calendar.id.replace("#", "%23"), // convert '#'
            name: calendar.summary,
            color: calendar.backgroundColor,
          };
        });
        console.log("calendarList", calendarList);
        console.log(calendars);
        return calendars;
      });
  }

  return useQuery("googleCalendarList", getGoogleCalendarList, {
    staleTime: Infinity,
    enabled: enabled,
  });
}

export function useGetGoogleCalendar(enabled: boolean, calendarId: string) {
  async function getGoogleCalendar() {
    return await axios
      .get(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}`)
      .then((res) => console.log(res.data));
  }

  return useQuery("googleCalendar", getGoogleCalendar, {
    staleTime: Infinity,
    enabled: enabled,
  });
}

export async function getGoogleCalendarEvents(calendarId: string) {
  return await axiosGoogle
    .get(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        // params: {
        //   timeMin: timeMin,
        //   timeMax: timeMax,
        // },
      }
    )
    .then((res) => console.log(res.data));
}

export function usePostGoogleCalendarEvent(
  enabled: boolean,
  eventData: any,
  calendarId: string
) {
  async function postGoogleCalendarEvent() {
    return await axios
      .post(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        eventData
      )
      .then((res) => console.log(res.data));
  }

  return useMutation(postGoogleCalendarEvent, {
    // When mutate is called:
    onMutate: async (_newEvent) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries("googleCalendarEvents");
      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData("googleCalendarEvents");
      // Return a context object with the snapshotted (rollback) value
      return { previousEvents };
    },
    onSuccess: (data) => {
      console.log("postGoogleCalendarEvent response data: ", data); // TODO: log response, to get exact event data
      queryClient.setQueryData("googleCalendarEvents", data);
    },
    onError: (error, _newEvent, context) => {
      console.error(error);
      // Rollback to the previous value
      queryClient.setQueryData("googleCalendarEvents", context?.previousEvents);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries("googleCalendarEvents");
    },
  });
}

export function usePatchGoogleCalendarEvent(
  eventData: any,
  calendarId: string,
  eventId: string
) {
  async function patchGoogleCalendarEvent() {
    return await axios
      .patch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        eventData
      )
      .then((res) => console.log(res.data));
  }

  return useMutation(patchGoogleCalendarEvent, {
    // When mutate is called:
    onMutate: async (_updatedEvent) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries([
        "googleCalendarEvents",
        calendarId,
        eventId,
      ]);
      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData("googleCalendarEvents");
      // Return a context object with the snapshotted (rollback) value
      return { previousEvents };
    },
    onSuccess: (data) => {
      console.log("patchGoogleCalendarEvent response data: ", data); // TODO: log response, to get exact event data
      queryClient.setQueryData(
        ["googleCalendarEvents", calendarId, eventId],
        data
      );
    },
    onError: (error, _updatedEvent, context) => {
      console.error(error);
      // Rollback to the previous value
      queryClient.setQueryData(
        ["googleCalendarEvents", calendarId, eventId],
        context?.previousEvents
      );
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries([
        "googleCalendarEvents",
        calendarId,
        eventId,
      ]);
    },
  });
}

export function useDeleteGoogleCalendarEvent(
  calendarId: string,
  eventId: string
) {
  async function deleteGoogleCalendarEvent() {
    return await axios
      .delete(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`
      )
      .then((res) => console.log(res.data));
  }

  return useMutation(deleteGoogleCalendarEvent, {
    // When mutate is called:
    onMutate: async (_deletedEvent) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries("googleCalendarEvents");
      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData([
        "googleCalendarEvents",
        calendarId,
        eventId,
      ]);
      // Return a context object with the snapshotted (rollback) value
      return { previousEvents };
    },
    onSuccess: (data) => {
      console.log("deleteGoogleCalendarEvent response data: ", data); // TODO: log response, to get exact event data
      queryClient.setQueryData(
        ["googleCalendarEvents", calendarId, eventId],
        data
      );
    },
    onError: (error, _deletedEvent, context) => {
      console.error(error);
      // Rollback to the previous value
      queryClient.setQueryData(
        ["googleCalendarEvents", calendarId, eventId],
        context?.previousEvents
      );
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries([
        "googleCalendarEvents",
        calendarId,
        eventId,
      ]);
    },
  });
}
