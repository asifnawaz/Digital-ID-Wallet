import BCrypt from "bcryptjs";

//NOTE(martina): this file is for utility functions that do not involve API calls
//For API related utility functions, see common/user-behaviors.js
//And for uploading related utility functions, see common/file-utilities.js

export const getPublicAndPrivateFiles = ({ viewer }) => {
  let publicFileIds = [];
  for (let slate of viewer.slates) {
    if (slate.isPublic) {
      publicFileIds.push(...slate.objects.map((obj) => obj.id));
    }
  }

  let publicFiles = [];
  let privateFiles = [];
  let library = viewer.library || [];
  for (let file of library) {
    if (file.isPublic || publicFileIds.includes(file.id)) {
      publicFiles.push(file);
    } else {
      privateFiles.push(file);
    }
  }
  return { publicFiles, privateFiles };
};

export const generateNumberByStep = ({ min, max, step = 1 }) => {
  var numbers = [];
  for (var n = min; n <= max; n += step) {
    numbers.push(n);
  }

  const randomIndex = Math.floor(Math.random() * numbers.length);
  return numbers[randomIndex];
};

export const endsWithAny = (options, string) =>
  options.some((option) => {
    if (string) {
      return string.endsWith(option);
    } else {
      return false;
    }
  });

export const encryptPasswordClient = async (text) => {
  const salt = "$2a$06$Yl.tEYt9ZxMcem5e6AbeUO";
  let hash = text;
  const rounds = 5;

  for (let i = 1; i <= rounds; i++) {
    hash = await BCrypt.hash(text, salt);
  }

  return hash;
};

export const coerceToArray = (input) => {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input;
  } else {
    return [input];
  }
};

export const getFileExtension = (filename) => filename?.split(".").pop();

export const getTimeUnitBetween = (date) => {
  const pastDate = new Date(date);
  const now = new Date();

  const differenceInSeconds = Math.floor((now - pastDate) / 1000);
  if (differenceInSeconds < 60) {
    return differenceInSeconds + "s";
  }

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);
  if (differenceInMinutes < 60) {
    return differenceInMinutes + "m";
  }

  const differenceInHours = Math.floor(differenceInMinutes / 60);
  if (differenceInHours < 24) {
    return differenceInHours + "h";
  }

  const differenceInDays = Math.floor(differenceInHours / 24);
  if (differenceInDays < 24) {
    return differenceInDays + "d";
  }

  const differenceInMonths = Math.floor(differenceInDays / 30);
  return differenceInMonths + "M";
};
