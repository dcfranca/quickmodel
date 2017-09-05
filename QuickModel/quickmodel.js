.import QtQuick.LocalStorage 2.0 as Sql

/*

  new QMDatabase('myApp', '1.0')
  define : returns an object with functions create/filter/delete
  create: returns an object with the properties
  */

function QMDatabase(appName, version) {
    this.migrate = false;
    //Tables to handle version control
    var qMDatabase = this;
    this.conn = Sql.LocalStorage.openDatabaseSync(appName + '_db', "1.0", appName, 100000,
        function(db) {
            qMDatabase.migrate = true;
            console.log("*** DATABASE DOESNT EXIST ****");
            db.changeVersion("", "1.0");
        }
    );
    var AppVersion = this.define('__AppVersion__', {
        appName: this.String('App Name', {accept_null:false}),
        version: this.String('Version', {accept_null:false})
    });

    var appVersion = AppVersion.filter({appName: appName}).get();

    if (appVersion) {
        if (appVersion.version !== version) {
            appVersion.version = version;
            appVersion.save();
            this.migrate = true
        }
    } else {
        appVersion = AppVersion.create({appName: appName, version: version});
        this.migrate = true;
    }
}

QMDatabase.prototype = {
    constructor: QMDatabase,

    String: function(label, params) {
        return new QMField('TEXT', label, params);
    },
    Integer: function(label, params) {
        return new QMField('INTEGER', label, params);
    },
    Float: function(label, params) {
        return new QMField('FLOAT', label, params);
    },
    Real: function(label, params) {
        return new QMField('REAL', label, params);
    },
    Date: function(label, params) {
        return new QMField('DATE', label, params);
    },
    DateTime: function(label, params) {
        return new QMField('DATETIME', label, params);
    },
    Boolean: function(label, params) {
        return new QMField('BOOLEAN', label, params);
    },
    PK: function(label, params) {
        return new QMField('PK', label, params);
    },
    FK: function(label, params) {
        return new QMField('FK', label, params);
    },
    _defineField: function(column, data) {
        var sql;
        var items = [];
        var fk = [];

        //If is a foreign key
        if (data.type === 'FK') {
            items.push(column)
            items.push('INTEGER')
            fk.push('FOREIGN KEY(' + column + ')')
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
                    if (!data.params[param]) {
                        items.push('NOT NULL');
                    }
                    break;
                case 'unique':
                    if (unique) {
                        items.push('UNIQUE');
                    }
                    break;
                case 'references':
                    fk.push('REFERENCES ' + data.params[param] + '(id) ON DELETE CASCADE ON UPDATE CASCADE');
                    break;
                case 'default':
                    items.push('DEFAULT ' + data.params[param]);
                    break;

            }
        }

        return {field: items.join(' '), fk: fk.join(' ')};
    },
    retrieveFields: function(name) {
        var rs;
        var sql = "PRAGMA table_info(" + name + ")";
        this.conn.transaction(
            function(tx) {
                console.log("Run SQL: " + sql);
                rs = tx.executeSql(sql);
            }
        )

        var fields = {};
        for (var idx=0; idx < rs.rows.length; idx++) {
            fields[rs.rows[idx].name] = null;
        }

        return fields;
    },
    define: function(name, fields) {
        var sql_create = "CREATE TABLE IF NOT EXISTS " + name + " (";
        var idx = 0;
        this.properties = {};
        this.tableName = name;

        fields['id'] = this.PK('Primary Key', []);

        var foreign_keys = [];
        for (var column in fields) {
            var definitions = fields[column];
            var field_data = this._defineField(column, fields[column]);
            if (idx > 0) sql_create += ", ";
            sql_create += field_data['field'];

            if (field_data['fk'].length > 0) {
                foreign_keys.push(field_data['fk']);
            }
            idx++;
        }

        //Create foreign key references
        for (var ifk=0; ifk < foreign_keys.length; ifk++) {
            sql_create += ", " + foreign_keys[ifk];
        }

        sql_create += ")";
        var model = new QMModel(this, name, fields);

        if (this.migrate) {
            var oldObjs = [];
            var oldFields = this.retrieveFields(name);
            if (!isEmpty(oldFields)) {
                var oldModel = new QMModel(this, name, oldFields);
                oldObjs = oldModel.all();
                this._runSQL("DROP TABLE " + name);
            }

            //Run create table
            this._runSQL(sql_create);

            for (var i=0; i< oldObjs.length; i++) {
                for (var field in oldObjs[i]) {
                    if (!(field in fields) && field !== '_model' && field !== 'save') {
                        delete oldObjs[i][field];
                    }
                }
                oldObjs[i].save(true);
            }
        }

        return model;
    },
    _runSQL: function(sql) {
        this.conn.transaction(
            function(tx) {
                console.log("Run SQL: " + sql);
                tx.executeSql(sql);
            }
        )
    }
};

