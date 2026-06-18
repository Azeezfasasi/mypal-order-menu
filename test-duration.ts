// Test script to verify duration calculation

import {
  calculateDuration,
  isValidDateTimeRange,
} from "@/components/events/create-event-modal/utils/durationCalculator";

console.log("Testing duration calculation...\n");

// Test cases
const testCases = [
  // Same day events
  {
    name: "Same day - 9 hours",
    startDate: "2025-07-29",
    startTime: "09:00 AM",
    endDate: "2025-07-29",
    endTime: "06:00 PM",
    expected: "9 Hours",
  },
  {
    name: "Same day - 2.5 hours",
    startDate: "2025-07-29",
    startTime: "02:00 PM",
    endDate: "2025-07-29",
    endTime: "04:30 PM",
    expected: "2 Hours 30 Minutes",
  },
  // Multi-day events
  {
    name: "Two days exactly",
    startDate: "2025-07-29",
    startTime: "09:00 AM",
    endDate: "2025-07-31",
    endTime: "09:00 AM",
    expected: "2 Days",
  },
  {
    name: "One day plus hours",
    startDate: "2025-07-29",
    startTime: "09:00 AM",
    endDate: "2025-07-30",
    endTime: "06:00 PM",
    expected: "1 Day 9 Hours",
  },
  // Edge cases
  {
    name: "Short duration - 30 minutes",
    startDate: "2025-07-29",
    startTime: "02:00 PM",
    endDate: "2025-07-29",
    endTime: "02:30 PM",
    expected: "30 Minutes",
  },
  {
    name: "Invalid - end before start",
    startDate: "2025-07-29",
    startTime: "06:00 PM",
    endDate: "2025-07-29",
    endTime: "09:00 AM",
    expected: "",
  },
];

testCases.forEach((test) => {
  try {
    const result = calculateDuration(
      test.startDate,
      test.startTime,
      test.endDate,
      test.endTime
    );
    const isValid = isValidDateTimeRange(
      test.startDate,
      test.startTime,
      test.endDate,
      test.endTime
    );

    console.log(`${test.name}:`);
    console.log(`  Expected: ${test.expected}`);
    console.log(`  Got: ${result}`);
    console.log(`  Valid range: ${isValid}`);
    console.log(`  Match: ${result === test.expected ? "✅" : "❌"}\n`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log(`${test.name}: Error - ${error?.message}\n`);
  }
});
