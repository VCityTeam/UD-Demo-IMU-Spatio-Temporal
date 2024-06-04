import * as itowns from 'itowns';
import * as proj4 from 'proj4';
import * as THREE from 'three';
import { initScene, loadMultipleJSON } from '@ud-viz/utils_browser';
import {
  C3DTTemporalTileset,
  C3DTTemporalBoundingVolume,
  C3DTTemporalBatchTable,
  STS_DISPLAY_MODE,
  STLayer,
  STSCircle,
  STSVector,
  STSParabola,
  STSHelix,
  ID as C3DTT_ID,
  Temporal3DTilesLayerWrapper
} from '@ud-viz/extensions_3d_tiles_temporal';

loadMultipleJSON([
  'https://raw.githubusercontent.com/VCityTeam/UD-Viz/ae6d4430e371f387a6aff9bd3d69b886947bef88/examples/assets/config/extents.json',
  'https://raw.githubusercontent.com/VCityTeam/UD-Viz/ae6d4430e371f387a6aff9bd3d69b886947bef88/examples/assets/config/crs.json',
  'https://raw.githubusercontent.com/VCityTeam/UD-Viz/ae6d4430e371f387a6aff9bd3d69b886947bef88/examples/assets/config/layer/3DTiles_temporal.json',
  'https://raw.githubusercontent.com/VCityTeam/UD-Viz/ae6d4430e371f387a6aff9bd3d69b886947bef88/examples/assets/config/layer/3DTiles_STS_data.json',
  'https://raw.githubusercontent.com/VCityTeam/UD-Viz/ae6d4430e371f387a6aff9bd3d69b886947bef88/examples/assets/config/layer/base_maps.json',
  'https://raw.githubusercontent.com/VCityTeam/UD-Viz/ae6d4430e371f387a6aff9bd3d69b886947bef88/examples/assets/config/layer/elevation.json',
]).then((configs) => {
  proj4.default.defs(configs['crs'][0].name, configs['crs'][0].transform);

  const extent = new itowns.Extent(
    configs['extents'][0].name,
    parseInt(configs['extents'][0].west),
    parseInt(configs['extents'][0].east),
    parseInt(configs['extents'][0].south),
    parseInt(configs['extents'][0].north)
  );

  // create a itowns planar view
  const viewDomElement = document.createElement('div');
  viewDomElement.classList.add('full_screen');
  document.body.appendChild(viewDomElement);
  const view = new itowns.PlanarView(viewDomElement, extent);

  // eslint-disable-next-line no-constant-condition
  if ('RUN_MODE' == 'production')
    loadingScreen(view, ['UD-VIZ', 'UDVIZ_VERSION']);

  // init scene 3D
  initScene(view.camera.camera3D, view.mainLoop.gfxEngine.renderer, view.scene);

  view.addLayer(
    new itowns.ColorLayer(configs['base_maps'][0]['name'], {
      updateStrategy: {
        type: itowns.STRATEGY_DICHOTOMY,
        options: {},
      },
      source: new itowns.WMSSource({
        extent: extent,
        name: configs['base_maps'][0].source['name'],
        url: configs['base_maps'][0].source['url'],
        version: configs['base_maps'][0].source['version'],
        crs: extent.crs,
        format: configs['base_maps'][0].source['format'],
      }),
      transparent: true,
    })
  );

  const isTextureFormat =
    configs['elevation']['format'] == 'image/jpeg' ||
    configs['elevation']['format'] == 'image/png';
  view.addLayer(
    new itowns.ElevationLayer(configs['elevation']['layer_name'], {
      useColorTextureElevation: isTextureFormat,
      colorTextureElevationMinZ: isTextureFormat
        ? configs['elevation']['colorTextureElevationMinZ']
        : null,
      colorTextureElevationMaxZ: isTextureFormat
        ? configs['elevation']['colorTextureElevationMaxZ']
        : null,
      source: new itowns.WMSSource({
        extent: extent,
        url: configs['elevation']['url'],
        name: configs['elevation']['name'],
        crs: extent.crs,
        heightMapWidth: 256,
        format: configs['elevation']['format'],
      }),
    })
  );

  const extensions = new itowns.C3DTExtensions();
  extensions.registerExtension(C3DTT_ID, {
    [itowns.C3DTilesTypes.batchtable]:
      C3DTTemporalBatchTable,
    [itowns.C3DTilesTypes.boundingVolume]:
      C3DTTemporalBoundingVolume,
    [itowns.C3DTilesTypes.tileset]:
      C3DTTemporalTileset,
  });

  // CREATE HTML
  const ui = document.createElement('div');
  document.body.appendChild(ui);
  ui.style = 'position: absolute; display: grid; left: 0%; top: 0%; z-index:10';

  const selectDataset = document.createElement('select');
  ui.appendChild(selectDataset);
  const optionDefaultDataset = document.createElement('option');
  optionDefaultDataset.innerText = 'Choose a dataset';
  optionDefaultDataset.selected = true;
  optionDefaultDataset.disabled = true;
  optionDefaultDataset.hidden = true;
  selectDataset.appendChild(optionDefaultDataset);
  const datasetFakeDataLyon = document.createElement('option');
  datasetFakeDataLyon.value = 'fakeLyon';
  datasetFakeDataLyon.innerText = 'Lyon fake data';
  selectDataset.appendChild(datasetFakeDataLyon);
  const datasetFakeDataGratteCiel = document.createElement('option');
  datasetFakeDataGratteCiel.value = 'fakeGratteCiel';
  datasetFakeDataGratteCiel.innerText = 'Gratte Ciel fake data';
  selectDataset.appendChild(datasetFakeDataGratteCiel);
  const datasetLyon = document.createElement('option');
  datasetLyon.value = 'lyon';
  datasetLyon.innerText = 'Lyon temporal';
  selectDataset.appendChild(datasetLyon);
  const datasetGratteCiel = document.createElement('option');
  datasetGratteCiel.value = 'gratteCiel';
  datasetGratteCiel.innerText = 'GratteCiel temporal';
  selectDataset.appendChild(datasetGratteCiel);

  const getDataset = () => {
    switch (selectDataset.selectedOptions[0].value) {
      case 'fakeLyon':
        return configs['3DTiles_STS_data'][0];
      case 'fakeGratteCiel':
        return configs['3DTiles_STS_data'][1];
      case 'lyon':
        return [configs['3DTiles_temporal'][0]];
      case 'gratteCiel':
        return [configs['3DTiles_temporal'][2]];
    }
  };

  const selectMode = document.createElement('select');
  selectMode.hidden = true;
  ui.appendChild(selectMode);
  const optionDefaultMode = document.createElement('option');
  optionDefaultMode.innerText = 'Choose a Mode';
  optionDefaultMode.selected = true;
  optionDefaultMode.disabled = true;
  optionDefaultMode.hidden = true;
  selectMode.appendChild(optionDefaultMode);

  for (const mode in STS_DISPLAY_MODE) {
    const optionMode = document.createElement('option');
    optionMode.innerText = STS_DISPLAY_MODE[mode];
    selectMode.appendChild(optionMode);
  }

  const getCurrentMode = () => {
    if (selectMode.selectedOptions[0] != optionDefaultMode)
      return selectMode.selectedOptions[0].value;
    return undefined;
  };

  const selectSTShape = document.createElement('select');
  selectSTShape.hidden = true;
  ui.appendChild(selectSTShape);
  const optionDefaultShape = document.createElement('option');
  optionDefaultShape.innerText = 'Choose a Shape';
  optionDefaultShape.disabled = true;
  optionDefaultShape.hidden = true;
  selectSTShape.appendChild(optionDefaultShape);

  // CIRCLE HTML
  const optionCircle = document.createElement('option');
  optionCircle.value = 'circle';
  optionCircle.innerText = 'Circle';
  selectSTShape.appendChild(optionCircle);

  const uiCircle = document.createElement('div');
  uiCircle.hidden = true;
  ui.appendChild(uiCircle);

  const radiusParameterLabel = document.createElement('label');
  radiusParameterLabel.innerText = 'Radius';
  uiCircle.appendChild(radiusParameterLabel);
  const radiusParameter = document.createElement('input');
  radiusParameter.type = 'number';
  radiusParameter.name = 'Radius';
  uiCircle.appendChild(radiusParameter);

  const heightParameterLabel = document.createElement('label');
  heightParameterLabel.innerText = 'Height';
  uiCircle.appendChild(heightParameterLabel);
  const heightParameter = document.createElement('input');
  heightParameter.type = 'number';
  heightParameter.name = 'Height';
  uiCircle.appendChild(heightParameter);

  const dateSelectLabel = document.createElement('label');
  dateSelectLabel.innerText = 'Year';
  uiCircle.appendChild(dateSelectLabel);
  const selectDate = document.createElement('select');
  uiCircle.appendChild(selectDate);

  const updateCheckBoxLabel = document.createElement('label');
  updateCheckBoxLabel.innerText = 'Freeze rotation';
  uiCircle.appendChild(updateCheckBoxLabel);
  const updateCheckBox = document.createElement('input');
  updateCheckBox.type = 'checkbox';
  updateCheckBox.name = 'update';
  uiCircle.appendChild(updateCheckBox);

  // VECTOR HTML
  const optionVector = document.createElement('option');
  optionVector.value = 'vector';
  optionVector.innerText = 'Vector';
  selectSTShape.appendChild(optionVector);

  const uiVector = document.createElement('div');
  uiVector.hidden = true;
  ui.appendChild(uiVector);

  const deltaLabel = document.createElement('label');
  deltaLabel.innerText = 'Delta';
  uiVector.appendChild(deltaLabel);
  const deltaParameter = document.createElement('input');
  deltaParameter.type = 'number';
  deltaParameter.name = 'delta';
  uiVector.appendChild(deltaParameter);

  const alphaLabel = document.createElement('label');
  alphaLabel.innerText = 'Alpha';
  uiVector.appendChild(alphaLabel);
  const alphaParameter = document.createElement('input');
  alphaParameter.type = 'number';
  alphaParameter.name = 'alpha';
  uiVector.appendChild(alphaParameter);

  // HELIX HTML
  const optionHelix = document.createElement('option');
  optionHelix.value = 'helix';
  optionHelix.innerText = 'Helix';
  selectSTShape.appendChild(optionHelix);

  const uiHelix = document.createElement('div');
  uiHelix.hidden = true;
  ui.appendChild(uiHelix);

  const helixDeltaLabel = document.createElement('label');
  helixDeltaLabel.innerText = 'Delta';
  uiHelix.appendChild(helixDeltaLabel);
  const helixDeltaParameter = document.createElement('input');
  helixDeltaParameter.type = 'number';
  helixDeltaParameter.name = 'delta';
  uiHelix.appendChild(helixDeltaParameter);

  const helixRadiuslabel = document.createElement('label');
  helixRadiuslabel.innerText = 'Radius';
  uiHelix.appendChild(helixRadiuslabel);
  const helixRadiusParameter = document.createElement('input');
  helixRadiusParameter.type = 'number';
  helixRadiusParameter.name = 'rayon';
  uiHelix.appendChild(helixRadiusParameter);

  // PARABOLA HTML
  const optionParabola = document.createElement('option');
  optionParabola.value = 'parabola';
  optionParabola.innerText = 'Parabola';
  selectSTShape.appendChild(optionParabola);

  const uiParabola = document.createElement('div');
  uiParabola.hidden = true;
  ui.appendChild(uiParabola);

  const labelDistAxisX = document.createElement('label');
  labelDistAxisX.innerText = 'Distance on X axis';
  uiParabola.appendChild(labelDistAxisX);

  const parabolaDistAxisX = document.createElement('input');
  parabolaDistAxisX.type = 'number';
  parabolaDistAxisX.name = 'distAxisX';
  uiParabola.appendChild(parabolaDistAxisX);

  const labelDistAxisY = document.createElement('label');
  labelDistAxisY.innerText = 'Distance on Y axis';
  uiParabola.appendChild(labelDistAxisY);
  const parabolaDistAxisY = document.createElement('input');
  parabolaDistAxisY.type = 'number';
  parabolaDistAxisY.name = 'distAxisY';
  uiParabola.appendChild(parabolaDistAxisY);

  const labelHeight = document.createElement('label');
  labelHeight.innerText = 'Height';
  uiParabola.appendChild(labelHeight);
  const parabolaHeight = document.createElement('input');
  parabolaHeight.type = 'number';
  parabolaHeight.name = 'Height';
  uiParabola.appendChild(parabolaHeight);

  const parabolaDateSelectLabel = document.createElement('label');
  parabolaDateSelectLabel.innerText = 'Year';
  uiParabola.appendChild(parabolaDateSelectLabel);
  const selectDateParabola = document.createElement('select');
  uiParabola.appendChild(selectDateParabola);

  // CREATE 3DTILES

  let versions = [];
  let stsCircle = null;
  let stsVector = null;
  let stsHelix = null;
  let stsParabola = null;

  selectDataset.onchange = () => {
    selectMode.hidden = false;
    optionDefaultShape.selected = true;
    if (versions.length > 0) {
      versions.forEach((v) => {
        view.removeLayer(v.c3DTLayer.id);
      });
      versions = [];
    }
    const c3dtilesConfigs = getDataset();
    const temporalsWrappers = [];
    const promisesTileContentLoaded = [];
    c3dtilesConfigs.forEach((config) => {
      const isTemporal = !!config.dates;
      const datesJSON = isTemporal ? config.dates : [config.date];
      const registerExtensions = isTemporal ? extensions : null;
      datesJSON.forEach((date) => {
        const c3DTilesLayer = new itowns.C3DTilesLayer(
          config.id + '_' + date.toString(),
          {
            name: config.id + date.toString(),
            source: new itowns.C3DTilesSource({
              url: config.url,
            }),
            registeredExtensions: registerExtensions,
          },
          view
        );
        itowns.View.prototype.addLayer.call(view, c3DTilesLayer);
        promisesTileContentLoaded.push(
          new Promise((resolve) => {
            c3DTilesLayer.addEventListener(
              itowns.C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
              () => {
                resolve();
              }
            );
          })
        );
        if (isTemporal) {
          temporalsWrappers.push(
            new Temporal3DTilesLayerWrapper(
              c3DTilesLayer
            )
          );

          if (date == Math.min(...datesJSON)) {
            temporalsWrappers[temporalsWrappers.length - 1].styleDate =
              date + 1;
          } else {
            temporalsWrappers[temporalsWrappers.length - 1].styleDate =
              date - 2;
          }
        }
        versions.push({ date: date, c3DTLayer: c3DTilesLayer });
      });
    });

    const stLayer = new STLayer(
      view,
      new THREE.Object3D(),
      versions
    );

    Promise.all(promisesTileContentLoaded).then(() => {
      // STSCircle
      if (stsCircle != null) {
        stsCircle.dispose();
        stsCircle.stLayer = stLayer;
        uiCircle.hidden = true;
      } else {
        stsCircle = new STSCircle(stLayer);
      }

      selectDate.innerHTML = '';
      versions.forEach((v) => {
        const date = v.date;
        const optionDate = document.createElement('option');
        optionDate.innerText = date.toString();
        if (versions.indexOf(v) == 0) {
          optionDate.selected = true;
          stsCircle.selectedDate = date;
        }
        selectDate.appendChild(optionDate);
      });

      // STSVector
      if (stsVector != null) {
        stsVector.dispose();
        stsVector.stLayer = stLayer;
        uiVector.hidden = true;
      } else {
        stsVector = new STSVector(stLayer);
      }

      // STSHelix
      if (stsHelix != null) {
        stsHelix.dispose();
        stsHelix.stLayer = stLayer;
        uiHelix.hidden = true;
      } else {
        stsHelix = new STSHelix(stLayer);
      }

      // STSParabola
      if (stsParabola != null) {
        stsParabola.dispose();
        stsParabola.stLayer = stLayer;
        uiParabola.hidden = true;
      } else {
        stsParabola = new STSParabola(stLayer);
      }

      selectDateParabola.innerHTML = '';
      versions.forEach((v) => {
        const date = v.date;
        const optionDate = document.createElement('option');
        optionDate.innerText = date.toString();
        if (date == stsParabola.middleDate) optionDate.selected = true;
        selectDateParabola.appendChild(optionDate);
      });
    });
  };

  // EVENTS

  const getShapesWithUi = () => {
    return [
      {
        stShape: stsCircle,
        ui: uiCircle,
      },
      { stShape: stsVector, ui: uiVector },
      { stShape: stsHelix, ui: uiHelix },
      { stShape: stsParabola, ui: uiParabola },
    ];
  };

  selectSTShape.onchange = () => {
    console.log(selectSTShape.selectedOptions[0].value);
    getShapesWithUi().forEach((element) => {
      if (element.stShape != null && element.stShape.displayed) {
        element.stShape.dispose();
        element.ui.hidden = true;
      }
    });
    switch (selectSTShape.selectedOptions[0].value) {
      case 'circle':
        stsCircle.display(getCurrentMode());
        uiCircle.hidden = false;
        radiusParameter.value = stsCircle.radius;
        heightParameter.value = stsCircle.height;
        break;
      case 'vector':
        stsVector.display(getCurrentMode());
        uiVector.hidden = false;
        deltaParameter.value = stsVector.delta;
        alphaParameter.value = stsVector.alpha;
        break;
      case 'helix':
        stsHelix.display(getCurrentMode());
        uiHelix.hidden = false;
        helixRadiusParameter.value = stsHelix.radius;
        helixDeltaParameter.value = stsHelix.delta;
        break;
      case 'parabola':
        stsParabola.display(getCurrentMode());
        uiParabola.hidden = false;
        parabolaDistAxisX.value = stsParabola.distAxisX;
        parabolaDistAxisY.value = stsParabola.distAxisY;
        parabolaHeight.value = stsParabola.height;
        break;
    }
  };

  selectMode.onchange = () => {
    getShapesWithUi().forEach((element) => {
      selectSTShape.hidden = false;
      if (element.stShape != null && element.stShape.displayed) {
        element.stShape.display(getCurrentMode());
      }
    });
  };

  radiusParameter.addEventListener('input', (event) => {
    stsCircle.radius = Number(event.target.value);
    stsCircle.display(getCurrentMode());
    stsCircle.selectVersion(selectDate.selectedOptions[0].value);
  });

  heightParameter.addEventListener('input', (event) => {
    stsCircle.height = Number(event.target.value);
    stsCircle.display(getCurrentMode());
    stsCircle.selectVersion(selectDate.selectedOptions[0].value);
  });

  updateCheckBox.onchange = () => {
    stsCircle.pause = updateCheckBox.checked;
  };

  selectDate.onchange = () => {
    stsCircle.selectVersion(selectDate.selectedOptions[0].value);
  };

  selectDateParabola.onchange = () => {
    stsParabola.middleDate = selectDateParabola.selectedOptions[0].value;
    stsParabola.display(getCurrentMode());
  };

  deltaParameter.addEventListener('input', (event) => {
    stsVector.delta = Number(event.target.value);
    stsVector.display(getCurrentMode());
  });

  alphaParameter.addEventListener('input', (event) => {
    stsVector.alpha = Number(event.target.value);
    stsVector.display(getCurrentMode());
  });

  helixRadiusParameter.addEventListener('input', (event) => {
    stsHelix.radius = Number(event.target.value);
    stsHelix.display(getCurrentMode());
  });

  helixDeltaParameter.addEventListener('input', (event) => {
    stsHelix.delta = Number(event.target.value);
    stsHelix.display(getCurrentMode());
  });

  parabolaDistAxisX.addEventListener('input', (event) => {
    stsParabola.distAxisX = Number(event.target.value);
    stsParabola.display(getCurrentMode());
  });

  parabolaDistAxisY.addEventListener('input', (event) => {
    stsParabola.distAxisY = Number(event.target.value);
    stsParabola.display(getCurrentMode());
  });

  parabolaHeight.addEventListener('input', (event) => {
    stsParabola.height = Number(event.target.value);
    stsParabola.display(getCurrentMode());
  });
});
