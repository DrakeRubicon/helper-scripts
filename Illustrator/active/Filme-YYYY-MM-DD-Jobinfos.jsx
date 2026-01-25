/*
    Finishes a prepared Film job file by:
    - Renaming artboards to include size and object count
    - Saving the file with a name based on date, artboard count, and per-artboard size + object count
    - Exporting each artboard as a high-res grayscale TIFF

    Illustrator file with name based on:
    Date, artboard count, and per-artboard size + object count

    Example:
    2026-01-07_3 Filme_[{500x700mm, 12 Spuren},{300x300mm, 1 Spur},{210x297mm, 9 Spuren}].ai
    2023-11-15_1 Film_[400x600mm,8].ai

    Each artboard renamed to:
    "Film X, WIDTHxHEIGHTmm, N Spuren"

    Example:
    "Film 1, 500x700mm, 12 Spuren"
    "Film 2, 300x300mm, 1 Spur"
*/

(function () {
    if (app.documents.length === 0) {
        alert("No document open!");
        return;
    }

    var doc = app.activeDocument;
    var ptToMm = 25.4 / 72;

    // ---------- DATE ----------
    var now = new Date();
    var yyyy = now.getFullYear();
    var mm = ("0" + (now.getMonth() + 1)).slice(-2);
    var dd = ("0" + now.getDate()).slice(-2);
    var dateStr = yyyy + "-" + mm + "-" + dd;

    // ---------- OBJECT COUNT FUNCTION ----------
    function countTopLayerObjectsOnArtboard(doc, artboardIndex) {
        var ab = doc.artboards[artboardIndex];
        var abRect = ab.artboardRect; // [left, top, right, bottom]
        var count = 0;

        for (var l = 0; l < doc.layers.length; l++) {
            var layer = doc.layers[l];

            if (!layer.visible || layer.locked) continue;

            for (var i = 0; i < layer.pageItems.length; i++) {
                var item = layer.pageItems[i];

                // Only top-level items of the layer
                if (item.parent !== layer) continue;
                if (item.hidden || item.locked) continue;

                try {
                    var b = item.visibleBounds;

                    if (
                        b[2] > abRect[0] &&
                        b[0] < abRect[2] &&
                        b[1] > abRect[3] &&
                        b[3] < abRect[1]
                    ) {
                        count++;
                    }
                } catch (e) { }
            }
        }

        return count;
    }

    // ---------- COLLECT ARTBOARD INFO FUNCTION ----------
    function collectArtboardInfo(doc, ptToMm) {
        var info = [];
        var abCount = doc.artboards.length;

        for (var i = 0; i < abCount; i++) {
            var ab = doc.artboards[i];
            var r = ab.artboardRect;

            var width = Math.round((r[2] - r[0]) * ptToMm);
            var height = Math.round((r[1] - r[3]) * ptToMm);

            var objCount = countTopLayerObjectsOnArtboard(doc, i);
            var spurWord = (objCount === 1) ? "Spur" : "Spuren";

            info.push({
                index: i,
                width: width,
                height: height,
                objCount: objCount,
                spurWord: spurWord
            });
        }

        return info;
    }

    // ---------- EXPORT ARTBOARDS AS TIFF ----------
    function exportArtboardsAsTIFF(doc, folder, baseName) {

        var tiffOptions = new ExportOptionsTIFF();
        tiffOptions.imageColorSpace = ImageColorSpace.GrayScale;
        tiffOptions.resolution = 450;
        tiffOptions.antiAliasing = AntiAliasingMethod.TYPEOPTIMIZED;
        tiffOptions.byteOrder = TIFFByteOrder.IBMPC;
        tiffOptions.lZWCompression = true;
        tiffOptions.embedICCProfile = true;
        tiffOptions.saveMultipleArtboards = false;

        for (var i = 0; i < doc.artboards.length; i++) {
            doc.artboards.setActiveArtboardIndex(i);

            //exportOptions.artboardRange = "1" i+1

            //addWhiteBackgroundForArtboard(doc, i);

            var abName = doc.artboards[i].name.replace(/[\\\/:*?"<>|]/g, "_");

            var tiffFile = new File(
                folder.fsName + "/" +
                baseName + "_" + abName + ".tif"
            );

            doc.exportFile(tiffFile, ExportType.TIFF, tiffOptions);
        }
    }

    // ---------- SET BACKGROUND TO WHITE RECT
    function addWhiteBackgroundForArtboard(doc, artboardIndex) {
    var ab = doc.artboards[artboardIndex];
    var r = ab.artboardRect; // [left, top, right, bottom]

    var bg = doc.pathItems.rectangle(
        r[1],                 // top
        r[0],                 // left
        r[2] - r[0],          // width
        r[1] - r[3]           // height
    );

    bg.filled = true;
    bg.fillColor = new RGBColor();
    bg.fillColor.red = 0;
    bg.fillColor.green = 0;
    bg.fillColor.blue = 0;

    bg.stroked = false;
    bg.move(doc, ElementPlacement.PLACEATEND);
}



    // ---------- COLLECT ARTBOARD INFO ----------
    var abInfo = collectArtboardInfo(doc, ptToMm);
    var abCount = abInfo.length;

    // ---------- RENAME ARTBOARDS ----------
    for (var i = 0; i < abCount; i++) {
        var a = abInfo[i];
        doc.artboards[i].name =
            "Film " + (i + 1) + ", " +
            a.width + "x" + a.height + "mm, " +
            a.objCount + " " + a.spurWord;
    }

    // ---------- BUILD FILENAME ----------
    var filmWord = (abCount === 1) ? "Film" : "Filme";
    var abData = [];

    for (var i = 0; i < abCount; i++) {
        var a = abInfo[i];

        if (abCount === 1) {
            abData.push(a.width + "x" + a.height + "mm, " + a.objCount + " " + a.spurWord);
        } else {
            abData.push("{" + a.width + "x" + a.height + "mm, " + a.objCount + " " + a.spurWord + "}");
        }
    }

    var newFileName =
        dateStr + "_" + abCount + " " + filmWord + "_[" + abData.join(",") + "].ai";

    // ---------- SAVE LOCATION ----------
    var folder;
    if (doc.saved && doc.fullName) {
        folder = doc.fullName.parent;
    } else {
        folder = Folder.selectDialog("Select a folder to save the file");
        if (!folder) return;
    }

    var saveFile = new File(folder.fsName + "/" + newFileName);

    // ---------- SAVE OPTIONS ----------
    var saveOptions = new IllustratorSaveOptions();
    saveOptions.compatibility = Compatibility.ILLUSTRATOR17;
    saveOptions.embedICCProfile = true;

    doc.saveAs(saveFile, saveOptions);

    // ---------- EXPORT TIFFs ----------

    var baseName = dateStr + "_";
    exportArtboardsAsTIFF(doc, folder, baseName);

    alert("File saved and TIFFs exported:\n" + folder.fsName);

})();
