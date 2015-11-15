QMModel
=======

QMModel represents a model attached to a database table, the model is created when you define a new table/object:

    var Book = quickModel.define('Book', {
	    title: quickModel.String('Title', {accept_null:false}),

	    authorName: quickModel.String('Author Name', {accept_null:false}),
	    
	    pages: quickModel.Integer('Pages', {default: 0})
	});

