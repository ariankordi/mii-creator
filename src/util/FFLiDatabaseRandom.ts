import { FFLiiGetEyeRotateOffset } from "../class/JFL/src/detail/FFLiCharInfo";
import {
  RANDOM_PARTS_ARRAY_EYE_COLOR,
  RANDOM_PARTS_ARRAY_EYE_TYPE,
  RANDOM_PARTS_ARRAY_EYEBROW_TYPE,
  RANDOM_PARTS_ARRAY_FACE_LINE,
  RANDOM_PARTS_ARRAY_FACE_MAKEUP,
  RANDOM_PARTS_ARRAY_FACE_TYPE,
  RANDOM_PARTS_ARRAY_FACELINE_COLOR,
  RANDOM_PARTS_ARRAY_HAIR_COLOR,
  RANDOM_PARTS_ARRAY_HAIR_TYPE,
  RANDOM_PARTS_ARRAY_MOUTH_TYPE,
  RANDOM_PARTS_ARRAY_NOSE_TYPE,
} from "../constants/RandomParts";
import Mii from "../external/mii-js/mii";
import {
  FFL_MOUTH_COLOR_MAX,
  FFLFavoriteColor,
  FFLiiGetEyebrowRotateOffset,
} from "./FFLTypes";

function DetermineParam(
  pGender: FFLGender,
  pAge: FFLAge,
  pRace: FFLRace
): [FFLGender, FFLAge, FFLRace] {
  let gender: FFLGender = pGender,
    age: FFLAge = pAge,
    race: FFLRace = pRace;

  if (pGender == FFLGender.FFL_GENDER_MAX) {
    // u32 rnd = m_pRandomContext->Random(FFL_GENDER_MAX);
    const rnd = Math.floor(Math.random() * 2);
    gender = rnd == 0 ? FFLGender.FFL_GENDER_MALE : FFLGender.FFL_GENDER_FEMALE;
  }

  if (pAge == FFLAge.FFL_AGE_MAX) {
    // u32 rnd = m_pRandomContext->Random(10);
    // assuming the random is ceil of 1-10
    const rnd = Math.floor(Math.random() * 10);
    age =
      rnd < 4
        ? FFLAge.FFL_AGE_CHILD
        : rnd < 8
        ? FFLAge.FFL_AGE_ADULT
        : FFLAge.FFL_AGE_ELDER;
  }

  if (pRace == FFLRace.FFL_RACE_MAX) {
    // u32 rnd = m_pRandomContext->Random(10);
    const rnd = Math.floor(Math.random() * 10);
    race =
      rnd < 4
        ? FFLRace.FFL_RACE_ASIAN
        : rnd < 8
        ? FFLRace.FFL_RACE_WHITE
        : FFLRace.FFL_RACE_BLACK;
  }

  return [gender, age, race];
}

export enum FFLAge {
  FFL_AGE_CHILD = 0,
  FFL_AGE_ADULT = 1,
  FFL_AGE_ELDER = 2,
  FFL_AGE_MAX = 3,
}
export enum FFLGender {
  FFL_GENDER_MALE = 0,
  FFL_GENDER_FEMALE = 1,
  FFL_GENDER_MAX = 2,
}
export enum FFLRace {
  FFL_RACE_BLACK = 0,
  FFL_RACE_WHITE = 1,
  FFL_RACE_ASIAN = 2,
  FFL_RACE_MAX = 3,
}

function GetRandomGlassType(age: FFLAge) {
  let target = Math.floor(Math.random() * 100);
  let type = 0;
  while (target >= RANDOM_GLASS_TYPE[age][type]) type++;

  return type;
}

export function GetRandomParts(array: any[]) {
  return array[1][Math.floor(Math.random() * array[0])];
}

const RANDOM_GLASS_TYPE: any[] = [
  [90, 94, 96, 100, 0, 0, 0, 0, 0],
  [83, 86, 90, 93, 94, 96, 98, 100, 0],
  [78, 83, 0, 93, 0, 0, 98, 100, 0],
];

