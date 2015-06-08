var dataTypes = {
    //Data types
    STRING: "TEXT",
    INTEGER: "INTEGER",
    DATE: "TEXT",
    DATETIME: "TEXT",
    REAL: "REAL",
    FLOAT: "FLOAT",

}

//create an object
function define(name, data) {
    var sql = "CREATE TABLE " + name + " (";
    var idx = 0;
    var properties;
    for (var column in data) {
        if (idx > 0) sql += ", ";
        sql += column + " " + dataTypes[data[column]];
        properties[column] = null;
        idx++;
    }

    var objManager = {
        properties: properties,
        sql: sql,
        filter: function(clause) {

        },


    }

    return objManager;
}

var User = define('User', {
  username: QuickModel.STRING,
  birthday: QuickModel.DATE
});

