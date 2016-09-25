var QueryString = function () {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}();

function ucfirst (str) {
  str += ''
  var f = str.charAt(0)
    .toUpperCase()
  return f + str.substr(1)
}

$(document).ready(function() {
  var momentParser = function () {

    $('.moment-date:not(.momented)').each(function() {

      // On set nos variables
      var element = $(this)
      var format = element.attr('data-format')
      var fromNow = element.attr('fromNow')
      var content = format
      var date = new Date(element.html())
      var moment_instance = moment(date)

      // La langue
      moment_instance.locale(navigator.language)

			if (fromNow !== undefined) {
				// if requested just set relative time
				content =  moment_instance.fromNow();
			} else {
				// La REGEX
				var regex = /{([A-Z])+}/g;

				// On récupère les formats moment

				var matches = format.match(new RegExp(regex))
				for (var i = 0; i < matches.length; i++) {

					var moment_format = matches[i].substr(1).slice(0, -1)
					var moment_date = moment_instance.format(moment_format);

					content = content.replace(matches[i], moment_date)
				}
			}

      // On set l'HTML
      element.html(content)

      // On dit que la conversion est déjà faite
      element.addClass('momented')

    })

  }();
})


String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
}
