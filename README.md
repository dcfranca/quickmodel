# QuickModel

QuickModel is a simple, easy to setup ORM library for Qt/QML.
Tha main goal is to provide a very simple ORM layer on top of SQLite.

To achieve these goals we aim for the following:

  - Single file library. Just import a single file into your QML project
  - Consistent interface inspired by Django ORM

### Quick Start
Clone the repository.
You can also find this project in [qpm](https://www.qpm.io/)

Include `QuickModel.pri` to your .pro:

    include($$PWD/../QuickModel/QuickModel.pri)

Import the `qrc:/QuickModel/quickmodel.js` file into your project:

    import "qrc:/QuickModel/quickmodel.js" as QuickModel

Define your database and the models:
```javascript
    var quickModel = new QuickModel.QMDatabase('testApp', '1.0');
    //Define objects
    var Artist = quickModel.define('Artist', {
        name: quickModel.String('Name', {accept_null:false})
    });
    var Track = quickModel.define('Track', {
        title: quickModel.String('Track Name', {accept_null:false}),
        artist: quickModel.FK('Artist', {'references': 'Artist'}),
        stars: quickModel.Integer('Avaliation', {accept_null:false, 'default': 0})
    });
```

Insert new data:
```javascript
    var artist1 = Artist.create({name: 'Lana del Rey'});
    var artist2 = Artist.create({name: 'Rammstein'});
    var artist3 = Artist.create({name: 'Arctic Monkeys'});
    var artist4 = Artist.create({name: 'Johnny Cash'});
    var artist5 = Artist.create({name: 'Johnny Bravo'});
    var track = Track.create({title: 'Born to die', artist: artist1.id});
```
Or:
```javascript
    var track2 = Track.makeObject();
    track2.title = 'Do I Wanna Know';
    track2.artist = artist3.id;
    track2.save();
```
Update:
```javascript
    track2.stars = 5;
    track2.save();
```
Bulk queries:
```javascript
    Track.filter({artist: artist1.id}).update({stars: 3});
    Track.filter({artist: artist2.id}).remove();
```
Run your queries:
```javascript
    var artists_johnny = Artist.filter({name__like: 'Johnny'}).all();
    var sorted_artists = Artist.order('name').limit(3).all();
    var lana = Artist.filter({name: 'Lana del Rey'}).get();
```
Documentation: http://quickmodel.readthedocs.org/en/latest/

### TODO
  - More detailed documentation
  - Support to joins
  - Support to async calls
