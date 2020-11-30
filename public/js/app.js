'use strict';

// alert('I work');
// console.log('app.js in the house');


document.addEventListener('DOMContentLoaded', () => {
  const themeStylesheet = document.getElementById('theme');
  const storedTheme = localStorage.getItem('theme');
  console.log(storedTheme);
  if(storedTheme){
    themeStylesheet.href = storedTheme;
  }
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    if(themeStylesheet.href.includes('light')){
      themeStylesheet.href = '/dark-theme.css';
      themeToggle.innerText = 'Switch Mode';
    } else {
      themeStylesheet.href = '/light-theme.css';
      themeToggle.innerText = 'Switch Mode';
    }
    localStorage.setItem('theme', themeStylesheet.href)
  })
})
