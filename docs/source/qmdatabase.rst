QMDatabase
==========

QMDatabase represents a database connection, it's the first class you need initialize before use the library.

To initialize it as simple as:
    import "quickmodel.js" as QuickModel
    var quickModel = new QuickModel.QMDatabase("myApp", '1.0');

Where the "myApp" is the name of your app and "1.0" is the version

With the QMDatabase instance you can define your tables/objects:

    var Book = quickModel.define('Book', {
	    title: quickModel.String('Title', {accept_null:false}),
	    authorName: quickModel.String('Author Name', {accept_null:false}),
	    pages: quickModel.Integer('Pages', {default: 0})
	});
