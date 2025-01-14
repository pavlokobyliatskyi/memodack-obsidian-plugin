export const getPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.indexOf("win") !== -1) {
    return "win";
  } else if (userAgent.indexOf("mac") !== -1) {
    return "mac";
  } else if (userAgent.indexOf("linux") !== -1) {
    return "linux";
  }

  return "win";
};
