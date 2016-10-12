/**
 * DataTablesService
 *
 * @description :: Server-side logic for paginate datatables
 * @help        :: See https://datatables.net/examples/data_sources/server_side.html
 */

var _ = require('lodash')

module.exports = {

  datatable: function (model, options, cb) {
    if (!options.start) {
      options.start = 0
    }

    if (!options.length) {
      options.length = 10
    }

    var filterObj = {}

    if (options.filter) {
      _.each(options.filter, function (fieldObj, fieldKey) {
        if (typeof fieldObj === 'object' || fieldObj === 'array') {
          _.each(fieldObj, function (fieldValueObj, fieldValueKey) {
            if (Number(fieldValueObj)) {
              options.filter[fieldKey][fieldValueKey] = Number(fieldValueObj)
            }
          })
        } else {
          if (Number(fieldObj)) {
            options.filter[fieldKey] = Number(fieldObj)
          }
        }
      })

      filterObj = options.filter
    }

    var recordsTotal = 0
    var recordsFiltered = 0

    model.count(filterObj).exec(function (err, num) {
      recordsTotal = num
      recordsFiltered = num
    })

    var findQuery = model.find(filterObj).skip(options.start).limit(options.length)

    if (options.order) {
      for (var i in options.order) {
        var orderObj = options.order[i]
        findQuery.sort(options.columns[orderObj.column].data + ' ' + orderObj.dir)
      }
    }

    if (options.search && options.search.value) {
      var whereObj = {
        or: []
      }

      for (var i in options.columns) {
        if (options.columns[i].searchable === 'true') { // authorize search
          if (options.columns[i].data.indexOf('.') !== -1) { // populate find, example : user.username
            var split = options.columns[i].data.split('.') // for get table + column
            var column = split[1] // example : username
            var table = split[0] // example : user

            // find table in populate options
            if (options.populate && options.populate.indexOf(table) !== -1) {
              options.populate[options.populate.indexOf(table)] = [ // replace old populate name table by array with name table + where conditions
                table,
                {
                  where: {
                    like: '%' + options.search.value + '%'
                  }
                }
              ]
            }
            else {
              options.populate = []
              // create populate
              options.populate.push(
                table,
                {
                  where: {
                    like: '%' + options.search.value + '%'
                  }
                }
              )
            }

          }
          else { // isn't a populate find
            var columnWhereObj = {}

            columnWhereObj[options.columns[i].data] = {
              like: '%' + options.search.value + '%'
            }

            whereObj.or.push(columnWhereObj)
          }
        }
      }
      findQuery.where(whereObj)
    }

    if (options.populate) {
      for (var i in options.populate) {
        if (typeof options.populate[i] === 'object')
          findQuery.populate(options.populate[i][0], options.populate[i][1])
        else
          findQuery.populate(options.populate[i])
      }
    }

    findQuery.exec(function (err, data) {
      if (err) {
        return cb(err)
      } else {
        if (options.search.value) {
          recordsFiltered = data.length
        }

        return cb(null, {
          draw: options.draw,
          recordsTotal: recordsTotal,
          recordsFiltered: recordsFiltered,
          data: data
        })
      }
    })
  }
}
