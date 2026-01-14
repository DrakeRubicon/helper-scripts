#target illustrator

(function () {
  if (!app.documents.length) {
    alert("No open document.");
    return;
  }

  var src = app.activeDocument;

  // ---------- FIND REQUIRED LAYERS ----------

  var fcLayer = null;
  var plottLayers = [];

  for (var i = 0; i < src.layers.length; i++) {
    var lname = src.layers[i].name;
    if (!fcLayer && lname.indexOf("FC ") === 0) fcLayer = src.layers[i];
    if (/^plott/i.test(lname)) plottLayers.push(src.layers[i]);
  }

  if (!fcLayer || !plottLayers.length) {
    alert("Required layers not found.");
    return;
  }

  

  // ---------- SCAN FOR CUT GROUPS ----------

  var dieGroups = [],
    kissGroups = [];

  function scanGroups(container) {
    for (var i = 0; i < container.groupItems.length; i++) {
      var g = container.groupItems[i];
      var n = g.name.toLowerCase();
      if (n === "diecut" || n === "die") dieGroups.push(g);
      if (n === "kisscut" || n === "kiss") kissGroups.push(g);
      scanGroups(g);
    }
  }

  for (var p = 0; p < plottLayers.length; p++) scanGroups(plottLayers[p]);

  var hasSpecialGroups = dieGroups.length || kissGroups.length;

    // ---------- CREATE NEW DOCUMENT AND COPY ITEMS ----------

  var newDoc = app.documents.add(src.documentColorSpace, src.width, src.height);
  newDoc.artboards[0].artboardRect = src.artboards[0].artboardRect;

  function copyItem(item, targetLayer) {
    item.selected = true;
    app.copy();
    app.activeDocument = newDoc;
    newDoc.activeLayer = targetLayer;
    app.paste();
    app.activeDocument = src;
    src.selection = null;
  }

  // ---------- SPOT COLOR FUNCTIONS ----------

  function getSpot(doc, name, c, m, y, k) {
    for (var i = 0; i < doc.spots.length; i++)
      if (doc.spots[i].name === name) return doc.spots[i];

    var spot = doc.spots.add();
    spot.name = name;
    spot.colorType = ColorModel.SPOT;

    var cmyk = new CMYKColor();
    cmyk.cyan = c;
    cmyk.magenta = m;
    cmyk.yellow = y;
    cmyk.black = k;
    spot.color = cmyk;
    return spot;
  }

  function recolorLayer(layer, spot) {
    var items = layer.pathItems;
    for (var i = 0; i < items.length; i++) {
      items[i].filled = false;
      items[i].stroked = true;

      var sc = new SpotColor();
      sc.spot = spot;
      sc.tint = 100;
      items[i].strokeColor = sc;
    }
  }

  // ---------- COPY LAYERS AND GROUPS ---------- 

  var fcTarget = newDoc.layers.add();
  fcTarget.name = fcLayer.name;
  copyItem(fcLayer, fcTarget);

  var dieLayer, kissLayer;

  if (hasSpecialGroups) {
    if (dieGroups.length) {
      dieLayer = newDoc.layers.add();
      dieLayer.name = "DIECUT";
      for (var d = 0; d < dieGroups.length; d++)
        copyItem(dieGroups[d], dieLayer);
    }

    if (kissGroups.length) {
      kissLayer = newDoc.layers.add();
      kissLayer.name = "KISSCUT";
      for (var k = 0; k < kissGroups.length; k++)
        copyItem(kissGroups[k], kissLayer);
    }
  } else {
    for (var l = 0; l < plottLayers.length; l++) {
      var pl = newDoc.layers.add();
      pl.name = plottLayers[l].name;
      copyItem(plottLayers[l], pl);
    }
  }

  // ---------- CREATE AND APPLY SPOT COLORS ----------  
  if (dieLayer) {
    var dieSpot = getSpot(newDoc, "DIECUT", 0, 100, 0, 0);
    recolorLayer(dieLayer, dieSpot);
  }

  if (kissLayer) {
    var kissSpot = getSpot(newDoc, "KISSCUT", 100, 0, 0, 0);
    recolorLayer(kissLayer, kissSpot);
  }

  // ---------- CLEANUP SPOT COLORS ----------
  for (var i = newDoc.spots.length - 1; i >= 0; i--) {
    var s = newDoc.spots[i].name;

    if (s !== "DIECUT" && s !== "KISSCUT" && s !== "Mimaki Plotter Marks") {
      try {
        newDoc.spots[i].remove();
      } catch (e) {}
    }
  }

  // ---------- SAVE NEW DOCUMENT AS PLOTT.AI ----------
  var saveFile = new File(src.path + "/PLOTT.ai");

  var opts = new IllustratorSaveOptions();
  opts.compatibility = Compatibility.ILLUSTRATOR17;
  opts.flattenOutput = OutputFlattening.PRESERVEAPPEARANCE;
  opts.pdfCompatible = false;

  newDoc.saveAs(saveFile, opts);
  newDoc.close(SaveOptions.DONOTSAVECHANGES);

  // ---------- RESTORE ORIGINAL DOCUMENT ----------
  app.activeDocument = src;
  alert("PLOTT.ai exported successfully.");
})();
