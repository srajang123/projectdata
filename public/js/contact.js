let msg = document.querySelectorAll('.msg');
msg.forEach(msgs => {
    msgs.addEventListener('click', (e) => {
        let name = e.target.parentElement.children[0].innerHTML;
        let msg = e.target.parentElement.children[1].innerHTML;
        let mail = e.target.parentElement.children[2].value;
        let mob = e.target.parentElement.children[3].value;
        console.log(name, msg);
        document.querySelector('.mail').value = mail;
        document.querySelector('.mob').value = mob;
        document.querySelector('.form-name').innerHTML = name;
        document.querySelector('.form-data').innerHTML = msg;
        document.querySelector('.msg-resolve').style.visibility = 'visible';
    });
});