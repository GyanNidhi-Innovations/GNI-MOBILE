// utils/responsive.js

import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const wp = (percent) => (width * percent) / 100;
export const hp = (percent) => (height * percent) / 100;

export const isSmallDevice = width < 380;