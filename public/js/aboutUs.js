
'use strict';

$('#j-button').click(function(){
  $('#jp-section').show();
  $('#tina-section').hide();
  $('#simon-section').hide();
  $('#pixel-section').hide();
});
$('#t-button').click(function(){
  $('#jp-section').hide();
  $('#tina-section').show();
  $('#simon-section').hide();
  $('#pixel-section').hide();
});
$('#s-button').click(function(){
  $('#jp-section').hide();
  $('#tina-section').hide();
  $('#simon-section').show();
  $('#pixel-section').hide();
});
$('#p-button').click(function(){
  $('#jp-section').hide();
  $('#tina-section').hide();
  $('#simon-section').hide();
  $('#pixel-section').show();
});
