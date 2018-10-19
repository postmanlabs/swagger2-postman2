// Exports the collapse function for the plugin
/**
folder - a postman folder json node from which to start collapsing unnecessary folders
*/
Compressor = {
  collapse: function (folder) {
    var prefix = folder.name,
      firstPass = true,
      result = { result: true, reason: "" };

    if (!folder.item) {
      return { result: false, reason: "folder contains no items" };
    }

    while (folder.name && folder.item.length == 1 && !folder.request && !folder.item[0].request) {
      folder.name = prefix + "/" + folder.item[0].name;
      folder.item = folder.item[0].item;

      if (firstPass) {
        prefix += "/...";
        firstPass = false;
      }
    }

    folder.item.forEach(item => {
      var subResult = this.collapse(item);
      if (subResult.result == false) {
        result = subResult;
      }
    });

    return result;
  }
};

module.exports = function (folder) {
  return Compressor.collapse(folder);
}