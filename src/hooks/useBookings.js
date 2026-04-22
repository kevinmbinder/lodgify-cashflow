"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { processBookings, groupEventsByBooking } from "../lib/payoutCalc";

const POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes

export function useBookings(settings) {
  const [rawBookings, setRawBookings] = useState([]);
  const [syncedAt, setSyncedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setRawBookings(json.bookings || []);
      setSyncedAt(json.syncedAt ? new Date(json.syncedAt) : null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    timerRef.current = setInterval(fetchBookings, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [fetchBookings]);

  // Fee settings are applied client-side — recompute without re-fetching
  const events = processBookings(rawBookings, settings);
  const bookingGroups = groupEventsByBooking(rawBookings, settings);

  return { events, bookingGroups, loading, error, syncedAt };
}
