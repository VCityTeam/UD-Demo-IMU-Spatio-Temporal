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
  Temporal3DTilesLayerWrapper,
} from '@ud-viz/extensions_3d_tiles_temporal';

loadMultipleJSON([
  'https://raw.githubusercontent.com/VCityTeam/UD-Viz/ae6d4430e371f387a6aff9bd3d69b886947bef88/examples/assets/config/extents.json',
  'https://raw.githubusercontent.com/VCityTeam/UD-Viz/ae6d4430e371f387a6aff9bd3d69b886947bef88/examples/assets/config/crs.json',
  'https://raw.githubusercontent.com/VCityTeam/UD-Viz/ae6d4430e371f387a6aff9bd3d69b886947bef88/examples/assets/config/layer/3DTiles_temporal.json',
  'https://raw.githubusercontent.com/VCityTeam/UD-Viz/ae6d4430e371f387a6aff9bd3d69b886947bef88/examples/assets/config/layer/3DTiles_STS_data.json',
  'https://raw.githubusercontent.com/VCityTeam/UD-Viz/e3896d130e048e0c4fd517c34308d2ad355edbdd/examples/assets/config/layer/base_maps.json',
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

  view.addLayer(
    new itowns.ElevationLayer(configs['elevation']['layer_name'], {
      useColorTextureElevation: true,
      colorTextureElevationMinZ:
        configs['elevation']['colorTextureElevationMinZ'],
      colorTextureElevationMaxZ:
        configs['elevation']['colorTextureElevationMaxZ'],
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
    [itowns.C3DTilesTypes.batchtable]: C3DTTemporalBatchTable,
    [itowns.C3DTilesTypes.boundingVolume]: C3DTTemporalBoundingVolume,
    [itowns.C3DTilesTypes.tileset]: C3DTTemporalTileset,
  });

  // CREATE HTML
  const selectDataset = document.getElementById('select_dataset');
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

  const selectMode = document.getElementById('select_mode');

  for (const mode in STS_DISPLAY_MODE) {
    const optionMode = document.createElement('option');
    optionMode.innerText = STS_DISPLAY_MODE[mode];
    selectMode.appendChild(optionMode);
  }

  const getCurrentMode = () => {
    return selectMode.selectedOptions[0].value;
  };

  const selectSTShape = document.getElementById('select_shape');
  const shapeName = document.getElementById('shape_name');
  const defaultShape = document.getElementById('default_shape');

  // CIRCLE HTML
  const uiCircle = document.getElementById('circle_div');
  const radiusParameter = document.getElementById('circle_radius');
  const heightParameter = document.getElementById('circle_height');
  const selectDate = document.getElementById('circle_year');
  const updateCheckBox = document.getElementById('circle_rotation');

  // VECTOR HTML
  const uiVector = document.getElementById('vector_div');
  const deltaParameter = document.getElementById('vector_delta');
  const alphaParameter = document.getElementById('vector_alpha');

  // HELIX HTML
  const uiHelix = document.getElementById('helix_div');
  const helixDeltaParameter = document.getElementById('helix_delta');
  const helixRadiusParameter = document.getElementById('helix_radius');

  // PARABOLA HTML
  const uiParabola = document.getElementById('parabola_div');
  const parabolaDistAxisX = document.getElementById('parabola_distx');
  const parabolaDistAxisY = document.getElementById('parabola_disty');
  const parabolaHeight = document.getElementById('parabola_height');
  const selectDateParabola = document.getElementById('parabola_year');

  // CREATE SHAPES AND 3DTILES

  const stsCircle = new STSCircle();
  const stsVector = new STSVector();
  const stsHelix = new STSHelix();
  const stsParabola = new STSParabola();

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

  let versions = [];

  selectDataset.onchange = () => {
    selectMode.hidden = false;
    defaultShape.selected = true;
    if (versions.length > 0) {
      versions.forEach((v) => {
        view.removeLayer(v.c3DTLayer.id);
      });
      versions = [];
    }
    const c3dtilesConfigs = getDataset();
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
          const temporalsWrapper = new Temporal3DTilesLayerWrapper(
            c3DTilesLayer
          );

          if (date == Math.min(...datesJSON)) {
            temporalsWrapper.styleDate = date + 1;
          } else {
            temporalsWrapper.styleDate = date - 2;
          }
        }
        versions.push({ date: date, c3DTLayer: c3DTilesLayer });
      });
    });

    const stLayer = new STLayer(view, new THREE.Object3D(), versions);

    Promise.all(promisesTileContentLoaded).then(() => {
      shapeName.hidden = true;

      getShapesWithUi().forEach((element) => {
        if (element.stShape.displayed) {
          element.stShape.dispose();
          element.ui.hidden = true;
        }
        element.stShape.setSTLayer(stLayer);
      });

      // STSCircle
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

      // STSParabola
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

  selectSTShape.onchange = () => {
    shapeName.hidden = false;
    shapeName.innerText = selectSTShape.selectedOptions[0].innerText;
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
