class ColumnAttribute {
    constructor(columnName, columnType, isKey, foreignTable) {
        this.columnName = columnName;
        this.columnType = columnType;
        this.length = this.getLengthFromColumnType(columnType);
        this.isKey = isKey;
        this.foreignTable = foreignTable;
        this.value = null;
    }

    getLengthFromColumnType = (columnType) => {
        var varcharPattern = /VARCHAR\((\d+)\)/;
        var match = columnType.toUpperCase().match(varcharPattern);
        if (match && match.length > 0) {
            return eval(match[1]);
        }
    }
}

class TableAttribute {
    constructor(tableName, tableModel) {
        this.tableName = tableName;
        this.tableModel = tableModel;
        this.columnAttributes = [];

        TableAttribute.allTables.push(this);
    }

    static allTables = [];

    getColumnAttributes(instance) {
        for (var prop in instance) {
            var propObj = instance[prop];
            if (ColumnAttribute.prototype.isPrototypeOf(propObj)) {
                this.columnAttributes.push(propObj);
            }
        }
    }

    static getSelectString(tableName, instance) {
        var query = "SELECT";
        var comma = "";

        var index = 0;
        for (var col in instance) {
            var prop = instance[col];
            if (prop && ColumnAttribute.prototype.isPrototypeOf(prop)) {
                query += `${comma} t1.${prop.columnName} as ${col}`;
                comma = ",";
            }
            else if (instance.values && instance.values[col] && instance.values[col].function) {
                query += `${comma} ${instance.values[col].function} as ${col}`;
                comma = ",";
            }
        }

        query += ` FROM ${tableName} t1`;

        var columnsWithValues = [];
        for (var colIndex in instance) {
            var col = instance[colIndex];
            if (ColumnAttribute.prototype.isPrototypeOf(col)) {
                if (col.value || col.value === 0) {
                    columnsWithValues.push(col);
                }
            }
        }

        if (columnsWithValues.length > 0) {
            query += " WHERE";
            comma = "";
            for (var colIndex in columnsWithValues) {
                var col = columnsWithValues[colIndex];
                query += `${comma} t1.${col.columnName} = ${this.getQueryValue(col.columnType, col.value)}`;
                comma = " AND";
            }
        }

        return query;
    }

    static joinClauses = [];
    static allJoinTables = [];

    static listAllJoinTables(joinTables) {
        if (Array.isArray(joinTables)) {
            for (var index in joinTables) {
                if (Array.isArray(joinTables[index])) {
                    throw new Error("Invalid Syntax: Nested array encountered in join tables");
                }
                else {
                    this.allJoinTables.push(joinTables[index]);
                    if (joinTables[index].childLinks) {
                        this.listAllJoinTables(joinTables[index].childLinks);
                    }
                }
            }
        }
        else {
            this.allJoinTables.push(joinTables);
            if (joinTables[index].childLinks) {
                this.listAllJoinTables(joinTables[index].childLinks);
            }
        }
    }

    static getKeyColumn = (table) => {
        var properties = Object.keys(table);
        for (var key in properties) {
            var prop = table[properties[key]];
            if (ColumnAttribute.prototype.isPrototypeOf(prop) && prop.isKey) {
                return {
                    property: properties[key],
                    column: prop
                };
            }
        }

        return null;
    }

    static getTableAttribute = (table) => {
        var properties = Object.keys(table);
        for (var key in properties) {
            var prop = table[properties[key]];
            if (TableAttribute.prototype.isPrototypeOf(prop)) {
                return {
                    property: properties[key],
                    table: prop
                };
            }
        }

        return null;
    }

    static getForeignTableColumns = (table) => {
        var foreignTables = [];
        var properties = Object.keys(table);
        for (var key in properties) {
            var prop = table[properties[key]];
            if (ColumnAttribute.prototype.isPrototypeOf(prop) && prop.foreignTable) {
                foreignTables.push({
                    property: properties[key],
                    column: prop
                });
            }
        }

        return foreignTables;
    }