// void FFLiDatabaseRandom::Get(FFLiCharInfo* pCharInfo, FFLGender gender, FFLAge age, FFLRace race)
export function FFLiDatabaseRandom_Get(pCharInfo: Mii) {
  // {
  let [pGender, pAge, pRace] = [
    FFLGender.FFL_GENDER_MAX,
    FFLAge.FFL_AGE_MAX,
    FFLRace.FFL_RACE_MAX,
  ];
  let [gender, age, race] = DetermineParam(pGender, pAge, pRace);

  console.log("Gender,age,race", gender, age, race);

  //     pCharInfo.miiVersion = 3;
  pCharInfo.deviceOrigin = 3;
  //     s32 basePositionY = 0;
  let basePositionY = 0;
  //     if (gender == FFL_GENDER_FEMALE || age == FFL_AGE_CHILD)
  //         basePositionY = m_pRandomContext->Random(3);
  if (gender == FFLGender.FFL_GENDER_FEMALE || age == FFLAge.FFL_AGE_CHILD)
    basePositionY = Math.floor(Math.random() * 3);
  //     pCharInfo.faceType = GetRandomParts(RANDOM_PARTS_ARRAY_FACE_TYPE[gender][age][race], m_pRandomContext);
  //     pCharInfo.facelineColor = GetRandomParts(RANDOM_PARTS_ARRAY_FACELINE_COLOR[gender][race], m_pRandomContext);
  //     pCharInfo.faceLine = GetRandomParts(RANDOM_PARTS_ARRAY_FACE_LINE[gender][age][race], m_pRandomContext);
  //     pCharInfo.faceMakeup = GetRandomParts(RANDOM_PARTS_ARRAY_FACE_MAKEUP[gender][age][race], m_pRandomContext);
  //     pCharInfo.hairType = GetRandomParts(RANDOM_PARTS_ARRAY_HAIR_TYPE[gender][age][race], m_pRandomContext);
  //     pCharInfo.hairColor = GetRandomParts(RANDOM_PARTS_ARRAY_HAIR_COLOR[race][age], m_pRandomContext);
  //     pCharInfo.hairDir = m_pRandomContext->Random(FFL_HAIR_DIR_MAX);
  //     pCharInfo.eyeType = GetRandomParts(RANDOM_PARTS_ARRAY_EYE_TYPE[gender][age][race], m_pRandomContext);
  //     pCharInfo.eyeColor = GetRandomParts(RANDOM_PARTS_ARRAY_EYE_COLOR[race], m_pRandomContext);
  //     pCharInfo.eyeScale = 4;
  //     pCharInfo.eyeScaleY = 3;
  //     s32 eyeRotateOffsetTarget;
  pCharInfo.faceType = GetRandomParts(
    RANDOM_PARTS_ARRAY_FACE_TYPE[gender][age][race]
  );
  pCharInfo.skinColor = GetRandomParts(
    RANDOM_PARTS_ARRAY_FACELINE_COLOR[gender][race]
  );
  pCharInfo.wrinklesType = GetRandomParts(
    RANDOM_PARTS_ARRAY_FACE_LINE[gender][age][race]
  );
  pCharInfo.makeupType = GetRandomParts(
    RANDOM_PARTS_ARRAY_FACE_MAKEUP[gender][age][race]
  );
  pCharInfo.hairType = GetRandomParts(
    RANDOM_PARTS_ARRAY_HAIR_TYPE[gender][age][race]
  );
  pCharInfo.hairColor = GetRandomParts(
    RANDOM_PARTS_ARRAY_HAIR_COLOR[race][age]
  );
  pCharInfo.flipHair = Boolean(Math.ceil(Math.random() * 2));
  pCharInfo.eyeType = GetRandomParts(
    RANDOM_PARTS_ARRAY_EYE_TYPE[gender][age][race]
  );
  pCharInfo.eyeColor = GetRandomParts(RANDOM_PARTS_ARRAY_EYE_COLOR[race]);
  pCharInfo.eyeScale = 4;
  pCharInfo.eyeVerticalStretch = 3;
  let eyeRotateOffsetTarget: number;
  if (gender == FFLGender.FFL_GENDER_MALE) {
    pCharInfo.eyeRotation = 4;
    eyeRotateOffsetTarget = FFLiiGetEyeRotateOffset(2);
  } else {
    pCharInfo.eyeRotation = 3;
    eyeRotateOffsetTarget = FFLiiGetEyeRotateOffset(4);
  }
  const eyeRotateOffsetBase = FFLiiGetEyeRotateOffset(pCharInfo.eyeType);
  pCharInfo.eyeSpacing = 2;
  pCharInfo.eyeYPosition = basePositionY + 12;
  pCharInfo.eyeRotation += eyeRotateOffsetTarget - eyeRotateOffsetBase;
  pCharInfo.eyebrowType = GetRandomParts(
    RANDOM_PARTS_ARRAY_EYEBROW_TYPE[gender][age][race]
  );
  pCharInfo.eyebrowColor = pCharInfo.hairColor;
  pCharInfo.eyebrowScale = 4;
  pCharInfo.eyebrowVerticalStretch = 3;
  pCharInfo.eyebrowRotation = 6;
  pCharInfo.eyebrowSpacing = 2;
  let eyebrowRotateOffsetTarget;
  if (race == FFLRace.FFL_RACE_ASIAN) {
    pCharInfo.eyebrowYPosition = basePositionY + 9;
    eyebrowRotateOffsetTarget = FFLiiGetEyebrowRotateOffset(6);
  } else {
    pCharInfo.eyebrowYPosition = basePositionY + 10;
    eyebrowRotateOffsetTarget = FFLiiGetEyebrowRotateOffset(0);
  }
  const eyebrowRotateOffsetBase = FFLiiGetEyebrowRotateOffset(
    pCharInfo.eyebrowType
  );
  pCharInfo.eyebrowRotation +=
    eyebrowRotateOffsetTarget - eyebrowRotateOffsetBase;
  pCharInfo.noseType = GetRandomParts(
    RANDOM_PARTS_ARRAY_NOSE_TYPE[gender][age][race]
  );
  pCharInfo.noseScale = gender == FFLGender.FFL_GENDER_MALE ? 4 : 3;
  pCharInfo.noseYPosition = basePositionY + 9;
  pCharInfo.mouthType = GetRandomParts(
    RANDOM_PARTS_ARRAY_MOUTH_TYPE[gender][age][race]
  );
  pCharInfo.mouthColor =
    gender == FFLGender.FFL_GENDER_MALE
      ? 0
      : Math.floor(Math.random() * FFL_MOUTH_COLOR_MAX);
  pCharInfo.mouthScale = 4;
  pCharInfo.mouthHorizontalStretch = 3;
  pCharInfo.mouthYPosition = basePositionY + 13;
  let mustacheType, beardType, mustachePositionY;
  if (
    gender == FFLGender.FFL_GENDER_MALE &&
    (age == FFLAge.FFL_AGE_ADULT || age == FFLAge.FFL_AGE_ELDER) &&
    Math.floor(Math.random() * 10) < 2
  ) {
    mustacheType = 0;
    let randomBeardType = false;
    switch (Math.floor(Math.random() * 3)) {
      case 0:
        randomBeardType = true;
        break;
      //@ts-ignore fallthrough
      case 2:
        randomBeardType = true; // fall-through
      case 1:
        mustacheType = Math.floor(Math.random() * 5) + 1;
        break;
    }
    beardType = randomBeardType ? Math.floor(Math.random() * 5) + 1 : 0;
    mustachePositionY = 10;
  } else {
    mustacheType = 0;
    beardType = 0;
    mustachePositionY = basePositionY + 10;
  }
  pCharInfo.mustacheType = mustacheType;
  pCharInfo.beardType = beardType;
  pCharInfo.facialHairColor = pCharInfo.hairColor;
  pCharInfo.mustacheScale = 4;
  pCharInfo.mustacheYPosition = mustachePositionY;
  pCharInfo.glassesType = GetRandomGlassType(age);
  pCharInfo.glassesColor = 0;
  pCharInfo.glassesScale = 4;
  pCharInfo.glassesYPosition = basePositionY + 10;
  pCharInfo.moleEnabled = Boolean(0);
  pCharInfo.moleScale = 4;
  pCharInfo.moleXPosition = 2;
  pCharInfo.moleYPosition = 20;
  pCharInfo.height = 64;
  pCharInfo.build = 64;
  pCharInfo.miiName = "no name";
  // creator name is unset
  pCharInfo.gender = gender;
  pCharInfo.birthMonth = 0;
  pCharInfo.birthDay = 0;
  pCharInfo.favoriteColor = Math.floor(
    Math.random() * FFLFavoriteColor.FFL_FAVORITE_COLOR_MAX
  );
  pCharInfo.favorite = false;
  pCharInfo.allowCopying = true;
  pCharInfo.profanityFlag = false;
  // pCharInfo.nonUserMii= true;
  pCharInfo.regionLock = 0;
  pCharInfo.characterSet = 0; // FFL_FONT_REGION_JP_US_EU;
  pCharInfo.pageIndex = 0;
  pCharInfo.slotIndex = 0;
  pCharInfo.deviceOrigin = 4; //FFL_BIRTH_PLATFORM_WII_U;
  // pCharInfo.authorType = 0;
}

//@ts-expect-error Debugging
window.mii = Mii;
//@ts-expect-error Debugging
window.FFLiDatabaseRandom_Get = FFLiDatabaseRandom_Get;
