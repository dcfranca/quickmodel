Queries
=======

The queries interface is inspired in Django-ORM, so you can expect a familiar interface if you are used to Django.

i.e: 
If you want to find a specific book, you can query by title
	var books = Book.filter({title: "Fight Club"}).all()

If you want to list all books sorted by title:
	var books = Book.order('title').all()

You can use special operators for things like "greater than, less than" adding double underscore and the operator as the dict key:

If you want to list all books with the word "World" in the title
	var books = Book.filter({title__like:'World'}).all()

If you want to list only the books with more than 100 pages
	var books = Book.filter({pages__gt:100}).all()

All operators:
like: The column contains the string
startswith: The column starts with the string
endswith: The column ends with the string
gt: Greater than
ge: Greater than or equal
lt: Less than
le: Less than or equal
null: is NULL

If you want to list only the books from a specific author
	var author = Author.filter({name: "Isaac Asimov"}).get()
	var books = Book.filter({author:author.id}).all()

If you want to update an item or a list of items you just need to filter first and call update with the new parameters
	Author.filter({name: "Isac Asimov"}).update({name: "Isaac Asimov"});

The same approach to exclude an item
	Author.filter({title: 'Foundation'}).remove();
