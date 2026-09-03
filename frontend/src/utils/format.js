export const money = (n) =>
  "ETB " +
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const getStatusClass = (s) => {
  if (s === "Confirmed" || s === "Completed") return "ok";
  if (s === "Pending") return "warn";
  return "bad";
};

export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const options = { year: "numeric", month: "short", day: "numeric" };
  if (includeTime) {
    options.hour = "numeric";
    options.minute = "2-digit";
  }
  return date.toLocaleDateString("en-US", options);
};

export const formatDuration = (start, end) => {
  if (!start || !end) return "";
  const diffMs = new Date(end) - new Date(start);
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 0) return "Invalid";

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

export const downloadCSV = (filename, headers, data) => {
  const csvRows = [];
  csvRows.push(
    headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","),
  );

  for (const row of data) {
    csvRows.push(
      row
        .map(
          (cell) =>
            `"${cell === null || cell === undefined ? "" : String(cell).replace(/"/g, '""')}"`,
        )
        .join(","),
    );
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
