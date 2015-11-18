Defining
========

As a first step before use the library you must define the classes (database entities) related to your poject.

For this you can simply create a js file, containing the initialization.
	.import "quickmodel.js" as QuickModel

	var qmdb;
	var Author;
	var Book;

	function init() {
		qmdb = new QuickModel.QMDatabase("MyApp", "1.0");

	    Author = qmdb.define("Author", {
	                        name: qmdb.String("Name", {accept_null: false}),
	                        email: qmdb.String("Email")
	    });

	    Book = qmdb.define("Book", {
	                        author: qmdb.FK("Author", {references: 'Author'})
	                        title: qmdb.String("Title", {accept_null: false}),
	                        pages: qmdb.Integer("Pages", {accept_null: false}),
	                        
	    });
	}


Then, you must call your initialization function before any attempt to use the data from the models.
And you can create your objects:
    var author1 = Artist.create({name: 'Chuck Palahniuk'});
    var author2 = Artist.create({name: 'Isaac Asimov'});

