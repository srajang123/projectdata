const reset=document.querySelector('#reset');
const submit=document.querySelector('#submit');
reset.addEventListener('click',(e)=>{
    if(!confirm('Do You want to reset?'))
        e.preventDefault();
});