.import QtQuick.LocalStorage 2.0 as Sql

var dataType = {
    //Data types
    STRING: "TEXT",
    INTEGER: "INTEGER",
    DATE: "TEXT",
    DATETIME: "TEXT",
    REAL: "REAL",
    FLOAT: "FLOAT",
    PK: "INTEGER PRIMARY KEY"
}

/*

  new QuickDB('database', '1.0', 'myApp')
  define : returns an object with functions create/filter/delete
  create: returns an object with the properties
  */

var db;

function QuickModel(appName, version) {
    this.db = Sql.LocalStorage.openDatabaseSync(appName + '_db', version, appName, 100000);
}

QuickModel.prototype = {

    constructor: QuickModel,

    //define the table
    run_sql: function(sql) {
        this.db.transaction(
            function(tx) {
                console.log("Run SQL: " + sql);
                tx.executeSql(sql);
            }
        )
    },
    define: function(name, data) {
        var sql_create = "CREATE TABLE IF NOT EXISTS " + name + " (";
        var idx = 0;
        this.properties = {};
        this.tableName = name;
        data['id'] = [dataType.PK];

        var filterConditions = {};

        sql_create += " id " + dataType.PK;
        this.properties['id'] = null;

        for (var column in data) {
            if (column === 'id') continue;
            var definitions = data[column];
            sql_create += ", " + column + " " + definitions[0];
            for (var i=1; i < definitions.length; i++) {
                sql_create += " " + definitions[i];
            }

            this.properties[column] = null;
            idx++;
        }

        sql_create += ")";

        //Run create table
        this.run_sql(sql_create);

        return this;
    },
    _create_where_clause:function() {
        var sql = " WHERE ";
        var idx = 0;

        for (var cond in this.filterConditions) {
            if (idx > 0) sql += " AND ";
            var operator = '=';
            if (cond.indexOf('__') > -1) {
                var operands = cond.split('__');
                var field = operands[0];
                operator = operands[1];

                switch(operator) {
                case 'gt':
                    operator = '>'; break;
                case 'ge':
                    operator = '>='; break;
                case 'lt':
                    operator = '<'; break;
                case 'le':
                    operator = '<='; break;
                case 'like':
                    operator = 'like'; break;
                }
            }

            sql += cond + " " + operator + " ";
            if (operator === 'like') {
                sql += "'%"+ this.filterConditions[cond] + "%'";
            } else {
                sql += "'" + this.filterConditions[cond] + "'";
            }
            idx++;
        }
        return sql;
    },
    update:function(newValues) {
        var sql = "UPDATE " + this.tableName + " SET ";
        var idx = 0;
        for (var prop in newValues) {
            if (idx > 0) sql += ",";
            sql += prop + " = '" + newValues[prop] + "'";
            idx++;
        };
        sql += this._create_where_clause();

        this.run_sql(sql);
    },
    _insert:function() {
        var sql = "INSERT INTO " + this.tableName + "(";
        var fields = [];
        var values = [];
        for (var field in this.properties) {
            if (field === 'id')
                continue;
            fields.push(field);
            if (this.properties[field]) {
                values.push("'" + this.properties[field] + "'");
            }
            else
                values.push('NULL');
        }
        sql += fields.join(',');
        sql += ") VALUES (" + values.join(',') + ")";

        this.run_sql(sql);
     },
     create:function(data) {
        for (var field in data) {
            this.properties[field] = data[field];
        }

        this._insert();
     },
     save:function() {
        if (this.properties[id]) {
            update();
        } else {
            _insert();
        }
     },
     exclude:function() {
        var sql = "DELETE FROM " + this.tableName;
        sql += this._create_where_clause();
        this.run_sql(sql);
     },
     filter:function(conditions) {
         this.filterConditions = conditions;
         return this;
     },
     all:function() {
        var sql = "SELECT ";
        var fields = [];
        for (var field in this.properties) {
            fields.push(field);
        }

        sql += fields.join(',');
        sql += " FROM " + this.tableName;
        sql += this._create_where_clause();

        var rs = [];

        this.db.transaction(
            function(tx) {
                console.log("Run SQL: " + sql);
                rs = tx.executeSql(sql)

                console.log("RESULT SET: " + rs);
            }
        )

        console.log("AFTER RESULT SET: " + rs);

        return rs;
    }
}

//TODO: Migrations!
