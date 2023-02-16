import Head from "next/head";

import React, {
  useCallback,
  useRef,
  useMemo,
  useState,
  useEffect,
  RefObject,
  createRef,
} from "react";
import { useAuth } from "@/lib/useAuth";
import dayjs from "dayjs";
import styled, { css, createGlobalStyle } from "styled-components";
import {
  ActionIcon,
  Button,
  Checkbox,
  FileButton,
  Group,
  List,
  Modal,
  SegmentedControl,
  Select,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import {
  IconBrandGoogle,
  IconMapSearch,
  IconPaperclip,
  IconPhoto,
} from "@tabler/icons";
import {
  getGoogleCalendarEvents,
  useGetGoogleCalendar,
  useGetGoogleCalendarList,
} from "@/models/GoogleCalendar";
import { useQueries } from "react-query";

enum SelectedViews {
  Day = "Day",
  Week = "Week",
  Month = "Month",
}

enum SelectedCategories {
  Event = "Event",
  Task = "Task",
  Journal = "Journal",
}

const GlobalStyle = createGlobalStyle`
  * {
    /* padding: 0; */
    margin: 0;
  }
  div {
    font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;
  }
`;
const Wrapper = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: row;
`;
const SidebarContainer = styled.div`
  min-width: 220px;
  max-width: 220px;
  display: flex;
  flex-direction: column;
  padding: 10px;
`;
const SidebarHeader = styled.div`
  height: 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 10px;
`;
const SidebarLogoContainer = styled.div`
  display: flex;
  align-items: center;
`;
const SidebarCalendars = styled.div`
  display: flex;
  flex-direction: column;
`;
const SidebarCalendarsLabelContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
`;
const SidebarCalendarsLabel = styled.h3`
  font-size: 12px;
  font-weight: 500;
`;
const SidebarCalendar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 5px 0;
  margin-left: 15px;
`;
const SidebarCalendarColor = styled.div`
  display: flex;
  border-radius: 4px;
  width: 15px;
  height: 15px;
  margin-right: 10px;
  background-color: ${(props: { bgColor: string }) => {
    return props.bgColor;
  }};
`;
const SidebarCalendarText = styled.p`
  font-size: 12px;
`;
const SidebarBottom = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: auto;
`;
const CalendarContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: 0 10px 10px 10px;
`;
const CalendarHeader = styled.div`
  display: flex;
  flex-direction: row;
  padding: 10px 0;
`;
const CalendarHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;
const CalendarHeaderMonthYear = styled.div`
  display: flex;
  font-size: 16px;
  font-weight: 500;
`;
const CalendarHeaderRight = styled.div`
  display: flex;
  justify-content: flex-end;
  flex: 1;
`;
const CalendarBody = styled.div`
  flex: 1;
  border-radius: 10px;
  overflow: hidden;
  background-color: #f4f7f9;
`;
const CalendarBodyBg = styled.div`
  height: 100%;
  flex: 1;
  display: flex;
  gap: 1px;
  flex-direction: column;
  background-color: #e9ecee;
`;
const DaysOfWeek = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1px;
  background-color: #f4f7f9;
`;
const DayOfWeek = styled.div`
  display: flex;
  justify-content: center;
  width: ${`${(1 / 7) * 100}` + `%`};
  padding: 10px 0;
  text-transform: uppercase;
`;
const DayOfWeekText = styled.h6`
  font-size: 12px;
  font-weight: 500;
  color: #999999;
`;
const MonthDays = styled.div`
  display: flex;
  gap: 1px;
  flex: 1;
  flex-direction: row;
  flex-wrap: wrap;
  width: calc(100% + 1px);
  height: 100%;
`;
const Day = styled.div`
  display: flex;
  width: calc(${`${(1 / 7) * 100}%`} - 1px);
  height: calc(${`${(1 / 6) * 100}%`} - 1px);
  background: ${(props: { isCurrentMonth: boolean }) =>
    props.isCurrentMonth
      ? "#F4F7F9"
      : "repeating-linear-gradient(-35deg, #F4F7F9, #F4F7F9 10px, #E5E5E5 10px, #E5E5E5 11px)"};
  :hover {
    background-color: rgb(231, 245, 255);
  }
  /* margin-bottom: 1px; */
  /* margin-right: 1px; */
`;
const DayTextContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: flex-end;
  align-items: flex-start;
  padding-top: 5px;
  padding-right: 5px;
`;
const DayText = styled.p`
  font-size: 12px;
  font-weight: 400;
  color: #999999;
`;
const ModalBackdrop = styled.div`
  display: flex;
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  flex: 1;
  justify-content: center;
  align-items: center;
`;
const ModalContainer = styled.div`
  position: absolute;
  top: ${(props: { dayRef: RefObject<HTMLDivElement> | null }) =>
    props.dayRef?.current?.offsetTop}px;
  left: ${(props: { dayRef: RefObject<HTMLDivElement> | null }) =>
    props.dayRef?.current?.offsetLeft! + props.dayRef?.current?.offsetWidth!}px;
  min-width: 300px;
  /* min-height: 550px; */
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: 10px;
  border-width: 2px;
  border-color: #f2f2f2;
  background-color: rgba(255, 255, 255, 0.9);
`;
const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const ModalBodyRow = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
`;
const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #f2f2f2;
  padding-top: 10px;
`;

const AddEventModal: React.FC<{
  selectedCategory: SelectedCategories;
  setSelectedCategory: (category: SelectedCategories) => void;
  startDate: Date;
  setStartDate: (date: Date) => void;
  startTime: Date;
  setStartTime: (date: Date) => void;
  allDay: boolean;
  setAllDay: (allDay: boolean) => void;
  location: string;
  setLocation: (location: string) => void;
  description: string;
  setDescription: (description: string) => void;
  resetFileRef: RefObject<() => void>;
  setFiles: (files: File[]) => void;
  files: File[];
  clearFile: () => void;
  selectedCalendar: string;
  setSelectedCalendar: (calendar: string) => void;
  googleCalendars: any;
  user: any;
  dayRef: RefObject<HTMLDivElement> | null;
}> = ({
  selectedCategory,
  setSelectedCategory,
  startDate,
  setStartDate,
  startTime,
  setStartTime,
  allDay,
  setAllDay,
  location,
  setLocation,
  description,
  setDescription,
  resetFileRef,
  setFiles,
  files,
  clearFile,
  selectedCalendar,
  setSelectedCalendar,
  googleCalendars,
  user,
  dayRef,
}) => {
  return (
    <ModalContainer dayRef={dayRef}>
      <ModalBody>
        <SegmentedControl
          value={selectedCategory}
          onChange={setSelectedCategory}
          data={[
            { label: "Event", value: SelectedCategories.Event },
            { label: "Task", value: SelectedCategories.Task },
            { label: "Journal", value: SelectedCategories.Journal },
          ]}
          color={"blue"}
        />
        <TextInput
          placeholder={`${selectedCategory} Title`}
          label="Title"
          withAsterisk
        />
        <DatePicker
          placeholder="Pick date"
          label="Date"
          withAsterisk
          defaultValue={new Date()}
          value={startDate}
          onChange={setStartDate}
        />
        {selectedCategory === SelectedCategories.Event ||
        (selectedCategory === SelectedCategories.Task && !allDay) ? (
          <TimeInput
            label={
              // eslint-disable-next-line no-nested-ternary
              selectedCategory === SelectedCategories.Event
                ? "Start Time"
                : selectedCategory === SelectedCategories.Task
                ? "Due Time"
                : ""
            }
            format="12"
            defaultValue={new Date()}
            value={startTime}
            onChange={setStartTime}
          />
        ) : null}
        {selectedCategory === SelectedCategories.Event ? (
          <Checkbox
            label="All Day"
            size="xs"
            checked={allDay}
            onChange={(event) => setAllDay(event.currentTarget.checked)}
          />
        ) : null}
        {selectedCategory === SelectedCategories.Event ? (
          <TextInput
            placeholder="Event Location"
            label="Location"
            value={location}
            onChange={(event) => setLocation(event.currentTarget.value)}
            rightSection={
              <ActionIcon>
                <IconMapSearch />
              </ActionIcon>
            }
          />
        ) : null}
        {selectedCategory === SelectedCategories.Event ||
        selectedCategory === SelectedCategories.Task ? (
          <Textarea
            placeholder="Description"
            label="Description"
            variant="filled"
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
          />
        ) : null}
        {selectedCategory === SelectedCategories.Journal ? <Textarea /> : null}
        {selectedCategory === SelectedCategories.Event ||
        selectedCategory === SelectedCategories.Journal ? (
          <Group position="left">
            <FileButton
              resetRef={resetFileRef}
              onChange={setFiles}
              accept=".pdf,.doc,.docx,image/png,image/jpeg,image/jpg"
              multiple
            >
              {(props) => (
                <ActionIcon {...props}>
                  {selectedCategory === SelectedCategories.Event ? (
                    <IconPaperclip />
                  ) : (
                    <IconPhoto />
                  )}
                </ActionIcon>
              )}
            </FileButton>
            <Button
              disabled={files.length === 0}
              color="red"
              size="xs"
              onClick={clearFile}
            >
              Reset
            </Button>
          </Group>
        ) : null}
        {files && (
          <List size="sm" mt={5} withPadding>
            {files.map((file, index) => (
              <List.Item key={index}>{file.name}</List.Item>
            ))}
          </List>
        )}
      </ModalBody>
      <ModalFooter>
        <Select
          value={selectedCalendar}
          onChange={setSelectedCalendar}
          data={googleCalendars?.map(
            (calendar: { id: string; name: string }) => {
              return {
                value: calendar.id,
                label:
                  calendar.name === user?.email ? "Primary" : calendar.name,
              };
            }
          )}
          dropdownPosition={"top"}
          size={"xs"}
        />
        <Button size="xs">Submit</Button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default function Home() {
  const { session, user, isGoogleSignedIn, signInWithGoogle, signOut } =
    useAuth();
  const [isGoogleCalendarFetched, setIsGoogleCalendarFetched] = useState(false);

  const { data: googleCalendars, isSuccess } =
    useGetGoogleCalendarList(isGoogleSignedIn);

  const gCals = googleCalendars;

  const googleCalendarEvents = useQueries(
    gCals?.map((calendar: any) => {
      return {
        queryKey: ["googleCalendarEventsById", calendar.id],
        queryFn: () => getGoogleCalendarEvents(calendar.id),
        staleTime: Infinity,
        enabled: calendar.id !== undefined,
      };
    }) ?? []
  );

  useEffect(() => {
    console.log(googleCalendarEvents);
  }, [googleCalendarEvents]);

  const WEEKDAYS = useMemo(
    () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    []
  );
  // const TODAY = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  const [currentMonthYear, setCurrentMonthYear] = useState(() => {
    const currentYear = parseInt(dayjs().format("YYYY"));
    const currentMonth = parseInt(dayjs().format("M"));
    return { year: currentYear, month: currentMonth };
  });

  const currentMonthText = useMemo(() => {
    return dayjs(
      new Date(currentMonthYear.year, currentMonthYear.month - 1)
    ).format("MMMM YYYY");
  }, [currentMonthYear]);

  // ------------------ //
  // utility functions
  // ------------------ //
  function getNumberOfDaysInMonth(year: number, month: number) {
    return dayjs(`${year}-${month}-01`).daysInMonth();
  }

  const createDaysForCurrentMonth = useCallback(
    (year: number, month: number) => {
      return [...Array(getNumberOfDaysInMonth(year, month))].map(
        (_day, index) => {
          return {
            date: dayjs(`${year}-${month}-${index + 1}`).format("YYYY-MM-DD"),
            dayOfMonth: index + 1,
            dayOfWeek: dayjs(`${year}-${month}-${index + 1}`).day(),
            isCurrentMonth: true,
          };
        }
      );
    },
    []
  );

  function createDaysForPreviousMonth(
    year: number,
    month: number,
    currentMonthFirstDayOfWeek: number
  ) {
    const previousMonth = dayjs(`${year}-${month}-01`).subtract(1, "month");

    // Cover first day of the month being sunday (firstDayOfTheMonthWeekday === 0)
    const visibleNumberOfDaysFromPreviousMonth = currentMonthFirstDayOfWeek
      ? currentMonthFirstDayOfWeek - 1
      : 6;

    const previousMonthLastMondayDayOfMonth = dayjs(currentMonthFirstDayOfWeek)
      .subtract(visibleNumberOfDaysFromPreviousMonth, "day")
      .date();

    return [...Array(visibleNumberOfDaysFromPreviousMonth)].map(
      (_day, index) => {
        return {
          date: dayjs(
            `${previousMonth.year()}-${previousMonth.month() + 1}-${
              previousMonthLastMondayDayOfMonth + index
            }`
          ).format("YYYY-MM-DD"),
          dayOfMonth: previousMonthLastMondayDayOfMonth + index,
          isCurrentMonth: false,
        };
      }
    );
  }

  function createDaysForNextMonth(
    year: number,
    month: number,
    currentMonthLastDayOfWeek: number
  ) {
    const nextMonth = dayjs(`${year}-${month}-01`).add(1, "month");
    console.log("currentMonthLastDayOfWeek: ", currentMonthLastDayOfWeek);
    const visibleNumberOfDaysFromNextMonth = 7 - currentMonthLastDayOfWeek;

    return [...Array(visibleNumberOfDaysFromNextMonth)].map((day, index) => {
      return {
        date: dayjs(
          `${nextMonth.year()}-${nextMonth.month() + 1}-${index + 1}`
        ).format("YYYY-MM-DD"),
        dayOfMonth: index + 1,
        isCurrentMonth: false,
      };
    });
  }

  const monthDays = useMemo(() => {
    const currentMonthDays = createDaysForCurrentMonth(
      currentMonthYear.year,
      currentMonthYear.month
    );
    const previousMonthDays = createDaysForPreviousMonth(
      currentMonthYear.year,
      currentMonthYear.month,
      currentMonthDays[0].dayOfWeek
    );
    const nextMonthDays = createDaysForNextMonth(
      currentMonthYear.year,
      currentMonthYear.month,
      currentMonthDays[currentMonthDays.length - 1].dayOfWeek
    );
    console.log("monthDays: ", [
      ...currentMonthDays,
      ...previousMonthDays,
      ...nextMonthDays,
    ]);
    return [...previousMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [
    createDaysForCurrentMonth,
    currentMonthYear.month,
    currentMonthYear.year,
  ]);

  const dayRefs = useMemo(
    () =>
      Array.from({ length: monthDays.length }).map(() =>
        createRef<HTMLDivElement>()
      ),
    [monthDays]
  );

  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // const getWeekday = useCallback(date => {
  //   return dayjs(date).weekday();
  // }, []);

  // function initMonthSelectors() {
  //   document
  //     .getElementById('previous-month-selector')
  //     .addEventListener('click', function () {
  //       selectedMonth = dayjs(selectedMonth).subtract(1, 'month');
  //       createCalendar(selectedMonth.format('YYYY'), selectedMonth.format('M'));
  //     });

  //   document
  //     .getElementById('present-month-selector')
  //     .addEventListener('click', function () {
  //       selectedMonth = dayjs(new Date(INITIAL_YEAR, INITIAL_MONTH - 1, 1));
  //       createCalendar(selectedMonth.format('YYYY'), selectedMonth.format('M'));
  //     });

  //   document
  //     .getElementById('next-month-selector')
  //     .addEventListener('click', function () {
  //       selectedMonth = dayjs(selectedMonth).add(1, 'month');
  //       createCalendar(selectedMonth.format('YYYY'), selectedMonth.format('M'));
  //     });
  // }

  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const [selectedView, setSelectedView] = useState<SelectedViews>(
    SelectedViews.Month
  );
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategories>(
    SelectedCategories.Event
  );

  const [selectedCalendar, setSelectedCalendar] = useState<string>(
    googleCalendars?.[0]?.id || ""
  );

  const [title, setTitle] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [allDay, setAllDay] = useState<boolean>(false);
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const resetFileRef = useRef<() => void>(null);
  const [files, setFiles] = useState<File[]>([]);
  const clearFile = () => {
    setFiles([] as File[]);
    resetFileRef.current?.();
  };

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <GlobalStyle />
      <Wrapper>
        <SidebarContainer>
          <SidebarHeader>
            <SidebarLogoContainer>
              <h6 style={{ fontSize: 16, fontWeight: 600 }}>Dayly Calendar</h6>
            </SidebarLogoContainer>
          </SidebarHeader>
          <SidebarCalendars>
            {/* <SidebarCalendarsLabel>Calendars</SidebarCalendarsLabel> */}
            {isGoogleSignedIn && (
              <SidebarCalendarsLabelContainer>
                <IconBrandGoogle size={15} stroke={3} />
                <SidebarCalendarsLabel>{user?.email}</SidebarCalendarsLabel>
              </SidebarCalendarsLabelContainer>
            )}
            {isGoogleSignedIn &&
              googleCalendars?.length > 0 &&
              googleCalendars.map(
                (calendar: { id: string; name: string; color: string }) => {
                  return (
                    <SidebarCalendar key={calendar.id}>
                      {/* <SidebarCalendarColor
                        bgColor={calendar.color}
                      ></SidebarCalendarColor>
                      <SidebarCalendarText>
                        {calendar.name === user?.email
                          ? "Primary"
                          : calendar.name}
                      </SidebarCalendarText> */}
                      <Checkbox
                        checked={true}
                        label={
                          calendar.name === user?.email
                            ? "Primary"
                            : calendar.name
                        }
                        styles={{
                          inner: {
                            width: 15,
                            height: 15,
                          },
                          input: {
                            width: 15,
                            height: 15,
                            backgroundColor: calendar.color,
                            borderColor: calendar.color,
                            [":checked"]: {
                              backgroundColor: calendar.color,
                              borderColor: calendar.color,
                            },
                          },
                          labelWrapper: {
                            fontSize: 12,
                            lineHeight: "15px",
                          },
                        }}
                      />
                    </SidebarCalendar>
                  );
                }
              )}
          </SidebarCalendars>
          <SidebarBottom>
            {user ? (
              <Button onClick={signOut} variant="light" color="gray">
                Sign Out
              </Button>
            ) : (
              <Button onClick={signInWithGoogle} variant="light" color="gray">
                Sign In
              </Button>
            )}
          </SidebarBottom>
        </SidebarContainer>

        <CalendarContainer>
          <CalendarHeader>
            <CalendarHeaderLeft>
              <CalendarHeaderMonthYear>
                {currentMonthText}
              </CalendarHeaderMonthYear>
            </CalendarHeaderLeft>
            <CalendarHeaderRight>
              <SegmentedControl
                styles={{ label: { minWidth: 70 } }}
                size={"xs"}
                value={selectedView}
                onChange={(value: SelectedViews) => setSelectedView(value)}
                data={[
                  { label: "Day", value: SelectedViews.Day },
                  { label: "Week", value: SelectedViews.Week },
                  { label: "Month", value: SelectedViews.Month },
                ]}
              />
            </CalendarHeaderRight>
          </CalendarHeader>
          <CalendarBody>
            <CalendarBodyBg>
              <DaysOfWeek>
                {WEEKDAYS.map((weekday, i) => {
                  return (
                    <DayOfWeek key={i}>
                      <DayOfWeekText>{weekday}</DayOfWeekText>
                    </DayOfWeek>
                  );
                })}
              </DaysOfWeek>
              <MonthDays>
                {monthDays?.map((day, i) => {
                  return (
                    <Day
                      ref={dayRefs[i]}
                      key={i}
                      isCurrentMonth={day.isCurrentMonth}
                      onClick={() => {
                        setSelectedDayIndex(i);
                        setModalVisible(true);
                      }}
                    >
                      <DayTextContainer>
                        <DayText>{day.dayOfMonth}</DayText>
                      </DayTextContainer>
                    </Day>
                  );
                })}
              </MonthDays>
            </CalendarBodyBg>
          </CalendarBody>

          {modalVisible && (
            <AddEventModal
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              startDate={startDate}
              setStartDate={setStartDate}
              startTime={startTime}
              setStartTime={setStartTime}
              allDay={allDay}
              setAllDay={setAllDay}
              location={location}
              setLocation={setLocation}
              description={description}
              setDescription={setDescription}
              resetFileRef={resetFileRef}
              setFiles={setFiles}
              files={files}
              clearFile={clearFile}
              selectedCalendar={selectedCalendar}
              setSelectedCalendar={setSelectedCalendar}
              googleCalendars={googleCalendars}
              user={user}
              dayRef={
                selectedDayIndex !== null ? dayRefs[selectedDayIndex] : null
              }
            />
          )}
          {/* <Modal
            opened={modalVisible}
            onClose={() => setModalVisible(false)}
            size="auto"
            centered
            overlayOpacity={0}
            title="Add To Calendar"
            styles={{
              modal: {
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(4px)",
              },
            }}
          >
            <ModalContainer>
              <ModalBody>
                <SegmentedControl
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  data={[
                    { label: "Event", value: SelectedCategories.Event },
                    { label: "Task", value: SelectedCategories.Task },
                    { label: "Journal", value: SelectedCategories.Journal },
                  ]}
                  color={"blue"}
                />
                <TextInput
                  placeholder={`${selectedCategory} Title`}
                  label="Title"
                  withAsterisk
                />
                <DatePicker
                  placeholder="Pick date"
                  label="Date"
                  withAsterisk
                  defaultValue={new Date()}
                  value={startDate}
                  onChange={setStartDate}
                />
                {selectedCategory === SelectedCategories.Event ||
                (selectedCategory === SelectedCategories.Task && !allDay) ? (
                  <TimeInput
                    label={
                      // eslint-disable-next-line no-nested-ternary
                      selectedCategory === SelectedCategories.Event
                        ? "Start Time"
                        : selectedCategory === SelectedCategories.Task
                        ? "Due Time"
                        : ""
                    }
                    format="12"
                    defaultValue={new Date()}
                    value={startTime}
                    onChange={setStartTime}
                  />
                ) : null}
                {selectedCategory === SelectedCategories.Event ? (
                  <Checkbox
                    label="All Day"
                    size="xs"
                    checked={allDay}
                    onChange={(event) => setAllDay(event.currentTarget.checked)}
                  />
                ) : null}
                {selectedCategory === SelectedCategories.Event ? (
                  <TextInput
                    placeholder="Event Location"
                    label="Location"
                    value={location}
                    onChange={(event) => setLocation(event.currentTarget.value)}
                    rightSection={
                      <ActionIcon>
                        <IconMapSearch />
                      </ActionIcon>
                    }
                  />
                ) : null}
                {selectedCategory === SelectedCategories.Event ||
                selectedCategory === SelectedCategories.Task ? (
                  <Textarea
                    placeholder="Description"
                    label="Description"
                    variant="filled"
                    value={description}
                    onChange={(event) =>
                      setDescription(event.currentTarget.value)
                    }
                  />
                ) : null}
                {selectedCategory === SelectedCategories.Journal ? (
                  <Textarea />
                ) : null}
                {selectedCategory === SelectedCategories.Event ||
                selectedCategory === SelectedCategories.Journal ? (
                  <Group position="left">
                    <FileButton
                      resetRef={resetFileRef}
                      onChange={setFiles}
                      accept=".pdf,.doc,.docx,image/png,image/jpeg,image/jpg"
                      multiple
                    >
                      {(props) => (
                        <ActionIcon {...props}>
                          {selectedCategory === SelectedCategories.Event ? (
                            <IconPaperclip />
                          ) : (
                            <IconPhoto />
                          )}
                        </ActionIcon>
                      )}
                    </FileButton>
                    <Button
                      disabled={files.length === 0}
                      color="red"
                      size="xs"
                      onClick={clearFile}
                    >
                      Reset
                    </Button>
                  </Group>
                ) : null}
                <List size="sm" mt={5} withPadding>
                  {files.map((file, index) => (
                    <List.Item key={index}>{file.name}</List.Item>
                  ))}
                </List>
              </ModalBody>
              <ModalFooter>
                <Select
                  value={selectedCalendar}
                  onChange={setSelectedCalendar}
                  data={googleCalendars?.map(
                    (calendar: { id: string; name: string }) => {
                      return {
                        value: calendar.id,
                        label:
                          calendar.name === user?.email
                            ? "Primary"
                            : calendar.name,
                      };
                    }
                  )}
                  dropdownPosition={"top"}
                  size={"xs"}
                />
                <Button size="xs">Submit</Button>
              </ModalFooter>
            </ModalContainer>
          </Modal> */}
        </CalendarContainer>
      </Wrapper>
    </>
  );
}
