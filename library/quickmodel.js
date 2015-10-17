.import QtQuick.LocalStorage 2.0 as Sql

/*

  new QuickDB('database', '1.0', 'myApp')
  define : returns an object with functions create/filter/delete
  create: returns an object with the properties
  */

var db;

function QuickField(type, label, params) {
    this.items = [];
    var fieldName;
    this.type = type;
    this.params = params;
}

function QuickModel(appName, version) {
    this.db = Sql.LocalStorage.openDatabaseSync(appName + '_db', version, appName, 100000);

    this.String = function(label, params) {
        return new QuickField('TEXT', label, params);
    }
    this.Integer = function(label, params) {
        return new QuickField('INTEGER', label, params);
    }
    this.Float = function(label, params) {
        return new QuickField('FLOAT', label, params);
    }
    this.Real = function(label, params) {
        return new QuickField('REAL', label, params);
    }
    this.Date = function(label, params) {
        return new QuickField('DATE', label, params);
    }
    this.DateTime = function(label, params) {
        return new QuickField('DATETIME', label, params);
    }
    this.PK = function(label, params) {
        return new QuickField('INTEGER PRIMARY KEY', label, params);
    }
    this.FK = function(label, params) {
        return new QuickField('FK', label, params);
    }
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
    _define_field: function(column, data) {
        var sql;
        var items = [];

        //If is a foreign key
        if (data.type === 'FK') {
            items.push('FOREIGN KEY(' + column + ')')
        }
        else if (data.type === 'PK') {
            items.push(column);
            items.push('INTEGER PRIMARY KEY');
        }
        else {
            items.push(column);
            items.push(data.type);
        }

        for (var param in data.params) {
            switch(param) {
                case 'accept_null':
                    if (!param) {
                        items.push('NOT NULL');
                    }
                    break;
                case 'unique':
                    if (unique) {
                        items.push('UNIQUE');
                    }
                    break;
                case 'references':
                    var t = params[param].split('.');
                    items.push('REFERENCES ' + t[0] + '(' + t[1] + ')');
                    break;
            }
        }

        return items.join(' ');
    },
    define: function(name, data) {
        var sql_create = "CREATE TABLE IF NOT EXISTS " + name + " (";
        var idx = 0;
        this.properties = {};
        this.tableName = name;

        sql_create += this._define_field('id', {type: 'PK'});
        this.properties['id'] = null;

        for (var column in data) {
            if (column === 'id') continue;
            var definitions = data[column];
            sql_create += ", " + this._define_field(column, data[column]);
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
            var operator;
            var newOperator = '=';
            var field = cond;
            if (cond.indexOf('__') > -1) {
                var operands = cond.split('__');
                field = operands[0];
                operator = operands[1];

                switch(operator) {
                case 'gt':
                    newOperator = '>'; break;
                case 'ge':
                    newOperator = '>='; break;
                case 'lt':
                    newOperator = '<'; break;
                case 'le':
                    newOperator = '<='; break;
                case 'null':
                    if (this.filterConditions[cond])
                        newOperator = 'IS NULL';
                    else
                        newOperator = 'IS NOT NULL';
                    break;
                case 'like':
                    newOperator = 'like'; break;
                }
            }

            sql += field + " " + newOperator + " ";
            if (operator === 'like') {
                sql += "'%"+ this.filterConditions[cond] + "%'";
            } else if (operator !== 'null') {
                if (this.filterConditions[cond].constructor === String) {
                    sql += "'" + this.filterConditions[cond] + "'";
                }
                else {
                    sql += this.filterConditions[cond];
                }
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
     remove:function() {
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
     get:function() {
         var objs = this.limit(1).all();
         if (objs.length > 0)
             return objs[0];

         return null;
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

        if (this.sorters && this.sorters.constructor === String) {
            this.sorters = [this.sorters];
        }

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

        this.filterConditions = {};
        this.limiter = null;
        this.sorters = null;

        return objs;
    }
}

//TODO: Migrations!
//TODO: Replace concatenations with binds '?'
