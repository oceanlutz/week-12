
/*
    The general idea of this was to allow the creation 
    of lists for users to store the expenses that they
    input, and then add those together to act as a simple
    expendatures list and total. I will more than likely 
    add to this in the future, as there are several 
    design choices I've made that are currently not 
    needed for the current requirements. I do want to add
    them eventually, however. This code helps assist in 
    the function of displaying a modal for a user to 
    input a list name and amomunt of expenses, along with
    the decision of whether or not to display those 
    expenses in the method used in the USA (1,000.00) or 
    the method used in Germany, which is most other 
    countries (1.000,00). However, the cost field must be
    specifically filled with only a number and no symbols
    while also in the USA method of input. I plan on 
    changing this but in the present it just relies on 
    the correct input from the user to store the value 
    correctly for calculations. The lists are created 
    through the use of the create modal and can be later
    edited through another edit modal. All of these 
    page elements for input interact through javascript 
    below to achive full CRUD functionality and interact
    with the given api.
*/

//list class for creating pieces of data to be posted
class List {
    constructor(name, format, expenses) {
        this.format = format;
        this.name = name;
        this.expenses = expenses;
    }

    //i don't even use this but am leaving it for  now
    addExpense(name, cost, freq) {
        this.expenses.push(new Expense(name, cost, freq));
    }
}


//the lists each contain an array of expense objects
//this class is for creating new expense objects to push
class Expense {
    constructor(name, cost, freq) {
        this.name = name;
        this.cost = cost;
        this.freq = freq;
    }
}

//this is for storing all the CRUD methods that will
//interact with the api 
class ListService {
    static url = 'https://653ec4d09e8bd3be29dfb424.mockapi.io/api/v1/lists';
    //url of this specific api

    static getAllLists() {
        return $.get(this.url);
    }
    //returns all the data at the given url

    static getList(id) {
        return $.get(this.url + `/${id}`);
    }
    //returns specific piece of data depending on argument

    static createList(list) {
        return fetch(this.url, { 
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
              },
            body: JSON.stringify(list) 
        });
    }
    //this posts to the api with all required 
    //information to become json using fetch function
    /*
        jquery was not working for this and would not 
        properly post the expenses array, switching to
        fetch immediately resolved this issue after
        quite a headache so my trust in jquery is 
        definitely shaken, pure js saved my life
        and sanity
    */

    //the actual method for changing a list 
    //via api through put method
    //again pure js made this way easier
    static updateList(list) {
        return fetch(this.url + `/${list.id}`, { 
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json'
              },
            body: JSON.stringify(list)
        });
    }

    //jquery was doing this well at least so i kept it
    //also pretty sure i was required to use ajax() at
    //some point so this is me doing that
    static deleteList(id) {
        return $.ajax({
            url: this.url + `/${id}`,
            type: "DELETE"
        });
    }
}

//the class for all the interactions with the DOM
//most of the js happens here, it sort of ended up 
//being maybe a kitchen sink class :sweat_emoji:
class DOMManager {
    static lists;

    /*
        tbh this many classes may be overkill for this
        this method takes the data from api through ListService
        and then takes the promise and calls method to render them
        on the web page
    */
    static getAllLists() {
        ListService.getAllLists().then(lists => this.render(lists));
    }

    /*
        this takes the required constructor variables for a List 
        and calls ListService function to send to api; it then 
        refreshes lists being displayed
    */
    static createList(name, format, expenses) {
        
    
        ListService.createList(new List(name, format, expenses))
            .then(() => {
                return ListService.getAllLists();
            })
            .then((lists) => this.render(lists));
    }

    //takes list id and calls ListService.delete() to delete
    //matching list url from the api
    static deleteList(id) {
        ListService.deleteList(id)
            .then(() => {
                return ListService.getAllLists();
            })
            .then((lists) => this.render(lists));
    }

    //literally don't use this but wrote it for possible future edits
    static addExpenses(id) {
        for (let list of this.lists) {
            if (list.id == id) {
                list.expenses.push(new Expense(
                    $('#expense').val(), 
                    $('#expense-cost').val(), 
                    document.querySelector('input[name="frequency"]:checked').value));
                ListService.updateList(list)
                    .then(() => {
                        return ListService.getAllLists();
                    })
                    .then((lists) => this.render(lists));
            }
        }
    }

