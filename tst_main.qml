import QtQuick 2.4
import QtTest 1.0

import "library/quickmodel.js" as QuickModel

TestCase {
    name: "quickModelTests"

    function test_create_database() {

    }

    function test_create_models() {
        var quickModel = new QuickModel.QuickModel('testApp' + new Date(), '1.0');
        var User = quickModel.define('User', {
          username: [QuickModel.dataType.STRING, 'NOT NULL'],
          firstName: [QuickModel.dataType.STRING],
          lastName: [QuickModel.dataType.STRING],
          birthday: [QuickModel.dataType.DATE],
          height: [QuickModel.dataType.FLOAT],
          weight: [QuickModel.dataType.INTEGER]
        });

        var user = User.create({username: "dfranca", firstName: "Daniel", lastName: "França"});
        var users = User.filter({username: "dfrancx"}).all();
        compare(users.rows.length, 0);
        users = User.filter({username: "dfranca"}).all();
        console.log("RS USERS: " + users);
        compare(users.rows.length, 1);
        user = users.rows.item(0);

        compare(user.id, 1);

        users = User.filter({username: "dfranca", firstName: "Danix"}).all();
        compare(users.rows.length, 0);
        User.filter({username: "dfranca", firstName: "Daniel"}).update({firstName: "Danix"});
        users = User.filter({username: "dfranca", firstName: "Danix"}).all();
        compare(users.rows.length, 1);

        User.filter({username: "dfranca", firstName: "Danix"}).exclude();
        users = User.filter({username: "dfranca"}).all();
        compare(users.rows.length, 0);

    }

    function test_manipulate_objects() {
        //Create object
        //Query object
        //Delete object
        //Query object
        //Update object
        //Query old object value
        //Query new object value
    }
}
