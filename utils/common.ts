import dayjs from "dayjs";
import { envName } from "../configs";
import { v4 } from "uuid";

export const range = (start: number, end: number) => {
  const result = [];
  for (let i = start; i < end; i++) {
    result.push(i);
  }
  return result;
};

export const disabledDate = (current: any) => {
  // Can not select days before today and today
  return current && current < dayjs().endOf("day").subtract(1, "day");
};

export const delay = (() => {
  let timer = 0;
  return (callback: Function, ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(callback, ms);
  };
})();

export function getBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export const getFileContent = (file: string, callback: Function) => {
  const rawFile = new XMLHttpRequest();
  rawFile.open("GET", file, false);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status === 0) {
        const allText = rawFile.responseText;
        callback(allText);
      }
    }
  };
  rawFile.send(null);
};

export const validateEmail = (email: string) => {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export const encodeEmail = (str: string) => {
  if (validateEmail(str)) {
    const tmp = str?.split("@");

    return (
      tmp?.[0]?.slice(0, Math.round((40 * tmp?.[0].length) / 100)) +
      "***" +
      "@" +
      tmp?.[1]
    );
  }

  return str;
};

export const validatePhone = (phone: string) => {
  const regexPhoneNumber = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;

  return phone.match(regexPhoneNumber) ? true : false;
};

export const removeLoading = () => {
  setTimeout(() => {
    const dom = document.getElementById("page-loading-icon")!;
    if (dom) {
      dom.style.display = "none";
    }
  }, 1000);
};

export function kFormatter(value: string) {
  const newValue = parseInt(value || "0");

  var suffixes = ["", "K", "M", "B", "T"];
  var suffixNum = Math.floor(("" + newValue).length / 3);
  var shortValue: any = parseFloat(
    (suffixNum != 0
      ? newValue / Math.pow(1000, suffixNum)
      : newValue
    ).toPrecision(2)
  );
  if (shortValue % 1 != 0) {
    shortValue = shortValue.toFixed(1);
  }

  return shortValue + suffixes[suffixNum];
}

export const removeError = ({ errors, name, setErrors }: any) => {
  const newErrors = { ...errors };
  delete newErrors?.[name];
  setErrors({ ...newErrors });
};

export const IMGUR = "https://api.imgur.com/3/";
export const imgurKey = {
  id1: "28aa138ec07d5a7", // private key
  id2: "8e65e1476b42d2cc6a000eca122065833a211cc2",
  id3: "0YSiCkDts9wsHwg", // key album
};

export const hexToRgbA = (hex: string, opacity = 1) => {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split("");
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = "0x" + c.join("");
    return (
      "rgba(" +
      [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") +
      "," +
      opacity +
      ")"
    );
  }

  return undefined;
};

const createImage = (url: string) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 * @param {File} image - image File url
 * @param {Object} pixelCrop - pixelCrop Object provided by react-easy-crop
 * @param {number} rotation - optional rotation parameter
 */
export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: any,
  rotation = 0
) => {
  const image: any = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // set each dimensions to double largest dimension to allow for a safe area for the
  // image to rotate in without being clipped by canvas context
  canvas.width = safeArea;
  canvas.height = safeArea;

  // translate canvas context to a central location on image to allow rotating around the center.
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // draw rotated image and store data.
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image with correct offsets for x,y crop values.
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // As Base64 string
  // return canvas.toDataURL('image/jpeg');

  // As a blob
  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, "image/jpeg");
  });
};

const getDeepValue = (data: any, keys: any): any => {
  // If plain string, split it to array
  if (typeof keys === "string") {
    keys = keys.split(".");
  }

  // Get key
  const key = keys.shift();

  // Get data for that key
  const keyData = data[key];

  // Check if there is data
  if (!keyData) {
    return undefined;
  }

  // Check if we reached the end of query string
  if (keys.length === 0) {
    return keyData;
  }

  return getDeepValue(Object.assign({}, keyData), keys);
};

export type RemoveErrorProps = {
  errors: { [k: string]: any };
  setErrors: (args: { [k: string]: any }) => void;
  name: string;
};

export const getDeviceUuId = (userID?: string): string => {
  const localUid = localStorage.getItem(`${envName}-lci`);
  let uid = localUid ? localUid : v4();
  if (userID) {
    uid = userID;
  }
  localStorage.setItem(`${envName}-lci`, uid);
  return uid;
};

export function isGifOrGiphyUrl(url?: string): boolean {
  if (!url) return false;
  const isGif = /\.gif(\?.*)?$/i.test(url);

  // Check if the URL contains giphy.com
  const containsGiphy = url?.includes?.("giphy.com");

  return isGif || containsGiphy;
}

export const cleanText = (originalText?: string) =>
  (originalText ?? "").replace(/[\x00-\x1F\x7F-\x9F]/g, "");