    /*
        this takes the id attribute of the button within
        the edit modal to update the data (which is currently
        set to having an id matching the current list id it's 
        editing)
    */
    static updateList(IDString) {
        let id = IDString.slice(7);
        //console.log(id); for testing 
        
        //for loop to search for list with matching id,
        //it then takes the new table added by user in 
        //modal and finds each expense to add to list
        for (let list of this.lists) {
            if (list.id == id) {
                list.expenses = [];
                //clears out list prior to new updated expenses

                if ($('#expense-table-edit').has('tr')) {
                    $.each($('.expense-item-edit'), function(index, value) {
                        
                        //finds appropriate table entry and assigns it 
                        //to variable that gets passed to new expense
                        let name, amount, freq;
                        name = $(value).children('.expense').text();
                        amount = $(value).children('.amount').text();
                        freq = $(value).children('.frequency').text();
                        freq = freq.toLowerCase();
                        //console.log(`${name} ${amount} ${freq}`); for testing 
                        list.expenses.push(new Expense(name, amount, freq));
                    })

                    //sends updated list to api and refreshes lists displayed
                    ListService.updateList(list)
                    .then(() => {
                        return ListService.getAllLists();
                    })
                    .then((lists) => this.render(lists)); 
                }
                
                //console.log(list); for testing 

                //this resets the modal for the next user, and 
                //resets update button id to default id
                $('#expense-table-edit').empty();
                document.getElementById('expense-name-edit').value = '';
                document.getElementById('expense-cost-edit').value = '';
                document.getElementById(IDString).id ='update-list';
            }
        }
    }

    //this is the pure javascript solution to jquery's toggle()
    //currently not in use because data-dismiss element attribute 
    //dismisses the modal on exit or update
    static toggleModal(el) {
        if (el.style.display == 'none') {
          el.style.display = '';
          
        } else {
          el.style.display = 'none';
          document.getElementsByName('body').classList.toggle('modal-open');
        }
    }
      
    //this takes the user input and creates a table to display the current
    //expenses, it offers a unique delete button for each that finds the 
    //exact expense item index and deletes the row before the rows are 
    //read and updated to the list
    static editList(id) {
        let thisList;
        $('#expense-table-edit').empty();
        document.getElementById("expense-table-edit").className = '';
        document.getElementById("expense-table-edit").classList.add(`id-${id}`);
        //console.log(id); for testing
        for (let list of this.lists) {
            if (list.id == id) {
                //console.log(list); more testing
                thisList = list;
                for (let expense of list.expenses) {
                    //console.log(expense); wow i put lots of these in here
                    let cost = expense.cost,
                        frequency = this.capitalizeFirstLetter(expense.freq);
                    $('#expense-table-edit').append(
                        `
                        <tr class="expense-item-edit" id="expense-${list.expenses.indexOf(expense)}">
                            <td class="expense">${expense.name}</td>
                            <td class="amount">${cost}</td>
                            <td class="frequency">${frequency}</td>
                            <td>
                                <a class="col-auto btn btn-remove btn-md m-2" role="button" onclick="document.getElementById('expense-${list.expenses.indexOf(expense)}').remove()">
                                    Delete
                                </a>
                            </td>
                        </tr>
                        `
                        
                    )
                }
                document.getElementById('exit-edit').setAttribute('onclick', `DOMManager.updateId('update-${list.id}');`);
                document.getElementById('close-edit').setAttribute('onclick', `DOMManager.updateId('update-${list.id}');`);
                document.getElementById('update-list').id =`update-${list.id}`;
            }
        }
    }

    /*
        this resets the id of the button element on the 
        modal used for editing a given list. the id of 
        the update button is set to 'update-${list.id}'
        in order to work with correct list when modal displays
        from when the edit list button on a displayed list is 
        clicked. the update button has the attribute of 
        onclick="DOMManager.updateList(this.id);" to pass
        the list id from its own id to update that list in
        the api. this function gets called afterwards with
        the same id to reset the button's id to default of 
        'update-list' until another edit button on a given 
        list is clicked
    */
    static updateId(elementId) {
        document.getElementById(elementId).id = 'update-list';
    }

    //this is just for formatting, capitalizes first 
    //letter of string
    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    //takes all lists and renders them as bootstrap 
    //cards while giving each a functional set of 
    //buttons to edit or delete
    static render(lists) {
        this.lists = lists;
        $('#list-display').empty();
        for (let list of lists) {
            let weekly = 0, monthly = 0, yearly = 0;
            
            $('#list-display').prepend(
                `
                <div class="col-md-4 pb-4" id="${list.id}">
                    <div class="card shadow-sm bg-card-inner">
                        <h5 class="card-header text-center bg-custom">
                        ${list.name} (${list.format}) 
                        </h5>
                        <div class="card-body"></div>
                    </div>
                </div>
                `
            );
            
            //takes cost of each expense and localizes it
            //then adds to appropriate variable before
            //they get added together for expense total
            for (let expense of list.expenses) {
                let expenseLocalize = (Number(expense.cost))
                    .toLocaleString(list.format, 
                        { minimumFractionDigits: 2 }
                    );
                
                $(`#${list.id}`).find('.card-body').append(
                    `
                    <p>
                        <span>${expense.name} (${expense.freq}): </span>
                        <p class="text-right">${expenseLocalize}</p>
                    </p>
                    `
                );
                
                //takes expense frequency and adds that expense
                //cost to appropriate variable for calculations 
                switch (expense.freq) {
                    case 'weekly': 
                        weekly += Number(expense.cost);
                        break;
                    case 'monthly':
                        monthly += Number(expense.cost);
                        break;
                    case 'yearly':
                        yearly += Number(expense.cost);
                        break;
                    default:
                        break; 
                }
            }
            
            //total amount calculated
            let yearlyTotal = (yearly + (weekly * 52) + (monthly * 12))
                    .toLocaleString(
                        list.format, 
                        { minimumFractionDigits: 2 }
                    );
            
            //adds total and then adds buttons with onclick methods
            //to modify the list variable and send to api
            $(`#${list.id}`).find('.card').append(
                `
                <div class="card-footer"><span><strong>Total (year): </strong><br></span>
                    <p class="text-right">${yearlyTotal}</p>
                </div>
                <div class="row justify-content-center card-footer">
                    <a class="col-auto btn btn-edit btn-md m-2" onclick="this.blur(); DOMManager.editList(${list.id});" data-toggle="modal" data-target="#edit-modal" href="#" role="button">
                        Edit List
                    </a>
                    <a class="col-auto btn btn-remove btn-md m-2" onclick="this.blur(); DOMManager.deleteList(${list.id});" href="#" role="button">
                        Delete List
                    </a>
                </div>       
                `
            );
        }
    }
}

