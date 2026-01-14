#target illustrator

(function () {

    if (!app.documents.length) {
        alert("No open document.");
        return;
    }

    var src = app.activeDocument;

    // ---------- FIND LAYERS ----------
    var layersToCopy = [];
    var fcLayer = null;

    for (var i = 0; i < src.layers.length; i++) {
        var lname = src.layers[i].name;

        if (!fcLayer && lname.indexOf("FC ") === 0) {
            fcLayer = src.layers[i];
        }

        if (/^plott/i.test(lname)) {
            layersToCopy.push(src.layers[i]);
        }
    }

    if (fcLayer) layersToCopy.push(fcLayer);

    if (!layersToCopy.length) {
        alert("No valid layers found.");
        return;
    }

    // ---------- CREATE NEW DOCUMENT ----------
    var newDoc = app.documents.add(
        src.documentColorSpace,
        src.width,
        src.height
    );

    newDoc.rulerOrigin = src.rulerOrigin;
    newDoc.pageOrigin = src.pageOrigin;
    newDoc.artboards[0].artboardRect = src.artboards[0].artboardRect;

    // ---------- COPY LAYERS ----------
    for (var j = 0; j < layersToCopy.length; j++) {
        var layer = layersToCopy[j];

        layer.hasSelectedArtwork = true;
        src.selection = null;
        layer.hasSelectedArtwork = true;

        app.copy();

        app.activeDocument = newDoc;

        var newLayer = newDoc.layers.add();
        newLayer.name = layer.name;
        app.paste();

        app.activeDocument = src;
        src.selection = null;
    }

    // ---------- SAVE CS6 FILE ----------
    var saveFile = new File(src.path + "/PLOTT.ai");

    var opts = new IllustratorSaveOptions();
    opts.compatibility = Compatibility.ILLUSTRATOR17; // CS6
    opts.flattenOutput = OutputFlattening.PRESERVEAPPEARANCE;
    opts.pdfCompatible = false;

    newDoc.saveAs(saveFile, opts);
    newDoc.close(SaveOptions.DONOTSAVECHANGES);

    app.activeDocument = src;

    alert("PLOTT.ai exported successfully.");

})();