/*******************************
  QMModel
  Define a class referencing a database table
  *****************************/

function QMModel(db, tableName, fields) {
    this.filterConditions = {};
    this.sorters = [];
    this.limiters = null;

    this._meta = {
        db: db,
        tableName: tableName,
        fields: fields,
    };
}

function isEmpty(obj) {
    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

QMModel.prototype = {
    create: function(data) {
        var obj = this.makeObject(data);
        var insertId = this.insert(obj);

        var objs = this.filter({id:insertId}).all();
        if (objs.length > 0) {
            return objs[0];
        }

        return null;
    },
    filter: function(conditions) {
        this.filterConditions = conditions;
        return this;
    },
    order: function(sorters) {
        if (typeof sorters === 'string') {
            if (!this.sorters) {
                this.sorters = [];
            }
            this.sorters.push(sorters);
        }
        else if (Array.isArray(sorters)) {
            this.sorters = sorters;
        }
        return this;
    },
    limit: function(limiter) {
        this.limiter = limiter;
        return this;
    },
    get: function() {
        var objs = this.limit(1).all();
        if (objs.length > 0)
            return objs[0];

        return null;
    },
    all: function() {
        var sql = "SELECT ";
        var fields = [];
        for (var field in this._meta.fields) {
            fields.push(field);
        }

        sql += fields.join(',');
        sql += " FROM " + this._meta.tableName;
        sql += this._defineWhereClause();

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

        this._meta.db.conn.transaction(
            function(tx) {
                console.log("Run SQL: " + sql);
                rs = tx.executeSql(sql)

                //console.log("RESULT SET: " + rs);
            }
        )

        var objs = [];
        for (var i=0; i < rs.rows.length; i++) {
            var item = rs.rows.item(i);
            var obj = this.makeObject(item);
            objs.push(obj);
        }

        this.filterConditions = {};
        this.limiter = null;
        this.sorters = null;

        return objs;
    },
    update: function(obj) {
        var sql = "UPDATE " + this._meta.tableName + " SET ";
        var idx = 0;
        for (var field in obj) {
            if (field === '_model' || field === 'save')
                continue;
            if (field === 'id' && isEmpty(obj[field]))
                continue;

            if (idx > 0) sql += ",";
            sql += field + " = " + this._convertToSqlType(obj[field]) + "";
            idx++;
        }
        sql += this._defineWhereClause(this.filterConditions);

        this._meta.db._runSQL(sql);
        this.filterConditions = {};
    },
    insert: function(obj) {
        var sql = "INSERT INTO " + this._meta.tableName + "(";
        var fields = [];
        var values = [];
        for (var field in obj) {
            if (field === '_model' || field === 'save')
                continue;
            if (field === 'id' && isEmpty(obj[field]))
                continue;
            fields.push(field);
            if (obj[field]) {
                values.push(this._convertToSqlType(obj[field]));
            } else {
                values.push('NULL');
            }
        }
        sql += fields.join(', ');
        sql += ") VALUES (" + values.join(', ') + ")";

        var rs;
        this._meta.db.conn.transaction(
            function(tx) {
                console.log("Run SQL: " + sql);
                rs = tx.executeSql(sql);
            }
        )

        return rs.insertId;
    },
    remove: function() {
        var sql = "DELETE FROM " + this._meta.tableName;
        sql += this._defineWhereClause();
        this._meta.db._runSQL(sql);
        this.filterConditions = {};
    },
    _typeof : function (value) {
        var l_type = typeof value;

        // adjusting type based on object instanceof
        if (l_type === 'object') {
            if (value instanceof Date) {
                l_type = 'date';
            } else
            if (value instanceof Number) {
                l_type = 'number';
            } else
            if (value instanceof String) {
                l_type = 'string';
            } else
            if (value instanceof Boolean) {
                l_type = 'boolean';
            }
        }

        return l_type;
    },
    _convertToSqlType: function (value) {
        var l_type = this._typeof(value);

        if (l_type === 'boolean') {
            value = value ? 1 : 0;
            l_type = 'number';
        }
        if (l_type === 'date') {
            value = value.toISOString();
            l_type = 'string';
        }
        if (l_type === 'string') {
            value = "'" + value.replace("'", "''") + "'";
        }

        return value;
    },
    _convertFromSqlValue: function (value, definition) {
        if (!definition) return value;
        if (!value) return value;

        var l_type = this._typeof(value);
        var l_desiredType = definition.type;

        if (l_type === 'number') {
            if (l_desiredType === 'BOOLEAN') {
                value = value !== 0;
            }
        }

        if (l_type === 'string') {
            if ((l_desiredType === 'FLOAT') ||
                (l_desiredType === 'REAL') ||
                (l_desiredType === 'INTEGER') ||
                (l_desiredType === 'FK') ||
                (l_desiredType === 'PK')) {
                value = Number(value);
            } else
            if ((l_desiredType === 'DATE') ||
                (l_desiredType === 'DATETIME')) {
                value = new Date(value);
            } else
            if (l_desiredType === 'BOOLEAN') {
                switch (value) {
                    case "true":
                    case "1":
                    case "on":
                    case "yes":
                        value = true;
                        break;
                    default:
                        var isNum = value.match(/^[0-9]+$/);
                        if (!isNum)
                            value = false;
                        else
                            value = value !== 0;
                        break;
                }
            }
        }

        return value;
    },
    _defineWhereClause: function() {
        var sql = '';
        var idx = 0;

        for (var cond in this.filterConditions) {
            if (idx > 0) sql += " AND ";
            var operator;
            var newOperator = '=';
            var field = cond;
            var position;
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
                    newOperator = 'LIKE';
                    position = 'BEGINEND';
                    break;
                case 'startswith':
                    newOperator = 'LIKE';
                    position = 'END';
                    break;
                case 'endswith':
                    newOperator = 'LIKE';
                    position = 'BEGIN';
                    break;
                }
            }
            else if (this.filterConditions[cond].constructor === Array) {
                newOperator = 'IN';
            }

            sql += field + " " + newOperator + " ";
            if (newOperator === 'LIKE') {
                sql += "'";
                if (position.indexOf('BEGIN') > -1) {
                    sql += "%";
                }
                sql += this.filterConditions[cond];
                if (position.indexOf('END') > -1) {
                    sql += "%";
                }
                sql += "'";
            } else if (operator !== 'null') {
                if (this.filterConditions[cond].constructor === String) {
                    sql += "'" + this.filterConditions[cond] + "'";
                } else if (newOperator === 'IN') {
                    sql += "('" + this.filterConditions[cond].join("','") + "')";
                }
                else {
                    sql += this._convertToSqlType(this.filterConditions[cond]);
                }
            }
            idx++;
        }

        if (sql.length > 0) {
            sql = " WHERE " + sql;
        }

        return sql;
    },
    makeObject: function(values) {
        var obj = new QMObject(this);
        for (var field in values) {
            if (field.startsWith('_') || field === 'save' || !(field in this._meta.fields))
                continue;
            obj[field] = this._convertFromSqlValue(values[field], this._meta.fields[field]);
        }
        return obj;
    }
};


/**************************************
  QMObject
  reference a single instance of a object in the database
  *************************************/
function QMObject(model) {
    this._model = model
    this.id = null;
}

QMObject.prototype = {
    //Functions for single object
    save: function(forceInsert) {
       if (typeof forceInsert === 'undefined') { forceInsert = false; }
       if (this.id && !forceInsert) {
           this._model.filter({id: this.id}).update(this);
       } else {
           this.id = this._model.insert(this);
       }
       return this;
    }
}

/*******************************************
  QMField
  Define a database field with attributes
  ******************************************/

function QMField(type, label, params) {
    this.type = type;
    this.params = params;
}

//TODO: Migrations!
//TODO: Replace concatenations with binds '?'
