var Utility = {
    _getDepartments:function () {
        var loc1 = {
            add1:"P.O Box 3899",
            zip:"94404",
            state:"CA"
        };
        var loc2 = {
            add1:"P.O Box 4899",
            zip:"95502",
            state:"CA"
        };
        return [
            {
                name:'R&D',
                number:'23',
                locations:[
                    loc1,
                    loc2
                ]
            },
            {
                name:'Marketing',
                number:'24',
                locations:[
                    loc1,
                    loc2
                ]
            }
        ];
    },
    getEmployee:function (count) {
        !count && (count = 10);
        var result = {
            name:'comp' + count,
            employees:[]
        };
        var departmentData = this._getDepartments();
        for (var i = 0; i < count; i++) {
            var emp = {
                fname:'fname' + i,
                lname:'lname' + i,
                age:(function () {
                    var age = parseInt(Math.random() * 100);
                    return age < 20 ? age + 20 : age > 65 ? 65 : age;
                })(),
                sex:(function () {
                    return (parseInt(Math.random() * 100) % 2) ? 'M' : 'F';
                })(),
                works_for:(function () {
                    return departmentData[(parseInt(Math.random() * 100) % 2)];
                })()
            };
            result.employees.push(emp);
        }
        return result;
    }
};