    static createJoinClauses(leftTable, joinTables) {
        var tableAttribute = this.getTableAttribute(leftTable);
        if (!tableAttribute) {
            throw new Error("Error in Method createJoinClauses: leftTable element does not contain a TableAttribute");
        }

        var keyColumn = this.getKeyColumn(leftTable);
        if (!keyColumn) {
            throw new Error(`Error in Method createJoinClauses: Table ${tableAttribute.table.tableName} does not have a ColumnAttribute where isKey = true`);
        }

        var foreignTables = this.getForeignTableColumns(leftTable);

        if (!Array.isArray(joinTables)) {
            joinTables = [ joinTables ];
        }

        var containsArray = false;
        for (var index in joinTables) {
            var joinTable = joinTables[index];
            var joinTableAttribute = this.getTableAttribute(joinTable);
            if (!joinTableAttribute) {
                throw new Error("Error in Method createJoinClauses: joinTable element does not contain a TableAttribute");
            }
            var joinTableKeyColumn = this.getKeyColumn(joinTable);
            if (!joinTableKeyColumn) {
                throw new Error(`Error in Method createJoinClauses: Table ${joinTableAttribute.table.tableName} does not have a ColumnAttribute where isKey = true`);
            }
            var joinForeignTableColumns = this.getForeignTableColumns(joinTable);
            var leftTableName = tableAttribute.table.tableName;
            var joinForeignTableColumn = null;
            joinForeignTableColumns.map(col => {
                if (col.column.foreignTable == leftTableName) {
                    joinForeignTableColumn = col;
                }
            });

            var joinTableName = joinTableAttribute.table.tableName;
            var leftForeignTableColumn = null;
            foreignTables.map(col => {
                if (col.column.foreignTable == joinTableName) {
                    leftForeignTableColumn = col;
                }
            });

            if (leftForeignTableColumn && joinForeignTableColumn) {
                throw new Error(`Error in Method createJoinClasses: Circular error between parent and child tables: ${leftTableName} and ${joinTableName}. Each refers to the other with a foreignTable attribute`);
            }
            else if (joinForeignTableColumn) {
                var join = `LEFT JOIN ${joinTableAttribute.table.tableName} ${joinTable.alias} ON ${leftTable.alias}.${keyColumn.column.columnName}=${joinTable.alias}.${joinForeignTableColumn.column.columnName}`;
                this.joinClauses.push(join);
            }
            else if (leftForeignTableColumn) {
                var join = `LEFT JOIN ${joinTableAttribute.table.tableName} ${joinTable.alias} ON ${leftTable.alias}.${leftForeignTableColumn.column.columnName}=${joinTable.alias}.${joinTableKeyColumn.column.columnName}`;
                this.joinClauses.push(join);
            }
            else {
                throw new Error(`Error in Method createJoinClasses: Unable to join ${leftTableName} and ${joinTableName}. The foreignTable attribute does not match the table name`);
            }

            if (joinTable.childLinks) {
                this.createJoinClauses(joinTable, joinTable.childLinks);
            }
        }
    }

