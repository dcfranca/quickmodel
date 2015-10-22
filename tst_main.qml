import QtQuick 2.4
import QtTest 1.0

import "library/quickmodel.js" as QuickModel

TestCase {
    name: "quickModelTests"

    /****************
      Classes: QMDatabase / QMClass / QMObject
      Instantiate a new database -- new QMDatabase(databaseName)

      QMDatabase
        define (return new QMClass)
        _define_field (return field string)
        _run_sql

      QMClass
        create (return new QMObject)
        filter (return this)
        order (return this)
        limit (return this)
        get
        all
        update
        insert
        remove
        _define_where_clause (return where clause string)

      QMObject
        save

      ***************/

    function test_basic_orm() {
        var quickModel = new QuickModel.QMDatabase('testApp' + new Date(), '1.0');

        //Define object
        var User = quickModel.define('User', {
          username: quickModel.String('Username', {accept_null:false}),
          firstName: quickModel.String('First Name'),
          lastName: quickModel.String('Last Name'),
          birthday: quickModel.Date('Birthday'),
          height: quickModel.Float('Height'),
          weight: quickModel.Integer('Weight')
        });

        //Create object
        var user = User.create({username: "dfranca", firstName: "Daniel", lastName: "Franca"});
        //Filter objects
        var users = User.filter({username: "dfrancx"}).all();
        compare(users.length, 0);
        users = User.filter({username: "dfranca"}).all();
        compare(users.length, 1);
        user = users[0];

        compare(user.id, 1);

        //Save single object field change
        user.lastName = 'Frank';
        user.save();
        users = User.filter({lastName: "Frank"}).all();
        compare(users.length, 1);

        users = User.filter({username: "dfranca", firstName: "Danix"}).all();
        compare(users.length, 0);

        //Update user name and check if it was saved
        User.filter({username: "dfranca", firstName: "Daniel"}).update({firstName: "Danix"});
        users = User.filter({username: "dfranca", firstName: "Danix"}).all();
        compare(users.length, 1);

        //Delete user
        User.filter({username: "dfranca", firstName: "Danix"}).remove();
        users = User.filter({username: "dfranca"}).all();
        compare(users.length, 0);

        var user1 = User.create({username: "hsimpson", firstName: "Homer", lastName: "Simpson", birthday: new Date("1995-10-05"), height: 1.81});
        var user2 = User.create({username: "jdoe", firstName: "John", lastName: "Doe", birthday: new Date("1989-10-05"), height: 1.55});
        var user3 = User.create({username: "alock", firstName: "Adam", lastName: "Lock", height: 2.05, birthday: new Date("1991-10-25")});

        user = User.filter({username: "dfranca"}).update({height: 1.81});

        //Sort all users by height
        var usersOrdered = User.filter().order(['height']).all();

        compare(usersOrdered.length, 3);

        compare(usersOrdered[0].height, 1.55);
        compare(usersOrdered[0].username, "jdoe");

        compare(usersOrdered[1].height, 1.81);
        compare(usersOrdered[1].username, "hsimpson");

        compare(usersOrdered[2].height, 2.05);
        compare(usersOrdered[2].username, "alock");

        var user4 = User.create({username: "bsimpson", firstName: "Bart", lastName: "Simpson", birthday: new Date("2002-06-12"), height: 1.30});

        //Sort %simpsons% users by height desc
        var usersFiltered = User.filter({username__like: "simpson"}).order(['-height']).all();
        compare(usersFiltered.length, 2);

        compare(usersFiltered[0].firstName, "Homer");
        compare(usersFiltered[0].username, "hsimpson");

        compare(usersFiltered[1].firstName, "Bart");
        compare(usersFiltered[1].username, "bsimpson");

        var me = User.filter({username: "jdoe"}).get();
        me.lastName = "França";

        me.save();

        compare(User.filter({lastName: "França"}).all().length, 1);

        //Check users higher than 1.8m (to see how operators work)
        var tallUsers = User.filter({height__gt: 1.8}).order('height').all();
        compare(tallUsers.length, 2);
        compare(tallUsers[0].username, "hsimpson");
        compare(tallUsers[1].username, "alock");

        //Test limit
        var user5 = User.create({username: "tmosby", firstName: "Ted", lastName: "Mosby", birthday: new Date("1980-08-01"), height: 1.22});

        var shortestUsers = User.filter({height__lt: 1.8}).order('height').limit(2).all();
        compare(shortestUsers.length, 2);
        compare(shortestUsers[0].username, "tmosby");
        compare(shortestUsers[1].username, "bsimpson");

        //Test sorting date and not null
        var youngestUser = User.filter({birthday__null: false}).order('-birthday').get();
        compare(youngestUser.username, 'bsimpson');
        var bd = new Date(youngestUser.birthday);
        compare(bd.getFullYear(), 2002);
        compare(bd.getMonth()+1, 6);
        compare(bd.getDate(), 12);
    }

    function test_field_attributes() {
        var quickModel = new QuickModel.QMDatabase('testApp' + new Date(), '1.0');

        //Define objects
        var Artist = quickModel.define('Artist', {
            name: quickModel.String('Name', {accept_null:false})
        });
        var Track = quickModel.define('Track', {
            title: quickModel.String('Track Name', {accept_null:false}),
            artist: quickModel.FK('Artist', {'references': 'Artist'})
        })

        var artist = Artist.create({name: 'Lana del Rey'});
        var track = Track.create({title: 'Born to die', artist: artist.id});

        compare(track.artist, artist.id);

        Artist.filter({id: artist.id}).remove();

        //No more artists
        var artists = Artist.all();
        compare(artists.length, 0);

        var artist1 = Artist.create({name: 'Lana del Rey'});
        var artist2 = Artist.create({name: 'Rammstein'});
        var artist3 = Artist.create({name: 'Arctic Monkeys'});
        var artist4 = Artist.create({name: 'Johnny Cash'});
        var artist5 = Artist.create({name: 'Johnny Bravo'});

        var artistsLikeJohnny = Artist.filter({name__like: 'Johnny'}).all();
        compare(artistsLikeJohnny.length, 2);

        var sortedArtists = Artist.order('name').limit(3).all();
        compare(sortedArtists.length, 3);
        compare(sortedArtists[0].name, 'Arctic Monkeys');
        compare(sortedArtists[1].name, 'Johnny Bravo');
        compare(sortedArtists[2].name, 'Johnny Cash');

        var lana = Artist.filter({name: 'Lana del Rey'}).get();
        compare(lana.name, 'Lana del Rey');

        var last3artists = Artist.filter({id: [5, 4, 3]}).order('id').all();
        compare(last3artists.length, 3);
        compare(last3artists[0].name, 'Arctic Monkeys');
        compare(last3artists[1].name, 'Johnny Cash');
        compare(last3artists[2].name, 'Johnny Bravo');

        var allJohnnys = Artist.filter({name__startswith: 'Johnny'}).order('name').all();
        compare(allJohnnys.length, 2);
        compare(allJohnnys[0].name, 'Johnny Bravo');
        compare(allJohnnys[1].name, 'Johnny Cash');

    }

    function test_migrate_database() {
        var dbName = 'testApp' + new Date();
        var quickModel = new QuickModel.QMDatabase(dbName, '1.0');

        //Define objects
        var Book = quickModel.define('Book', {
            title: quickModel.String('Title', {accept_null:false}),
            authorName: quickModel.String('Author Name', {accept_null:false})
        });

        Book.create({title: "A Clockwork Orange", authorName: "Anthony Burgess"});
        Book.create({title: "Fight Club", authorName: "Chuck Palahniuk"});
        Book.create({title: "Haunted", authorName: "Chuck Palahniuk"});
        Book.create({title: "Lolita", authorName: "Vladimir Nabokov"});

        //Migrate
        quickModel = new QuickModel.QMDatabase(dbName, '1.1');
        Book = quickModel.define('Book', {
            title: quickModel.String('Title', {accept_null:false}),
            authorName: quickModel.String('Author Name', {accept_null:false}),
            pages: quickModel.Integer('Pages', {default: 0})
        });

        var books = Book.order('title').all();
        compare(books.length, 4);

        compare(books[0].title, "A Clockwork Orange");
        compare(books[0].authorName, "Anthony Burgess");
        compare(books[0].pages, 0);

        compare(books[1].title, "Fight Club");
        compare(books[1].authorName, "Chuck Palahniuk");
        compare(books[1].pages, 0);

        compare(books[2].title, "Haunted");
        compare(books[2].authorName, "Chuck Palahniuk");
        compare(books[2].pages, 0);

        compare(books[3].title, "Lolita");
        compare(books[3].authorName, "Vladimir Nabokov");
        compare(books[3].pages, 0);
    }
}

//TODO
//Test foreign key
//Test unique item
//Test not null
//Test delete foreign key
//Test save null
