// Exports the merge function for the plugin, merges two Postman v2 nodes
/**
left - a node from the left document
right - a node from the right document to merge into and override the left
*/
Merger = {
  merge: function (left, right) {
    var lItems = left["item"];
    var rItems = right["item"];

    if (lItems == null || rItems == null) {
      return {result:false, reason:"No 'item' member in left or right tree"};
    }

    var lKeys = [];
    lItems.forEach(item => {lKeys.push(item["name"].toUpperCase()) });

    rItems.forEach(item => {
      var match = lKeys.indexOf(item["name"].toUpperCase());
      if (match >= 0) {
        // If a folder, recurse.  If an endpoint that already exists, replace.
        if (item.request) {
          lItems[match] = item;
        }
        else {
          this.merge(lItems[match], item);
        }
      }
      else {
        // not found in the left items already, add it
        lItems.push(item);
      }
    });

    return {result:true}
  }
}

module.exports = function (left, right) {
  Merger.merge(left, right);
};