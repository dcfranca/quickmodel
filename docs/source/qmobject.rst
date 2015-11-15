QMObject
========

QMObject represents a single instance of an object in the database:

	//Create a new object in the database and store it on myBook variable

	var myBook = Book.create({title: "Haunted", authorName: "Chuck Palahniuk"});

	//Retrieve the object from the database

	var book = Book.filter(authorName: "Chuck Palahniuk").get();

	//Retrieve a collection of objects from the database sorted by title
	
	var books = Book.order('title').all();
