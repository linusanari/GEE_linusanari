/*-----------------------------------------------------------
----------------------DATA PREPROCESSING--------------------------
-----------------------------------------------------------*/

//-----2002-----//
//Making a cloud free composite
var image2002 = ee.Algorithms.Landsat.simpleComposite({
  collection: l7raw.filterDate("2002-01-01", "2002-12-31"),
  asFloat: true, //Leave results as a float
});

//Declaring AOI; Kirinyaga County
var kirinyaga = admin.filter(ee.Filter.eq("ADM1_EN", "Kirinyaga"));

//Clip to Nairobi County Boundary
var kirinyaga2002 = image2002.clip(kirinyaga);

//Declairing the Visualization Paramemters
var l9vizParams = {
  bands: ["B4", "B3", "B2"],
  min: 0,
  max: 0.3,
};

//-----2022-----//
//Making a cloud free composite
var image2022 = ee.Algorithms.Landsat.simpleComposite({
  collection: l9raw.filterDate("2022-01-01", "2022-12-31"), //2022
  asFloat: true, //Leave data as a float
});

//Clip to Nairobi County Boundary
var kirinyaga2022 = image2022.clip(kirinyaga);

//Declairing the Visualization Paramemters - L7
var l7vizParams = {
  bands: ["B3", "B2", "B1"],
  min: 0,
  max: 0.3,
};

//------Displaying both clipped imageCollections
Map.addLayer(kirinyaga2002, l7vizParams, "kirinyaga2002", false);
Map.addLayer(kirinyaga2022, l9vizParams, "kirinyaga2022", false);

//Centering to AOI
Map.centerObject(kirinyaga, 10);

/*-----------------------------------------------------------
----------------------TRAINING DATA--------------------------
-----------------------------------------------------------*/
//-----2002 Data-----//
var label2002 = "Class2002";
var l7bands = ["B1", "B2", "B3", "B4", "B5", "B7", "B8"];
var input2002 = kirinyaga2002.select(l7bands);

//Classes; [0-Water, 1-Built_up, 2-Vegetation, 3-Forest, 4-Bareland]
var training2002 = Water2002.merge(Built_up2002)
  .merge(Vegetation2002)
  .merge(Forest2002)
  .merge(Bareland2002);

//Overlay the points on the image
var trainImage2002 = input2002.sampleRegions({
  collection: training2002,
  properties: [label2002],
  scale: 10,
});
print(trainImage2002);

var trainingData = trainImage2002.randomColumn();
var trainSet = trainingData.filter(ee.Filter.lessThan("random", 0.8));
var testSet = trainingData.filter(ee.Filter.greaterThanOrEquals("random", 0.8));

//Classifier Model - CART
var classifier2002 = ee.Classifier.smileCart().train(
  trainSet,
  label2002,
  l7bands
);

//Classify the LandSat image
var classified2002 = input2002.classify(classifier2002);

//Visualization Parameters
var cVizParams2002 = ["#1ca3ec", "#c73611", "#41ec05", "#03440c", "#eab64f"];

Map.addLayer(
  classified2002,
  { palette: cVizParams2002, min: 0, max: 4 },
  "2002 Classified Kirinyaga",
  false
);

//-----2022 Data-----//
var label2022 = "Class2022";
var l9bands = ["B1", "B2", "B3", "B4", "B5", "B6", "B7"];
var input2022 = kirinyaga2022.select(l9bands);

//Classes; [0-Water, 1-Built_up, 2-Vegetation, 3-Forest, 4-Bareland]
var training2022 = Water2022.merge(Built_up2022)
  .merge(Vegetation2022)
  .merge(Forest2022)
  .merge(Bareland2022);

//Overlay the points on the image
var trainImage2022 = input2022.sampleRegions({
  collection: training2022,
  properties: [label2022],
  scale: 10,
});
print(trainImage2022);

var trainingData = trainImage2022.randomColumn();
var trainSet = trainingData.filter(ee.Filter.lessThan("random", 0.8));
var testSet = trainingData.filter(ee.Filter.greaterThanOrEquals("random", 0.8));

//Classifier Model - CART
var classifier2022 = ee.Classifier.smileCart().train(
  trainSet,
  label2022,
  l9bands
);

//Classify the LandSat image
var classified2022 = input2022.classify(classifier2022);

//Visualization Parameters
var cVizParams2022 = ["#1ca3ec", "#c73611", "#41ec05", "#03440c", "#eab64f"];

//Visualization Parameters already declared

Map.addLayer(
  classified2022,
  { palette: cVizParams2022, min: 0, max: 4 },
  "2022 Classified Kirinyaga"
);

/*-----------------------------------------------------------
----------------------ADDING LEGEND--------------------------
-----------------------------------------------------------*/
var panel = ui.Panel({
  style: {
    position: "bottom-left",
    padding: "5px;",
  },
});

var title = ui.Label({
  value: "Classification",
  style: {
    fontSize: "14px",
    fontWeight: "bold",
    margin: "0px;",
  },
});

panel.add(title);

var color = ["#1ca3ec", "#c73611", "#41ec05", "#03440c", "#eab64f"];
var lc_class = ["Water", "Built-up Area", "Vegetation", "Forest", "Bareland"];

var list_legend = function (color, description) {
  var c = ui.Label({
    style: {
      backgroundColor: color,
      padding: "10px",
      margin: "4px",
    },
  });

  var ds = ui.Label({
    value: description,
    style: {
      margin: "5px",
    },
  });

  return ui.Panel({
    widgets: [c, ds],
    layout: ui.Panel.Layout.Flow("horizontal"),
  });
};

for (var a = 0; a < 5; a++) {
  panel.add(list_legend(color[a], lc_class[a]));
}

Map.add(panel);