//resets form on close button press
$('#close-create').on('click', () => {
    $('#expense-table').empty();
    document.getElementById('list-name').value = '';
    document.getElementById('expense-name').value = '';
    document.getElementById('expense-cost').value = '';
    document.getElementById("frequency1").checked = true;
    document.getElementById("locale1").checked = true;
})

//resets form on exit button press
$('#exit-create').on('click', () => {
    $('#expense-table').empty();
    document.getElementById('list-name').value = '';
    document.getElementById('expense-name').value = '';
    document.getElementById('expense-cost').value = '';
    document.getElementById("frequency1").checked = true;
    document.getElementById("locale1").checked = true;
})


$('#create-list').on('click', () => {
    
    //temporarily holds expenses before sending to list
    let expensesList = [];

    //adds each expense to above variable
    if ($('#expense-table').has('tr')) {
        $.each($('.expense-item'), function(index, value) {
            
            let name, amount, freq;
            name = $(value).children('.expense').text();
            amount = $(value).children('.amount').text();
            freq = $(value).children('.frequency').text();
            freq = freq.toLowerCase();
            //console.log(`${name} ${amount} ${freq}`); for testing
            expensesList.push(new Expense(name, amount, freq));
        })
    }
    //console.log(expensesList); for testing

    //creates list object using inputs from form
    DOMManager.createList($('#list-name').val(), 
    document.querySelector('input[name="locale-radios"]:checked').value,
    expensesList);

    //resets form for *user experience*
    $('#expense-table').empty();
    document.getElementById('list-name').value = '';
    document.getElementById('expense-name').value = '';
    document.getElementById('expense-cost').value = '';
    document.getElementById("frequency1").checked = true;
    document.getElementById("locale1").checked = true;
    
});

//currently not in use because function is given
//instead to click event function below
function addSingleItem() {
    let frequency = document.querySelector('input[name="frequency-edit"]:checked').value,
        expense = $('#expense-name-edit').val();
        cost = $('#expense-cost-edit').val();
        $('#expense-table-edit').append(
        `
        <tr class="expense-item-edit">
            <td class="expense">${expense}</td>
            <td class="amount">${cost}</td>
            <td class="frequency">${frequency}</td>
            <td>
                <a class="col-auto btn btn-remove btn-md m-2" role="button">
                    Delete
                </a>
            </td>
        </tr>
        `
        )
    document.getElementById('expense-name-edit').value = '';
    document.getElementById('expense-cost-edit').value = '';
}

//assigns function to add button on create modal to add the 
//expense to the table of expenses before user submits
$('#add-expense').on('click', () => {
    let frequency = document.querySelector('input[name="frequency"]:checked').value,
        frequencyCap = DOMManager.capitalizeFirstLetter(frequency), //capitalizes for display reasons
        expense = $('#expense-name').val();
        cost = $('#expense-cost').val();
        $('#expense-table').append(
        `
        <tr class="expense-item">
            <td class="expense">${expense}</td>
            <td class="amount">${cost}</td>
            <td class="frequency">${frequencyCap}</td>
            <td>
                <a class="col-auto btn btn-remove btn-md m-2" onclick="$(this).parents('tr').empty()" role="button">
                    Delete
                </a>
            </td>
        </tr>
        `
        )
    //reset form inputs
    document.getElementById('expense-name').value = '';
    document.getElementById('expense-cost').value = '';
    }
);
    

//gets all current lists on program start
DOMManager.getAllLists();


// *ignore* me messing with locales 
/*var value = (1000000).toLocaleString(
    undefined, 
    { minimumFractionDigits: 2 }
);
console.log(value);

var locales = [
    undefined,  // Your own browser
    'en-US',    // United States
    'de-DE',    // Germany
    'ru-RU',    // Russia
    'hi-IN',    // India
    'de-CH',    // Switzerland
  ];
  var n = 100000;
  var opts = { minimumFractionDigits: 2 };
  for (var i = 0; i < locales.length; i++) {
    console.log(locales[i], n.toLocaleString(locales[i], opts));
  }*/