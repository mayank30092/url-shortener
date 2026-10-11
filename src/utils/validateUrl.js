const validateUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const parsedUrl = new URL(value);

    return (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      parsedUrl.hostname.includes(".")
    );
  } catch {
    return false;
  }
};

module.exports = { validateUrl };
