# QuickModel

QuickModel is a simple/easy to setup ORM library for Qt/QML.
Tha main goal is to provide a very simple ORM layer on top of the SQLite access.

To achieve those goals we aim the following

  - Single file library/Just need to import a single file into your QML project
  - Consistent interface inspired by Django ORM

### Quick Start
Clone the repository and import the library/quickmodel.js file into your project.
You can also find this project in qpm: https://www.qpm.io/

Define your database and the models:

        var quickModel = new QuickModel.QMDatabase('testApp', '1.0');
        //Define objects
        var Artist = quickModel.define('Artist', {
            name: quickModel.String('Name', {accept_null:false})
        });
        var Track = quickModel.define('Track', {
            title: quickModel.String('Track Name', {accept_null:false}),
            artist: quickModel.FK('Artist', {'references': 'Artist'})
        })

Run your queries on your new database:

        var artist1 = Artist.create({name: 'Lana del Rey'});
        var artist2 = Artist.create({name: 'Rammstein'});
        var artist3 = Artist.create({name: 'Arctic Monkeys'});
        var artist4 = Artist.create({name: 'Johnny Cash'});
        var artist5 = Artist.create({name: 'Johnny Bravo'});
        var track = Track.create({title: 'Born to die', artist: artist.id});
        
        var artists_johnny = Artist.filter({name__like: 'Johnny'}).all();
        var sorted_artists = Artist.order('name').limit(3).all();
        var lana = Artist.filter({name: 'Lana del Rey'}).get();

Documentation: http://quickmodel.readthedocs.org/en/latest/

### TODO
  - More detailed documentation
  - Support to joins
  - Support to async calls
