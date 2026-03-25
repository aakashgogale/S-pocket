/**
 * Simple heuristic threat detector.
 * Flags risky uploads and events and normalizes the payload
 * to what the Threat model expects.
 */
export const detectThreat = (payload = {}) => {
  const {
    event = "generic",
    mimetype = "",
    size = 0,
    filename = "",
    ip = "",
    description = "",
    severity: incomingSeverity
  } = payload;

  const extension = mimetype.split("/").pop()?.toLowerCase() || "";
  const riskyExt = ["exe", "bat", "cmd", "sh", "js", "msi"];
  const sizeMb = Number((size / (1024 * 1024)).toFixed(2));

  let severity = incomingSeverity || "low";
  let title = "Activity Logged";
  let detail = description || "No threat indicators detected.";
  let flagged = false;

  if (event === "file_upload") {
    if (riskyExt.includes(extension)) {
      severity = "high";
      flagged = true;
      title = "Suspicious file upload";
      detail = `Executable-type upload detected (${extension}).`;
    } else if (sizeMb >= 10) {
      severity = "medium";
      flagged = true;
      title = "Large file uploaded";
      detail = `File size is ${sizeMb} MB which exceeds safe threshold.`;
    } else {
      title = "File scanned";
      detail = "No malicious indicators found.";
      severity = "low";
    }
  } else if (incomingSeverity && incomingSeverity !== "low") {
    // Allow manual severity override for other events
    flagged = true;
    title = payload.title || "Security event detected";
    detail = description || "Custom security signal received.";
    severity = incomingSeverity;
  }

  return {
    flagged,
    threat: {
      title,
      description: detail,
      severity,
      type: event,
      metadata: {
        ip,
        filename,
        sizeMb,
        mimetype
      },
      status: flagged ? "open" : "resolved"
    }
  };
};
