import type Mii from "../mii-js/mii";

export function FFLiiGetEyeRotateOffset(type: number) {
  const ROTATE: number[] = [
    3, 4, 4, 4, 3, 4, 4, 4, 3, 4, 4, 4, 4, 3, 3, 4, 4, 4, 3, 3, 4, 3, 4, 3, 3,
    4, 3, 4, 4, 3, 4, 4, 4, 3, 3, 3, 4, 4, 3, 3, 3, 4, 4, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 4, 4, 4, 4, 3, 4, 4, 3, 4, 4, 4, 4,

    4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  ];
  return 32 - ROTATE[type];
}

export function FFLiiGetEyebrowRotateOffset(type: number) {
  const ROTATE = [
    6, 6, 5, 7, 6, 7, 6, 7, 4, 7, 6, 8, 5, 5, 6, 6, 7, 7, 6, 6, 5, 6, 7, 5,

    6, 6, 6, 6,
  ];
  return 32 - ROTATE[type];
}

export function FFLiiGetAdjustedMouthH(height: number, type: number) {
  switch (type) {
    case 3:
    case 15:
    case 19:
    case 20:
    case 21:
    case 23:
    case 25:
      if (height < 12) height = 12;
  }
  return height;
}

export function FFLiiGetAdjustedEyeH(height: number, type: number) {
  switch (type) {
    case 14:
    case 26:
      if (height < 12) height = 12;
  }
  return height;
}

export type FFLiCharInfo = {
  /*u32*/ miiVersion: number;
  parts: {
    /*s32*/ faceType: number;
    /*s32*/ facelineColor: number;
    /*s32*/ faceLine: number;
    /*s32*/ faceMakeup: number;
    /*s32*/ hairType: number;
    /*s32*/ hairColor: number;
    /*s32*/ hairDir: number;
    /*s32*/ eyeType: number;
    /*s32*/ eyeColor: number;
    /*s32*/ eyeScale: number;
    /*s32*/ eyeScaleY: number;
    /*s32*/ eyeRotate: number;
    /*s32*/ eyeSpacingX: number;
    /*s32*/ eyePositionY: number;
    /*s32*/ eyebrowType: number;
    /*s32*/ eyebrowColor: number;
    /*s32*/ eyebrowScale: number;
    /*s32*/ eyebrowScaleY: number;
    /*s32*/ eyebrowRotate: number;
    /*s32*/ eyebrowSpacingX: number;
    /*s32*/ eyebrowPositionY: number;
    /*s32*/ noseType: number;
    /*s32*/ noseScale: number;
    /*s32*/ nosePositionY: number;
    /*s32*/ mouthType: number;
    /*s32*/ mouthColor: number;
    /*s32*/ mouthScale: number;
    /*s32*/ mouthScaleY: number;
    /*s32*/ mouthPositionY: number;
    /*s32*/ mustacheType: number;
    /*s32*/ beardType: number;
    /*s32*/ beardColor: number;
    /*s32*/ mustacheScale: number;
    /*s32*/ mustachePositionY: number;
    /*s32*/ glassType: number;
    /*s32*/ glassColor: number;
    /*s32*/ glassScale: number;
    /*s32*/ glassPositionY: number;
    /*s32*/ moleType: number;
    /*s32*/ moleScale: number;
    /*s32*/ molePositionX: number;
    /*s32*/ molePositionY: number;
  };
  /*u32*/ height: number;
  /*u32*/ build: number;
  /*u16*/ name: string;
  /*u16*/ creatorName: string;
  /*FFLGender*/ gender: number;
  /*u32*/ birthMonth: number;
  /*u32*/ birthDay: number;
  /*u32*/ favoriteColor: number;
  /*u8*/ favoriteMii: number;
  /*u8*/ copyable: number;
  /*u8*/ ngWord: number;
  /*u8*/ localOnly: number;
  /*u32*/ regionMove: number;
  /*FFLFontRegion*/ fontRegion: number;
  /*u32*/ pageIndex: number;
  /*u32*/ slotIndex: number;
  /*FFLBirthPlatform*/ birthPlatform: number;
  /*FFLCreateID*/ creatorID: any;
  /*u16*/ _112: number; // Set to zero
  /*u32*/ _114: number; // Set to FFLiMiiDataCore._0_24_27
  /*FFLiAuthorID*/ authorID: any;
};

export enum FFLiOriginPosition {
  FFLI_ORIGIN_POSITION_CENTER = 0,
  FFLI_ORIGIN_POSITION_RIGHT = 1,
  FFLI_ORIGIN_POSITION_LEFT = 2,
}

export const MiiClassToFFLiCharInfo = (mii: Mii): FFLiCharInfo => ({
  _112: mii.unknown1,
  _114: mii.unknown2,
  authorID: mii.systemId,
  birthDay: mii.birthDay,
  birthMonth: mii.birthMonth,
  birthPlatform: mii.deviceOrigin,
  build: mii.build,
  copyable: Number(mii.allowCopying),
  creatorID: mii.systemId,
  creatorName: mii.creatorName,
  favoriteColor: mii.favoriteColor,
  favoriteMii: Number(mii.favorite),
  fontRegion: 0,
  gender: mii.gender,
  height: mii.height,
  localOnly: 0,
  miiVersion: mii.version,
  name: mii.miiName,
  ngWord: 0,
  pageIndex: mii.pageIndex,
  parts: {
    beardColor: mii.facialHairColor,
    beardType: mii.beardType,
    eyebrowColor: mii.eyebrowColor,
    eyebrowPositionY: mii.eyebrowYPosition,
    eyebrowRotate: mii.eyebrowRotation,
    eyebrowScale: mii.eyebrowScale,
    eyebrowScaleY: mii.eyebrowYPosition,
    eyebrowSpacingX: mii.eyebrowSpacing,
    eyebrowType: mii.eyebrowType,
    eyeColor: mii.eyeColor,
    eyePositionY: mii.eyeYPosition,
    eyeRotate: mii.eyeRotation,
    eyeScale: mii.eyeScale,
    eyeScaleY: mii.eyeVerticalStretch,
    eyeSpacingX: mii.eyeSpacing,
    eyeType: mii.eyeType,
    faceLine: mii.wrinklesType,
    facelineColor: mii.skinColor,
    faceMakeup: mii.makeupType,
    faceType: mii.faceType,
    glassColor: mii.glassesColor,
    glassPositionY: mii.glassesYPosition,
    glassScale: mii.glassesScale,
    glassType: mii.glassesType,
    hairColor: mii.hairColor,
    hairDir: Number(mii.flipHair),
    hairType: mii.hairType,
    molePositionX: mii.moleXPosition,
    molePositionY: mii.moleYPosition,
    moleScale: mii.moleScale,
    moleType: Number(mii.moleEnabled),
    mouthColor: mii.mouthColor,
    mouthPositionY: mii.mouthYPosition,
    mouthScale: mii.mouthScale,
    mouthScaleY: mii.mouthHorizontalStretch,
    mouthType: mii.mouthType,
    mustachePositionY: mii.mustacheYPosition,
    mustacheScale: mii.mustacheScale,
    mustacheType: mii.mustacheType,
    nosePositionY: mii.noseYPosition,
    noseScale: mii.noseScale,
    noseType: mii.noseType,
  },
  regionMove: mii.regionLock,
  slotIndex: mii.slotIndex,
});
