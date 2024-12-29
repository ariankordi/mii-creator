import * as THREE from "three";
import {
  cLightAmbient,
  cLightDiffuse,
  cLightDir,
  cLightSpecular,
  cMaterialName,
  cMaterialParam,
  cRimColor,
  cRimPower,
} from "./fflShaderConst";
import { fflFragmentShader, fflVertexShader } from "./FFLShader";
import { switchFragmentShader, switchVertexShader } from "./SwitchShader";
import {
  cBeardMaterials,
  cBodyMaterials,
  cFacelineMaterials,
  cGlassMaterial,
  cHairMaterials,
  cHatMaterials,
  cMaskMaterial,
  cNoseMaterials,
  cPantsMaterials,
  FFLI_NN_MII_COMMON_COLOR_MASK,
  type DrawParamMaterial,
} from "./SwitchShaderMaterials";
import type Mii from "../../../external/mii-js/mii";
import { getSetting } from "../../../util/Settings";
import { miitomoFragmentShader, miitomoVertexShader } from "./MiitomoShader";

export function traverseAddShader(
  model: THREE.Group<THREE.Object3DEventMap>,
  mii: Mii
) {
  // Traverse the model to access its meshes
  model.traverse((n) => {
    const node = n as THREE.Mesh;
    if (node.isMesh) {
      traverseMesh(node, mii);
    }
  });
}
export async function traverseMesh(node: THREE.Mesh, mpCharInfo: Mii) {
  const shaderSetting = await getSetting("shaderType");
  const originalMaterial = node.material as THREE.MeshBasicMaterial;

  if (shaderSetting === "none") {
    const nonShaderMaterial = new THREE.MeshPhysicalMaterial({
      color: originalMaterial.color,
      side: originalMaterial.side,
      map: originalMaterial.map,
      blending: THREE.CustomBlending,
      blendDstAlpha: THREE.OneFactor,
      transparent: originalMaterial.transparent,
      alphaTest: originalMaterial.alphaTest,
      metalness: 1,
      roughness: 1,
      reflectivity: 1,
    });
    node.material = nonShaderMaterial;
    return;
  }

  // Access userData from geometry
  const userData = node.geometry.userData;

  if (userData.ignore !== undefined) {
    if (userData.ignore === 1) return;
  }

  // Retrieve modulateType and map to material parameters
  let modulateType = userData.modulateType;
  if (userData.modulateType === undefined)
    console.warn(`Mesh "${node.name}" is missing "modulateType" in userData.`);

  let modulateSkinning = userData.modulateSkinning;
  if (userData.modulateSkinning === undefined) modulateSkinning = 0;

  // HACK for now: disable lighting on mask, glass, noseline
  // (Because there is some lighting bug affecting
  // those that does not happen in FFL-Testing)
  const lightEnable = modulateType > 5 ? false : true;
  // Select material parameter based on the modulate type, default to faceline
  let materialParam =
    modulateType !== undefined
      ? modulateType && modulateType < 9
        ? cMaterialParam[modulateType]
        : cMaterialParam[0]
      : cMaterialParam[0];

  // Retrieve modulateMode, defaulting to constant color
  let modulateMode =
    userData.modulateMode === undefined ? 0 : userData.modulateMode;

  // Retrieve modulateColor (vec3)
  let modulateColor;
  if (!userData.modulateColor) {
    console.warn(`Mesh "${node.name}" is missing "modulateColor" in userData.`);
    // Default to red if missing
    modulateColor = new THREE.Vector4(1, 0, 0, 1);
  } else {
    modulateColor = new THREE.Vector4(...userData.modulateColor, 1);
  }

  // Define macros based on the presence of textures
  const defines: Record<string, any> = {};

  // let tex: THREE.Texture | null = null;

  THREE.ColorManagement.enabled = false;
  if (originalMaterial.map) {
    defines.USE_MAP = "";

    // try to fix it some more.. lol
    originalMaterial.map.colorSpace = THREE.LinearSRGBColorSpace;
    originalMaterial.needsUpdate = true;
  }

  // Function to Map FFLCullMode to three.js material side
  let side = originalMaterial.side;
  if (userData.cullMode !== undefined) {
    switch (userData.cullMode) {
      case 0: // FFL_CULL_MODE_NONE
        side = THREE.DoubleSide; // No culling
        break;
      case 1: // FFL_CULL_MODE_BACK
        side = THREE.FrontSide; // Cull back faces, render front
        break;
      case 2: // FFL_CULL_MODE_FRONT
        side = THREE.BackSide; // Cull front faces, render back
        break;
    }
  }

  let finalMat: THREE.Material;

  if (shaderSetting === "switch") {
    /* Do A LOTTA Calculations */
    let drawParamMaterial: DrawParamMaterial;
    let commonColor: number = 0; // failsafe common color set
    switch (modulateType) {
      case cMaterialName.FFL_MODULATE_TYPE_SHAPE_NOSELINE:
      case cMaterialName.FFL_MODULATE_TYPE_SHAPE_MASK:
        drawParamMaterial = cMaskMaterial;
        break;
      case cMaterialName.FFL_MODULATE_TYPE_SHAPE_GLASS:
        drawParamMaterial = cGlassMaterial;
        break;
      // pants: special or not
      case cMaterialName.FFL_MODULATE_TYPE_SHAPE_FOREHEAD:
      case cMaterialName.FFL_MODULATE_TYPE_SHAPE_FACELINE:
        // does not need conversion
        drawParamMaterial = cFacelineMaterials[mpCharInfo.extFacelineColor];
        break;
      case cMaterialName.FFL_MODULATE_TYPE_SHAPE_NOSE:
        drawParamMaterial = cNoseMaterials[mpCharInfo.extFacelineColor];
        break;
      // body: favorite color
      case cMaterialName.FFL_MODULATE_TYPE_SHAPE_BODY:
        drawParamMaterial = cBodyMaterials[mpCharInfo.favoriteColor];
        break;
      case cMaterialName.FFL_MODULATE_TYPE_SHAPE_PANTS:
        drawParamMaterial =
          mpCharInfo.normalMii === false
            ? cPantsMaterials[1]
            : cPantsMaterials[0];
        break;
      // case cMaterialName.CUSTOM_MATERIAL_PARAM_BODY:
      //     drawParamMaterial = cBodyMaterials[mpCharInfo->favoriteColor];
      //     break;
      // case static_cast<FFLModulateType>(SWITCH_MATERIAL_PARAM_PANTS_GRAY):
      //     drawParamMaterial = cPantsMaterials[0]; // gray index
      //     break;
      // case static_cast<FFLModulateType>(SWITCH_MATERIAL_PARAM_PANTS_GOLD):
      //     drawParamMaterial = cPantsMaterials[1]; // gold index
      //     break;
      case cMaterialName.FFL_MODULATE_TYPE_SHAPE_CAP:
        drawParamMaterial = cHatMaterials[mpCharInfo.favoriteColor];
        break;

      case cMaterialName.FFL_MODULATE_TYPE_SHAPE_HAIR:
        // HACK: ver3 hair color 0 maps to common color 8
        if (mpCharInfo.hairColor == 0) commonColor = 8;
        else
          commonColor = mpCharInfo.extHairColor & FFLI_NN_MII_COMMON_COLOR_MASK;
        drawParamMaterial = cHairMaterials[commonColor];
        //RIO_LOG("hair color: %d, specular factor B: %f\n", commonColor, drawParamMaterial.specular.factorB);
        break;
      case cMaterialName.FFL_MODULATE_TYPE_SHAPE_BEARD:
        // HACK: same as above
        if (mpCharInfo.facialHairColor == 0) commonColor = 8;
        else
          commonColor =
            mpCharInfo.extBeardColor & FFLI_NN_MII_COMMON_COLOR_MASK;
        drawParamMaterial = cBeardMaterials[commonColor];
        break;
      default:
        // not suitable for material, return
        return;
    }

    const uniforms: Record<string, any> = {};

    /*
        PIXEL_UNIFORM_MODULATE_TYPE = modulateType
        PIXEL_UNIFORM_GAMMA_TYPE = gammaType
        PIXEL_UNIFORM_DRAW_TYPE = drawType
        PIXEL_UNIFORM_PAD0 = pad0
        PIXEL_UNIFORM_CONST_COLOR1 = constColor1
        PIXEL_UNIFORM_CONST_COLOR2 = constColor2
        PIXEL_UNIFORM_CONST_COLOR3 = constColor3
        PIXEL_UNIFORM_LIGHT_DIR_IN_VIEW = lightDirInView
        PIXEL_UNIFORM_LIGHT_COLOR = lightColor
        PIXEL_UNIFORM_SSS_COLOR = u_SssColor
        PIXEL_UNIFORM_SPECULAR_COLOR = u_SpecularColor
        PIXEL_UNIFORM_RIM_COLOR = u_RimColor
        PIXEL_UNIFORM_HALF_LAMBERT_FACTOR = u_HalfLambertFactor
        PIXEL_UNIFORM_SSS_SPECULAR_FACTOR = u_SssSpecularFactor
        PIXEL_UNIFORM_SPECULAR_FACTOR_A = u_SpecularFactorA
        PIXEL_UNIFORM_SPECULAR_FACTOR_B = u_SpecularFactorB
        PIXEL_UNIFORM_SPECULAR_SHINNESS = u_SpecularShinness
        PIXEL_UNIFORM_RIM_POWER = u_RimPower
        PIXEL_UNIFORM_RIM_WIDTH = u_RimWidth
        PIXEL_UNIFORM_LIGHT_ENABLE = lightEnable
    */
    // AlphaOpa -> LuminanceAlpha
    if (modulateType === 5) {
      modulateType = 4;
    }
    // LuminanceAlpha -> AlphaOpa
    else if (modulateType === 4) {
      modulateType = 5;
    }
    // glass
    else if (
      modulateType === cMaterialName.FFL_MODULATE_TYPE_SHAPE_GLASS ||
      modulateType === cMaterialName.FFL_MODULATE_TYPE_SHAPE_MASK ||
      modulateType === cMaterialName.FFL_MODULATE_TYPE_SHAPE_NOSELINE
    ) {
      modulateMode = 1;
    } else if (modulateType === 5) {
      modulateType = 0;
      modulateMode = 0;
    }
    uniforms["modulateType"] = { value: modulateMode };
    // uniforms["lightEnable"] = { value: modulateMode > 5 ? false : true };
    uniforms["lightEnable"] = { value: true };

    uniforms["u_const1"] = {
      value: modulateColor,
    };

    // mShader.setUniform(
    //   drawParamMaterial.sssColor.r,
    //    drawParamMaterial.sssColor.g,
    //    drawParamMaterial.sssColor.b, 1.00f, u32(-1), mPixelUniformLocation[PIXEL_UNIFORM_SSS_COLOR]);
    uniforms["u_SssColor"] = {
      value: new THREE.Vector4(
        drawParamMaterial.sssColor[0],
        drawParamMaterial.sssColor[1],
        drawParamMaterial.sssColor[2],
        1.0
      ),
    };
    // mShader.setUniform(
    //   drawParamMaterial.specular.color.r,
    //   drawParamMaterial.specular.color.g,
    //   drawParamMaterial.specular.color.b, 1.00f, u32(-1), mPixelUniformLocation[PIXEL_UNIFORM_SPECULAR_COLOR]);
    uniforms["u_SpecularColor"] = {
      value: new THREE.Vector4(
        drawParamMaterial.specular.color[0],
        drawParamMaterial.specular.color[1],
        drawParamMaterial.specular.color[2],
        1.0
      ),
    };
    // mShader.setUniform(
    //   drawParamMaterial.rimLight.color.r,
    //    drawParamMaterial.rimLight.color.g,
    //     drawParamMaterial.rimLight.color.b, 1.00f, u32(-1), mPixelUniformLocation[PIXEL_UNIFORM_RIM_COLOR]);
    uniforms["u_RimColor"] = {
      value: new THREE.Vector4(
        drawParamMaterial.rimLight.color[0],
        drawParamMaterial.rimLight.color[1],
        drawParamMaterial.rimLight.color[2],
        1.0
      ),
    };
    // mShader.setUniform(
    //   drawParamMaterial.halfLambertFactor,
    //   u32(-1),
    //   mPixelUniformLocation[PIXEL_UNIFORM_HALF_LAMBERT_FACTOR]
    // );
    uniforms["u_HalfLambertFactor"] = {
      value: drawParamMaterial.halfLambertFactor,
    };
    // mShader.setUniform(
    //   drawParamMaterial.sssSpecularBlendFactor,
    //   u32(-1),
    //   mPixelUniformLocation[PIXEL_UNIFORM_SSS_SPECULAR_FACTOR]
    // );
    uniforms["u_SssSpecularFactor"] = {
      value: drawParamMaterial.sssSpecularBlendFactor,
    };
    // mShader.setUniform(
    //   drawParamMaterial.specular.factorA,
    //   u32(-1),
    //   mPixelUniformLocation[PIXEL_UNIFORM_SPECULAR_FACTOR_A]
    // );
    uniforms["u_SpecularFactorA"] = {
      value: drawParamMaterial.specular.factorA,
    };
    // mShader.setUniform(
    //   drawParamMaterial.specular.factorB,
    //   u32(-1),
    //   mPixelUniformLocation[PIXEL_UNIFORM_SPECULAR_FACTOR_B]
    // );
    uniforms["u_SpecularFactorB"] = {
      value: drawParamMaterial.specular.factorB,
    };
    // mShader.setUniform(
    //   drawParamMaterial.specular.shinness,
    //   u32(-1),
    //   mPixelUniformLocation[PIXEL_UNIFORM_SPECULAR_SHINNESS]
    // );
    uniforms["u_SpecularShinness"] = {
      value: drawParamMaterial.specular.shinness,
    };
    // mShader.setUniform(
    //   drawParamMaterial.rimLight.power,
    //   u32(-1),
    //   mPixelUniformLocation[PIXEL_UNIFORM_RIM_POWER]
    // );
    uniforms["u_RimPower"] = {
      value: drawParamMaterial.rimLight.power,
    };
    // mShader.setUniform(
    //   drawParamMaterial.rimLight.width,
    //   u32(-1),
    //   mPixelUniformLocation[PIXEL_UNIFORM_RIM_WIDTH]
    // );
    uniforms["u_RimWidth"] = {
      value: drawParamMaterial.rimLight.width,
    };

    const cLightDir = new THREE.Vector4(
      -0.12279,
      0.70711,
      0.69636,
      1.0
    ).negate();
    const cLightColor = new THREE.Vector4(1.0, 1.0, 1.0, 1.0);

    // Extra Uniforms
    uniforms["gammaType"] = { value: 1 };
    uniforms["lightDirInView"] = { value: cLightDir };
    uniforms["lightColor"] = { value: cLightColor };

    // set draw type here
    enum DrawType {
      DRAW_TYPE_NORMAL = 0,
      DRAW_TYPE_FACELINE = 1,
      DRAW_TYPE_HAIR = 2,
    }
    let drawType: number = 0;

    switch (modulateType) {
      case cMaterialName.FFL_MODULATE_TYPE_SHAPE_HAIR:
        drawType = DrawType.DRAW_TYPE_HAIR;
        break;
      // NOTE: the shader will take alpha into account if
      // you set draw type uniform to this, and the faceline
      // texture would need to be drawn with alpha, however
      // ffl does not do this by default and as of writing
      // i have removed the hack to do this and it seems fine
      default:
        drawType = DrawType.DRAW_TYPE_NORMAL;
        break;
    }

    // mShader.setUniform(s32(drawType), u32(-1), mPixelUniformLocation[PIXEL_UNIFORM_DRAW_TYPE]);
    uniforms.drawType = { value: drawType };
    uniforms["s_Tex"] = { value: originalMaterial.map };

    finalMat = new THREE.ShaderMaterial({
      vertexShader: switchVertexShader,
      fragmentShader: switchFragmentShader,
      uniforms: {
        // TODO
        ...uniforms,
      },
      defines: defines,
      side: side,
      blending: THREE.CustomBlending,
      blendDstAlpha: THREE.OneFactor,
      transparent: originalMaterial.transparent, // Handle transparency
      alphaTest: originalMaterial.alphaTest, // Handle alpha testing
    });
  } else if (shaderSetting === "wiiu") {
    if (
      modulateType === cMaterialName.FFL_MODULATE_TYPE_SHAPE_BODY ||
      modulateType === cMaterialName.FFL_MODULATE_TYPE_SHAPE_PANTS
    ) {
      switch (modulateType) {
        case cMaterialName.FFL_MODULATE_TYPE_SHAPE_BODY:
          materialParam =
            cMaterialParam[cMaterialName.FFL_MODULATE_TYPE_SHAPE_BODY];
          break;
        case cMaterialName.FFL_MODULATE_TYPE_SHAPE_PANTS:
          materialParam =
            cMaterialParam[cMaterialName.FFL_MODULATE_TYPE_SHAPE_PANTS];
          break;
      }
      finalMat = new THREE.ShaderMaterial({
        vertexShader: fflVertexShader,
        fragmentShader: fflFragmentShader,
        uniforms: {
          u_const1: { value: modulateColor },
          u_light_ambient: { value: cLightAmbient },
          u_light_diffuse: { value: cLightDiffuse },
          u_light_specular: { value: cLightSpecular },
          u_light_dir: { value: cLightDir },
          u_light_enable: { value: true },
          u_material_ambient: { value: materialParam.ambient },
          u_material_diffuse: { value: materialParam.diffuse },
          u_material_specular: { value: materialParam.specular },
          u_material_specular_mode: { value: materialParam.specularMode },
          u_material_specular_power: { value: materialParam.specularPower },
          u_mode: { value: modulateMode },
          u_rim_color: { value: new THREE.Vector4(0.4, 0.4, 0.4, 1.0) },
          u_rim_power: { value: cRimPower },
          s_texture: { value: originalMaterial.map },
        },
        defines: defines,
        side: side,
        // NOTE: usually these blend modes are
        // only set for DrawXlu stage
        blending: THREE.CustomBlending,
        blendDstAlpha: THREE.OneFactor,
        transparent: originalMaterial.transparent, // Handle transparency
        alphaTest: originalMaterial.alphaTest, // Handle alpha testing
      });
    }
    // Create a custom ShaderMaterial
    else {
      finalMat = new THREE.ShaderMaterial({
        vertexShader: fflVertexShader,
        fragmentShader: fflFragmentShader,
        uniforms: {
          u_const1: { value: modulateColor },
          u_light_ambient: { value: cLightAmbient },
          u_light_diffuse: { value: cLightDiffuse },
          u_light_specular: { value: cLightSpecular },
          u_light_dir: { value: cLightDir },
          u_light_enable: { value: lightEnable },
          u_material_ambient: { value: materialParam.ambient },
          u_material_diffuse: { value: materialParam.diffuse },
          u_material_specular: { value: materialParam.specular },
          u_material_specular_mode: { value: materialParam.specularMode },
          u_material_specular_power: { value: materialParam.specularPower },
          u_mode: { value: modulateMode },
          u_rim_color: { value: cRimColor },
          u_rim_power: { value: cRimPower },
          s_texture: { value: originalMaterial.map },
        },
        defines: defines,
        side: side,
        // NOTE: usually these blend modes are
        // only set for DrawXlu stage
        blending: THREE.CustomBlending,
        blendDstAlpha: THREE.OneFactor,
        transparent: originalMaterial.transparent, // Handle transparency
        alphaTest: originalMaterial.alphaTest, // Handle alpha testing
      });
    }
  } else if (shaderSetting === "lightDisabled") {
    // it's easier to use the shader w/ lightEnable set to false for this
    // as MeshBasicMaterial is too bright
    finalMat = new THREE.ShaderMaterial({
      vertexShader: fflVertexShader,
      fragmentShader: fflFragmentShader,
      uniforms: {
        u_const1: { value: modulateColor },
        u_light_ambient: { value: cLightAmbient },
        u_light_diffuse: { value: cLightDiffuse },
        u_light_specular: { value: cLightSpecular },
        u_light_dir: { value: cLightDir },
        u_light_enable: { value: false },
        u_material_ambient: { value: materialParam.ambient },
        u_material_diffuse: { value: materialParam.diffuse },
        u_material_specular: { value: materialParam.specular },
        u_material_specular_mode: { value: materialParam.specularMode },
        u_material_specular_power: { value: materialParam.specularPower },
        u_mode: { value: modulateMode },
        u_rim_color: { value: cRimColor },
        u_rim_power: { value: cRimPower },
        s_texture: { value: originalMaterial.map },
      },
      defines: defines,
      side: side,
      // NOTE: usually these blend modes are
      // only set for DrawXlu stage
      blending: THREE.CustomBlending,
      blendDstAlpha: THREE.OneFactor,
      transparent: originalMaterial.transparent, // Handle transparency
      alphaTest: originalMaterial.alphaTest, // Handle alpha testing
    });
  } else if (shaderSetting === "miitomo") {
    console.log("You are using Miitomo shader :)");
    finalMat = new THREE.ShaderMaterial({
      vertexShader: miitomoVertexShader,
      fragmentShader: miitomoFragmentShader,
      uniforms: {
        u_const1: { value: modulateColor },
        u_light_ambient: { value: cLightAmbient },
        u_light_diffuse: { value: cLightDiffuse },
        u_light_specular: { value: cLightSpecular },
        u_light_dir: { value: cLightDir },
        u_light_enable: { value: 1 },
        u_material_ambient: { value: materialParam.ambient },
        u_material_diffuse: { value: materialParam.diffuse },
        u_material_specular: { value: materialParam.specular },
        u_material_specular_mode: { value: materialParam.specularMode },
        u_material_specular_power: { value: materialParam.specularPower },
        u_mode: { value: modulateMode },
        u_rim_color: { value: cRimColor },
        u_rim_power: { value: cRimPower },
        s_texture: { value: originalMaterial.map },

        // Vertex shader normals :)
        uAlpha: { value: 1.0 },
        // three.js handles skinning
        uBoneCount: { value: 0 },
        uBoneMatrices: { value: [] },
        uBoneNormalMatrices: { value: [] },
        uDirLightColor0: {
          value: new THREE.Vector3(0.35137, 0.32392, 0.32392),
        },
        uDirLightColor1: {
          value: new THREE.Vector3(0.10039, 0.09255, 0.09255),
        },
        uDirLightCount: { value: 2 },
        uDirLightDirAndType0: {
          value: new THREE.Vector4(-0.2, 0.5, 0.8, -1.0),
        },
        uDirLightDirAndType1: {
          value: new THREE.Vector4(0.0, -0.19612, 0.98058, -1.0),
        },
        uEyePt: {
          value: new THREE.Vector3(0, 79.99184, 701.21417),
        },
        uHSLightGroundColor: {
          value: new THREE.Vector3(0.87843, 0.72157, 0.5898),
        },
        uHSLightSkyColor: {
          value: new THREE.Vector3(0.87843, 0.83451, 0.80314),
        },
      },
      defines: defines,
      side: side,
      // NOTE: usually these blend modes are
      // only set for DrawXlu stage
      blending: THREE.CustomBlending,
      blendDstAlpha: THREE.OneFactor,
      transparent: originalMaterial.transparent, // Handle transparency
      alphaTest: originalMaterial.alphaTest, // Handle alpha testing
    });
  } else {
    finalMat = new THREE.ShaderMaterial({
      vertexShader: fflVertexShader,
      fragmentShader: fflFragmentShader,
      uniforms: {
        u_const1: { value: modulateColor },
        u_light_ambient: { value: cLightAmbient },
        u_light_diffuse: { value: cLightDiffuse },
        u_light_specular: { value: cLightSpecular },
        u_light_dir: { value: cLightDir },
        u_light_enable: { value: lightEnable },
        u_material_ambient: { value: materialParam.ambient },
        u_material_diffuse: { value: materialParam.diffuse },
        u_material_specular: { value: materialParam.specular },
        u_material_specular_mode: { value: materialParam.specularMode },
        u_material_specular_power: { value: materialParam.specularPower },
        u_mode: { value: modulateMode },
        u_rim_color: { value: cRimColor },
        u_rim_power: { value: cRimPower },
        s_texture: { value: originalMaterial.map },
      },
      defines: defines,
      side: side,
      // NOTE: usually these blend modes are
      // only set for DrawXlu stage
      blending: THREE.CustomBlending,
      blendDstAlpha: THREE.OneFactor,
      transparent: originalMaterial.transparent, // Handle transparency
      alphaTest: originalMaterial.alphaTest, // Handle alpha testing
    });
  }

  // Assign the custom material to the mesh
  node.material = finalMat;
}
