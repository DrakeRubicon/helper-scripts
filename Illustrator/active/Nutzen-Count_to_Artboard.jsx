#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("No document open.");
        return;
    }

    var doc = app.activeDocument;

    // Ensure an active layer exists
    if (!doc.activeLayer) {
        alert("No active layer selected.");
        return;
    }

    var layer = doc.activeLayer;
    var count = 0;

    // Count top-level groups and images
    for (var i = 0; i < layer.pageItems.length; i++) {
        var item = layer.pageItems[i];

        if (
            item.typename === "GroupItem" ||
            item.typename === "PlacedItem" ||   // linked images
            item.typename === "RasterItem"       // embedded images
        ) {
            count++;
        }
    }

    // Rename the active artboard
    var artboardIndex = doc.artboards.getActiveArtboardIndex();
    doc.artboards[artboardIndex].name = count + " Filme";

})();
