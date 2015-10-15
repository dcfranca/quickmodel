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
    modelObject: function(data) {
        data['save'] = this.save;
        data['_meta'] = {
            db: this.db,
            tableName: this.tableName,
            update: this.update,
            filter: this.filter,
            _insert: this._insert,
            run_sql: this.run_sql,
            _create_where_clause: this._create_where_clause
        }
        return data;
    },
    define: function(name, data) {
        var sql_create = "CREATE TABLE IF NOT EXISTS " + name + " (";
        var idx = 0;
        this.properties = {};
        this.tableName = name;
        data['id'] = [dataType.PK];

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

        var sql = '';
        var idx = 0;

        for (var cond in this.filterConditions) {
            if (idx > 0) sql += " AND ";
            var operator = '=';
            var field = cond;
            if (cond.indexOf('__') > -1) {
                var operands = cond.split('__');
                field = operands[0];
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

            sql += field + " " + operator + " ";
            if (operator === 'like') {
                sql += "'%"+ this.filterConditions[cond] + "%'";
            } else {
                sql += "'" + this.filterConditions[cond] + "'";
            }
            idx++;
        }

        if (sql.length > 0) {
            sql = " WHERE " + sql;
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

        var rs;
        this.db.transaction(
            function(tx) {
                console.log("Run SQL: " + sql);
                rs = tx.executeSql(sql);
            }
        )

        return rs.insertId;
     },
     create:function(data) {
        for (var field in data) {
            this.properties[field] = data[field];
        }

        var insertId = this._insert();
        var objs = this.filter({id:insertId}).all();
        if (objs.length > 0) {
            return objs[0];
        }

        return null;
     },
     save:function() {
        if (this.id) {
            var updateFields = {};
            for (var newValue in this) {
                if (newValue !== 'save' && newValue !== '_meta') {
                    updateFields[newValue] = this[newValue];
                }
            }

            this._meta.filter({id: this.id}).update(updateFields);
        } else {
            this._insert();
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
     order:function(sorters) {
         this.sorters = sorters;
         return this;
     },
     limit:function(limiter) {
         this.limiter = limiter;
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

        if (this.sorters && this.sorters.length > 0) {
            sql += " ORDER BY ";
            for (var idxOrder=0; idxOrder < this.sorters.length; idxOrder++) {
                if (idxOrder > 0) sql += ", ";
                var ord = this.sorters[idxOrder];
                if (ord[0] === '-') {
                    sql += ord.substring(1) + " DESC ";
                }
                else {
                    sql += ord;
                }
            }
        }

        if (this.limiter) {
            sql += " LIMIT " + this.limiter;
        }

        var rs = [];

        this.db.transaction(
            function(tx) {
                console.log("Run SQL: " + sql);
                rs = tx.executeSql(sql)

                console.log("RESULT SET: " + rs);
            }
        )

        console.log("AFTER RESULT SET: " + rs);
        var objs = [];
        for (var i=0; i < rs.rows.length; i++) {
            var item = rs.rows.item(i);
            var obj = this.modelObject(item);
            objs.push(obj);
        }

        return objs;
    }
}

//TODO: Migrations!
//TODO: first/limit (top)
