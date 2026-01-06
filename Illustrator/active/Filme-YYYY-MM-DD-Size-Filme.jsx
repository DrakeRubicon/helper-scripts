/*
    Save Illustrator file with name based on:
    date, active artboard size, and artboard count.
    Example: "2025-10-28_500x700mm_3 Filme.ai"
*/

(function () {
    if (app.documents.length === 0) {
        alert("No document open!");
        return;
    }

    var doc = app.activeDocument;

    // Artboard count
    var artboardCount = doc.artboards.length;

    // Active artboard for size
    var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()];

    // Get artboard dimensions in mm
    var width = ab.artboardRect[2] - ab.artboardRect[0];
    var height = ab.artboardRect[1] - ab.artboardRect[3];
    var ptToMm = 25.4 / 72;
    width = Math.round(width * ptToMm);
    height = Math.round(height * ptToMm);

    // Generate current date (YYYY-MM-DD)
    var now = new Date();
    var yyyy = now.getFullYear();
    var mm = ("0" + (now.getMonth() + 1)).slice(-2);
    var dd = ("0" + now.getDate()).slice(-2);
    var dateStr = yyyy + "-" + mm + "-" + dd;

    // Construct new filename using artboard count
    var newFileName =
        dateStr +
        "_" +
        width +
        "x" +
        height +
        "mm_" +
        artboardCount +
        " Filme.ai";

    // Choose folder (same as document if already saved)
    var folder;
    if (doc.saved && doc.fullName) {
        folder = doc.fullName.parent;
    } else {
        folder = Folder.selectDialog("Select a folder to save the file");
        if (!folder) return;
    }

    var saveFile = new File(folder.fsName + "/" + newFileName);

    // Save as Illustrator file
    var saveOptions = new IllustratorSaveOptions();
    saveOptions.compatibility = Compatibility.ILLUSTRATOR17;
    saveOptions.embedICCProfile = true;

    doc.saveAs(saveFile, saveOptions);

    alert("File saved as:\n" + saveFile.fsName);
})();
