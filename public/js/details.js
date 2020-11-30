'use strict';

if (<%= detailData.isInDB %> === true) {
    $('#editGameButton').prop('disabled', false);
    $('#add-inv-button').prop('disabled', true);
    $('#delete-button').prop('disabled', false);
    // $('#go-back-form').attr('action', '/search/');
    // $('#go-back').text('Back to Results');
}
if (<%= detailData.isInDB %> === false) {
    $('#editGameButton').prop('disabled', true);
    $('#add-inv-button').prop('disabled', false);
    $('#delete-button').prop('disabled', true);
}
