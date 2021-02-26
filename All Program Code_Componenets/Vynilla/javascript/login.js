function myFunction() {
    var element = document.body;
    element.classList.toggle("dark-mode");
    }
function openModal() {
    /* Note that you do NOT have to do a document.getElementById anywhere in this exercise. Use the elements below */        
    var myInput = document.getElementById("psw");
    var confirmMyInput = document.getElementById("cpsw");
	var letter = document.getElementById("letter");
	var capital = document.getElementById("capital");
	var number = document.getElementById("number");
	var length = document.getElementById("length");    
    var match = document.getElementById("match");

	myInput.onkeyup = function() {
       console.log('helllooo')
        
        
        var lowerCaseLetters = /[a-z]/; 
        var upperCaseLetters = /[A-Z]/; 
        var numbers = /[0-9]/; 
        var minLength = 8; 
        /* TODO: Question 1.1: Ends here */
        

        /* TODO: Question 1.2:  Starts here */
         /*
         - So first read up on classList.  
         - Perform a console.log(letter.classList) and check the array that you see. By default the first time, there should be just 1 element and it should be
         "invalid". "invalid" is a class that is present in login.css. 
         - Below, there are a bunch of if blocks and else blocks.
         - Each if block means that some successful condition is satisfied for our password conditon. So the red cross need to be converted to a check mark.
         - Each else block stands for a failed condition, so the green check mark needs to be a red cross again.
         - All that you need to do is, in each of the blocks, fill in the correct classNames for the remove and the add methods.
         */

        // Validate lowercase letters
        if(myInput.value.match(lowerCaseLetters)) {             
            letter.classList.remove("invalid"); 
            letter.classList.add("valid"); 
        } else {
            letter.classList.remove("valid"); 
            letter.classList.add("invalid"); 
        }

        // Validate capital letters        
        if(myInput.value.match(upperCaseLetters)) { 
            capital.classList.remove("invalid"); 
            capital.classList.add("valid");
        } else {
            capital.classList.remove("valid");
            capital.classList.add("invalid");
        }

        // Validate numbers        
        if(myInput.value.match(numbers)) { 
            number.classList.remove("invalid"); 
            number.classList.add("valid"); 
        } else {
            number.classList.remove("valid"); 
            number.classList.add("invalid");
        }

        // Validate length
        if(myInput.value.length >= minLength) {
            length.classList.remove("invalid");
            length.classList.add("valid");
        } else {
            length.classList.remove("valid");
            length.classList.add("invalid");
        }
        /* TODO: Question 1.2:  Ends here */
    }
    /* TODO Question 1.3: Starts here */
    confirmMyInput.onkeyup = function() {
                // Validate password and confirmPassword
                var passEqualsConfPass = (myInput.value == confirmMyInput.value); // TODO: Change this to the condition that needs to be checked so that the text entered in password equals the text in confirm password
                console.log(myInput.value)
                if(passEqualsConfPass) { 
                    match.classList.remove("invalid"); 
                    match.classList.add("valid"); 
                } else {
                    match.classList.remove("valid"); 
                    match.classList.add("invalid"); 
                }        
    /* TODO Question 1.3: Starts here */

                // Disable or Enable the button based on the elements in classList
                enableButton(letter, capital, number, length, match);
    }
}


function enableButton(letter, capital, number, length, match) {
    // TODO: Clear this function for students to implement    
    var button = document.getElementById('my_submit_button');
    var condition = (length.classList == "valid" && number.classList == "valid" && capital.classList == "valid" && letter.classList == "valid" && match.classList == "valid"); // TODO: Replace false with the correct condition
    if(condition) {       
            button.disabled = false;
        }        
    }    