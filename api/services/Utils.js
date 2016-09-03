/**
 * UtilsService
 *
 * @description :: Utils functions for all kind of stuff
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Services
 */

module.exports = {

  compareVersion: function (a, b) {
    var i, diff;
    var regExStrip0 = /(\.0+)+$/;
    var segmentsA = a.replace(regExStrip0, '').split('.');
    var segmentsB = b.replace(regExStrip0, '').split('.');
    var l = Math.min(segmentsA.length, segmentsB.length);

    for (i = 0; i < l; i++) {
        diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
        if (diff)
            return diff;
    }
    return segmentsA.length - segmentsB.length;
  },

  truncate: function (content, length, removeHTML) {

    if (content.length > length) {
      content = content.substr(0, length)
      content += '...'
    }

    if (removeHTML)
      content = this.removeHTML(content)

    return content
  },

  removeHTML: function (content) {
    return content.replace(/(<([^>]+)>)/ig,"")
  }

};
