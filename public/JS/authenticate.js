//Do I NEEED THIS FILE?



//input fields
const email = document.getElementById('email').value;
const username = document.getElementById('username').value;
const password = document.getElementById('password').value;
const password = document.getElementById('confPassword').value;

const submit = document.getElementById('signUpButton');

submit.addEventListener('click', function(event) {
    event.preventDefault();
})

alert("works");