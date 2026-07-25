import { useWindowDimensions } from "react-native";

export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();

  const isVeryCompactPhone = width < 350;
  const isCompactPhone = width < 380;
  const isLargePhone = width >= 430 && width < 600;
  const isMediumWindow = width >= 600 && width < 840;
  const isExpandedWindow = width >= 840;
  const isWideWindow = isMediumWindow || isExpandedWindow;

  const type = {
    pageTitle: isVeryCompactPhone
      ? 25
      : isCompactPhone
        ? 27
        : isWideWindow
          ? 34
          : isLargePhone
            ? 31
            : 29,

    heroTitle: isVeryCompactPhone
      ? 25
      : isCompactPhone
        ? 27
        : isWideWindow
          ? 36
          : isLargePhone
            ? 32
            : 30,

    sectionTitle: isCompactPhone
      ? 18
      : isWideWindow
        ? 23
        : 20,

    cardTitle: isVeryCompactPhone
      ? 16
      : isCompactPhone
        ? 17
        : isWideWindow
          ? 21
          : 18,

    body: isCompactPhone
      ? 14
      : isWideWindow
        ? 16
        : 15,

    small: isCompactPhone
      ? 12
      : isWideWindow
        ? 14
        : 13,

    button: isCompactPhone
      ? 15
      : isWideWindow
        ? 17
        : 16,
  };

  const layout = {
    horizontalPadding: isVeryCompactPhone
      ? 16
      : isWideWindow
        ? 28
        : 20,

    cardPadding: isCompactPhone
      ? 16
      : isWideWindow
        ? 24
        : 20,

    contentMaxWidth: isWideWindow
      ? 720
      : 560,

    eventCardImageHeight: isVeryCompactPhone
      ? 170
      : isCompactPhone
        ? 185
        : isWideWindow
          ? 280
          : isLargePhone
            ? 240
            : 215,

    eventHeroHeight: isVeryCompactPhone
      ? 230
      : isCompactPhone
        ? 250
        : isWideWindow
          ? 390
          : isLargePhone
            ? 330
            : 295,

    notificationImageSize: isCompactPhone
      ? 60
      : isWideWindow
        ? 84
        : 72,
  };

  return {
    width,
    height,
    fontScale,
    isVeryCompactPhone,
    isCompactPhone,
    isLargePhone,
    isMediumWindow,
    isExpandedWindow,
    isWideWindow,
    type,
    layout,
  };
}