    static getJoinSelectString(tableName, tableInstance, joinTables) {
        console.log("In getJoinSelectString");
        console.log("primary table = " + tableInstance.table.tableName);

        this.allJoinTables = [];
        this.joinClauses = [];

        this.allJoinTables.push(tableInstance);
        this.listAllJoinTables(joinTables);

        var tables = [];
        for (var i = 0; i < this.allJoinTables.length; i++) {
            this.allJoinTables[i].alias = `t${i + 1}`;
            tables[i + 1] = this.allJoinTables[i];
        }

        var keys = Object.keys(tableInstance);
        var query = "SELECT";
        var comma = "";

        var keyColumn = null;
        var tableIncrement = 1;
        for (var joinIndex in this.allJoinTables) {
            var joinInstance = this.allJoinTables[joinIndex];
            console.log("table is " + joinInstance.table.tableName);
            var tableNumber = tableIncrement++;
            var propertyNames = Object.keys(joinInstance);
            index = 0;

            for (var col in joinInstance) {
                var prop = joinInstance[col];
                var name = col;
                if (prop && ColumnAttribute.prototype.isPrototypeOf(prop)) {
                    name = `${col}${tableNumber}`;
                    query += `${comma} ${joinInstance.alias}.${prop.columnName} as ${name}`;
                    comma = ",";
                }
                else if (joinInstance.values && joinInstance.values[col] && joinInstance.values[col].function) {
                    name = `${col}${tableNumber}`;
                    var func = joinInstance.values[col].function.replace(/(.*[\(,]\s?)(t1)(\..*)/g, `$1${joinInstance.alias}$3`);
                    query += `${comma} ${func} as ${name}`;
                    comma = ",";
                }
            }
        }

        var selectClause = query;
        console.log(selectClause);

        var fromClause = ` FROM ${tableName} t1`;
        console.log(fromClause);

        this.createJoinClauses(tableInstance, joinTables);

        var joinClause = "";
        for (var index in this.joinClauses) {
            joinClause += ` ${this.joinClauses[index]}`;
        }

        console.log(joinClause);
        var query = "";
        comma = "";

        var tableColumnsWithValues = [];
        for (var tableIndex in this.allJoinTables) {
            var table = this.allJoinTables[tableIndex];
            for (var colIndex in table) {
                var col = table[colIndex];
                if (ColumnAttribute.prototype.isPrototypeOf(col)) {
                    if (col.value || col.value === 0) {
                        col.tableAlias = table.alias;
                        tableColumnsWithValues.push(col);
                    }
                }
            }
        }

        if (tableColumnsWithValues.length > 0) {
            query = " WHERE";
            comma = "";

            for (var colIndex in tableColumnsWithValues) {
                var col = tableColumnsWithValues[colIndex];
                query += `${comma} ${col.tableAlias}.${col.columnName} = ${this.getQueryValue(col.columnType, col.value)}`;
                comma = " AND";
            }
        }
        var whereClause = query;
        console.log(whereClause);
        return selectClause + fromClause + joinClause + whereClause;
    }

    static getInsertString(tableInstance) {
        var table = null;
        var keyColumn = null;
        var properties = [];
        for (var col in tableInstance) {
            var prop = tableInstance[col];
            if (prop && TableAttribute.prototype.isPrototypeOf(prop)) {
                table = prop;
            }
            else if (prop && ColumnAttribute.prototype.isPrototypeOf(prop) && prop.isKey) {
                keyColumn = prop;
            }
            else if (prop && ColumnAttribute.prototype.isPrototypeOf(prop)) {
                properties.push(prop);
            }
        }

        var comma = "";
        var columnNames = "(";
        var columnValues = "VALUES (";
        for (var i = 0; i < properties.length; i++) {
            var prop = properties[i];
            var value = this.getQueryValue(prop.columnType, prop.value);;

            columnNames = `${columnNames}${comma}${prop.columnName}`;
            columnValues = `${columnValues}${comma}${value}`;
            comma = ", ";
        }

        columnNames = `${columnNames})`;
        columnValues = `${columnValues})`;

        var insertString = `INSERT INTO ${table.tableName} ${columnNames} ${columnValues}`;
        return insertString;
    }

    static getUpdateString(tableInstance) {
        var table = null;
        var keyColumn = null;
        var properties = [];
        for (var col in tableInstance) {
            var prop = tableInstance[col];
            if (prop && TableAttribute.prototype.isPrototypeOf(prop)) {
                table = prop;
            }
            else if (prop && ColumnAttribute.prototype.isPrototypeOf(prop) && prop.isKey) {
                keyColumn = prop;
            }
            else if (prop && ColumnAttribute.prototype.isPrototypeOf(prop)) {
                properties.push(prop);
            }
        }

        var setClause = " SET";
        var comma = "";
        for (var i = 0; i < properties.length; i++) {
            var prop = properties[i];
            if (prop.value !== null & prop.value !== undefined) {
                var value = this.getQueryValue(prop.columnType, prop.value);

                setClause = `${setClause}${comma} ${prop.columnName}=${value}`;
                comma = ",";
            }
        }

        var updateString = `UPDATE ${table.tableName} ${setClause} WHERE ${keyColumn.columnName}=${keyColumn.value}`;
        console.log(updateString);
        return updateString;
    }

    static getDeleteString(tableInstance) {
        var deleteString = "DELETE FROM";

        var keyColumn = null;
        for (var col in tableInstance) {
            var prop = tableInstance[col];
            if (prop && TableAttribute.prototype.isPrototypeOf(prop)) {
                deleteString = `${deleteString} ${prop.tableName}`;
            }
            else if (prop && ColumnAttribute.prototype.isPrototypeOf(prop) && prop.isKey) {
                keyColumn = prop;
                if (!keyColumn.value) {
                    throw new Error(`Error in method getDeleteString, key column "${keyColumn.columnName}" has no value specified`);
                }
            }
        }

        deleteString = `${deleteString} WHERE ${keyColumn.columnName}=${keyColumn.value}`;
        return deleteString;
    }

    static getQueryValue(typ, val) {
        const datePattern = /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2}).*/;

        var qVal = ""
        if (typ.toUpperCase().startsWith("VARCHAR")) {
            if (val || val === "" || val === 0) {
                qVal = `'${val}'`;
            }
            else {
                qVal = null;
            }
        }
        else if (typ.toUpperCase().startsWith("DATE")) {
            if (val) {
                val = val.replace(datePattern, '$1 $2');
                qVal = `'${val}'`;
            }
        }
        else {
            qVal = val;
        }

        return qVal;
    }
}

module.exports = { columnAttribute: ColumnAttribute, tableAttribute: TableAttribute };
