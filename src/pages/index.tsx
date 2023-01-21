import Head from "next/head";

import React, {
  useCallback,
  useRef,
  useMemo,
  useState,
  useEffect,
} from "react";
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
  Textarea,
  TextInput,
} from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import { IconMapSearch, IconPaperclip, IconPhoto } from "@tabler/icons";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useAuth } from "@/lib/auth";

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
    font-family: 'Inter', sans-serif;
  }
`;
const Wrapper = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: row;
`;
const SidebarContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 10px;
`;
const SidebarHeader = styled.div`
  display: flex;
  padding: 10px 0;
`;
const SidebarHeaderText = styled.h3`
  font-size: 16px;
  font-weight: 500;
`;
const SidebarCalendars = styled.div`
  display: flex;
  flex-direction: column;
`;
const SidebarCalendar = styled.div`
  display: flex;
  flex-direction: column;
`;
const SidebarCalendarGroupTitle = styled.div`
  display: flex;
  margin-bottom: 5px;
`;
const SidebarCalendarGroupTitleText = styled.h6`
  font-size: 13px;
  font-weight: 400;
  color: #999999;
`;
const SidebarCalendarGroup = styled.div`
  display: flex;
  flex-direction: column;
`;
const SidebarCalendarItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 5px 0;
`;
const SidebarCalendarColor = styled.div`
  display: flex;
  border-radius: 4px;
  width: 15px;
  height: 15px;
  margin-right: 10px;
`;
const SidebarCalendarText = styled.p`
  font-size: 13px;
`;
const CalendarContainer = styled.div`
  display: flex;
  flex: 5;
  flex-direction: column;
`;
const CalendarHeader = styled.div`
  display: flex;
  flex-direction: row;
  padding: 10px 0;
`;
const CalendarHeaderLeft = styled.div`
  display: flex;
  flex: 1;
`;
const CalendarHeaderMonthYear = styled.div`
  display: flex;
  font-size: 32px;
  font-weight: bold;
`;
const CalendarHeaderRight = styled.div`
  display: flex;
  flex: 1;
`;
const DaysOfWeek = styled.div`
  display: flex;
  flex-direction: row;
`;
const DayOfWeek = styled.div`
  display: flex;
  width: ${`${(1 / 7) * 100}` + `%`};
  padding: 5px 0;
`;
const DayOfWeekText = styled.h6`
  font-size: 13px;
  font-weight: 400;
  color: #999999;
`;
const MonthDays = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  height: 100%;
`;
const Day = styled.div`
  display: flex;
  width: ${`${(1 / 7) * 100}` + `%`};
  height: ${`${(1 / 6) * 100}` + `%`};
  background-color: ${(props: { isCurrentMonth: boolean }) =>
    props.isCurrentMonth ? "white" : "lightgrey"};
  :hover {
    background-color: rgb(231, 245, 255);
  }
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
  font-size: 13px;
  font-weight: 400;
  padding: 2px 2px 0 0;
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
  min-width: 400px;
  min-height: 550px;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  border-width: 2px;
  border-color: #f2f2f2;
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

export default function Home() {
  const { session, user, signInWithGoogle, signOut } = useAuth();

  const WEEKDAYS = useMemo(
    () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    []
  );
  // const TODAY = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  const [currentMonthYear, setCurrentMonthYear] = useState(() => {
    const currentYear = dayjs().format("YYYY");
    const currentMonth = dayjs().format("M");
    return { year: currentYear, month: currentMonth };
  });

  const currentMonthText = useMemo(() => {
    return dayjs(
      new Date(
        parseInt(currentMonthYear.year),
        parseInt(currentMonthYear.month) - 1
      )
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
      parseInt(currentMonthYear.year),
      parseInt(currentMonthYear.month)
    );
    const previousMonthDays = createDaysForPreviousMonth(
      parseInt(currentMonthYear.year),
      parseInt(currentMonthYear.month),
      currentMonthDays[0].dayOfWeek
    );
    const nextMonthDays = createDaysForNextMonth(
      parseInt(currentMonthYear.year),
      parseInt(currentMonthYear.month),
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

  const [selectedCategory, setSelectedCategory] = useState<SelectedCategories>(
    SelectedCategories.Event
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
            <SidebarHeaderText>Calendars</SidebarHeaderText>
          </SidebarHeader>
          <SidebarCalendars>
            <SidebarCalendar>
              <SidebarCalendarGroupTitle>
                <SidebarCalendarGroupTitleText>
                  joylee@gmail.com
                </SidebarCalendarGroupTitleText>
              </SidebarCalendarGroupTitle>
              <SidebarCalendarGroup>
                <SidebarCalendarItem>
                  <SidebarCalendarColor></SidebarCalendarColor>
                  <SidebarCalendarText>Primary</SidebarCalendarText>
                </SidebarCalendarItem>
                <SidebarCalendarItem>
                  <SidebarCalendarColor></SidebarCalendarColor>
                  <SidebarCalendarText>Holidays</SidebarCalendarText>
                </SidebarCalendarItem>
                <SidebarCalendarItem>
                  <SidebarCalendarColor></SidebarCalendarColor>
                  <SidebarCalendarText>Important</SidebarCalendarText>
                </SidebarCalendarItem>
              </SidebarCalendarGroup>
            </SidebarCalendar>
          </SidebarCalendars>
          {user ? (
            <Button onClick={signOut}>Sign Out</Button>
          ) : (
            <Button onClick={signInWithGoogle}>Sign In</Button>
          )}
          <p>{user ? user.email : null}</p>
        </SidebarContainer>

        <CalendarContainer>
          <CalendarHeader>
            <CalendarHeaderLeft>
              <CalendarHeaderMonthYear>
                {currentMonthText}
              </CalendarHeaderMonthYear>
            </CalendarHeaderLeft>
            <CalendarHeaderRight></CalendarHeaderRight>
          </CalendarHeader>
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
                  key={i}
                  isCurrentMonth={day.isCurrentMonth}
                  onClick={() => setModalVisible(true)}
                >
                  <DayTextContainer>
                    <DayText>{day.dayOfMonth}</DayText>
                  </DayTextContainer>
                </Day>
              );
            })}
          </MonthDays>
          <Modal
            opened={modalVisible}
            onClose={() => setModalVisible(false)}
            size="auto"
            centered
            overlayOpacity={0.2}
            overlayBlur={0.5}
            title="Add To Calendar"
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
            </ModalContainer>
          </Modal>
        </CalendarContainer>
      </Wrapper>
    </>
  );
}
