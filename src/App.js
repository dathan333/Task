import "./App.css";
import React, { useState, useEffect, useMemo } from "react";
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
  const [view, setView] = useState("month");
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
  }, [currentDate, view]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const newEvents = { ...events };

      const datesToFetch = dateRange.filter((date) => {
        const key = format(date, "yyyy-MM-dd");
        return !newEvents[key];
      });

      await Promise.all(
        datesToFetch.map(async (date) => {
          const year = format(date, "yyyy");
          const month = format(date, "M");
          const day = format(date, "d");
          const key = format(date, "yyyy-MM-dd");

          try {
            const response = await fetch(`${API_BASE}/${year}/${month}/${day}`);
            if (!response.ok) throw new Error("Fetch failed");
            const data = await response.json();
            newEvents[key] = data.celebrations;
          } catch {
            newEvents[key] = [{ title: "Error loading data" }];
          }
        })
      );

      setEvents((prev) => ({ ...prev, ...newEvents }));
      setLoading(false);
    };

    fetchEvents();
  }, [dateRange]);

  const navigate = (dir) => {
    setCurrentDate((prev) =>
      view === "month"
        ? dir === "prev"
          ? subMonths(prev, 1)
          : addMonths(prev, 1)
        : dir === "prev"
        ? subWeeks(prev, 1)
        : addWeeks(prev, 1)
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 text-sm font-sans bg-blue-500 min-h-screen">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="bg-white p-4 rounded shadow flex-1">
          <div className="flex justify-between mb-2">
            <div className="flex gap-2">
              <button onClick={() => navigate("prev")}>←</button>
              <button onClick={() => setCurrentDate(new Date())}>
                Calendar
              </button>
              <button onClick={() => navigate("next")}>→</button>
            </div>
            <h2 className="font-bold">{format(currentDate, "MMMM yyyy")}</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setView("month")}
                className={
                  view === "month" ? "bg-gray-300 px-2 rounded" : "px-2"
                }
              >
                Month
              </button>
              <button
                onClick={() => setView("week")}
                className={
                  view === "week" ? "bg-gray-300 px-2 rounded" : "px-2"
                }
              >
                Week
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center font-semibold">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 mt-1">
            {dateRange.map((date) => {
              const key = format(date, "yyyy-MM-dd");
              return (
                <div
                  key={key}
                  className="h-20 p-1 border rounded overflow-auto"
                >
                  <div className="text-xs font-bold">{format(date, "d")}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow w-full md:w-96 overflow-auto max-h-[32rem]">
          <h3 className="font-bold mb-2">Events</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            dateRange.map((date) => {
              const key = format(date, "yyyy-MM-dd");
              const dayEvents = events[key] || [];
              return (
                <div key={key} className="mb-2">
                  <div className="font-semibold">
                    {format(date, "MMMM dd yyyy")}
                  </div>
                  <ul className="pl-2 list-disc text-xs text-gray-700">
                    {dayEvents.map((e, i) => (
                      <li key={i}>{e.title}</li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
