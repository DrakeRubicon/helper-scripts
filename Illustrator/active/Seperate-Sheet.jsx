#target illustrator

(function () {

    if (!app.documents.length) {
        alert("No open document.");
        return;
    }

    var src = app.activeDocument;

    // ---------- FIND SOURCE LAYERS ----------
    var fcLayer = null;
    var plottLayers = [];

    for (var i = 0; i < src.layers.length; i++) {
        var lname = src.layers[i].name;

        if (!fcLayer && lname.indexOf("FC ") === 0) {
            fcLayer = src.layers[i];
        }
        if (/^plott/i.test(lname)) {
            plottLayers.push(src.layers[i]);
        }
    }

    if (!fcLayer || !plottLayers.length) {
        alert("Required layers not found.");
        return;
    }

    // ---------- SCAN FOR DIE / KISS GROUPS ----------
    var dieGroups = [];
    var kissGroups = [];

    function scanGroups(container) {
        for (var i = 0; i < container.groupItems.length; i++) {
            var g = container.groupItems[i];
            var name = g.name.toLowerCase();

            if (name === "diecut" || name === "die") dieGroups.push(g);
            if (name === "kisscut" || name === "kiss") kissGroups.push(g);

            scanGroups(g);
        }
    }

    for (var p = 0; p < plottLayers.length; p++) {
        scanGroups(plottLayers[p]);
    }

    var hasSpecialGroups = dieGroups.length || kissGroups.length;

    // ---------- CREATE NEW DOCUMENT ----------
    var newDoc = app.documents.add(src.documentColorSpace, src.width, src.height);
    newDoc.artboards[0].artboardRect = src.artboards[0].artboardRect;

    function copyItem(item, targetLayer) {
        item.selected = true;
        app.copy();
        app.activeDocument = newDoc;
        app.paste();
        newDoc.activeLayer.move(targetLayer, ElementPlacement.PLACEATEND);
        app.activeDocument = src;
        src.selection = null;
    }

    // ---------- FC LAYER ----------
    var fcTarget = newDoc.layers.add();
    fcTarget.name = fcLayer.name;
    copyItem(fcLayer, fcTarget);

    // ---------- DIE / KISS MODE ----------
    if (hasSpecialGroups) {

        if (dieGroups.length) {
            var dieLayer = newDoc.layers.add();
            dieLayer.name = "DIECUT";
            for (var d = 0; d < dieGroups.length; d++) {
                copyItem(dieGroups[d], dieLayer);
            }
        }

        if (kissGroups.length) {
            var kissLayer = newDoc.layers.add();
            kissLayer.name = "KISSCUT";
            for (var k = 0; k < kissGroups.length; k++) {
                copyItem(kissGroups[k], kissLayer);
            }
        }

    } 
    // ---------- NORMAL PLOTT MODE ----------
    else {
        for (var l = 0; l < plottLayers.length; l++) {
            var pl = newDoc.layers.add();
            pl.name = plottLayers[l].name;
            copyItem(plottLayers[l], pl);
        }
    }

    // ---------- SAVE ----------
    var saveFile = new File(src.path + "/PLOTT.ai");

    var opts = new IllustratorSaveOptions();
    opts.compatibility = Compatibility.ILLUSTRATOR17;
    opts.flattenOutput = OutputFlattening.PRESERVEAPPEARANCE;
    opts.pdfCompatible = false;

    newDoc.saveAs(saveFile, opts);
    newDoc.close(SaveOptions.DONOTSAVECHANGES);

    app.activeDocument = src;
    alert("PLOTT.ai exported successfully.");

})();
