import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from "date-fns";

const API_BASE = "http://calapi.inadiutorium.cz/api/v0/en";

const App = () => {
  const [view, setView] = useState("month"); // 'month' or 'week'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(false);

  const dateRange = useMemo(() => {
    const start =
      view === "month"
        ? startOfWeek(startOfMonth(currentDate))
        : startOfWeek(currentDate);
    const end =
      view === "month"
        ? endOfWeek(endOfMonth(currentDate))
        : endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [view, currentDate]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const newEvents = { ...events };

      const fetchDates = dateRange.filter((d) => {
        const key = format(d, "yyyy-MM-dd");
        return !newEvents[key];
      });

      await Promise.all(
        fetchDates.map(async (date) => {
          const year = format(date, "yyyy");
          const month = format(date, "M"); // no leading zero
          const day = format(date, "d");

          const key = format(date, "yyyy-MM-dd");

          try {
            const res = await axios.get(`${API_BASE}/${year}/${month}/${day}`);
            newEvents[key] = res.data.celebrations;
          } catch (e) {
            newEvents[key] = [{ title: "Error loading data", rank: "" }];
          }
        })
      );

      setEvents(newEvents);
      setLoading(false);
    };

    fetchEvents();
  }, [dateRange]);

  const changeDate = (direction) => {
    if (view === "month") {
      setCurrentDate(
        direction === "prev"
          ? subMonths(currentDate, 1)
          : addMonths(currentDate, 1)
      );
    } else {
      setCurrentDate(
        direction === "prev"
          ? subWeeks(currentDate, 1)
          : addWeeks(currentDate, 1)
      );
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Liturgical Calendar</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView("month")}
            className={`px-3 py-1 rounded ${
              view === "month" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1 rounded ${
              view === "week" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => changeDate("prev")}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            ←
          </button>
          <button
            onClick={() => changeDate("next")}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            →
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      <div
        className={`grid ${
          view === "month" ? "grid-cols-7" : "grid-cols-7"
        } gap-2`}
      >
        {dateRange.map((date) => {
          const key = format(date, "yyyy-MM-dd");
          return (
            <div
              key={key}
              className="border rounded p-2 text-sm bg-white shadow hover:shadow-md transition"
            >
              <div className="font-bold">{format(date, "EEE d")}</div>
              <ul className="mt-1">
                {(events[key] || []).map((ev, i) => (
                  <li key={i} className="text-gray-700 text-xs">
                    • {ev.title}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
